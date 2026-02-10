/**
 * Fixed-depth binary Merkle tree using Pedersen hash.
 * Matches Noir circuit's compute_merkle_root exactly.
 *
 * The tree is built bottom-up:
 *   - Layer 0 contains the leaves (padded to 2^depth with ZERO_LEAF)
 *   - Each subsequent layer is half the size of the previous one
 *   - Layer[depth] contains a single element: the root
 *
 * Hashing rule:  parent = pedersenHash([leftChild, rightChild])
 */

import { pedersenHash } from './hash.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MerkleTree {
  /** Tree depth (number of levels above the leaf layer). */
  depth: number;
  /** Original leaves before padding. */
  leaves: bigint[];
  /**
   * All layers of the tree.
   *   layers[0] = padded leaves (length 2^depth)
   *   layers[depth] = [root]
   */
  layers: bigint[][];
  /** Convenience accessor: layers[depth][0]. */
  root: bigint;
}

export interface MerkleProof {
  /** The leaf value being proved. */
  leaf: bigint;
  /** Index of the leaf in the bottom layer. */
  index: number;
  /** Sibling hashes from leaf to root (length = depth). */
  hashPath: bigint[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Padding value used for empty / unused leaf slots. */
export const ZERO_LEAF = 0n;

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

/**
 * Build a fixed-depth binary Merkle tree from the supplied leaves.
 *
 * @param leaves - Non-padded leaf values (bigint field elements)
 * @param depth  - Desired tree depth (the leaf layer will have 2^depth slots)
 * @returns A complete MerkleTree with all intermediate layers
 */
export async function buildMerkleTree(
  leaves: bigint[],
  depth: number,
): Promise<MerkleTree> {
  const width = 2 ** depth;

  if (leaves.length > width) {
    throw new RangeError(
      `Too many leaves (${leaves.length}) for depth ${depth} (max ${width})`,
    );
  }

  // --- Layer 0: pad leaves to full width ---
  const paddedLeaves = new Array<bigint>(width);
  for (let i = 0; i < width; i++) {
    paddedLeaves[i] = i < leaves.length ? leaves[i] : ZERO_LEAF;
  }

  const layers: bigint[][] = [paddedLeaves];

  // --- Build layers bottom-up ---
  let currentLayer = paddedLeaves;

  for (let level = 0; level < depth; level++) {
    const nextLayer: bigint[] = [];

    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = currentLayer[i + 1];
      const parent = await pedersenHash([left, right]);
      nextLayer.push(parent);
    }

    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return {
    depth,
    leaves,
    layers,
    root: layers[depth][0],
  };
}

// ---------------------------------------------------------------------------
// Proof extraction
// ---------------------------------------------------------------------------

/**
 * Extract a Merkle proof (sibling path) for a given leaf index.
 *
 * The proof consists of one sibling hash per level, starting from the leaf
 * layer and ending just below the root.  This is exactly the `hash_path`
 * array consumed by the Noir circuit's `compute_merkle_root`.
 *
 * @param tree      - A previously built MerkleTree
 * @param leafIndex - Zero-based index into the padded leaf layer
 * @returns A MerkleProof containing the sibling path
 */
export function getMerkleProof(
  tree: MerkleTree,
  leafIndex: number,
): MerkleProof {
  const maxIndex = 2 ** tree.depth - 1;

  if (leafIndex < 0 || leafIndex > maxIndex) {
    throw new RangeError(
      `Leaf index ${leafIndex} out of range [0, ${maxIndex}]`,
    );
  }

  const hashPath: bigint[] = [];
  let idx = leafIndex;

  for (let level = 0; level < tree.depth; level++) {
    // If idx is even, sibling is idx+1; if odd, sibling is idx-1.
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    hashPath.push(tree.layers[level][siblingIdx]);

    // Move up to the parent index.
    idx = Math.floor(idx / 2);
  }

  return {
    leaf: tree.layers[0][leafIndex],
    index: leafIndex,
    hashPath,
  };
}
