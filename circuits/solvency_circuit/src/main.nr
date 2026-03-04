use std::hash::pedersen_hash;

global TREE_DEPTH: u32 = 4; // 16 leaves - must match tree-builder

/// Compute Merkle root from a leaf, its index, and the sibling hash path.
/// Uses Pedersen hash (Barretenberg backend) matching the off-chain tree builder.
fn compute_merkle_root(leaf: Field, index: Field, hash_path: [Field; TREE_DEPTH]) -> Field {
    let mut current = leaf;
    let index_bits: [u1; TREE_DEPTH] = index.to_le_bits();
    for i in 0..TREE_DEPTH {
        let (left, right) = if index_bits[i] == 0 {
            (current, hash_path[i])
        } else {
            (hash_path[i], current)
        };
        current = pedersen_hash([left, right]);
    }
    current
}

/// Main circuit entry point.
///
/// Public inputs (visible on-chain after verification):
///   - root: Merkle root of the reserve commitment tree
///   - total_liabilities: claimed total liabilities in satoshis
///
/// Private inputs (hidden by ZK proof):
///   - leaf: the reserve commitment leaf value
///   - index: position of the leaf in the tree
///   - hash_path: sibling hashes from leaf to root
///   - total_reserves: actual total reserves in satoshis
fn main(
    // PUBLIC inputs
    root: pub Field,
    total_liabilities: pub Field,
    // PRIVATE inputs
    leaf: Field,
    index: Field,
    hash_path: [Field; TREE_DEPTH],
    total_reserves: Field,
) {
    // 1. Verify the leaf is in the committed Merkle tree
    let computed_root = compute_merkle_root(leaf, index, hash_path);
    assert(computed_root == root, "Merkle proof failed: computed root does not match");

    // 2. Prove reserves >= liabilities using range check
    // If reserves >= liabilities, the difference fits in 64 bits.
    // If reserves < liabilities, the difference wraps around the field (~254 bits),
    // which cannot be decomposed into 64 bits, causing the assertion to fail.
    let diff = total_reserves - total_liabilities;
    let _diff_bits: [u1; 64] = diff.to_le_bits::<64>();
}

#[test]
fn test_solvency_simple() {
    // Simple test: reserves > liabilities with a trivial tree
    let leaf = pedersen_hash([1, 100]);

    // Build a depth-4 tree with one real leaf and 15 zero leaves
    // Layer 0: [leaf, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let zero = 0;
    let zero_hash = pedersen_hash([zero, zero]);
    let zero_hash_2 = pedersen_hash([zero_hash, zero_hash]);
    let zero_hash_3 = pedersen_hash([zero_hash_2, zero_hash_2]);

    // Build the path for index 0
    // Level 0 sibling: 0 (the second leaf)
    // Level 1 sibling: hash of (0, 0)
    // Level 2 sibling: hash of (hash(0,0), hash(0,0))
    // Level 3 sibling: hash of above pattern
    let hash_path = [zero, zero_hash, zero_hash_2, zero_hash_3];

    // Compute expected root
    let l1 = pedersen_hash([leaf, zero]);
    let l2 = pedersen_hash([l1, zero_hash]);
    let l3 = pedersen_hash([l2, zero_hash_2]);
    let root = pedersen_hash([l3, zero_hash_3]);

    main(root, 50, leaf, 0, hash_path, 100);
}

#[test(should_fail_with = "Merkle proof failed")]
fn test_invalid_root() {
    let leaf = pedersen_hash([1, 100]);
    let hash_path = [0; TREE_DEPTH];
    let fake_root = pedersen_hash([42, 42]);
    main(fake_root, 50, leaf, 0, hash_path, 100);
}
