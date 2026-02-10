#!/usr/bin/env bash
set -euo pipefail

# Solva: Deploy all contracts to Starknet Sepolia
# Prerequisites: scarb, sncast, funded account
#
# Usage: ./scripts/deploy.sh [--devnet]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"

# Default RPC (Sepolia)
RPC_URL="${RPC_URL:-https://free-rpc.nethermind.io/sepolia-juno/v0_7}"
ACCOUNT="${ACCOUNT:-}"

if [[ "${1:-}" == "--devnet" ]]; then
    RPC_URL="http://localhost:5050"
    echo "Using local devnet at $RPC_URL"
fi

echo "=== Solva Contract Deployment ==="
echo "RPC: $RPC_URL"
echo ""

# Build all contracts
echo "[1/5] Building contracts..."
for contract in solvency_verifier solvency_registry solva_token lending_protocol; do
    echo "  Building $contract..."
    cd "$CONTRACTS_DIR/$contract"
    scarb build
done
echo ""

# Deploy Solvency Verifier
echo "[2/5] Deploying SolvencyVerifier..."
cd "$CONTRACTS_DIR/solvency_verifier"
VERIFIER_CLASS=$(sncast declare --contract-name SolvencyVerifier --url "$RPC_URL" 2>&1 | grep "class_hash:" | awk '{print $2}')
echo "  Class hash: $VERIFIER_CLASS"
VERIFIER_ADDR=$(sncast deploy --class-hash "$VERIFIER_CLASS" --url "$RPC_URL" 2>&1 | grep "contract_address:" | awk '{print $2}')
echo "  Deployed at: $VERIFIER_ADDR"
echo ""

# Deploy Solva Token
echo "[3/5] Deploying SolvaToken..."
cd "$CONTRACTS_DIR/solva_token"
OWNER_ADDR="${OWNER_ADDR:-0x1234}"  # Set via env or default
INITIAL_SUPPLY="0x0 0x989680"  # 10,000,000 sats as u256 (low, high)
TOKEN_CLASS=$(sncast declare --contract-name SolvaToken --url "$RPC_URL" 2>&1 | grep "class_hash:" | awk '{print $2}')
echo "  Class hash: $TOKEN_CLASS"
TOKEN_ADDR=$(sncast deploy --class-hash "$TOKEN_CLASS" --constructor-calldata "$OWNER_ADDR $INITIAL_SUPPLY" --url "$RPC_URL" 2>&1 | grep "contract_address:" | awk '{print $2}')
echo "  Deployed at: $TOKEN_ADDR"
echo ""

# Deploy Solvency Registry
echo "[4/5] Deploying SolvencyRegistry..."
cd "$CONTRACTS_DIR/solvency_registry"
MAX_PROOF_AGE="86400"  # 24 hours
REGISTRY_CLASS=$(sncast declare --contract-name SolvencyRegistry --url "$RPC_URL" 2>&1 | grep "class_hash:" | awk '{print $2}')
echo "  Class hash: $REGISTRY_CLASS"
REGISTRY_ADDR=$(sncast deploy --class-hash "$REGISTRY_CLASS" --constructor-calldata "$VERIFIER_ADDR $MAX_PROOF_AGE $OWNER_ADDR" --url "$RPC_URL" 2>&1 | grep "contract_address:" | awk '{print $2}')
echo "  Deployed at: $REGISTRY_ADDR"
echo ""

# Deploy Lending Protocol
echo "[5/5] Deploying LendingProtocol..."
cd "$CONTRACTS_DIR/lending_protocol"
LENDING_CLASS=$(sncast declare --contract-name LendingProtocol --url "$RPC_URL" 2>&1 | grep "class_hash:" | awk '{print $2}')
echo "  Class hash: $LENDING_CLASS"
LENDING_ADDR=$(sncast deploy --class-hash "$LENDING_CLASS" --constructor-calldata "$REGISTRY_ADDR $OWNER_ADDR" --url "$RPC_URL" 2>&1 | grep "contract_address:" | awk '{print $2}')
echo "  Deployed at: $LENDING_ADDR"
echo ""

# Save deployment addresses
DEPLOY_FILE="$PROJECT_ROOT/deployments.json"
cat > "$DEPLOY_FILE" <<EOF
{
  "network": "$([ "$RPC_URL" = "http://localhost:5050" ] && echo 'devnet' || echo 'sepolia')",
  "rpc_url": "$RPC_URL",
  "contracts": {
    "solvency_verifier": "$VERIFIER_ADDR",
    "solva_token": "$TOKEN_ADDR",
    "solvency_registry": "$REGISTRY_ADDR",
    "lending_protocol": "$LENDING_ADDR"
  },
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "=== Deployment Complete ==="
echo "Addresses saved to $DEPLOY_FILE"
echo ""
echo "Contracts:"
echo "  Verifier:  $VERIFIER_ADDR"
echo "  Token:     $TOKEN_ADDR"
echo "  Registry:  $REGISTRY_ADDR"
echo "  Lending:   $LENDING_ADDR"
