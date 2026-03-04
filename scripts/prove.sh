#!/usr/bin/env bash
set -euo pipefail

# Solva: End-to-end proof generation
# Usage: ./scripts/prove.sh [--sample]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CIRCUIT_DIR="$PROJECT_ROOT/circuits/solvency_circuit"

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

# Step 5: Write verification key + generate proof
echo "[5/5] Generating ZK proof..."

# VK must be written first (prove reads it)
bb write_vk \
    -b target/solvency_circuit.json \
    -o target
echo "  VK: $CIRCUIT_DIR/target/vk"

bb prove \
    -b target/solvency_circuit.json \
    -w target/witness.gz \
    -o target
echo "  Proof: $CIRCUIT_DIR/target/proof"

# Verify locally
echo ""
echo "=== Local Verification ==="
bb verify -k target/vk -p target/proof && \
    echo "  Proof verified locally!" || \
    echo "  Local verification failed!"

echo ""
echo "=== Done ==="
echo "Proof artifact: $CIRCUIT_DIR/target/proof"
echo "Verification key: $CIRCUIT_DIR/target/vk"
echo ""
echo "Next: run ./scripts/submit_proof.py to submit on-chain"
