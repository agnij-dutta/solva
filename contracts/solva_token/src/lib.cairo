use starknet::ContractAddress;

#[starknet::interface]
pub trait ISolvaToken<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
    fn burn(ref self: TContractState, from: ContractAddress, amount: u256);
}

#[starknet::contract]
mod SolvaToken {
    use super::ISolvaToken;
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess,
        Map, StoragePathEntry,
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        total_supply: u256,
        balances: Map<ContractAddress, u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        #[key]
        from: ContractAddress,
        #[key]
        to: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, initial_supply: u256) {
        self.owner.write(owner);
        self.total_supply.write(initial_supply);
        self.balances.entry(owner).write(initial_supply);
    }

    #[abi(embed_v0)]
    impl SolvaTokenImpl of ISolvaToken<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            'Solva BTC'
        }

        fn symbol(self: @ContractState) -> felt252 {
            'sBTC'
        }

        fn decimals(self: @ContractState) -> u8 {
            8 // Same as Bitcoin
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.entry(account).read()
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let caller = get_caller_address();
            let caller_balance = self.balances.entry(caller).read();
            assert(caller_balance >= amount, 'Insufficient balance');

            self.balances.entry(caller).write(caller_balance - amount);
            let recipient_balance = self.balances.entry(recipient).read();
            self.balances.entry(recipient).write(recipient_balance + amount);

            self.emit(Transfer { from: caller, to: recipient, amount });
            true
        }

        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can mint');

            let supply = self.total_supply.read();
            self.total_supply.write(supply + amount);
            let balance = self.balances.entry(to).read();
            self.balances.entry(to).write(balance + amount);

            self.emit(Transfer { from: starknet::contract_address_const::<0>(), to, amount });
        }

        fn burn(ref self: ContractState, from: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can burn');

            let balance = self.balances.entry(from).read();
            assert(balance >= amount, 'Insufficient balance');

            self.balances.entry(from).write(balance - amount);
            let supply = self.total_supply.read();
            self.total_supply.write(supply - amount);

            self.emit(Transfer { from, to: starknet::contract_address_const::<0>(), amount });
        }
    }
}
