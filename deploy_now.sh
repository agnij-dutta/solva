#!/bin/bash
set -e

export PATH="$HOME/.local/bin:$PATH"

echo "🚀 Deploying Solva Contracts..."

ACCOUNT="solva-deployer"
NETWORK="sepolia"  
RPC="https://free-rpc.nethermind.io/sepolia-juno/v0_7"

cd /Users/agnijdutta/Desktop/solva

# Build contracts
echo "📦 Building contracts..."
cd contracts/solvency_verifier && scarb build && cd ../..
cd contracts/solvency_registry && scarb build && cd ../..
cd contracts/solva_token && scarb build && cd ../..
cd contracts/lending_protocol && scarb build && cd ../..

echo "✅ Contracts built"
echo ""

# Deploy SolvencyVerifier
echo "1/4 Deploying SolvencyVerifier..."
cd contracts/solvency_verifier
DECLARE_RESULT=$(sncast --account "$ACCOUNT" --url "$RPC" declare --contract-name SolvencyVerifier 2>&1)
if echo "$DECLARE_RESULT" | grep -q "class_hash"; then
    VERIFIER_CLASS=$(echo "$DECLARE_RESULT" | grep -o '"class_hash": "0x[^"]*"' | cut -d'"' -f4)
else
    # Already declared
    echo "Already declared, using from artifacts..."
    VERIFIER_CLASS=$(cat target/dev/solvency_verifier_SolvencyVerifier.contract_class.json | python3 -c "import sys,json,hashlib; print('0x' + hashlib.sha256(json.dumps(json.load(sys.stdin), separators=(',', ':')).encode()).hexdigest()[:62])")
fi

DEPLOY_RESULT=$(sncast --account "$ACCOUNT" --url "$RPC" deploy --class-hash "$VERIFIER_CLASS")
VERIFIER_ADDR=$(echo "$DEPLOY_RESULT" | grep -o '"contract_address": "0x[^"]*"' | cut -d'"' -f4)
echo "✓ Verifier: $VERIFIER_ADDR"

cd ../..

# Create deployments.json
cat > deployments.json << JSONEOF
{
  "network": "$NETWORK",
  "rpc_url": "$RPC",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "solvency_verifier": "$VERIFIER_ADDR",
    "solvency_registry": "TBD",
    "solva_token": "TBD", 
    "lending_protocol": "TBD"
  }
}
JSONEOF

echo ""
echo "✅ Deployment started! Check deployments.json for addresses"
cat deployments.json
