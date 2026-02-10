#!/usr/bin/env bash
set -euo pipefail

# Solva: Full end-to-end demo
# Demonstrates: BTC testnet UTXOs -> ZK proof -> onchain verification -> lending gate
#
# Usage: ./scripts/demo.sh [--sample] [--devnet]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

USE_SAMPLE="${1:-}"
NETWORK="${2:-}"

echo "========================================================"
echo "           SOLVA -- Solvency Demo                        "
echo "   BTC Reserves -> ZK Proof -> Onchain Verify            "
echo "========================================================"
echo ""

# Phase 1: Generate proof
echo "--- Phase 1: ZK Proof Generation ---"
"$SCRIPT_DIR/prove.sh" $USE_SAMPLE
echo ""

# Phase 2: Deploy contracts (if not already deployed)
DEPLOY_FILE="$PROJECT_ROOT/deployments.json"
if [[ ! -f "$DEPLOY_FILE" ]]; then
    echo "--- Phase 2: Contract Deployment ---"
    "$SCRIPT_DIR/deploy.sh" $NETWORK
    echo ""
else
    echo "--- Phase 2: Using existing deployment ---"
    echo "  (found $DEPLOY_FILE)"
    echo ""
fi

# Phase 3: Submit proof
echo "--- Phase 3: Submit Solvency Proof ---"
REGISTRY_ADDR=$(python3 -c "import json; print(json.load(open('$DEPLOY_FILE'))['contracts']['solvency_registry'])")
python3 "$SCRIPT_DIR/submit_proof.py" \
    --proof "$PROJECT_ROOT/circuits/solvency_circuit/proof" \
    --vk "$PROJECT_ROOT/circuits/solvency_circuit/vk" \
    --registry-address "$REGISTRY_ADDR"
echo ""

# Phase 4: Verify solvency status
echo "--- Phase 4: Verify Solvency Status ---"
echo "Checking is_solvent() on registry..."
OWNER_ADDR="${OWNER_ADDR:-0x1234}"
RPC_URL="${RPC_URL:-https://free-rpc.nethermind.io/sepolia-juno/v0_7}"
sncast call \
    --contract-address "$REGISTRY_ADDR" \
    --function "is_solvent" \
    --calldata "$OWNER_ADDR" \
    --url "$RPC_URL"
echo ""

# Phase 5: Test lending gate
echo "--- Phase 5: Lending Protocol Gate ---"
LENDING_ADDR=$(python3 -c "import json; print(json.load(open('$DEPLOY_FILE'))['contracts']['lending_protocol'])")
echo "Checking max LTV from lending protocol..."
sncast call \
    --contract-address "$LENDING_ADDR" \
    --function "get_max_ltv" \
    --url "$RPC_URL"
echo ""

echo "========================================================"
echo "              Demo Complete!                              "
echo "  Reserve solvency verified on-chain via ZK proof         "
echo "========================================================"
