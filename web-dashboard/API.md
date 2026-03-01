# Solva Web Dashboard API Reference

Base URL: `http://localhost:3000` (development)

## Authentication

Currently no authentication required (add in production).

## Common Response Format

All API endpoints return JSON with this structure:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

## Endpoints

### Health Check

Check API health status.

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": 1708041600000
  }
}
```

---

### Get Configuration

Retrieve deployment configuration and contract addresses.

```http
GET /api/config
```

**Response:**
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

---

### Generate Proof

Start ZK proof generation process.

```http
POST /api/generate-proof
Content-Type: application/json
```

**Request Body:**
```json
{
  "useSampleData": true  // Use sample UTXOs (offline mode)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "message": "Proof generation started"
}
```

**Status Codes:**
- `200` - Proof generation started successfully
- `500` - Failed to start proof generation

---

### Stream Proof Progress

Server-Sent Events stream for real-time proof generation progress.

```http
GET /api/generate-proof/stream?sessionId={sessionId}
```

**Query Parameters:**
- `sessionId` (required) - Session ID from generate-proof endpoint

**Response:** Server-Sent Events stream

**Event Format:**
```json
{
  "status": "fetching_utxos|building_tree|compiling_circuit|generating_witness|proving|verifying|complete|error",
  "message": "Status description",
  "progress": 0-100,
  "timestamp": 1708041600000,
  "error": "Error message (only if status=error)"
}
```

**Status Values:**
- `idle` - Initial state
- `fetching_utxos` - Fetching Bitcoin reserve data
- `building_tree` - Building Merkle tree
- `compiling_circuit` - Compiling Noir circuit
- `generating_witness` - Generating witness
- `proving` - Generating UltraKeccakHonk proof
- `verifying` - Verifying proof locally
- `complete` - Proof generation complete
- `error` - Error occurred

**Status Codes:**
- `200` - Stream started
- `400` - Missing sessionId parameter
- `404` - Session not found

**Example with cURL:**
```bash
curl -N "http://localhost:3000/api/generate-proof/stream?sessionId=550e8400-..."
```

**Example with EventSource (JavaScript):**
```javascript
const eventSource = new EventSource('/api/generate-proof/stream?sessionId=...');
eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(progress.status, progress.progress);
};
```

---

### Submit Proof

Submit generated proof to Starknet SolvencyRegistry.

```http
POST /api/submit-proof
Content-Type: application/json
```

**Request Body:**
```json
{
  "account": "my-starknet-account"  // Optional: sncast account name
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x789..."
  },
  "message": "Proof submitted successfully"
}
```

**Status Codes:**
- `200` - Proof submitted successfully
- `400` - Proof artifacts not found (generate proof first)
- `500` - Failed to submit proof

---

### Query Proof Status

Query solvency information for a specific issuer from the registry.

```http
GET /api/proof-status?issuer={address}
```

**Query Parameters:**
- `issuer` (required) - Issuer contract address (hex)

**Response:**
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

**Solvency Tiers:**
- `None` - No valid proof
- `TierC` - >= 100% reserves
- `TierB` - >= 120% reserves
- `TierA` - >= 150% reserves

**Status Codes:**
- `200` - Query successful
- `400` - Missing issuer parameter
- `500` - Failed to query registry

---

### Fetch Recent Proofs

Retrieve recent SolvencyVerified events from the registry.

```http
GET /api/recent-proofs?limit={limit}
```

**Query Parameters:**
- `limit` (optional) - Number of proofs to fetch (1-100, default: 10)

**Response:**
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

**Status Codes:**
- `200` - Query successful
- `400` - Invalid limit parameter
- `500` - Failed to fetch proofs

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Optional error details
  }
}
```

**Common Error Types:**

### ScriptExecutionError
Script execution failed.
```json
{
  "success": false,
  "error": "prove.sh exited with code 1",
  "details": {
    "script": "prove.sh",
    "exitCode": 1,
    "stderr": "Error output..."
  }
}
```

### StarknetError
Starknet RPC or contract interaction failed.
```json
{
  "success": false,
  "error": "Failed to query solvency info",
  "details": {
    "operation": "get_solvency_info",
    "cause": "RPC error..."
  }
}
```

### ConfigurationError
Deployment configuration missing or invalid.
```json
{
  "success": false,
  "error": "Failed to load deployment config",
  "message": "Make sure contracts are deployed (run ./scripts/deploy.sh)"
}
```

### ProofArtifactError
Required proof artifacts not found.
```json
{
  "success": false,
  "error": "Proof artifacts not found. Generate a proof first.",
  "details": {
    "missingArtifacts": ["proof", "vk"]
  }
}
```

---

## Rate Limiting

No rate limiting currently implemented. For production:

- Proof generation: 1 concurrent request per account
- Other endpoints: 100 requests/minute per IP

---

## CORS

Development mode allows all origins. For production, configure allowed origins in `next.config.mjs`.

---

## Examples

### Complete Flow with cURL

```bash
# 1. Check health
curl http://localhost:3000/api/health

# 2. Get config
curl http://localhost:3000/api/config

# 3. Generate proof
SESSION=$(curl -s -X POST http://localhost:3000/api/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"useSampleData": true}' | jq -r '.data.sessionId')

# 4. Stream progress
curl -N "http://localhost:3000/api/generate-proof/stream?sessionId=$SESSION"

# 5. Submit proof (after generation completes)
curl -X POST http://localhost:3000/api/submit-proof \
  -H "Content-Type: application/json" \
  -d '{}'

# 6. Query status
curl "http://localhost:3000/api/proof-status?issuer=0x..."

# 7. Fetch recent proofs
curl "http://localhost:3000/api/recent-proofs?limit=5"
```

### Complete Flow with JavaScript

```javascript
async function solvencyProofFlow() {
  // 1. Start proof generation
  const genResponse = await fetch('/api/generate-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useSampleData: true }),
  });
  const { data: { sessionId } } = await genResponse.json();

  // 2. Stream progress
  const eventSource = new EventSource(
    `/api/generate-proof/stream?sessionId=${sessionId}`
  );

  eventSource.onmessage = async (event) => {
    const progress = JSON.parse(event.data);
    console.log(`${progress.status}: ${progress.progress}%`);

    if (progress.status === 'complete') {
      eventSource.close();

      // 3. Submit proof
      const submitResponse = await fetch('/api/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const submitData = await submitResponse.json();
      console.log('Tx:', submitData.data.transactionHash);

      // 4. Query status (after tx confirmation)
      setTimeout(async () => {
        const statusResponse = await fetch(
          `/api/proof-status?issuer=${YOUR_ADDRESS}`
        );
        const statusData = await statusResponse.json();
        console.log('Solvency:', statusData.data);
      }, 30000); // Wait 30s for tx confirmation
    }
  };
}
```

---

## WebSocket Alternative

For bidirectional communication, consider implementing WebSocket instead of SSE:

```typescript
// Server (not implemented yet)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { type, payload } = JSON.parse(message);
    if (type === 'GENERATE_PROOF') {
      // Start proof generation
      // Send progress updates via ws.send()
    }
  });
});

// Client
const ws = new WebSocket('ws://localhost:3001');
ws.send(JSON.stringify({ type: 'GENERATE_PROOF', payload: { useSampleData: true } }));
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(progress);
};
```

---

## Future Enhancements

1. **Authentication** - JWT or API keys
2. **Rate Limiting** - Per-user quotas
3. **Webhooks** - Notify on proof completion
4. **Batch Operations** - Generate multiple proofs
5. **Query Optimization** - Cache Starknet queries
6. **Metrics** - Prometheus/Grafana integration
7. **WebSocket Support** - Bidirectional real-time communication
