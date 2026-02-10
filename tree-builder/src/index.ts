/**
 * CLI entry point for Solva Merkle tree builder.
 *
 * Usage:
 *   npx tsx src/index.ts [--sample] [--input <path>] [--liabilities <sats>]
 *
 * Flags:
 *   --sample           Use hard-coded sample reserve data (default if no --input)
 *   --input <path>     Path to a reserve_data.json produced by the UTXO fetcher
 *   --liabilities <n>  Total liabilities in satoshis (default: 80% of reserves)
 *
 * The tool will:
 *   1. Load reserve data (sample or from file)
 *   2. Hash each (address, balance) pair into a leaf via Pedersen
 *   3. Build a depth-4 Merkle tree
 *   4. Extract a proof for leaf index 0
 *   5. Write Prover.toml to circuits/solvency_circuit/Prover.toml
 *   6. Save tree debug data to tree-builder/merkle_tree.json
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { initBarretenberg, pedersenHash, cleanupBarretenberg } from './hash.js';
import { buildMerkleTree, getMerkleProof } from './buildTree.js';
import { generateProverToml, toHexField } from './generateProverToml.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Merkle tree depth -- supports up to 2^4 = 16 leaves. */
const TREE_DEPTH = 4;

/** Project root (two levels up from src/). */
const PROJECT_ROOT = resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface AddressBalance {
  address: string;
  balance: number; // satoshis
}

const SAMPLE_RESERVES: AddressBalance[] = [
  { address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', balance: 2_500_000 },
  { address: 'tb1qrp33g0q5b5698ahp5jnf5yzjmgcem8tlc7us37', balance: 1_500_000 },
  { address: 'tb1q0sq2rl79nakyg94e7m7amymdkfnr2950gkjy3a', balance: 3_000_000 },
  { address: 'tb1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h', balance: 1_000_000 },
  { address: 'tb1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', balance: 2_000_000 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derive a BN254-compatible field element from a Bitcoin address string.
 *
 * We SHA-256 the address and take the first 31 bytes (248 bits), which is
 * guaranteed to be smaller than the BN254 scalar field order (~254 bits).
 * This matches the approach used in the Noir circuit.
 */
function hashAddress(address: string): bigint {
  const hash = createHash('sha256').update(address).digest();
  const truncated = hash.subarray(0, 31);
  return BigInt('0x' + truncated.toString('hex'));
}

/**
 * Parse CLI arguments into a simple key/value map.
 */
function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--sample') {
      args.set('sample', 'true');
    } else if (arg === '--input' && i + 1 < argv.length) {
      args.set('input', argv[++i]);
    } else if (arg === '--liabilities' && i + 1 < argv.length) {
      args.set('liabilities', argv[++i]);
    }
  }
  return args;
}

/**
 * Load reserve data from a JSON file produced by the Python UTXO fetcher.
 * Expected shape: { addresses: string[], utxos: { [addr]: [{value}] }, total_sats: number }
 */
function loadReserveData(filePath: string): AddressBalance[] {
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as {
    addresses: string[];
    utxos: Record<string, { value: number }[]>;
    total_sats: number;
  };

  const result: AddressBalance[] = [];
  for (const addr of data.addresses) {
    const utxos = data.utxos[addr] ?? [];
    const balance = utxos.reduce((sum, u) => sum + u.value, 0);
    result.push({ address: addr, balance });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  console.log('='.repeat(60));
  console.log('  Solva Merkle Tree Builder');
  console.log('='.repeat(60));
  console.log();

  // --- 1. Load reserves ---
  let reserves: AddressBalance[];

  if (args.has('input')) {
    const inputPath = resolve(args.get('input')!);
    console.log(`Loading reserves from ${inputPath}`);
    reserves = loadReserveData(inputPath);
  } else {
    console.log('Using sample reserve data (pass --input <path> for real data)');
    reserves = SAMPLE_RESERVES;
  }

  const totalReserves = reserves.reduce((sum, r) => sum + r.balance, 0);
  console.log(`  Addresses : ${reserves.length}`);
  console.log(`  Total     : ${totalReserves.toLocaleString()} sats`);
  console.log();

  // --- 2. Determine liabilities ---
  const totalLiabilities = args.has('liabilities')
    ? parseInt(args.get('liabilities')!, 10)
    : Math.floor(totalReserves * 0.8);

  console.log(`  Liabilities: ${totalLiabilities.toLocaleString()} sats`);
  console.log(
    `  Solvency   : ${
      totalReserves >= totalLiabilities ? 'SOLVENT' : 'INSOLVENT'
    } (reserves ${totalReserves >= totalLiabilities ? '>=' : '<'} liabilities)`,
  );
  console.log();

  // --- 3. Initialise Barretenberg ---
  console.log('Initialising Barretenberg WASM backend...');
  await initBarretenberg();
  console.log('  Done.');
  console.log();

  // --- 4. Hash leaves ---
  console.log('Hashing leaves (Pedersen)...');
  const leaves: bigint[] = [];

  for (const { address, balance } of reserves) {
    const addrHash = hashAddress(address);
    const leaf = await pedersenHash([addrHash, BigInt(balance)]);
    leaves.push(leaf);
    console.log(`  [${leaves.length - 1}] ${address.slice(0, 20)}... => ${toHexField(leaf).slice(0, 18)}...`);
  }
  console.log();

  // --- 5. Build Merkle tree ---
  console.log(`Building Merkle tree (depth=${TREE_DEPTH}, capacity=${2 ** TREE_DEPTH})...`);
  const tree = await buildMerkleTree(leaves, TREE_DEPTH);
  console.log(`  Root: ${toHexField(tree.root)}`);
  console.log();

  // --- 6. Extract proof for leaf 0 ---
  const proofIndex = 0;
  console.log(`Extracting Merkle proof for leaf index ${proofIndex}...`);
  const proof = getMerkleProof(tree, proofIndex);
  console.log(`  Leaf : ${toHexField(proof.leaf).slice(0, 18)}...`);
  console.log(`  Index: ${proof.index}`);
  console.log(`  Path : [${proof.hashPath.map((h) => toHexField(h).slice(0, 18) + '...').join(', ')}]`);
  console.log();

  // --- 7. Generate Prover.toml ---
  const tomlContent = generateProverToml(
    tree,
    proof,
    BigInt(totalReserves),
    BigInt(totalLiabilities),
  );

  const proverTomlPath = resolve(PROJECT_ROOT, 'circuits', 'solvency_circuit', 'Prover.toml');
  mkdirSync(dirname(proverTomlPath), { recursive: true });
  writeFileSync(proverTomlPath, tomlContent, 'utf-8');
  console.log(`Prover.toml written to ${proverTomlPath}`);

  // --- 8. Save debug tree data ---
  const treeDebug = {
    depth: tree.depth,
    numLeaves: tree.leaves.length,
    root: toHexField(tree.root),
    layers: tree.layers.map((layer) => layer.map((v) => toHexField(v))),
    proof: {
      leaf: toHexField(proof.leaf),
      index: proof.index,
      hashPath: proof.hashPath.map((h) => toHexField(h)),
    },
    reserves: reserves.map((r) => ({
      address: r.address,
      balance: r.balance,
    })),
    totalReserves,
    totalLiabilities,
  };

  const treeJsonPath = resolve(PROJECT_ROOT, 'tree-builder', 'merkle_tree.json');
  writeFileSync(treeJsonPath, JSON.stringify(treeDebug, null, 2), 'utf-8');
  console.log(`Tree data written to ${treeJsonPath}`);
  console.log();

  // --- 9. Cleanup ---
  await cleanupBarretenberg();

  // --- 10. Summary ---
  console.log('='.repeat(60));
  console.log('  Summary');
  console.log('='.repeat(60));
  console.log(`  Merkle root      : ${toHexField(tree.root)}`);
  console.log(`  Tree depth       : ${tree.depth}`);
  console.log(`  Leaves (actual)  : ${tree.leaves.length}`);
  console.log(`  Leaves (padded)  : ${2 ** tree.depth}`);
  console.log(`  Total reserves   : ${totalReserves.toLocaleString()} sats`);
  console.log(`  Total liabilities: ${totalLiabilities.toLocaleString()} sats`);
  console.log(`  Proof leaf index : ${proofIndex}`);
  console.log();
  console.log('Next step: cd circuits/solvency_circuit && nargo prove');
  console.log();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
