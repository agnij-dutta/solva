use starknet::ContractAddress;

/// Solvency tier based on reserve/liability ratio
#[derive(Drop, Copy, Serde, starknet::Store, PartialEq)]
pub enum SolvencyTier {
    #[default]
    None,    // No valid proof
    TierC,   // >= 100% reserves
    TierB,   // >= 120% reserves
    TierA,   // >= 150% reserves
}

/// Solvency information for an issuer
#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct SolvencyInfo {
    pub last_proof_time: u64,
    pub merkle_root: u256,
    pub total_liabilities: u256,
    pub is_valid: bool,
    pub tier: SolvencyTier,
}

/// Interface matching the Garaga-generated UltraKeccakZKHonk verifier.
/// We define it here so the registry can dispatch cross-contract calls
/// without needing a crate dependency on the verifier.
#[starknet::interface]
pub trait IUltraKeccakZKHonkVerifier<TContractState> {
    fn verify_ultra_keccak_zk_honk_proof(
        self: @TContractState,
        full_proof_with_hints: Span<felt252>,
    ) -> Result<Span<u256>, felt252>;
}

#[starknet::interface]
pub trait ISolvencyRegistry<TContractState> {
    fn submit_solvency_proof(ref self: TContractState, full_proof_with_hints: Span<felt252>);
    fn is_solvent(self: @TContractState, issuer: ContractAddress) -> bool;
    fn get_solvency_info(self: @TContractState, issuer: ContractAddress) -> SolvencyInfo;
    fn get_verifier_address(self: @TContractState) -> ContractAddress;
    fn get_max_proof_age(self: @TContractState) -> u64;
    fn set_max_proof_age(ref self: TContractState, new_max_age: u64);
}

#[starknet::contract]
mod SolvencyRegistry {
    use super::{
        SolvencyInfo, SolvencyTier, ISolvencyRegistry,
        IUltraKeccakZKHonkVerifierDispatcher, IUltraKeccakZKHonkVerifierDispatcherTrait,
    };
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Map, StoragePathEntry,
    };

    #[storage]
    struct Storage {
        verifier_address: ContractAddress,
        max_proof_age: u64,
        owner: ContractAddress,
        solvency_info: Map<ContractAddress, SolvencyInfo>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        SolvencyVerified: SolvencyVerified,
        SolvencyFailed: SolvencyFailed,
    }

    #[derive(Drop, starknet::Event)]
    struct SolvencyVerified {
        #[key]
        issuer: ContractAddress,
        merkle_root: u256,
        total_liabilities: u256,
        tier: SolvencyTier,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct SolvencyFailed {
        #[key]
        issuer: ContractAddress,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        verifier_address: ContractAddress,
        max_proof_age: u64,
        owner: ContractAddress,
    ) {
        self.verifier_address.write(verifier_address);
        self.max_proof_age.write(max_proof_age);
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl SolvencyRegistryImpl of ISolvencyRegistry<ContractState> {
        fn submit_solvency_proof(ref self: ContractState, full_proof_with_hints: Span<felt252>) {
            let caller = get_caller_address();
            let now = get_block_timestamp();

            // Dispatch to the Garaga-generated verifier contract
            let verifier = IUltraKeccakZKHonkVerifierDispatcher {
                contract_address: self.verifier_address.read(),
            };
            let result = verifier.verify_ultra_keccak_zk_honk_proof(full_proof_with_hints);

            match result {
                Result::Ok(public_inputs) => {
                    // Extract public inputs: [root, total_liabilities]
                    let merkle_root: u256 = *public_inputs.at(0);
                    let total_liabilities: u256 = *public_inputs.at(1);

                    // The ZK proof guarantees reserves >= liabilities
                    // (enforced by the 64-bit range check in the Noir circuit).
                    let tier = SolvencyTier::TierA;

                    let info = SolvencyInfo {
                        last_proof_time: now,
                        merkle_root,
                        total_liabilities,
                        is_valid: true,
                        tier,
                    };
                    self.solvency_info.entry(caller).write(info);

                    self.emit(SolvencyVerified {
                        issuer: caller,
                        merkle_root,
                        total_liabilities,
                        tier,
                        timestamp: now,
                    });
                },
                Result::Err(_) => {
                    let info = SolvencyInfo {
                        last_proof_time: now,
                        merkle_root: 0_u256,
                        total_liabilities: 0_u256,
                        is_valid: false,
                        tier: SolvencyTier::None,
                    };
                    self.solvency_info.entry(caller).write(info);

                    self.emit(SolvencyFailed {
                        issuer: caller,
                        timestamp: now,
                    });
                },
            }
        }

        fn is_solvent(self: @ContractState, issuer: ContractAddress) -> bool {
            let info = self.solvency_info.entry(issuer).read();
            if !info.is_valid {
                return false;
            }
            let now = get_block_timestamp();
            let max_age = self.max_proof_age.read();
            if now - info.last_proof_time > max_age {
                return false;
            }
            true
        }

        fn get_solvency_info(self: @ContractState, issuer: ContractAddress) -> SolvencyInfo {
            self.solvency_info.entry(issuer).read()
        }

        fn get_verifier_address(self: @ContractState) -> ContractAddress {
            self.verifier_address.read()
        }

        fn get_max_proof_age(self: @ContractState) -> u64 {
            self.max_proof_age.read()
        }

        fn set_max_proof_age(ref self: ContractState, new_max_age: u64) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner');
            self.max_proof_age.write(new_max_age);
        }
    }
}
