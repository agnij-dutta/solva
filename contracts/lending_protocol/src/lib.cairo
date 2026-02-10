use starknet::ContractAddress;

#[starknet::interface]
pub trait ILendingProtocol<TContractState> {
    fn deposit(ref self: TContractState, amount: u256);
    fn borrow(ref self: TContractState, amount: u256);
    fn get_max_ltv(self: @TContractState) -> u256;
    fn get_pool_balance(self: @TContractState) -> u256;
    fn get_user_deposit(self: @TContractState, user: ContractAddress) -> u256;
    fn get_user_borrow(self: @TContractState, user: ContractAddress) -> u256;
}

#[starknet::contract]
mod LendingProtocol {
    use super::ILendingProtocol;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Map, StoragePathEntry,
    };
    use solvency_registry::{
        ISolvencyRegistryDispatcher, ISolvencyRegistryDispatcherTrait,
        SolvencyTier,
    };

    #[storage]
    struct Storage {
        registry_address: ContractAddress,
        reserve_manager: ContractAddress,
        pool_balance: u256,
        deposits: Map<ContractAddress, u256>,
        borrows: Map<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Deposit: Deposit,
        Borrow: Borrow,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposit {
        #[key]
        user: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Borrow {
        #[key]
        user: ContractAddress,
        amount: u256,
        ltv: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        registry_address: ContractAddress,
        reserve_manager: ContractAddress,
    ) {
        self.registry_address.write(registry_address);
        self.reserve_manager.write(reserve_manager);
    }

    /// Get the max LTV based on the reserve manager's solvency tier
    fn get_tier_ltv(tier: SolvencyTier) -> u256 {
        match tier {
            SolvencyTier::TierA => 80, // >= 150% reserves: 80% LTV
            SolvencyTier::TierB => 60, // >= 120% reserves: 60% LTV
            SolvencyTier::TierC => 40, // >= 100% reserves: 40% LTV
            SolvencyTier::None => 0,   // No valid proof: blocked
        }
    }

    #[abi(embed_v0)]
    impl LendingProtocolImpl of ILendingProtocol<ContractState> {
        fn deposit(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let current = self.deposits.entry(caller).read();
            self.deposits.entry(caller).write(current + amount);
            let pool = self.pool_balance.read();
            self.pool_balance.write(pool + amount);
            self.emit(Deposit { user: caller, amount });
        }

        fn borrow(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();

            // Check solvency of the reserve manager
            let registry = ISolvencyRegistryDispatcher {
                contract_address: self.registry_address.read(),
            };
            let reserve_mgr = self.reserve_manager.read();

            assert(registry.is_solvent(reserve_mgr), 'Reserve manager not solvent');

            let info = registry.get_solvency_info(reserve_mgr);
            let now = get_block_timestamp();
            assert(now - info.last_proof_time < 86400, 'Solvency proof too stale');

            // Get tier-based LTV
            let ltv = get_tier_ltv(info.tier);
            assert(ltv > 0, 'Borrowing blocked: no proof');

            // Check borrow against deposit * LTV
            let user_deposit = self.deposits.entry(caller).read();
            let max_borrow = user_deposit * ltv / 100;
            let current_borrow = self.borrows.entry(caller).read();
            assert(current_borrow + amount <= max_borrow, 'Exceeds max LTV borrow');

            // Check pool has enough liquidity
            let pool = self.pool_balance.read();
            assert(pool >= amount, 'Insufficient pool liquidity');

            // Execute borrow
            self.borrows.entry(caller).write(current_borrow + amount);
            self.pool_balance.write(pool - amount);

            self.emit(Borrow { user: caller, amount, ltv });
        }

        fn get_max_ltv(self: @ContractState) -> u256 {
            let registry = ISolvencyRegistryDispatcher {
                contract_address: self.registry_address.read(),
            };
            let reserve_mgr = self.reserve_manager.read();
            let info = registry.get_solvency_info(reserve_mgr);
            get_tier_ltv(info.tier)
        }

        fn get_pool_balance(self: @ContractState) -> u256 {
            self.pool_balance.read()
        }

        fn get_user_deposit(self: @ContractState, user: ContractAddress) -> u256 {
            self.deposits.entry(user).read()
        }

        fn get_user_borrow(self: @ContractState, user: ContractAddress) -> u256 {
            self.borrows.entry(user).read()
        }
    }
}
