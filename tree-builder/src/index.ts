/**
 * CLI entry point for Solva Merkle tree builder (v2 — full tree reconstruction).
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
 *   4. Output ALL leaf data (addr_hashes + balances) for in-circuit verification
 *   5. Write Prover.toml to circuits/solvency_circuit/Prover.toml
 *   6. Save tree debug data to tree-builder/merkle_tree.json
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { initBarretenberg, pedersenHash, cleanupBarretenberg } from './hash.js';
import { buildMerkleTree } from './buildTree.js';
import { generateProverToml, toHexField, type LeafData } from './generateProverToml.js';

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
 * SHA-256 the address and take the first 31 bytes (248 bits).
 */
function hashAddress(address: string): bigint {
  const hash = createHash('sha256').update(address).digest();
  const truncated = hash.subarray(0, 31);
  return BigInt('0x' + truncated.toString('hex'));
}

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
  console.log('  Solva Tree Builder v2 — Full Tree Reconstruction');
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

  // --- 4. Hash leaves and collect leaf data ---
  console.log('Hashing leaves (Pedersen on BN254)...');
  const leaves: bigint[] = [];
  const leafData: LeafData[] = [];

  for (const { address, balance } of reserves) {
    const addrHash = hashAddress(address);
    const leaf = await pedersenHash([addrHash, BigInt(balance)]);
    leaves.push(leaf);
    leafData.push({ addrHash, balance: BigInt(balance) });
    console.log(`  [${leaves.length - 1}] ${address.slice(0, 20)}... => ${toHexField(leaf).slice(0, 18)}...`);
  }
  console.log();

  // --- 5. Build Merkle tree ---
  console.log(`Building Merkle tree (depth=${TREE_DEPTH}, capacity=${2 ** TREE_DEPTH})...`);
  const tree = await buildMerkleTree(leaves, TREE_DEPTH);
  console.log(`  Root: ${toHexField(tree.root)}`);
  console.log(`  Active leaves: ${reserves.length} / ${2 ** TREE_DEPTH}`);
  console.log();

  // --- 6. Generate Prover.toml (v2 format — all leaves) ---
  const tomlContent = generateProverToml(
    tree,
    leafData,
    BigInt(totalLiabilities),
  );

  const proverTomlPath = resolve(PROJECT_ROOT, 'circuits', 'solvency_circuit', 'Prover.toml');
  mkdirSync(dirname(proverTomlPath), { recursive: true });
  writeFileSync(proverTomlPath, tomlContent, 'utf-8');
  console.log(`Prover.toml written to ${proverTomlPath}`);

  // --- 7. Save debug tree data ---
  const treeDebug = {
    depth: tree.depth,
    num_leaves: tree.leaves.length,
    root: toHexField(tree.root),
    layers: tree.layers.map((layer) => layer.map((v) => toHexField(v))),
    reserves: reserves.map((r, i) => ({
      address: r.address,
      balance: r.balance,
      addr_hash: toHexField(leafData[i].addrHash),
    })),
    total_reserves: totalReserves,
    total_liabilities: totalLiabilities,
    is_solvent: totalReserves >= totalLiabilities,
    ratio: totalLiabilities > 0 ? ((totalReserves / totalLiabilities) * 100).toFixed(1) + '%' : 'N/A',
    num_addresses: reserves.length,
    circuit_version: 'v2-full-tree-reconstruction',
  };

  const treeJsonPath = resolve(PROJECT_ROOT, 'tree-builder', 'merkle_tree.json');
  writeFileSync(treeJsonPath, JSON.stringify(treeDebug, null, 2), 'utf-8');
  console.log(`Tree data written to ${treeJsonPath}`);
  console.log();

  // --- 8. Cleanup ---
  await cleanupBarretenberg();

  // --- 9. Summary ---
  console.log('='.repeat(60));
  console.log('  Summary');
  console.log('='.repeat(60));
  console.log(`  Circuit version  : v2 (full tree reconstruction)`);
  console.log(`  Merkle root      : ${toHexField(tree.root)}`);
  console.log(`  Tree depth       : ${tree.depth}`);
  console.log(`  Active addresses : ${reserves.length}`);
  console.log(`  Total reserves   : ${totalReserves.toLocaleString()} sats`);
  console.log(`  Total liabilities: ${totalLiabilities.toLocaleString()} sats`);
  console.log(`  Solvency ratio   : ${((totalReserves / totalLiabilities) * 100).toFixed(1)}%`);
  console.log();
  console.log('Next: cd circuits/solvency_circuit && nargo compile && nargo execute witness');
  console.log();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
