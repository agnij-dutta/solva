# Solva Protocol - Deployment Summary

## Deployment Preparation Complete

All necessary tools, scripts, and documentation have been prepared for deploying the Solva protocol contracts to Starknet Sepolia testnet.

---

## What Has Been Completed

### 1. Development Environment Setup ✓

- **Scarb v2.8.5** installed (Cairo package manager)
- **Starknet Foundry v0.56.0** installed (sncast deployment tool)
- **Cairo v2.8.5** compiler configured
- All dependencies resolved and working

### 2. Contracts Built ✓

All 4 smart contracts have been successfully compiled:

| Contract | Status | Build Output | Dependencies |
|----------|--------|--------------|--------------|
| SolvencyVerifier | ✓ Built | 28KB contract class | None |
| SolvencyRegistry | ✓ Built | Contract class ready | Uses Verifier |
| SolvaToken | ✓ Built | Contract class ready | None |
| LendingProtocol | ✓ Built | Contract class ready | Uses Registry |

Build artifacts location:
```
/Users/agnijdutta/Desktop/solva/contracts/*/target/dev/*.contract_class.json
```

### 3. Deployment Account Created ✓

**Account Details:**
```
Name:    solva-deployer
Address: 0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635
Network: Starknet Sepolia Testnet
Status:  Created (awaiting funding)
```

**Explorer Link:**
https://sepolia.starkscan.co/contract/0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635

### 4. Deployment Scripts Created ✓

| Script | Purpose | Location |
|--------|---------|----------|
| deploy_sepolia.sh | Main deployment script | `/Users/agnijdutta/Desktop/solva/scripts/deploy_sepolia.sh` |
| test_deployment.sh | Post-deployment testing | `/Users/agnijdutta/Desktop/solva/scripts/test_deployment.sh` |
| deploy.sh | Original script (updated) | `/Users/agnijdutta/Desktop/solva/scripts/deploy.sh` |

### 5. Configuration Files ✓

| File | Purpose |
|------|---------|
| snfoundry.toml | Starknet Foundry config with Sepolia settings |
| Scarb.toml (×4) | Updated to Cairo 2.8.5 compatibility |

### 6. Documentation Created ✓

| Document | Purpose | Location |
|----------|---------|----------|
| DEPLOYMENT_GUIDE.md | Complete step-by-step deployment guide | `/Users/agnijdutta/Desktop/solva/DEPLOYMENT_GUIDE.md` |
| DEPLOYMENT_STATUS.md | Current deployment status | `/Users/agnijdutta/Desktop/solva/DEPLOYMENT_STATUS.md` |
| FRONTEND_INTEGRATION.md | Frontend integration examples | `/Users/agnijdutta/Desktop/solva/FRONTEND_INTEGRATION.md` |
| DEPLOYMENT_SUMMARY.md | This file | `/Users/agnijdutta/Desktop/solva/DEPLOYMENT_SUMMARY.md` |

---

## Deployment Workflow

The deployment follows this sequence:

```
Step 1: Fund Account
   ↓
   Get STRK from faucet
   → https://starknet-faucet.vercel.app/
   → Address: 0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635

Step 2: Deploy Account
   ↓
   sncast account deploy --name solva-deployer --network sepolia

Step 3: Deploy Contracts
   ↓
   ./scripts/deploy_sepolia.sh

   Deploys in order:
   1. SolvencyVerifier (no dependencies)
   2. SolvaToken (no dependencies)
   3. SolvencyRegistry (needs Verifier address)
   4. LendingProtocol (needs Registry address)

Step 4: Test Deployment
   ↓
   ./scripts/test_deployment.sh

Step 5: Save & Use Addresses
   ↓
   Addresses saved to deployments.json
   Ready for frontend integration
```

---

## Contract Details

### SolvencyVerifier
**Purpose:** Verifies zero-knowledge proofs of solvency
- Mock implementation for testing (accepts all proofs)
- Production: Replace with Garaga-generated verifier
- Constructor: No parameters
- Interface: `verify_ultra_keccak_honk_proof(proof: Span<felt252>) -> Option<Span<u256>>`

### SolvencyRegistry
**Purpose:** Stores and validates solvency status
- Tracks proof freshness (24-hour max age)
- Assigns solvency tiers (A/B/C/None)
- Emits verification events
- Constructor:
  - `verifier_address`: SolvencyVerifier contract address
  - `max_proof_age`: 86400 seconds (24 hours)
  - `owner`: Account address for admin functions

### SolvaToken
**Purpose:** Demo BTC-backed ERC20 token (sBTC)
- Name: "Solva BTC"
- Symbol: "sBTC"
- Decimals: 8 (matching Bitcoin)
- Initial supply: 10,000,000 sats
- Constructor:
  - `owner`: Token owner/minter address
  - `initial_supply`: 10,000,000 (as u256)

### LendingProtocol
**Purpose:** Lending/borrowing with solvency-gated LTV
- Tier-based max LTV:
  - Tier A (≥150% reserves): 80% LTV
  - Tier B (≥120% reserves): 60% LTV
  - Tier C (≥100% reserves): 40% LTV
  - No proof: 0% LTV (blocked)
- Requires fresh solvency proof (<24h)
- Constructor:
  - `registry_address`: SolvencyRegistry contract address
  - `reserve_manager`: Address that must maintain solvency

---

## Deployment Costs (Estimated)

| Operation | Estimated Cost (STRK) |
|-----------|----------------------|
| Account Deployment | 0.008 - 0.010 |
| Contract Declarations (×4) | 0.015 - 0.025 |
| Contract Deployments (×4) | 0.020 - 0.040 |
| **Total** | **0.043 - 0.075 STRK** |

**Recommendation:** Fund account with 0.1 STRK to have buffer for retries if needed.

---

## Post-Deployment Output

After successful deployment, you will receive:

### 1. deployments.json File
```json
{
  "network": "sepolia",
  "deployer": "0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635",
  "contracts": {
    "solvency_verifier": {
      "address": "0x...",
      "class_hash": "0x..."
    },
    "solva_token": {
      "address": "0x...",
      "class_hash": "0x..."
    },
    "solvency_registry": {
      "address": "0x...",
      "class_hash": "0x..."
    },
    "lending_protocol": {
      "address": "0x...",
      "class_hash": "0x..."
    }
  },
  "deployed_at": "2026-02-14T...",
  "explorer_urls": {
    "solvency_verifier": "https://sepolia.starkscan.co/contract/0x...",
    "solva_token": "https://sepolia.starkscan.co/contract/0x...",
    "solvency_registry": "https://sepolia.starkscan.co/contract/0x...",
    "lending_protocol": "https://sepolia.starkscan.co/contract/0x..."
  }
}
```

### 2. Explorer Links
Direct links to view each contract on Starkscan Sepolia explorer

### 3. Transaction Hashes
For each declare and deploy operation, viewable on explorer

---

## Next Steps - Quick Reference

### Immediate Actions Required:

1. **Fund the deployment account:**
   ```bash
   # Visit faucet
   open https://starknet-faucet.vercel.app/

   # Paste this address:
   0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635

   # Request 0.1 STRK tokens
   ```

2. **Deploy the account:**
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   sncast account deploy --name solva-deployer --network sepolia
   ```

3. **Deploy all contracts:**
   ```bash
   cd /Users/agnijdutta/Desktop/solva
   ./scripts/deploy_sepolia.sh
   ```

4. **Test the deployment:**
   ```bash
   ./scripts/test_deployment.sh
   ```

5. **Integrate with frontend:**
   - Copy contract addresses from `deployments.json`
   - Follow `FRONTEND_INTEGRATION.md` guide
   - Update environment variables in your frontend app

---

## Files Created/Modified

### New Files:
```
/Users/agnijdutta/Desktop/solva/
├── snfoundry.toml                    # Starknet Foundry config
├── DEPLOYMENT_GUIDE.md               # Full deployment guide
├── DEPLOYMENT_STATUS.md              # Current status
├── DEPLOYMENT_SUMMARY.md             # This file
├── FRONTEND_INTEGRATION.md           # Frontend examples
└── scripts/
    ├── deploy_sepolia.sh             # Main deployment script
    └── test_deployment.sh            # Testing script
```

### Modified Files:
```
/Users/agnijdutta/Desktop/solva/contracts/
├── solvency_verifier/Scarb.toml      # Updated to Cairo 2.8.5
├── solvency_registry/Scarb.toml      # Updated to Cairo 2.8.5 + lib
├── solva_token/Scarb.toml            # Updated to Cairo 2.8.5
└── lending_protocol/Scarb.toml       # Updated to Cairo 2.8.5
```

---

## Troubleshooting Guide

### Issue: Account deployment fails
**Solution:**
```bash
# Check if account was funded
sncast account list

# Check balance
sncast account balance --name solva-deployer --network sepolia

# If not funded, get tokens from faucet first
```

### Issue: Contract already declared
**Solution:** This is normal! The script will reuse the existing class hash and continue.

### Issue: Insufficient funds during deployment
**Solution:**
```bash
# Get more tokens from faucet to the account address
# Wait for previous transactions to complete
# Retry deployment script
```

### Issue: RPC connection errors
**Solution:**
```bash
# Wait a few minutes for network congestion to clear
# Or update snfoundry.toml with alternative RPC endpoint
```

---

## Verification Checklist

After deployment, verify:

- [ ] All 4 contracts deployed successfully
- [ ] `deployments.json` file created with addresses
- [ ] Each contract visible on Starkscan
- [ ] Token contract shows correct supply
- [ ] Registry points to correct verifier address
- [ ] Lending protocol points to correct registry address
- [ ] Test script runs without errors
- [ ] Mock solvency proof submits successfully

---

## Frontend Integration Preview

```javascript
// Quick integration example
import deployments from './deployments.json';
import { Contract, Provider } from 'starknet';

const provider = new Provider({ sequencer: { network: 'sepolia' } });

const registry = new Contract(
  registryABI.abi,
  deployments.contracts.solvency_registry.address,
  provider
);

// Check solvency
const isSolvent = await registry.is_solvent(issuerAddress);
console.log('Issuer is solvent:', isSolvent);
```

Full examples in `FRONTEND_INTEGRATION.md`

---

## Support Resources

- **Starknet Documentation:** https://docs.starknet.io/
- **Starknet Foundry Book:** https://foundry-rs.github.io/starknet-foundry/
- **Scarb Documentation:** https://docs.swmansion.com/scarb/
- **Starknet.js Docs:** https://www.starknetjs.com/
- **Sepolia Explorer:** https://sepolia.starkscan.co/

---

## Summary

**Status:** Ready for deployment - waiting for account funding

**What's Done:**
- ✓ All tools installed
- ✓ All contracts built
- ✓ Deployment scripts ready
- ✓ Documentation complete
- ✓ Account created

**What's Needed:**
- → Fund account with STRK
- → Deploy account
- → Run deployment script

**Estimated Time:** 10-15 minutes total (including faucet wait time)

**Expected Outcome:** 4 deployed contracts with addresses saved to `deployments.json`, ready for frontend integration.

---

**Next Command to Run:**
```bash
# After funding, run:
sncast account deploy --name solva-deployer --network sepolia && ./scripts/deploy_sepolia.sh
```

Good luck with your deployment!
