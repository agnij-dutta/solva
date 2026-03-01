#!/usr/bin/env bash
set -euo pipefail

# Solva: Deploy all contracts to Starknet Sepolia
# Prerequisites: scarb, sncast, funded account

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Add tools to PATH
export PATH="$HOME/.local/bin:$PATH"

echo "=== Solva Contract Deployment to Starknet Sepolia ==="
echo ""

# Check if account is deployed
ACCOUNT_NAME="${ACCOUNT_NAME:-solva-deployer}"
NETWORK="sepolia"

echo "Using account: $ACCOUNT_NAME"
echo "Network: $NETWORK"
echo ""

# Get account address
ACCOUNT_ADDR=$(sncast account list 2>/dev/null | grep -A1 "$ACCOUNT_NAME" | grep "address:" | awk '{print $2}' || echo "")

if [ -z "$ACCOUNT_ADDR" ]; then
    echo "Error: Account $ACCOUNT_NAME not found."
    echo "Please create and fund an account first:"
    echo "  1. sncast account create --name $ACCOUNT_NAME --network sepolia"
    echo "  2. Fund the account address with STRK tokens"
    echo "  3. sncast account deploy --name $ACCOUNT_NAME --network sepolia"
    exit 1
fi

echo "Account address: $ACCOUNT_ADDR"
echo ""

# Build all contracts
echo "[1/5] Building contracts..."
for contract in solvency_verifier solvency_registry solva_token lending_protocol; do
    echo "  Building $contract..."
    cd "$PROJECT_ROOT/contracts/$contract"
    scarb build
done
echo "All contracts built successfully!"
echo ""

# Deploy Solvency Verifier
echo "[2/5] Deploying SolvencyVerifier..."
cd "$PROJECT_ROOT/contracts/solvency_verifier"

# Declare the contract
echo "  Declaring contract..."
VERIFIER_DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" declare --contract-name SolvencyVerifier 2>&1)
echo "$VERIFIER_DECLARE_OUTPUT"

VERIFIER_CLASS=$(echo "$VERIFIER_DECLARE_OUTPUT" | grep -o "class_hash: 0x[0-9a-fA-F]*" | awk '{print $2}' || echo "")

if [ -z "$VERIFIER_CLASS" ]; then
    # Try to extract from already declared message
    VERIFIER_CLASS=$(echo "$VERIFIER_DECLARE_OUTPUT" | grep -o "0x[0-9a-fA-F]\{64\}" | head -1 || echo "")
fi

echo "  Class hash: $VERIFIER_CLASS"

# Deploy the contract
echo "  Deploying contract..."
VERIFIER_DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" deploy --class-hash "$VERIFIER_CLASS" 2>&1)
echo "$VERIFIER_DEPLOY_OUTPUT"

VERIFIER_ADDR=$(echo "$VERIFIER_DEPLOY_OUTPUT" | grep -o "contract_address: 0x[0-9a-fA-F]*" | awk '{print $2}')
echo "  Deployed at: $VERIFIER_ADDR"
echo ""

# Wait for confirmation
sleep 5

# Deploy Solva Token
echo "[3/5] Deploying SolvaToken..."
cd "$PROJECT_ROOT/contracts/solva_token"

# Use account address as owner
OWNER_ADDR="$ACCOUNT_ADDR"
# Initial supply: 10,000,000 sats (10 million in 8 decimals)
INITIAL_SUPPLY_LOW="0x989680"  # 10,000,000 in hex
INITIAL_SUPPLY_HIGH="0x0"

echo "  Declaring contract..."
TOKEN_DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" declare --contract-name SolvaToken 2>&1)
echo "$TOKEN_DECLARE_OUTPUT"

TOKEN_CLASS=$(echo "$TOKEN_DECLARE_OUTPUT" | grep -o "class_hash: 0x[0-9a-fA-F]*" | awk '{print $2}' || echo "")

if [ -z "$TOKEN_CLASS" ]; then
    TOKEN_CLASS=$(echo "$TOKEN_DECLARE_OUTPUT" | grep -o "0x[0-9a-fA-F]\{64\}" | head -1 || echo "")
fi

echo "  Class hash: $TOKEN_CLASS"

echo "  Deploying contract..."
TOKEN_DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" deploy \
    --class-hash "$TOKEN_CLASS" \
    --constructor-calldata "$OWNER_ADDR" "$INITIAL_SUPPLY_LOW" "$INITIAL_SUPPLY_HIGH" 2>&1)
echo "$TOKEN_DEPLOY_OUTPUT"

TOKEN_ADDR=$(echo "$TOKEN_DEPLOY_OUTPUT" | grep -o "contract_address: 0x[0-9a-fA-F]*" | awk '{print $2}')
echo "  Deployed at: $TOKEN_ADDR"
echo ""

sleep 5

# Deploy Solvency Registry
echo "[4/5] Deploying SolvencyRegistry..."
cd "$PROJECT_ROOT/contracts/solvency_registry"

# Max proof age: 24 hours = 86400 seconds
MAX_PROOF_AGE="86400"

echo "  Declaring contract..."
REGISTRY_DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" declare --contract-name SolvencyRegistry 2>&1)
echo "$REGISTRY_DECLARE_OUTPUT"

REGISTRY_CLASS=$(echo "$REGISTRY_DECLARE_OUTPUT" | grep -o "class_hash: 0x[0-9a-fA-F]*" | awk '{print $2}' || echo "")

if [ -z "$REGISTRY_CLASS" ]; then
    REGISTRY_CLASS=$(echo "$REGISTRY_DECLARE_OUTPUT" | grep -o "0x[0-9a-fA-F]\{64\}" | head -1 || echo "")
fi

echo "  Class hash: $REGISTRY_CLASS"

echo "  Deploying contract..."
REGISTRY_DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" deploy \
    --class-hash "$REGISTRY_CLASS" \
    --constructor-calldata "$VERIFIER_ADDR" "$MAX_PROOF_AGE" "$OWNER_ADDR" 2>&1)
echo "$REGISTRY_DEPLOY_OUTPUT"

REGISTRY_ADDR=$(echo "$REGISTRY_DEPLOY_OUTPUT" | grep -o "contract_address: 0x[0-9a-fA-F]*" | awk '{print $2}')
echo "  Deployed at: $REGISTRY_ADDR"
echo ""

sleep 5

# Deploy Lending Protocol
echo "[5/5] Deploying LendingProtocol..."
cd "$PROJECT_ROOT/contracts/lending_protocol"

echo "  Declaring contract..."
LENDING_DECLARE_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" declare --contract-name LendingProtocol 2>&1)
echo "$LENDING_DECLARE_OUTPUT"

LENDING_CLASS=$(echo "$LENDING_DECLARE_OUTPUT" | grep -o "class_hash: 0x[0-9a-fA-F]*" | awk '{print $2}' || echo "")

if [ -z "$LENDING_CLASS" ]; then
    LENDING_CLASS=$(echo "$LENDING_DECLARE_OUTPUT" | grep -o "0x[0-9a-fA-F]\{64\}" | head -1 || echo "")
fi

echo "  Class hash: $LENDING_CLASS"

echo "  Deploying contract..."
LENDING_DEPLOY_OUTPUT=$(sncast --account "$ACCOUNT_NAME" --network "$NETWORK" deploy \
    --class-hash "$LENDING_CLASS" \
    --constructor-calldata "$REGISTRY_ADDR" "$OWNER_ADDR" 2>&1)
echo "$LENDING_DEPLOY_OUTPUT"

LENDING_ADDR=$(echo "$LENDING_DEPLOY_OUTPUT" | grep -o "contract_address: 0x[0-9a-fA-F]*" | awk '{print $2}')
echo "  Deployed at: $LENDING_ADDR"
echo ""

# Save deployment addresses
DEPLOY_FILE="$PROJECT_ROOT/deployments.json"
cat > "$DEPLOY_FILE" <<EOF
{
  "network": "sepolia",
  "deployer": "$ACCOUNT_ADDR",
  "contracts": {
    "solvency_verifier": {
      "address": "$VERIFIER_ADDR",
      "class_hash": "$VERIFIER_CLASS"
    },
    "solva_token": {
      "address": "$TOKEN_ADDR",
      "class_hash": "$TOKEN_CLASS"
    },
    "solvency_registry": {
      "address": "$REGISTRY_ADDR",
      "class_hash": "$REGISTRY_CLASS"
    },
    "lending_protocol": {
      "address": "$LENDING_ADDR",
      "class_hash": "$LENDING_CLASS"
    }
  },
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "explorer_urls": {
    "solvency_verifier": "https://sepolia.starkscan.co/contract/$VERIFIER_ADDR",
    "solva_token": "https://sepolia.starkscan.co/contract/$TOKEN_ADDR",
    "solvency_registry": "https://sepolia.starkscan.co/contract/$REGISTRY_ADDR",
    "lending_protocol": "https://sepolia.starkscan.co/contract/$LENDING_ADDR"
  }
}
EOF

echo "=== Deployment Complete ==="
echo "Addresses saved to $DEPLOY_FILE"
echo ""
echo "Contract Addresses:"
echo "  Verifier:  $VERIFIER_ADDR"
echo "  Token:     $TOKEN_ADDR"
echo "  Registry:  $REGISTRY_ADDR"
echo "  Lending:   $LENDING_ADDR"
echo ""
echo "Explorer Links:"
echo "  Verifier:  https://sepolia.starkscan.co/contract/$VERIFIER_ADDR"
echo "  Token:     https://sepolia.starkscan.co/contract/$TOKEN_ADDR"
echo "  Registry:  https://sepolia.starkscan.co/contract/$REGISTRY_ADDR"
echo "  Lending:   https://sepolia.starkscan.co/contract/$LENDING_ADDR"
echo ""
echo "Frontend Integration:"
echo "  Use the addresses from $DEPLOY_FILE"
echo ""
