# Testing Guide for Solva Web Dashboard

## Prerequisites

1. Ensure all dependencies are installed:
```bash
cd /Users/agnijdutta/Desktop/solva/web-dashboard
npm install
```

2. Deploy contracts (if not already done):
```bash
cd /Users/agnijdutta/Desktop/solva
./scripts/deploy.sh --devnet  # Or without --devnet for Sepolia
```

3. Start the development server:
```bash
cd /Users/agnijdutta/Desktop/solva/web-dashboard
npm run dev
```

## API Testing

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": 1708041600000
  }
}
```

### 2. Configuration Check

```bash
curl http://localhost:3000/api/config
```

Expected response:
```json
{
  "success": true,
  "data": {
    "network": "sepolia",
    "rpc_url": "https://free-rpc.nethermind.io/sepolia-juno/v0_7",
    "contracts": {
      "solvency_verifier": "0x...",
      "solva_token": "0x...",
      "solvency_registry": "0x...",
      "lending_protocol": "0x..."
    },
    "deployed_at": "2024-02-15T12:00:00Z"
  }
}
```

### 3. Generate Proof

```bash
# Start proof generation
curl -X POST http://localhost:3000/api/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"useSampleData": true}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "message": "Proof generation started"
}
```

### 4. Stream Progress

```bash
# Replace SESSION_ID with the ID from step 3
curl -N "http://localhost:3000/api/generate-proof/stream?sessionId=SESSION_ID"
```

Expected output (Server-Sent Events):
```
data: {"status":"fetching_utxos","message":"Fetching Bitcoin reserve data...","progress":10,"timestamp":1708041600000}

data: {"status":"building_tree","message":"Building Merkle tree...","progress":30,"timestamp":1708041601000}

data: {"status":"compiling_circuit","message":"Compiling Noir circuit...","progress":50,"timestamp":1708041602000}

data: {"status":"generating_witness","message":"Generating witness...","progress":70,"timestamp":1708041603000}

data: {"status":"proving","message":"Generating UltraKeccakHonk proof...","progress":85,"timestamp":1708041604000}

data: {"status":"verifying","message":"Verifying proof locally...","progress":95,"timestamp":1708041605000}

data: {"status":"complete","message":"Proof generation complete","progress":100,"timestamp":1708041606000}
```

### 5. Submit Proof

```bash
curl -X POST http://localhost:3000/api/submit-proof \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x789..."
  },
  "message": "Proof submitted successfully"
}
```

### 6. Query Proof Status

```bash
# Replace ISSUER_ADDRESS with an actual address
curl "http://localhost:3000/api/proof-status?issuer=0x1234..."
```

Expected response:
```json
{
  "success": true,
  "data": {
    "issuer": "0x1234...",
    "solvencyInfo": {
      "last_proof_time": "1708041600",
      "merkle_root": "0xabc...",
      "total_liabilities": "1000000000",
      "is_valid": true,
      "tier": "TierA"
    },
    "isValid": true,
    "isFresh": true
  }
}
```

### 7. Fetch Recent Proofs

```bash
curl "http://localhost:3000/api/recent-proofs?limit=5"
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "issuer": "0x1234...",
      "merkle_root": "0xabc...",
      "total_liabilities": "1000000000",
      "tier": "TierA",
      "timestamp": 1708041600,
      "transaction_hash": "0x789..."
    }
  ]
}
```

## End-to-End Test Script

Save this as `test-e2e.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

API_URL="http://localhost:3000"

echo "=== Solva Dashboard E2E Test ==="
echo ""

# 1. Health check
echo "[1/7] Health check..."
curl -s "$API_URL/api/health" | jq .
echo ""

# 2. Config check
echo "[2/7] Config check..."
curl -s "$API_URL/api/config" | jq .
echo ""

# 3. Generate proof
echo "[3/7] Generating proof..."
RESPONSE=$(curl -s -X POST "$API_URL/api/generate-proof" \
  -H "Content-Type: application/json" \
  -d '{"useSampleData": true}')
echo "$RESPONSE" | jq .
SESSION_ID=$(echo "$RESPONSE" | jq -r '.data.sessionId')
echo "Session ID: $SESSION_ID"
echo ""

# 4. Stream progress (run for 10 seconds then stop)
echo "[4/7] Streaming progress (10 seconds)..."
timeout 10 curl -N "$API_URL/api/generate-proof/stream?sessionId=$SESSION_ID" || true
echo ""

# 5. Wait for proof to complete
echo "[5/7] Waiting for proof to complete..."
sleep 120  # Proof generation takes ~2 minutes
echo ""

# 6. Submit proof
echo "[6/7] Submitting proof..."
curl -s -X POST "$API_URL/api/submit-proof" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""

# 7. Fetch recent proofs
echo "[7/7] Fetching recent proofs..."
curl -s "$API_URL/api/recent-proofs?limit=5" | jq .
echo ""

echo "=== Test Complete ==="
```

Run the test:
```bash
chmod +x test-e2e.sh
./test-e2e.sh
```

## Browser Testing

### Test SSE in Browser Console

```javascript
// Start proof generation
const response = await fetch('http://localhost:3000/api/generate-proof', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ useSampleData: true }),
});
const { data } = await response.json();
console.log('Session ID:', data.sessionId);

// Connect to SSE stream
const eventSource = new EventSource(
  `http://localhost:3000/api/generate-proof/stream?sessionId=${data.sessionId}`
);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`[${progress.status}] ${progress.progress}% - ${progress.message}`);

  if (progress.status === 'complete' || progress.status === 'error') {
    eventSource.close();
    console.log('Stream closed');
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

## Common Issues

### "Failed to load deployment config"

**Cause:** `deployments.json` doesn't exist

**Solution:**
```bash
cd /Users/agnijdutta/Desktop/solva
./scripts/deploy.sh --devnet
```

### "Proof artifacts not found"

**Cause:** No proof has been generated yet

**Solution:** Run proof generation first:
```bash
curl -X POST http://localhost:3000/api/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"useSampleData": true}'
```

### "sncast invoke failed"

**Cause:** Starknet account not configured or insufficient funds

**Solution:**
```bash
# List accounts
sncast account list

# If no accounts, create one
sncast account create --name my-account

# Fund account on Sepolia testnet faucet
# https://starknet-faucet.vercel.app/
```

### SSE connection immediately closes

**Cause:** Session ID invalid or expired

**Solution:** Generate a new session ID with proof generation endpoint

## Performance Benchmarks

Expected timings (on M1 Mac):

- Health check: < 10ms
- Config check: < 50ms
- Generate proof (sample data): ~120 seconds
- Submit proof: ~30 seconds
- Query proof status: ~500ms
- Fetch recent proofs: ~1-2 seconds

## Next Steps

1. Add frontend UI components to consume these APIs
2. Implement WebSocket for bidirectional communication
3. Add authentication layer
4. Deploy to production environment
5. Set up monitoring and alerting
