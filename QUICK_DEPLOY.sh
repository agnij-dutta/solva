#!/bin/bash
set -e

echo "🚀 Quick Deploy - Solva Contracts to Starknet Sepolia"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Set paths
export PATH="$HOME/.local/bin:$PATH"

ACCOUNT_NAME="solva-deployer"
NETWORK="sepolia"
RPC_URL="https://free-rpc.nethermind.io/sepolia-juno/v0_7"

echo "Account: $ACCOUNT_NAME"
echo "Network: $NETWORK"
echo ""

# Get account address from file
ACCOUNT_FILE="$HOME/.starknet_accounts/starknet_open_zeppelin_accounts.json"
if [ ! -f "$ACCOUNT_FILE" ]; then
    echo -e "${RED}Error: Account file not found${NC}"
    echo "Expected: $ACCOUNT_FILE"
    exit 1
fi

ACCOUNT_ADDRESS=$(cat "$ACCOUNT_FILE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('$NETWORK', {}).get('$ACCOUNT_NAME', {}).get('address', ''))" 2>/dev/null)

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo -e "${RED}Error: Could not find account address${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found account: $ACCOUNT_ADDRESS"
echo ""

# Deploy contracts
echo "📦 Deploying contracts..."
echo ""

cd "$(dirname "$0")/.."

# 1. Deploy SolvencyVerifier
echo "1️⃣  Deploying SolvencyVerifier..."
cd contracts/solvency_verifier
scarb build
VERIFIER_RESULT=$(sncast --account "$ACCOUNT_NAME" --url "$RPC_URL" declare --contract-name SolvencyVerifier 2>&1 || echo "already_declared")
if echo "$VERIFIER_RESULT" | grep -q "class_hash"; then
    VERIFIER_CLASS=$(echo "$VERIFIER_RESULT" | grep "class_hash" | cut -d'"' -f4)
elif echo "$VERIFIER_RESULT" | grep -q "is already declared"; then
    # Extract from error message or use known hash
    echo -e "${YELLOW}Already declared, using existing class${NC}"
    VERIFIER_CLASS="0x5b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564" # Replace with actual
fi

VERIFIER_DEPLOY=$(sncast --account "$ACCOUNT_NAME" --url "$RPC_URL" deploy --class-hash "$VERIFIER_CLASS" 2>&1)
VERIFIER_ADDRESS=$(echo "$VERIFIER_DEPLOY" | grep "contract_address" | cut -d'"' -f4)
echo -e "${GREEN}✓${NC} SolvencyVerifier: $VERIFIER_ADDRESS"

# Save to deployments.json
cat > ../../deployments.json << JSON
{
  "network": "$NETWORK",
  "rpc_url": "$RPC_URL",
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "$ACCOUNT_ADDRESS",
  "contracts": {
    "solvency_verifier": "$VERIFIER_ADDRESS",
    "solvency_registry": "pending",
    "solva_token": "pending",
    "lending_protocol": "pending"
  }
}
JSON

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "📄 Deployment info saved to: deployments.json"
echo ""
echo "Contract addresses:"
echo "  Verifier: $VERIFIER_ADDRESS"
echo ""
echo "⚠️  Manual steps remaining:"
echo "  1. Deploy remaining contracts (registry, token, lending)"
echo "  2. Update .env files with addresses"
echo "  3. Restart dashboard: cd web-dashboard && npm run dev"
