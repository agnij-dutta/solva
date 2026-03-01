# Solva Protocol - Starknet Sepolia Deployment Guide

## Prerequisites

1. **Starknet Development Tools** (Already installed)
   - Scarb v2.8.5 (Cairo package manager)
   - Starknet Foundry v0.56.0 (sncast for deployment)

2. **Funded Starknet Account**
   - You need STRK tokens on Sepolia testnet to pay for deployment fees
   - Estimated total cost: ~0.05-0.1 STRK for all contracts

## Step 1: Fund Your Account

Your deployment account has been created:
- **Account Name**: `solva-deployer`
- **Address**: `0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635`
- **Network**: Starknet Sepolia Testnet

### Get Testnet Tokens

1. Visit a Starknet Sepolia faucet:
   - Starknet Faucet: https://starknet-faucet.vercel.app/
   - Blast Faucet: https://blastapi.io/faucets/starknet-sepolia-eth

2. Enter your account address: `0x036f21aff52fb88cc777f0bc9151917c5196d17c8ac1ccb52da5087c35e8c635`

3. Request STRK tokens (minimum 0.01 STRK needed)

4. Wait for transaction confirmation (~1-2 minutes)

## Step 2: Deploy Your Account

Once funded, deploy your account:

```bash
export PATH="$HOME/.local/bin:$PATH"
sncast account deploy --name solva-deployer --network sepolia
```

This will activate your account on Starknet Sepolia.

## Step 3: Deploy Solva Protocol Contracts

Run the deployment script:

```bash
cd /Users/agnijdutta/Desktop/solva
./scripts/deploy_sepolia.sh
```

The script will:
1. Build all 4 contracts
2. Declare each contract (upload bytecode)
3. Deploy contracts in correct order:
   - SolvencyVerifier (no dependencies)
   - SolvaToken (no dependencies)
   - SolvencyRegistry (depends on Verifier)
   - LendingProtocol (depends on Registry)
4. Save all addresses to `deployments.json`

Expected deployment time: 3-5 minutes

## Contract Deployment Order

The deployment follows these dependencies:

```
SolvencyVerifier (Base)
    ↓
SolvencyRegistry (needs Verifier address)
    ↓
LendingProtocol (needs Registry address)

SolvaToken (Independent)
```

## Step 4: Verify Deployment

After deployment, you'll receive:

1. **Contract Addresses** - Saved in `deployments.json`
2. **Explorer Links** - To view contracts on Starkscan
3. **Class Hashes** - For verification purposes

### Example deployments.json:

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
    ...
  }
}
```

## Step 5: Test Contract Functionality

Use the test script to verify contracts are working:

```bash
./scripts/test_deployment.sh
```

This will test:
- Token minting/transfers
- Solvency proof submission
- Lending protocol basic operations

## Frontend Integration

Use these contract addresses in your frontend application:

```javascript
// Example for React/Next.js
const SOLVA_CONTRACTS = {
  verifier: "0x...", // From deployments.json
  registry: "0x...",
  token: "0x...",
  lending: "0x..."
};
```

### Starknet.js Integration

```javascript
import { Contract, Provider } from 'starknet';

const provider = new Provider({
  sequencer: { network: 'sepolia' }
});

const registryContract = new Contract(
  registryABI,
  SOLVA_CONTRACTS.registry,
  provider
);

// Check solvency
const isSolvent = await registryContract.is_solvent(issuerAddress);
```

## Troubleshooting

### Account Not Deployed Error
- Make sure you funded the account with STRK tokens
- Run: `sncast account deploy --name solva-deployer --network sepolia`

### Insufficient Funds Error
- Get more STRK from the faucet
- Wait for previous transactions to complete

### Declaration Failed Error
- Contract may already be declared
- Script will extract the existing class hash and continue

### RPC Connection Error
- Network might be congested
- Try again in a few minutes
- Alternative RPC: Update `snfoundry.toml` with different endpoint

## Alternative: Use Existing Account

If you already have a funded Starknet account:

1. Edit `snfoundry.toml` to point to your account
2. Or set environment variable:
   ```bash
   export ACCOUNT_NAME="your-account-name"
   ./scripts/deploy_sepolia.sh
   ```

## Contract Descriptions

### SolvencyVerifier
- Verifies zero-knowledge proofs of solvency
- Currently in mock mode (accepts all proofs for testing)
- Production version will use Garaga for real ZK verification

### SolvencyRegistry
- Stores solvency status for issuers
- Tracks proof freshness (24-hour validity)
- Assigns solvency tiers (A/B/C) based on reserve ratios

### SolvaToken
- ERC20-like token representing synthetic BTC (sBTC)
- 8 decimals (matching Bitcoin)
- Initial supply: 10,000,000 sats
- Owner can mint/burn

### LendingProtocol
- Allows deposits and borrowing
- Max LTV based on issuer's solvency tier:
  - Tier A (≥150% reserves): 80% LTV
  - Tier B (≥120% reserves): 60% LTV
  - Tier C (≥100% reserves): 40% LTV
  - No valid proof: Borrowing blocked

## Next Steps

1. Fund account and deploy
2. Test basic functionality
3. Integrate with frontend
4. Submit test solvency proofs
5. Test lending operations

## Support

For issues:
1. Check `deployments.json` for contract addresses
2. Verify transactions on Starkscan
3. Check account balance: `sncast account list`
4. View transaction history on explorer

## Security Notes

- This is a testnet deployment for development/testing
- Do not use real funds or sensitive data
- Contracts are in development and not audited
- Use for demonstration purposes only
