/**
 * Starknet integration utilities
 */

import { Contract, RpcProvider, uint256 } from 'starknet';
import type { SolvencyInfo, SolvencyTier, ProofRecord } from '@/types';
import { getRpcUrl, getRegistryAddress } from './config';

// Minimal ABI for SolvencyRegistry
const REGISTRY_ABI = [
  {
    type: 'function',
    name: 'get_solvency_info',
    inputs: [
      {
        name: 'issuer',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
    outputs: [
      {
        type: '(u64, u256, u256, bool, solvency_registry::SolvencyTier)',
      },
    ],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'is_solvent',
    inputs: [
      {
        name: 'issuer',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
    outputs: [
      {
        type: 'core::bool',
      },
    ],
    state_mutability: 'view',
  },
  {
    type: 'event',
    name: 'SolvencyVerified',
    inputs: [
      {
        name: 'issuer',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'merkle_root',
        type: 'core::integer::u256',
      },
      {
        name: 'total_liabilities',
        type: 'core::integer::u256',
      },
      {
        name: 'tier',
        type: 'solvency_registry::SolvencyTier',
      },
      {
        name: 'timestamp',
        type: 'core::integer::u64',
      },
    ],
  },
] as const;

/**
 * Get Starknet provider instance
 */
export async function getProvider(): Promise<RpcProvider> {
  const rpcUrl = await getRpcUrl();
  return new RpcProvider({ nodeUrl: rpcUrl });
}

/**
 * Get SolvencyRegistry contract instance
 */
export async function getRegistryContract(): Promise<Contract> {
  const provider = await getProvider();
  const registryAddress = await getRegistryAddress();
  return new Contract(REGISTRY_ABI, registryAddress, provider);
}

/**
 * Map Cairo SolvencyTier enum variant to TypeScript enum
 */
function mapSolvencyTier(tierVariant: any): SolvencyTier {
  // Cairo enum comes as { variant: 'TierA' } or similar
  if (typeof tierVariant === 'object' && tierVariant.variant) {
    return tierVariant.variant as SolvencyTier;
  }
  // Fallback string matching
  const tierStr = String(tierVariant);
  if (tierStr.includes('TierA')) return 'TierA';
  if (tierStr.includes('TierB')) return 'TierB';
  if (tierStr.includes('TierC')) return 'TierC';
  return 'None';
}

/**
 * Query solvency information for a specific issuer
 */
export async function querySolvencyInfo(
  issuerAddress: string
): Promise<SolvencyInfo | null> {
  try {
    const contract = await getRegistryContract();
    const result = await contract.get_solvency_info(issuerAddress);

    // Parse tuple: (last_proof_time, merkle_root, total_liabilities, is_valid, tier)
    const [last_proof_time, merkle_root, total_liabilities, is_valid, tier] = result;

    return {
      last_proof_time: BigInt(last_proof_time.toString()),
      merkle_root: uint256.uint256ToBN(merkle_root),
      total_liabilities: uint256.uint256ToBN(total_liabilities),
      is_valid: Boolean(is_valid),
      tier: mapSolvencyTier(tier),
    };
  } catch (error) {
    console.error('Failed to query solvency info:', error);
    return null;
  }
}

/**
 * Check if an issuer is currently solvent (valid + fresh proof)
 */
export async function checkIsSolvent(issuerAddress: string): Promise<boolean> {
  try {
    const contract = await getRegistryContract();
    const result = await contract.is_solvent(issuerAddress);
    return Boolean(result);
  } catch (error) {
    console.error('Failed to check solvency:', error);
    return false;
  }
}

/**
 * Fetch recent SolvencyVerified events from the registry
 */
export async function fetchRecentProofs(
  limit: number = 10
): Promise<ProofRecord[]> {
  try {
    const provider = await getProvider();
    const registryAddress = await getRegistryAddress();

    // Get latest block
    const latestBlock = await provider.getBlockLatestAccepted();
    const fromBlock = Math.max(0, latestBlock.block_number - 1000); // Last ~1000 blocks

    // Query SolvencyVerified events
    const events = await provider.getEvents({
      address: registryAddress,
      from_block: { block_number: fromBlock },
      to_block: 'latest',
      keys: [['SolvencyVerified']], // Event selector
      chunk_size: 100,
    });

    const records: ProofRecord[] = [];

    for (const event of events.events.slice(0, limit)) {
      try {
        // Parse event data: [issuer, merkle_root, total_liabilities, tier, timestamp]
        const issuer = event.keys[1]; // First key after event selector
        const [merkle_root, total_liabilities, tier, timestamp] = event.data;

        records.push({
          issuer,
          merkle_root: merkle_root.toString(),
          total_liabilities: total_liabilities.toString(),
          tier: mapSolvencyTier(tier),
          timestamp: Number(timestamp),
          transaction_hash: event.transaction_hash,
        });
      } catch (parseError) {
        console.error('Failed to parse event:', parseError);
      }
    }

    return records;
  } catch (error) {
    console.error('Failed to fetch recent proofs:', error);
    return [];
  }
}
