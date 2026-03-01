# Solva Protocol - Quick Start Deployment

## TL;DR - Deploy in 3 Steps

### Step 1: Fund Account (2 minutes)
Visit: https://starknet-faucet.vercel.app/
```
Address: 0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635
Amount:  0.1 STRK
```

### Step 2: Deploy Account (1 minute)
```bash
export PATH="$HOME/.local/bin:$PATH"
sncast account deploy --name solva-deployer --network sepolia
```

### Step 3: Deploy Contracts (3-5 minutes)
```bash
cd /Users/agnijdutta/Desktop/solva
./scripts/deploy_sepolia.sh
```

### Done!
Contract addresses saved to: `deployments.json`

---

## Command Reference

### Check Account Status
```bash
# List all accounts
sncast account list

# Check balance
sncast account balance --name solva-deployer --network sepolia
```

### Deploy Contracts
```bash
# Full deployment
./scripts/deploy_sepolia.sh

# With custom account
ACCOUNT_NAME="my-account" ./scripts/deploy_sepolia.sh
```

### Test Deployment
```bash
./scripts/test_deployment.sh
```

### View Deployment Info
```bash
# Show deployed addresses
cat deployments.json | grep address

# Open explorer
open "https://sepolia.starkscan.co/contract/$(grep -A1 solvency_registry deployments.json | grep address | cut -d'\"' -f4)"
```

---

## Contract Addresses

After deployment, get addresses from:
```bash
cat deployments.json
```

Or programmatically:
```bash
# Verifier
jq -r '.contracts.solvency_verifier.address' deployments.json

# Registry
jq -r '.contracts.solvency_registry.address' deployments.json

# Token
jq -r '.contracts.solva_token.address' deployments.json

# Lending
jq -r '.contracts.lending_protocol.address' deployments.json
```

---

## Quick Tests

### Test Token
```bash
sncast --account solva-deployer --network sepolia \
  call --contract-address $(jq -r '.contracts.solva_token.address' deployments.json) \
  --function total_supply
```

### Test Registry
```bash
sncast --account solva-deployer --network sepolia \
  call --contract-address $(jq -r '.contracts.solvency_registry.address' deployments.json) \
  --function get_verifier_address
```

### Submit Test Proof
```bash
sncast --account solva-deployer --network sepolia \
  invoke --contract-address $(jq -r '.contracts.solvency_registry.address' deployments.json) \
  --function submit_solvency_proof \
  --calldata "0x123456 0x0 0xF4240 0x0"
```

---

## Troubleshooting One-Liners

### Account not funded?
```bash
echo "Fund this address: $(sncast account list | grep -A1 solva-deployer | grep address | awk '{print $2}')"
open https://starknet-faucet.vercel.app/
```

### Need to rebuild contracts?
```bash
for dir in solvency_verifier solvency_registry solva_token lending_protocol; do
  (cd /Users/agnijdutta/Desktop/solva/contracts/$dir && scarb build)
done
```

### Check deployment status?
```bash
[ -f deployments.json ] && echo "✓ Deployed" || echo "✗ Not deployed"
```

### View all deployed contracts on explorer?
```bash
jq -r '.explorer_urls | to_entries[] | "\(.key): \(.value)"' deployments.json
```

---

## Environment Variables

```bash
# Set custom account
export ACCOUNT_NAME="my-account"

# Set custom RPC (optional)
export RPC_URL="https://your-custom-rpc-url.com"
```

---

## Frontend Integration Snippet

```javascript
// React/Next.js
import deployments from '../deployments.json';

export const CONTRACTS = {
  verifier: deployments.contracts.solvency_verifier.address,
  registry: deployments.contracts.solvency_registry.address,
  token: deployments.contracts.solva_token.address,
  lending: deployments.contracts.lending_protocol.address,
};
```

---

## Files & Docs

| File | Purpose |
|------|---------|
| `DEPLOYMENT_SUMMARY.md` | Complete deployment overview |
| `DEPLOYMENT_GUIDE.md` | Detailed step-by-step guide |
| `FRONTEND_INTEGRATION.md` | Frontend code examples |
| `deployments.json` | Contract addresses (after deployment) |

---

## Support

**Documentation:**
- Full guide: `DEPLOYMENT_GUIDE.md`
- Summary: `DEPLOYMENT_SUMMARY.md`
- Frontend: `FRONTEND_INTEGRATION.md`

**Starknet Resources:**
- Docs: https://docs.starknet.io/
- Explorer: https://sepolia.starkscan.co/
- Faucet: https://starknet-faucet.vercel.app/

---

## Status Check

Run this to see what's done:

```bash
echo "Tools installed:"
which scarb && echo "  ✓ Scarb" || echo "  ✗ Scarb"
which sncast && echo "  ✓ Sncast" || echo "  ✗ Sncast"

echo -e "\nContracts built:"
for c in solvency_verifier solvency_registry solva_token lending_protocol; do
  [ -f "/Users/agnijdutta/Desktop/solva/contracts/$c/target/dev/"*.contract_class.json ] \
    && echo "  ✓ $c" || echo "  ✗ $c"
done

echo -e "\nAccount status:"
sncast account list | grep -q solva-deployer \
  && echo "  ✓ Account created" || echo "  ✗ Account not found"

echo -e "\nDeployment status:"
[ -f deployments.json ] \
  && echo "  ✓ Contracts deployed" || echo "  ✗ Not deployed yet"
```

---

**Ready to deploy? Run:**
```bash
./scripts/deploy_sepolia.sh
```
