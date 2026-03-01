# Frontend Integration Guide

## Contract Addresses

After deployment, import addresses from `deployments.json`:

```javascript
import deployments from './deployments.json';

export const SOLVA_CONTRACTS = {
  verifier: deployments.contracts.solvency_verifier.address,
  registry: deployments.contracts.solvency_registry.address,
  token: deployments.contracts.solva_token.address,
  lending: deployments.contracts.lending_protocol.address,
};

export const NETWORK = 'sepolia';
```

## Starknet.js Integration

### Installation

```bash
npm install starknet
# or
yarn add starknet
```

### Provider Setup

```javascript
import { Provider, constants } from 'starknet';

const provider = new Provider({
  sequencer: {
    network: constants.NetworkName.SN_SEPOLIA
  }
});

// Or use RPC
const providerRPC = new Provider({
  nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7'
});
```

### Contract ABIs

You'll need to export ABIs from the compiled contracts:

```javascript
// Extract from build artifacts
import verifierABI from '../contracts/solvency_verifier/target/dev/solvency_verifier_SolvencyVerifier.contract_class.json';
import registryABI from '../contracts/solvency_registry/target/dev/solvency_registry_SolvencyRegistry.contract_class.json';
import tokenABI from '../contracts/solva_token/target/dev/solva_token_SolvaToken.contract_class.json';
import lendingABI from '../contracts/lending_protocol/target/dev/lending_protocol_LendingProtocol.contract_class.json';
```

### Reading Contract Data

```javascript
import { Contract } from 'starknet';

// Initialize contract
const registryContract = new Contract(
  registryABI.abi,
  SOLVA_CONTRACTS.registry,
  provider
);

// Check if an issuer is solvent
async function checkSolvency(issuerAddress) {
  try {
    const isSolvent = await registryContract.is_solvent(issuerAddress);
    console.log('Is solvent:', isSolvent);
    return isSolvent;
  } catch (error) {
    console.error('Error checking solvency:', error);
    return false;
  }
}

// Get solvency info
async function getSolvencyInfo(issuerAddress) {
  try {
    const info = await registryContract.get_solvency_info(issuerAddress);
    return {
      lastProofTime: Number(info.last_proof_time),
      merkleRoot: info.merkle_root.toString(),
      totalLiabilities: info.total_liabilities.toString(),
      isValid: info.is_valid,
      tier: info.tier // 0=None, 1=TierC, 2=TierB, 3=TierA
    };
  } catch (error) {
    console.error('Error getting solvency info:', error);
    return null;
  }
}

// Get token balance
const tokenContract = new Contract(
  tokenABI.abi,
  SOLVA_CONTRACTS.token,
  provider
);

async function getBalance(accountAddress) {
  try {
    const balance = await tokenContract.balance_of(accountAddress);
    // Convert to number (8 decimals for BTC)
    return Number(balance) / 100000000;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
}

// Get lending info
const lendingContract = new Contract(
  lendingABI.abi,
  SOLVA_CONTRACTS.lending,
  provider
);

async function getLendingInfo() {
  try {
    const maxLTV = await lendingContract.get_max_ltv();
    const poolBalance = await lendingContract.get_pool_balance();

    return {
      maxLTV: Number(maxLTV),
      poolBalance: Number(poolBalance)
    };
  } catch (error) {
    console.error('Error getting lending info:', error);
    return null;
  }
}
```

### Writing to Contracts (Transactions)

```javascript
import { Account } from 'starknet';

// Initialize user account
const account = new Account(
  provider,
  userAddress,
  userPrivateKey // From wallet
);

// Connect contract to account
const registryWithSigner = new Contract(
  registryABI.abi,
  SOLVA_CONTRACTS.registry,
  account
);

// Submit solvency proof
async function submitProof(proofData) {
  try {
    // proofData should be array of felt252s
    // [root_low, root_high, liabilities_low, liabilities_high]
    const tx = await registryWithSigner.submit_solvency_proof(proofData);

    console.log('Transaction hash:', tx.transaction_hash);

    // Wait for transaction
    await provider.waitForTransaction(tx.transaction_hash);

    console.log('Proof submitted successfully');
    return tx;
  } catch (error) {
    console.error('Error submitting proof:', error);
    throw error;
  }
}

// Token transfer
const tokenWithSigner = new Contract(
  tokenABI.abi,
  SOLVA_CONTRACTS.token,
  account
);

async function transferTokens(recipientAddress, amount) {
  try {
    // Amount in sats (8 decimals)
    const amountInSats = Math.floor(amount * 100000000);

    const tx = await tokenWithSigner.transfer(
      recipientAddress,
      amountInSats
    );

    await provider.waitForTransaction(tx.transaction_hash);
    return tx;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
}

// Deposit to lending protocol
const lendingWithSigner = new Contract(
  lendingABI.abi,
  SOLVA_CONTRACTS.lending,
  account
);

async function deposit(amount) {
  try {
    const amountInSats = Math.floor(amount * 100000000);

    const tx = await lendingWithSigner.deposit(amountInSats);
    await provider.waitForTransaction(tx.transaction_hash);

    return tx;
  } catch (error) {
    console.error('Error depositing:', error);
    throw error;
  }
}

async function borrow(amount) {
  try {
    const amountInSats = Math.floor(amount * 100000000);

    const tx = await lendingWithSigner.borrow(amountInSats);
    await provider.waitForTransaction(tx.transaction_hash);

    return tx;
  } catch (error) {
    console.error('Error borrowing:', error);
    throw error;
  }
}
```

## React Hooks Example

```javascript
import { useState, useEffect } from 'react';
import { Contract, Provider } from 'starknet';

export function useSolvencyStatus(issuerAddress) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      if (!issuerAddress) return;

      const provider = new Provider({
        sequencer: { network: 'sepolia' }
      });

      const contract = new Contract(
        registryABI.abi,
        SOLVA_CONTRACTS.registry,
        provider
      );

      try {
        const info = await contract.get_solvency_info(issuerAddress);
        setStatus({
          isValid: info.is_valid,
          tier: ['None', 'TierC', 'TierB', 'TierA'][info.tier],
          lastProofTime: new Date(Number(info.last_proof_time) * 1000)
        });
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [issuerAddress]);

  return { status, loading };
}

// Usage in component
function IssuerStatus({ address }) {
  const { status, loading } = useSolvencyStatus(address);

  if (loading) return <div>Loading...</div>;
  if (!status) return <div>No data</div>;

  return (
    <div>
      <h3>Solvency Status</h3>
      <p>Valid: {status.isValid ? 'Yes' : 'No'}</p>
      <p>Tier: {status.tier}</p>
      <p>Last Proof: {status.lastProofTime.toLocaleString()}</p>
    </div>
  );
}
```

## Wallet Integration (get-starknet)

```javascript
import { connect } from 'get-starknet';

async function connectWallet() {
  try {
    const starknet = await connect();

    if (!starknet) {
      throw new Error('User rejected wallet selection or no wallet available');
    }

    await starknet.enable();

    if (starknet.isConnected) {
      console.log('Connected to:', starknet.selectedAddress);
      return starknet;
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
  }
}

// Use with contracts
async function submitProofWithWallet(proofData) {
  const starknet = await connectWallet();

  const account = starknet.account;

  const contract = new Contract(
    registryABI.abi,
    SOLVA_CONTRACTS.registry,
    account
  );

  return await contract.submit_solvency_proof(proofData);
}
```

## Event Listening

```javascript
// Listen for solvency verification events
async function watchSolvencyEvents() {
  const provider = new Provider({
    sequencer: { network: 'sepolia' }
  });

  // Get recent events
  const events = await provider.getEvents({
    address: SOLVA_CONTRACTS.registry,
    from_block: { block_number: 'latest' },
    to_block: { block_number: 'latest' },
    chunk_size: 10
  });

  console.log('Recent events:', events);
}
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
NEXT_PUBLIC_VERIFIER_ADDRESS=0x...
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_LENDING_ADDRESS=0x...
```

## TypeScript Types

```typescript
interface SolvencyInfo {
  last_proof_time: bigint;
  merkle_root: bigint;
  total_liabilities: bigint;
  is_valid: boolean;
  tier: 0 | 1 | 2 | 3; // None, TierC, TierB, TierA
}

interface DeploymentConfig {
  network: 'sepolia' | 'mainnet';
  deployer: string;
  contracts: {
    solvency_verifier: {
      address: string;
      class_hash: string;
    };
    solvency_registry: {
      address: string;
      class_hash: string;
    };
    solva_token: {
      address: string;
      class_hash: string;
    };
    lending_protocol: {
      address: string;
      class_hash: string;
    };
  };
}
```

## Testing Contract Interactions

```javascript
// Jest test example
import { Contract, Provider } from 'starknet';

describe('Solva Registry Integration', () => {
  let provider;
  let contract;

  beforeAll(() => {
    provider = new Provider({
      sequencer: { network: 'sepolia' }
    });

    contract = new Contract(
      registryABI.abi,
      SOLVA_CONTRACTS.registry,
      provider
    );
  });

  test('should read verifier address', async () => {
    const verifierAddr = await contract.get_verifier_address();
    expect(verifierAddr).toBe(SOLVA_CONTRACTS.verifier);
  });

  test('should read max proof age', async () => {
    const maxAge = await contract.get_max_proof_age();
    expect(Number(maxAge)).toBe(86400); // 24 hours
  });
});
```

## Error Handling

```javascript
async function safeContractCall(contractMethod, ...args) {
  try {
    return await contractMethod(...args);
  } catch (error) {
    if (error.message.includes('Insufficient balance')) {
      throw new Error('Insufficient funds for transaction');
    } else if (error.message.includes('Only owner')) {
      throw new Error('Unauthorized: only owner can perform this action');
    } else if (error.message.includes('Reserve manager not solvent')) {
      throw new Error('Reserve manager has no valid solvency proof');
    } else {
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }
}
```

## Next Steps

1. Deploy contracts using deployment script
2. Copy contract addresses from `deployments.json`
3. Update frontend configuration
4. Test read operations first
5. Implement wallet connection
6. Add transaction functionality
7. Handle events and state updates

## Resources

- Starknet.js Docs: https://www.starknetjs.com/
- get-starknet: https://github.com/starknet-io/get-starknet
- Starknet React: https://github.com/apibara/starknet-react
- Example DApps: https://github.com/starknet-io/starknet-examples
