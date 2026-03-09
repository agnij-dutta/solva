/**
 * Contract ABIs extracted from compiled Cairo artifacts.
 * These are the real ABIs for the deployed Starknet Sepolia contracts.
 */

export const REGISTRY_ABI = [
  {
    type: "impl",
    name: "SolvencyRegistryImpl",
    interface_name: "solvency_registry::ISolvencyRegistry",
  },
  {
    type: "struct",
    name: "core::array::Span::<core::felt252>",
    members: [{ name: "snapshot", type: "@core::array::Array::<core::felt252>" }],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "enum",
    name: "solvency_registry::SolvencyTier",
    variants: [
      { name: "None", type: "()" },
      { name: "TierC", type: "()" },
      { name: "TierB", type: "()" },
      { name: "TierA", type: "()" },
    ],
  },
  {
    type: "struct",
    name: "solvency_registry::SolvencyInfo",
    members: [
      { name: "last_proof_time", type: "core::integer::u64" },
      { name: "merkle_root", type: "core::integer::u256" },
      { name: "total_liabilities", type: "core::integer::u256" },
      { name: "is_valid", type: "core::bool" },
      { name: "tier", type: "solvency_registry::SolvencyTier" },
    ],
  },
  {
    type: "interface",
    name: "solvency_registry::ISolvencyRegistry",
    items: [
      {
        type: "function",
        name: "submit_solvency_proof",
        inputs: [{ name: "full_proof_with_hints", type: "core::array::Span::<core::felt252>" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "is_solvent",
        inputs: [{ name: "issuer", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_solvency_info",
        inputs: [{ name: "issuer", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "solvency_registry::SolvencyInfo" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_verifier_address",
        inputs: [],
        outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_max_proof_age",
        inputs: [],
        outputs: [{ type: "core::integer::u64" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "event",
    name: "solvency_registry::SolvencyRegistry::SolvencyVerified",
    kind: "struct",
    members: [
      { name: "issuer", type: "core::starknet::contract_address::ContractAddress", kind: "key" },
      { name: "merkle_root", type: "core::integer::u256", kind: "data" },
      { name: "total_liabilities", type: "core::integer::u256", kind: "data" },
      { name: "tier", type: "solvency_registry::SolvencyTier", kind: "data" },
      { name: "timestamp", type: "core::integer::u64", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "solvency_registry::SolvencyRegistry::SolvencyFailed",
    kind: "struct",
    members: [
      { name: "issuer", type: "core::starknet::contract_address::ContractAddress", kind: "key" },
      { name: "timestamp", type: "core::integer::u64", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "solvency_registry::SolvencyRegistry::Event",
    kind: "enum",
    variants: [
      { name: "SolvencyVerified", type: "solvency_registry::SolvencyRegistry::SolvencyVerified", kind: "nested" },
      { name: "SolvencyFailed", type: "solvency_registry::SolvencyRegistry::SolvencyFailed", kind: "nested" },
    ],
  },
] as const;

export const LENDING_ABI = [
  {
    type: "impl",
    name: "LendingProtocolImpl",
    interface_name: "lending_protocol::ILendingProtocol",
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "interface",
    name: "lending_protocol::ILendingProtocol",
    items: [
      {
        type: "function",
        name: "deposit",
        inputs: [{ name: "amount", type: "core::integer::u256" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "borrow",
        inputs: [{ name: "amount", type: "core::integer::u256" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_max_ltv",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_pool_balance",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_user_deposit",
        inputs: [{ name: "user", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_user_borrow",
        inputs: [{ name: "user", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "event",
    name: "lending_protocol::LendingProtocol::Deposit",
    kind: "struct",
    members: [
      { name: "user", type: "core::starknet::contract_address::ContractAddress", kind: "key" },
      { name: "amount", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "lending_protocol::LendingProtocol::Borrow",
    kind: "struct",
    members: [
      { name: "user", type: "core::starknet::contract_address::ContractAddress", kind: "key" },
      { name: "amount", type: "core::integer::u256", kind: "data" },
      { name: "ltv", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "lending_protocol::LendingProtocol::Event",
    kind: "enum",
    variants: [
      { name: "Deposit", type: "lending_protocol::LendingProtocol::Deposit", kind: "nested" },
      { name: "Borrow", type: "lending_protocol::LendingProtocol::Borrow", kind: "nested" },
    ],
  },
] as const;
