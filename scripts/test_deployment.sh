#!/usr/bin/env bash
set -euo pipefail

# Solva: Test deployed contracts functionality

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Add tools to PATH
export PATH="$HOME/.local/bin:$PATH"

echo "=== Solva Protocol - Contract Testing ==="
echo ""

# Check if deployments.json exists
if [ ! -f "deployments.json" ]; then
    echo "Error: deployments.json not found"
    echo "Please deploy contracts first using ./scripts/deploy_sepolia.sh"
    exit 1
fi

# Extract contract addresses from deployments.json
VERIFIER_ADDR=$(grep -A 1 '"solvency_verifier"' deployments.json | grep '"address"' | cut -d'"' -f4)
TOKEN_ADDR=$(grep -A 1 '"solva_token"' deployments.json | grep '"address"' | cut -d'"' -f4)
REGISTRY_ADDR=$(grep -A 1 '"solvency_registry"' deployments.json | grep '"address"' | cut -d'"' -f4)
LENDING_ADDR=$(grep -A 1 '"lending_protocol"' deployments.json | grep '"address"' | cut -d'"' -f4)

ACCOUNT_NAME="${ACCOUNT_NAME:-solva-deployer}"
NETWORK="sepolia"

echo "Testing contracts:"
echo "  Verifier:  $VERIFIER_ADDR"
echo "  Token:     $TOKEN_ADDR"
echo "  Registry:  $REGISTRY_ADDR"
echo "  Lending:   $LENDING_ADDR"
echo ""

# Test 1: Token Balance
echo "[Test 1] Checking token total supply..."
SUPPLY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" \
    call --contract-address "$TOKEN_ADDR" --function total_supply 2>&1 || echo "")

if [ -n "$SUPPLY_OUTPUT" ]; then
    echo "✓ Token contract is accessible"
    echo "$SUPPLY_OUTPUT"
else
    echo "✗ Failed to read token supply"
fi
echo ""

# Test 2: Registry Configuration
echo "[Test 2] Checking registry configuration..."
VERIFIER_CHECK=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" \
    call --contract-address "$REGISTRY_ADDR" --function get_verifier_address 2>&1 || echo "")

if [ -n "$VERIFIER_CHECK" ]; then
    echo "✓ Registry contract is accessible"
    echo "$VERIFIER_CHECK"
else
    echo "✗ Failed to read registry verifier"
fi
echo ""

# Test 3: Max Proof Age
echo "[Test 3] Checking max proof age setting..."
MAX_AGE=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" \
    call --contract-address "$REGISTRY_ADDR" --function get_max_proof_age 2>&1 || echo "")

if [ -n "$MAX_AGE" ]; then
    echo "✓ Max proof age configured"
    echo "$MAX_AGE"
else
    echo "✗ Failed to read max proof age"
fi
echo ""

# Test 4: Lending Protocol LTV
echo "[Test 4] Checking lending protocol max LTV..."
LTV=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" \
    call --contract-address "$LENDING_ADDR" --function get_max_ltv 2>&1 || echo "")

if [ -n "$LTV" ]; then
    echo "✓ Lending protocol is accessible"
    echo "$LTV"
else
    echo "✗ Failed to read max LTV"
fi
echo ""

# Test 5: Submit Mock Solvency Proof
echo "[Test 5] Submitting mock solvency proof..."
echo "  Note: This is a test proof with mock data"

# Create mock proof data (4 felt252s representing root and liabilities as u256)
# Root: 0x123456 (low), 0x0 (high)
# Liabilities: 1000000 sats = 0xF4240 (low), 0x0 (high)
PROOF_DATA="0x123456 0x0 0xF4240 0x0"

SUBMIT_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" \
    invoke --contract-address "$REGISTRY_ADDR" \
    --function submit_solvency_proof \
    --calldata "$PROOF_DATA" 2>&1 || echo "")

if echo "$SUBMIT_OUTPUT" | grep -q "transaction_hash"; then
    echo "✓ Solvency proof submitted successfully"
    TX_HASH=$(echo "$SUBMIT_OUTPUT" | grep "transaction_hash" | cut -d'"' -f4 || echo "")
    if [ -n "$TX_HASH" ]; then
        echo "  Transaction: https://sepolia.starkscan.co/tx/$TX_HASH"
    fi
else
    echo "✗ Failed to submit solvency proof"
    echo "$SUBMIT_OUTPUT"
fi
echo ""

# Wait for transaction
echo "Waiting for transaction confirmation (10 seconds)..."
sleep 10

# Test 6: Check Solvency Status
echo "[Test 6] Checking solvency status after proof submission..."
ACCOUNT_ADDR=$(sncast account list 2>/dev/null | grep -A1 "$ACCOUNT_NAME" | grep "address:" | awk '{print $2}' || echo "")

SOLVENT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" \
    call --contract-address "$REGISTRY_ADDR" \
    --function is_solvent \
    --calldata "$ACCOUNT_ADDR" 2>&1 || echo "")

if [ -n "$SOLVENT" ]; then
    echo "✓ Solvency status check successful"
    echo "$SOLVENT"
else
    echo "✗ Failed to check solvency status"
fi
echo ""

echo "=== Test Summary ==="
echo ""
echo "All basic contract interactions have been tested."
echo "Check the output above for any failures."
echo ""
echo "Next steps:"
echo "  1. View contracts on Starkscan using explorer URLs"
echo "  2. Integrate contract addresses with frontend"
echo "  3. Test full user flows with the frontend"
echo ""
