/// Placeholder verifier contract.
/// In production, this is REPLACED by `garaga gen --system ultra_keccak_honk`.
/// The mock always returns valid for testing purposes.

#[starknet::interface]
pub trait ISolvencyVerifier<TContractState> {
    fn verify_ultra_keccak_honk_proof(
        self: @TContractState,
        full_proof_with_hints: Span<felt252>,
    ) -> Option<Span<u256>>;
}

#[starknet::contract]
mod SolvencyVerifier {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        mock_mode: bool,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.mock_mode.write(true);
    }

    #[abi(embed_v0)]
    impl SolvencyVerifierImpl of super::ISolvencyVerifier<ContractState> {
        fn verify_ultra_keccak_honk_proof(
            self: @ContractState,
            full_proof_with_hints: Span<felt252>,
        ) -> Option<Span<u256>> {
            // In mock mode, extract first two elements as public inputs
            // In production, garaga handles real cryptographic verification
            if full_proof_with_hints.len() < 4 {
                return Option::None;
            }

            // Simulate extracting public inputs [root, total_liabilities]
            // Each u256 is two felt252s (low, high)
            let root = u256 {
                low: (*full_proof_with_hints.at(0)).try_into().unwrap(),
                high: (*full_proof_with_hints.at(1)).try_into().unwrap(),
            };
            let liabilities = u256 {
                low: (*full_proof_with_hints.at(2)).try_into().unwrap(),
                high: (*full_proof_with_hints.at(3)).try_into().unwrap(),
            };

            let mut public_inputs = array![root, liabilities];
            Option::Some(public_inputs.span())
        }
    }
}
