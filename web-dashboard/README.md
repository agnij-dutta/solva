# Solva Web Dashboard

Next.js-based web dashboard for the Solva ZK solvency verification protocol.

## Overview

This dashboard provides a web API layer over the existing Solva CLI tools, enabling:

- ZK proof generation with real-time progress streaming
- Proof submission to Starknet
- Solvency status queries via Starknet.js
- Recent proof history from on-chain events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
├─────────────────────────────────────────────────────────────┤
│  POST /api/generate-proof    │  Triggers prove.sh           │
│  GET  /api/generate-proof/   │  Server-Sent Events          │
│       stream                 │  for progress updates        │
│  POST /api/submit-proof      │  Runs submit_proof.py        │
│  GET  /api/proof-status      │  Queries Starknet registry   │
│  GET  /api/recent-proofs     │  Fetches on-chain events     │
│  GET  /api/config            │  Returns deployment config   │
│  GET  /api/health            │  Health check                │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌────────────────┐   ┌────────────────┐   ┌────────────────┐
│  Bash Scripts  │   │  Python Scripts│   │  Starknet RPC  │
│  (prove.sh)    │   │(submit_proof.py)│   │  (starknet.js) │
└────────────────┘   └────────────────┘   └────────────────┘
```

## API Endpoints

### POST /api/generate-proof

Starts ZK proof generation using the existing `prove.sh` script.

**Request:**
```json
{
  "useSampleData": true
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

### GET /api/generate-proof/stream?sessionId=xxx

Server-Sent Events endpoint for real-time proof generation progress.

**Event Stream:**
```
data: {"status":"fetching_utxos","message":"Fetching Bitcoin reserve data...","progress":10,"timestamp":1234567890}

data: {"status":"building_tree","message":"Building Merkle tree...","progress":30,"timestamp":1234567891}

data: {"status":"proving","message":"Generating UltraKeccakHonk proof...","progress":85,"timestamp":1234567892}

data: {"status":"complete","message":"Proof generation complete","progress":100,"timestamp":1234567893}
```

### GET /api/proof-status?issuer=0x...

Queries the Starknet SolvencyRegistry for a specific issuer's proof status.

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

### POST /api/submit-proof

Submits a generated proof to the Starknet SolvencyRegistry.

**Request:**
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

### GET /api/recent-proofs?limit=10

Fetches recent SolvencyVerified events from the registry.

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

### GET /api/config

Returns deployment configuration from `deployments.json`.

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

## Installation

```bash
cd web-dashboard
npm install
```

## Development

```bash
npm run dev
```

The dashboard will be available at http://localhost:3000

## Prerequisites

1. **Contracts must be deployed** - Run `../scripts/deploy.sh` to generate `deployments.json`
2. **Python dependencies** - The API wraps Python scripts that require `garaga` and other dependencies
3. **Starknet toolchain** - `sncast` must be available for proof submission
4. **Noir/Barretenberg** - `nargo` and `bb` must be installed for proof generation

## Environment Variables

Create `.env.local` for custom configuration:

```bash
# Optional: Override RPC URL
STARKNET_RPC_URL=https://free-rpc.nethermind.io/sepolia-juno/v0_7

# Optional: Default account for proof submission
STARKNET_ACCOUNT=my-account
```

## Project Structure

```
web-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-proof/
│   │   │   │   ├── route.ts          # POST /api/generate-proof
│   │   │   │   ├── sessions.ts       # In-memory session management
│   │   │   │   └── stream/
│   │   │   │       └── route.ts      # SSE progress streaming
│   │   │   ├── proof-status/
│   │   │   │   └── route.ts          # GET /api/proof-status
│   │   │   ├── submit-proof/
│   │   │   │   └── route.ts          # POST /api/submit-proof
│   │   │   ├── recent-proofs/
│   │   │   │   └── route.ts          # GET /api/recent-proofs
│   │   │   ├── config/
│   │   │   │   └── route.ts          # GET /api/config
│   │   │   └── health/
│   │   │       └── route.ts          # GET /api/health
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── lib/
│   │   ├── config.ts                 # Configuration management
│   │   ├── scripts.ts                # Script execution utilities
│   │   ├── starknet.ts               # Starknet.js integration
│   │   └── logger.ts                 # Structured logging
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md
```

## Usage Examples

### Generate and Submit a Proof

```bash
# 1. Start proof generation
SESSION_ID=$(curl -X POST http://localhost:3000/api/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"useSampleData": true}' | jq -r '.data.sessionId')

# 2. Watch progress (SSE)
curl -N "http://localhost:3000/api/generate-proof/stream?sessionId=$SESSION_ID"

# 3. Submit proof to Starknet
curl -X POST http://localhost:3000/api/submit-proof \
  -H "Content-Type: application/json" \
  -d '{"account": "my-account"}'

# 4. Query proof status
curl "http://localhost:3000/api/proof-status?issuer=0x1234..."

# 5. Fetch recent proofs
curl "http://localhost:3000/api/recent-proofs?limit=10"
```

### JavaScript Client Example

```typescript
// Start proof generation
const response = await fetch('/api/generate-proof', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ useSampleData: true }),
});
const { data: { sessionId } } = await response.json();

// Stream progress with EventSource
const eventSource = new EventSource(
  `/api/generate-proof/stream?sessionId=${sessionId}`
);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`${progress.status}: ${progress.progress}%`);

  if (progress.status === 'complete') {
    eventSource.close();
    // Submit proof
    fetch('/api/submit-proof', { method: 'POST' });
  }
};
```

## Production Considerations

### Session Management

The current implementation uses in-memory session storage. For production:

- Use Redis for distributed session storage
- Implement session cleanup and TTL
- Add authentication to prevent session hijacking

### Error Handling

- All API routes include try-catch with proper error responses
- Script execution errors are captured and logged
- Starknet RPC errors are handled gracefully

### Logging

- Structured logging with `logger.ts`
- In production, integrate with logging service (Datadog, CloudWatch, etc.)
- Log proof generation metrics for monitoring

### Scalability

- Proof generation is CPU-intensive - consider background job queue (BullMQ, etc.)
- For multiple concurrent proofs, use worker pool or separate compute instances
- Cache Starknet queries with short TTL

### Security

- Add API authentication (API keys, JWT, etc.)
- Rate limiting on proof generation endpoints
- Input validation on all request bodies
- CORS configuration for production domains

## Integration with Frontend

This backend is designed to be consumed by a React/Next.js frontend:

```typescript
// Frontend component example
import { useEffect, useState } from 'react';

function ProofGenerator() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  const generateProof = async () => {
    const res = await fetch('/api/generate-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useSampleData: true }),
    });
    const { data } = await res.json();

    const eventSource = new EventSource(
      `/api/generate-proof/stream?sessionId=${data.sessionId}`
    );

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setProgress(update.progress);
      setStatus(update.status);

      if (update.status === 'complete' || update.status === 'error') {
        eventSource.close();
      }
    };
  };

  return (
    <div>
      <button onClick={generateProof}>Generate Proof</button>
      <div>Status: {status}</div>
      <div>Progress: {progress}%</div>
    </div>
  );
}
```

## Troubleshooting

### "Failed to load deployment config"

Run `../scripts/deploy.sh` to deploy contracts and generate `deployments.json`.

### "Proof artifacts not found"

Generate a proof first using `POST /api/generate-proof` before submitting.

### "sncast invoke failed"

Ensure:
- Starknet account is configured (`sncast account list`)
- Account has sufficient funds for gas
- RPC URL is accessible

### SSE connection issues

Some proxies/load balancers buffer SSE. For production:
- Use WebSocket instead of SSE
- Configure proxy to disable buffering for SSE endpoints
- Add heartbeat messages to keep connection alive

## License

MIT
