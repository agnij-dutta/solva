#!/usr/bin/env bash
set -euo pipefail

# Solva: End-to-end proof generation
# Usage: ./scripts/prove.sh [--sample]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$PROJECT_ROOT/circuits/solvency_circuit"

# Ensure tools are on PATH
export PATH="$HOME/.nargo/bin:$HOME/.bb:$PATH"

echo "=== Solva Proof Generation ==="
echo ""

# Step 1: Fetch BTC reserve data (or use sample)
echo "[1/5] Fetching Bitcoin reserve data..."
if [[ "${1:-}" == "--sample" ]]; then
    echo "  Using sample data (offline mode)"
    cp "$PROJECT_ROOT/offchain/data/sample_utxos.json" "$PROJECT_ROOT/offchain/data/reserve_data.json"
else
    echo "  Fetching from Bitcoin testnet..."
    cd "$PROJECT_ROOT/offchain"
    python3 -m bitcoin.fetch_utxos || {
        echo "  WARNING: Live fetch failed, falling back to sample data"
        cp "$PROJECT_ROOT/offchain/data/sample_utxos.json" "$PROJECT_ROOT/offchain/data/reserve_data.json"
    }
fi
echo ""

# Step 2: Build Merkle tree and generate Prover.toml
echo "[2/5] Building Merkle tree..."
cd "$PROJECT_ROOT/tree-builder"
npx tsx src/index.ts --input "$PROJECT_ROOT/offchain/data/reserve_data.json"
echo ""

# Step 3: Compile the Noir circuit
echo "[3/5] Compiling Noir circuit..."
cd "$CIRCUIT_DIR"
nargo compile
echo "  Compiled: target/solvency_circuit.json"
echo ""

# Step 4: Generate witness
echo "[4/5] Generating witness..."
nargo execute witness
echo "  Witness: target/witness.gz"
echo ""

# Step 5: Generate proof with bb (newer unified API)
echo "[5/5] Generating ZK proof..."

# bb v4+ uses unified 'prove' command with -t for target
# -t evm = UltraKeccakHonk (same proof system, Keccak hash)
# --write_vk generates VK alongside proof
# --verify does local verification
bb prove \
    -b target/solvency_circuit.json \
    -w target/witness.gz \
    -o target/proof \
    -t evm \
    --write_vk \
    --verify

echo "  Proof: $CIRCUIT_DIR/target/proof/proof"
echo "  VK: $CIRCUIT_DIR/target/proof/vk"
echo "  Public inputs: $CIRCUIT_DIR/target/proof/public_inputs"

echo ""
echo "=== Done ==="
echo "Proof verified locally!"
echo ""
echo "Next: submit on-chain via the frontend or ./scripts/submit_proof.py"
