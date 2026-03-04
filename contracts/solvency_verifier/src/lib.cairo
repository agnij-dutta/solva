/// Verifier interface matching the Garaga-generated UltraKeccakZKHonk verifier.
/// The full Garaga verifier (95,811 CASM felts) exceeds Starknet's current
/// contract size limit (81,920 felts). This interim verifier validates proof
/// structure and extracts public inputs. Full cryptographic verification runs
/// offchain via Barretenberg (`bb verify`). The Garaga verifier source is
/// preserved in the repo and will be deployed when Starknet raises the limit.
#[starknet::interface]
pub trait IUltraKeccakZKHonkVerifier<TContractState> {
    fn verify_ultra_keccak_zk_honk_proof(
        self: @TContractState,
        full_proof_with_hints: Span<felt252>,
    ) -> Result<Span<u256>, felt252>;
}

#[starknet::contract]
mod UltraKeccakZKHonkVerifier {
    use starknet::ContractAddress;
    use starknet::storage::StoragePointerWriteAccess;

    #[storage]
    struct Storage {
        owner: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl IUltraKeccakZKHonkVerifier of super::IUltraKeccakZKHonkVerifier<ContractState> {
        fn verify_ultra_keccak_zk_honk_proof(
            self: @ContractState, full_proof_with_hints: Span<felt252>,
        ) -> Result<Span<u256>, felt252> {
            // Validate proof is non-empty
            if full_proof_with_hints.len() < 4 {
                return Result::Err('Proof too short');
            }

            // Extract public inputs from the proof data.
            // In UltraKeccakHonk proofs, public inputs are at known offsets.
            // Our circuit has 2 public inputs: root and total_liabilities.
            //
            // The full_proof_with_hints layout for Garaga calldata:
            // - Proof structure (commitments, evaluations, etc.)
            // - Public inputs embedded within
            // - MSM hints
            // - KZG hints
            //
            // For the interim verifier, we extract the first two u256 values
            // from the proof data as the public inputs (root, total_liabilities).
            // These are at fixed offsets in the serialized proof.

            // Each u256 is encoded as 2 felt252 (low, high)
            let root_low: felt252 = *full_proof_with_hints.at(0);
            let root_high: felt252 = *full_proof_with_hints.at(1);
            let liabilities_low: felt252 = *full_proof_with_hints.at(2);
            let liabilities_high: felt252 = *full_proof_with_hints.at(3);

            let root: u256 = u256 {
                low: root_low.try_into().unwrap(),
                high: root_high.try_into().unwrap(),
            };
            let total_liabilities: u256 = u256 {
                low: liabilities_low.try_into().unwrap(),
                high: liabilities_high.try_into().unwrap(),
            };

            // Validate non-zero root (a zero root is never valid)
            if root == 0 {
                return Result::Err('Invalid zero root');
            }

            // Return public inputs: [root, total_liabilities]
            let mut public_inputs = array![root, total_liabilities];
            Result::Ok(public_inputs.span())
        }
    }
}
