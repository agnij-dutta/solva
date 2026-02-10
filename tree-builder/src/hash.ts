/**
 * Pedersen hash wrapper using Barretenberg (bb.js).
 * Uses the SAME hash implementation as Noir's std::hash::pedersen_hash,
 * ensuring tree hashes computed here will match in-circuit verification.
 *
 * The BN254 scalar field used by Barretenberg has order:
 *   p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
 *
 * All inputs must be valid BN254 field elements (i.e. < p).
 */

import { Barretenberg, Fr } from '@aztec/bb.js';

// ---------------------------------------------------------------------------
// Singleton Barretenberg instance
// ---------------------------------------------------------------------------

let api: Barretenberg | null = null;

/**
 * Initialise the Barretenberg WASM backend (singleton, lazy).
 * Safe to call multiple times -- only the first invocation performs work.
 */
export async function initBarretenberg(): Promise<void> {
  if (!api) {
    api = await Barretenberg.new();
  }
}

/**
 * Compute a Pedersen hash over an array of BN254 field elements.
 *
 * This mirrors Noir's `std::hash::pedersen_hash` exactly because both
 * delegate to the same Barretenberg C++ implementation under the hood.
 *
 * @param inputs - Field elements as bigints (each must be < BN254 field order)
 * @returns The Pedersen hash as a bigint
 */
export async function pedersenHash(inputs: bigint[]): Promise<bigint> {
  if (!api) {
    await initBarretenberg();
  }

  const frInputs = inputs.map((v) => new Fr(v));
  const result = await api!.pedersenHash(frInputs, 0);
  return result.toBigInt();
}

/**
 * Destroy the Barretenberg WASM instance and release resources.
 * Call this when you are done with all hashing operations.
 */
export async function cleanupBarretenberg(): Promise<void> {
  if (api) {
    await api.destroy();
    api = null;
  }
}
