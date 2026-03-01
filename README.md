# Solva

**Starknet-native ZK solvency verification layer for BTCFi.**

Bitcoin-backed asset issuers publish zero-knowledge proofs that reserves exceed liabilities — verified onchain in Cairo via Garaga — without exposing reserve wallets or balances. Other protocols (lending, stablecoins) can gate operations based on verified solvency.

## Architecture

```
Bitcoin Testnet UTXOs
        │
        ▼
  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
  │ UTXO Fetcher│────▶│ Merkle Tree  │────▶│  Noir Circuit   │
  │  (Python)   │     │  Builder(TS) │     │  (Barretenberg) │
  └─────────────┘     └──────────────┘     └────────┬────────┘
                                                     │
                                          UltraKeccakHonk Proof
                                                     │
                                                     ▼
                                           ┌─────────────────┐
                                           │ Garaga Verifier  │
                                           │   (Cairo/Stark)  │
                                           └────────┬────────┘
                                                     │
                              ┌───────────────────────┼───────────────────┐
                              ▼                       ▼                   ▼
                     ┌────────────────┐    ┌──────────────────┐  ┌──────────────┐
                     │   Solvency     │    │   Solva Token    │  │   Lending    │
                     │   Registry     │    │   (sBTC ERC20)   │  │   Protocol   │
                     └────────────────┘    └──────────────────┘  └──────────────┘
```

**Pipeline**: Noir → `bb prove_ultra_keccak_honk` → Garaga verifier (Cairo) → Starknet Sepolia

**Curve**: BN254 throughout (Noir Pedersen, bb proof, Garaga verifier). No curve mismatch.

## Quick Start

### Prerequisites

```bash
# Starknet toolchain (Scarb, snforge, sncast)
curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.sh | sh

# Noir compiler
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup

# Barretenberg backend
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
bbup

# Garaga (Python)
pip install garaga

# Node.js dependencies
cd tree-builder && npm install

# Python dependencies
cd offchain && pip install -r bitcoin/requirements.txt
```

### Run the Demo

```bash
# Full end-to-end (uses sample BTC data)
./scripts/demo.sh --sample

# Or step by step:
./scripts/prove.sh --sample       # Generate ZK proof
./scripts/deploy.sh --devnet      # Deploy contracts
python3 scripts/submit_proof.py \ # Submit proof on-chain
  --proof circuits/solvency_circuit/proof \
  --vk circuits/solvency_circuit/vk \
  --registry-address <ADDR>
```

### Run Tests

```bash
# Noir circuit tests
./tests/test_circuit.sh

# Cairo contract tests (requires snforge)
cd contracts/solvency_registry && snforge test
```

### Web Dashboard (Optional)

For a web-based interface with REST API and real-time proof tracking:

```bash
cd web-dashboard
npm install
npm run dev  # Starts at http://localhost:3000
```

See [web-dashboard/README.md](web-dashboard/README.md) for API documentation.

## Project Structure

```
solva/
├── offchain/               # Bitcoin data fetching
│   ├── bitcoin/            # UTXO fetcher (Python/httpx)
│   └── data/               # Reserve data & sample fallbacks
├── tree-builder/           # Pedersen Merkle tree (TypeScript/bb.js)
├── circuits/               # Noir ZK circuit
│   └── solvency_circuit/   # Proves reserves >= liabilities
├── contracts/              # Cairo/Starknet contracts
│   ├── solvency_verifier/  # Garaga-generated proof verifier
│   ├── solvency_registry/  # Stores per-issuer solvency status
│   ├── solva_token/        # Demo BTC-backed ERC20 (sBTC)
│   └── lending_protocol/   # Lending with solvency gate
├── scripts/                # Automation scripts
│   ├── prove.sh            # End-to-end proof generation
│   ├── deploy.sh           # Deploy all contracts
│   ├── submit_proof.py     # Generate calldata & submit
│   └── demo.sh             # Full demo flow
├── web-dashboard/          # Next.js web dashboard & API
│   ├── src/app/api/        # REST API endpoints
│   ├── src/lib/            # Starknet.js integration & utilities
│   └── src/types/          # Shared TypeScript types
└── tests/                  # Test scripts
```

## How It Works

### 1. Reserve Commitment
The UTXO fetcher queries Bitcoin testnet for confirmed UTXOs across custody addresses. Each address balance is hashed into a Merkle leaf using Pedersen hash (via `@aztec/bb.js`, matching Noir's backend).

### 2. ZK Proof
The Noir circuit proves two things without revealing private data:
- **Merkle inclusion**: A reserve commitment exists in the tree (private leaf, path)
- **Solvency**: `total_reserves >= total_liabilities` (64-bit range check on the difference)

Proof system: UltraKeccakHonk on BN254 (not Groth16 — no trusted setup needed).

### 3. On-Chain Verification
The Garaga-generated Cairo verifier checks the UltraKeccakHonk proof on Starknet. The Solvency Registry stores verification results per issuer with freshness tracking (24h max proof age).

### 4. DeFi Integration
The lending protocol queries the registry before allowing borrows. Tier-based LTV:
- **Tier A** (>= 150% reserves): 80% LTV
- **Tier B** (>= 120% reserves): 60% LTV
- **Tier C** (>= 100% reserves): 40% LTV
- **No proof / stale**: Borrowing blocked

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| UltraKeccakHonk over Groth16 | Noir/bb native, no trusted setup, Garaga supports it |
| `@aztec/bb.js` for Pedersen | Same Barretenberg backend as Noir — guarantees hash match |
| 64-bit range check for solvency | Covers up to ~1.8×10^19 sats (BTC supply is 2.1×10^15) |
| Tree depth 4 (16 leaves) | Fast proofs (~5s), sufficient for hackathon demo |
| Mock verifier contract | Drop-in replaceable when `garaga gen` produces real verifier |

## License

MIT
