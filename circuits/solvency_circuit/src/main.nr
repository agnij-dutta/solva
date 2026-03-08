use std::hash::pedersen_hash;

// Tree depth 4 = 16 leaf slots. Must match tree-builder.
global NUM_LEAVES: u32 = 16;

// Solva Solvency Circuit v2 -- Full Tree Reconstruction
//
// Unlike a single Merkle inclusion proof, this circuit reconstructs
// the ENTIRE tree from raw leaf data (address hashes + balances),
// verifies the root matches, and proves the aggregate balance sum
// exceeds liabilities. This is cryptographically stronger because:
//
// 1. ALL leaves are verified, not just one
// 2. Balance sum is computed in-circuit (no external trust)
// 3. Root is deterministically reconstructed from private data
// 4. Address count is publicly attested
//
// Public inputs (visible on-chain after verification):
//   root              -- Merkle root of the reserve tree
//   total_liabilities -- claimed liabilities in satoshis
//   num_addresses     -- number of active reserve addresses
//
// Private inputs (hidden by ZK proof):
//   addr_hashes[16]   -- SHA256-truncated address identifiers
//   balances[16]      -- per-address balance in satoshis
fn main(
    // PUBLIC inputs
    root: pub Field,
    total_liabilities: pub Field,
    num_addresses: pub Field,

    // PRIVATE inputs
    addr_hashes: [Field; NUM_LEAVES],
    balances: [Field; NUM_LEAVES],
) {
    // Step 1: Hash all leaves and compute aggregate reserves
    // Each active leaf = pedersen_hash([addr_hash, balance])
    // Inactive leaves (padding) are 0.

    let mut leaf_layer: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    let mut total_reserves: Field = 0;
    let mut active_count: Field = 0;

    for i in 0..NUM_LEAVES {
        let is_active = (addr_hashes[i] != 0) | (balances[i] != 0);
        if is_active {
            leaf_layer[i] = pedersen_hash([addr_hashes[i], balances[i]]);
            total_reserves += balances[i];
            active_count += 1;
        }
        // else: leaf_layer[i] stays 0 (zero-padded leaf)
    }

    // Verify the claimed number of addresses matches actual count
    assert(active_count == num_addresses, "Address count mismatch");

    // Step 2: Reconstruct Merkle tree bottom-up
    // Layer 0 (16 leaves) -> Layer 1 (8) -> Layer 2 (4) -> Layer 3 (2) -> Root

    // Layer 0 -> Layer 1: 16 -> 8
    let mut layer_8: [Field; 8] = [0; 8];
    for i in 0..8 {
        layer_8[i] = pedersen_hash([leaf_layer[i * 2], leaf_layer[i * 2 + 1]]);
    }

    // Layer 1 -> Layer 2: 8 -> 4
    let mut layer_4: [Field; 4] = [0; 4];
    for i in 0..4 {
        layer_4[i] = pedersen_hash([layer_8[i * 2], layer_8[i * 2 + 1]]);
    }

    // Layer 2 -> Layer 3: 4 -> 2
    let mut layer_2: [Field; 2] = [0; 2];
    for i in 0..2 {
        layer_2[i] = pedersen_hash([layer_4[i * 2], layer_4[i * 2 + 1]]);
    }

    // Layer 3 -> Root: 2 -> 1
    let computed_root = pedersen_hash([layer_2[0], layer_2[1]]);

    // Step 3: Verify reconstructed root matches claimed root
    assert(
        computed_root == root,
        "Root mismatch: tree reconstruction does not match claimed root"
    );

    // Step 4: Solvency range check (reserves >= liabilities)
    // If reserves >= liabilities, diff is a small positive number (fits in 64 bits).
    // If reserves < liabilities, diff wraps around the BN254 field (~254 bits),
    // making the 64-bit decomposition impossible, so proof generation fails.
    // 64 bits handles up to ~1.8e19 sats (BTC max supply is 2.1e15 sats).
    let diff = total_reserves - total_liabilities;
    let _diff_bits: [u1; 64] = diff.to_le_bits::<64>();
}

// =========================================================================
// Tests
// =========================================================================

#[test]
fn test_solvency_full_tree() {
    // Create 3 active addresses with known balances
    let addr1: Field = 0x1111;
    let addr2: Field = 0x2222;
    let addr3: Field = 0x3333;
    let bal1: Field = 100;
    let bal2: Field = 200;
    let bal3: Field = 150;

    // Build addr_hashes and balances arrays (pad with zeros)
    let mut addr_hashes: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    let mut balances_arr: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    addr_hashes[0] = addr1;
    addr_hashes[1] = addr2;
    addr_hashes[2] = addr3;
    balances_arr[0] = bal1;
    balances_arr[1] = bal2;
    balances_arr[2] = bal3;

    // Compute leaves
    let leaf0 = pedersen_hash([addr1, bal1]);
    let leaf1 = pedersen_hash([addr2, bal2]);
    let leaf2 = pedersen_hash([addr3, bal3]);
    // leaves 3..15 are zero

    // Build tree bottom-up (matching circuit logic)
    let h01 = pedersen_hash([leaf0, leaf1]);
    let h23 = pedersen_hash([leaf2, 0]);
    let h45 = pedersen_hash([0, 0]);
    let h67 = pedersen_hash([0, 0]);
    let h89 = pedersen_hash([0, 0]);
    let hab = pedersen_hash([0, 0]);
    let hcd = pedersen_hash([0, 0]);
    let hef = pedersen_hash([0, 0]);

    let h0123 = pedersen_hash([h01, h23]);
    let h4567 = pedersen_hash([h45, h67]);
    let h89ab = pedersen_hash([h89, hab]);
    let hcdef = pedersen_hash([hcd, hef]);

    let h_left = pedersen_hash([h0123, h4567]);
    let h_right = pedersen_hash([h89ab, hcdef]);

    let root = pedersen_hash([h_left, h_right]);

    // total_reserves = 100 + 200 + 150 = 450
    // total_liabilities = 300 (< 450, so solvent)
    main(root, 300, 3, addr_hashes, balances_arr);
}

#[test(should_fail)]
fn test_insolvent_fails() {
    let mut addr_hashes: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    let mut balances_arr: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    addr_hashes[0] = 0x1111;
    balances_arr[0] = 100;

    let leaf0 = pedersen_hash([0x1111, 100]);
    let h01 = pedersen_hash([leaf0, 0]);
    let hzz = pedersen_hash([0, 0]);

    let h0123 = pedersen_hash([h01, hzz]);
    let h4567 = pedersen_hash([hzz, hzz]);
    let h89ab = pedersen_hash([hzz, hzz]);
    let hcdef = pedersen_hash([hzz, hzz]);

    let h_left = pedersen_hash([h0123, h4567]);
    let h_right = pedersen_hash([h89ab, hcdef]);

    let root = pedersen_hash([h_left, h_right]);

    // Liabilities (200) > Reserves (100) -- should fail range check
    main(root, 200, 1, addr_hashes, balances_arr);
}

#[test(should_fail_with = "Root mismatch")]
fn test_wrong_root_fails() {
    let mut addr_hashes: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    let mut balances_arr: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    addr_hashes[0] = 0x1111;
    balances_arr[0] = 100;

    let fake_root = pedersen_hash([42, 42]);
    main(fake_root, 50, 1, addr_hashes, balances_arr);
}

#[test(should_fail_with = "Address count mismatch")]
fn test_wrong_count_fails() {
    let mut addr_hashes: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    let mut balances_arr: [Field; NUM_LEAVES] = [0; NUM_LEAVES];
    addr_hashes[0] = 0x1111;
    balances_arr[0] = 100;

    // Compute correct root for this data
    let leaf0 = pedersen_hash([0x1111, 100]);
    let h01 = pedersen_hash([leaf0, 0]);
    let hzz = pedersen_hash([0, 0]);
    let h0123 = pedersen_hash([h01, hzz]);
    let h4567 = pedersen_hash([hzz, hzz]);
    let h89ab = pedersen_hash([hzz, hzz]);
    let hcdef = pedersen_hash([hzz, hzz]);
    let h_left = pedersen_hash([h0123, h4567]);
    let h_right = pedersen_hash([h89ab, hcdef]);
    let root = pedersen_hash([h_left, h_right]);

    // Claim 5 addresses when there is only 1 -- should fail
    main(root, 50, 5, addr_hashes, balances_arr);
}
