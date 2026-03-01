# Solva Web Dashboard Architecture

## Overview

The Solva Web Dashboard is a Next.js application that provides a REST API and web interface over the existing Solva CLI toolchain. It enables remote proof generation, submission, and monitoring without requiring direct CLI access.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Blockchain**: Starknet.js for contract interaction
- **API**: REST with Server-Sent Events for streaming
- **Session**: In-memory (upgrade to Redis for production)

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React)                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Proof Generator│  │  Status Query  │  │ Recent Proofs  │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
└───────────┼──────────────────┼──────────────────┼───────────┘
            │                   │                   │
            │ HTTP/SSE          │ HTTP              │ HTTP
            ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ /api/        │  │ /api/        │  │ /api/        │       │
│  │ generate-    │  │ proof-       │  │ recent-      │       │
│  │ proof        │  │ status       │  │ proofs       │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
    ┌─────┼──────────────────┼──────────────────┘
    │     │                  │
    ▼     ▼                  ▼
┌─────────────┐    ┌──────────────────┐
│  Scripts    │    │  Starknet.js     │
│  Executor   │    │  Integration     │
│             │    │                  │
│ - prove.sh  │    │ - RPC Provider   │
│ - submit_   │    │ - Contract ABI   │
│   proof.py  │    │ - Event Queries  │
└─────┬───────┘    └──────────┬───────┘
      │                       │
      ▼                       ▼
┌───────────────┐    ┌──────────────────┐
│   File        │    │   Starknet       │
│   System      │    │   Sepolia        │
│               │    │                  │
│ - proof       │    │ - Registry       │
│ - vk          │    │ - Verifier       │
│ - witness     │    │ - Events         │
└───────────────┘    └──────────────────┘
```

## Directory Structure

```
web-dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── generate-proof/ # POST - Start proof generation
│   │   │   │   ├── route.ts
│   │   │   │   ├── sessions.ts # Session management
│   │   │   │   └── stream/     # GET - SSE progress stream
│   │   │   │       └── route.ts
│   │   │   ├── proof-status/   # GET - Query registry
│   │   │   │   └── route.ts
│   │   │   ├── submit-proof/   # POST - Submit to Starknet
│   │   │   │   └── route.ts
│   │   │   ├── recent-proofs/  # GET - Fetch events
│   │   │   │   └── route.ts
│   │   │   ├── config/         # GET - Deployment config
│   │   │   │   └── route.ts
│   │   │   └── health/         # GET - Health check
│   │   │       └── route.ts
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── lib/                    # Shared utilities
│   │   ├── config.ts           # Config management
│   │   ├── scripts.ts          # Script execution
│   │   ├── starknet.ts         # Starknet integration
│   │   ├── logger.ts           # Structured logging
│   │   └── errors.ts           # Error handling
│   └── types/                  # TypeScript types
│       └── index.ts            # Shared types
├── examples/                   # Example components
│   └── ProofGenerator.tsx      # React component demo
├── package.json
├── tsconfig.json
├── next.config.mjs
├── README.md                   # API usage guide
├── API.md                      # API reference
├── TESTING.md                  # Testing guide
├── DEPLOYMENT.md               # Deployment guide
└── ARCHITECTURE.md             # This file
```

## Data Flow

### Proof Generation Flow

1. **Client** → POST `/api/generate-proof` with `{ useSampleData: true }`
2. **API Route** → Create session ID, spawn `prove.sh` process
3. **Script Executor** → Monitor stdout/stderr, parse progress
4. **Session Manager** → Store progress updates in memory
5. **Client** → Connect to SSE `/api/generate-proof/stream?sessionId=xxx`
6. **Stream Route** → Poll session, send SSE events
7. **Script Executor** → Complete, write proof artifacts to disk
8. **Client** → Receive completion event, close SSE connection

### Proof Submission Flow

1. **Client** → POST `/api/submit-proof`
2. **API Route** → Check proof artifacts exist
3. **Script Executor** → Spawn `submit_proof.py` with registry address
4. **Python Script** → Generate calldata with Garaga, invoke via `sncast`
5. **Starknet** → Submit transaction, return tx hash
6. **API Route** → Return tx hash to client

### Status Query Flow

1. **Client** → GET `/api/proof-status?issuer=0x...`
2. **API Route** → Call Starknet integration
3. **Starknet.js** → Query registry contract `get_solvency_info()`
4. **Contract** → Return solvency data
5. **API Route** → Parse and format response
6. **Client** → Receive solvency status

### Event Fetching Flow

1. **Client** → GET `/api/recent-proofs?limit=10`
2. **API Route** → Call Starknet integration
3. **Starknet.js** → Query events from latest blocks
4. **Provider** → Return `SolvencyVerified` events
5. **API Route** → Parse events, format records
6. **Client** → Receive proof records

## Key Components

### 1. Script Execution (`src/lib/scripts.ts`)

Wraps existing bash and Python scripts with proper:
- Process spawning with `child_process.spawn`
- Output streaming and parsing
- Progress tracking via regex matching
- Error handling with exit codes
- Artifact validation

### 2. Starknet Integration (`src/lib/starknet.ts`)

Provides typed access to on-chain data:
- RPC provider initialization
- Contract ABI definitions
- Type-safe contract calls
- Event filtering and parsing
- Error handling for RPC failures

### 3. Session Management (`src/app/api/generate-proof/sessions.ts`)

Manages in-memory proof generation sessions:
- Session ID generation
- Progress tracking
- Automatic cleanup (1 hour TTL)
- Thread-safe access (single-process)

**Production Upgrade:** Replace with Redis for distributed systems:
```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function saveSession(id: string, session: ProofSession) {
  await redis.setex(`session:${id}`, 3600, JSON.stringify(session));
}
```

### 4. Configuration Management (`src/lib/config.ts`)

Loads deployment config from `deployments.json`:
- Caches config in memory
- Provides helper functions
- Validates contract addresses
- Fallback to environment variables

**Integration Point:** Requires `deployments.json` from deployment script.

### 5. Type System (`src/types/index.ts`)

Shared TypeScript types for:
- API requests/responses
- Proof generation progress
- Solvency information
- Contract addresses
- Event records

**Type Safety:** Ensures consistency between frontend and backend.

## API Design Principles

### RESTful Endpoints
- GET for queries (idempotent)
- POST for actions (proof generation, submission)
- Descriptive resource names
- Consistent response format

### Error Handling
- Try-catch on all async operations
- Structured error responses
- HTTP status codes (200, 400, 404, 500)
- Custom error classes for categorization

### Streaming
- Server-Sent Events for one-way real-time updates
- Automatic reconnection support
- Heartbeat to detect disconnection
- Graceful cleanup on completion

### Validation
- Request body validation
- Query parameter validation
- Address format validation
- File existence checks

## Integration Points

### Blockchain Developer Coordination

**Required from Blockchain Developer:**

1. **Contract Addresses** - Deployed contract addresses in `deployments.json`:
```json
{
  "network": "sepolia",
  "rpc_url": "https://free-rpc.nethermind.io/sepolia-juno/v0_7",
  "contracts": {
    "solvency_verifier": "0x...",
    "solvency_registry": "0x...",
    "solva_token": "0x...",
    "lending_protocol": "0x..."
  }
}
```

2. **Contract ABIs** - If registry interface changes, update `REGISTRY_ABI` in `src/lib/starknet.ts`

3. **Event Schemas** - If `SolvencyVerified` event structure changes, update parser in `fetchRecentProofs()`

4. **RPC Endpoints** - Confirm production RPC URL and backup endpoints

**Provided to Blockchain Developer:**

1. **API Endpoints** - For integration with other services
2. **Event Monitoring** - Real-time proof verification tracking
3. **Status Queries** - Programmatic solvency checks

### CLI Scripts Integration

**Dependencies:**
- `../scripts/prove.sh` - Must be executable and in PATH
- `../scripts/submit_proof.py` - Must be executable with Python 3
- `../circuits/solvency_circuit/` - Output directory for artifacts
- `../deployments.json` - Generated by deploy script

**Assumptions:**
- Scripts write to expected file paths
- Scripts output parseable progress messages
- Scripts exit with 0 on success
- Python has `garaga` installed

## Performance Considerations

### Bottlenecks

1. **Proof Generation** - CPU-intensive, ~2 minutes
   - Solution: Queue system, worker pool

2. **Starknet RPC** - Network latency, rate limits
   - Solution: Caching, retry logic, fallback endpoints

3. **SSE Connections** - Memory per connection
   - Solution: Connection limits, timeout

### Optimizations

1. **Response Caching**
   - Cache solvency info for 30 seconds
   - Cache recent proofs for 1 minute
   - Cache config indefinitely (invalidate on redeploy)

2. **Connection Pooling**
   - Reuse HTTP connections for RPC
   - Limit concurrent proof generations

3. **Lazy Loading**
   - Only initialize Starknet provider when needed
   - Load config on first use

## Security Considerations

### Current Implementation

- No authentication (suitable for development only)
- No rate limiting (vulnerable to DoS)
- All endpoints publicly accessible
- File system access for proof artifacts

### Production Requirements

1. **Authentication**
   - JWT or API key authentication
   - Per-user rate limits
   - Account-based proof tracking

2. **Input Validation**
   - Sanitize all user inputs
   - Validate addresses with checksum
   - Limit request body sizes

3. **File Security**
   - Isolate proof artifacts per user
   - Prevent path traversal attacks
   - Clean up artifacts after submission

4. **Network Security**
   - HTTPS only in production
   - CORS restricted to trusted domains
   - Rate limiting on all endpoints

## Testing Strategy

### Unit Tests
- Test utility functions (config, logger, errors)
- Mock script execution
- Mock Starknet RPC calls

### Integration Tests
- Test API endpoints with test server
- Test SSE streaming
- Test script execution with sample data

### E2E Tests
- Full proof generation → submission → query flow
- Test error scenarios
- Test concurrent requests

## Monitoring and Observability

### Metrics to Track

1. **API Metrics**
   - Request rate per endpoint
   - Response times (p50, p95, p99)
   - Error rates by type

2. **Business Metrics**
   - Proof generations per hour
   - Success/failure rates
   - Average generation time
   - Submission success rate

3. **Infrastructure Metrics**
   - CPU usage during proof generation
   - Memory usage
   - Active SSE connections
   - Session storage size

### Logging

Structured logs with:
- Timestamp
- Log level (debug, info, warn, error)
- Request ID for tracing
- User context (when auth added)
- Error stack traces

## Future Enhancements

### Short Term
1. Add WebSocket support for bidirectional communication
2. Implement Redis session storage
3. Add authentication layer
4. Implement rate limiting

### Medium Term
1. Background job queue (BullMQ)
2. Proof artifact storage (S3/IPFS)
3. Metrics dashboard (Grafana)
4. Automated alerting

### Long Term
1. Multi-tenancy support
2. Custom RPC endpoint per user
3. Proof verification caching
4. Historical proof analytics
5. Integration with DeFi protocols

## Deployment Architecture

### Development
```
Developer Machine
├── Next.js Dev Server (:3000)
├── Local Starknet Devnet (:5050)
└── File System (proof artifacts)
```

### Production
```
Cloud Provider (Vercel/AWS/GCP)
├── Load Balancer
├── Next.js App (N instances)
├── Redis (sessions)
├── S3 (proof artifacts)
└── Monitoring (Datadog/CloudWatch)
    ├── Logs
    ├── Metrics
    └── Alerts
```

## Cost Estimation

### Development
- Free (local dev server)

### Production (1000 proofs/month)
- Compute: $50/month (2 vCPU instances)
- Redis: $10/month (256MB)
- Storage: $1/month (S3 for artifacts)
- RPC: Free (public endpoint) or $50/month (dedicated)
- Monitoring: $20/month (Datadog/New Relic)
- **Total: ~$80-130/month**

## Support and Maintenance

### Regular Tasks
- Monitor error rates
- Review performance metrics
- Update dependencies
- Security patches
- Backup deployments.json

### Incident Response
1. Check health endpoint
2. Review error logs
3. Verify Starknet RPC connectivity
4. Check proof artifacts disk space
5. Restart if necessary

### Escalation
- Frontend issues → UI team
- Script failures → DevOps team
- Contract issues → Blockchain developer
- RPC issues → Starknet team

## Contact and Collaboration

For questions or issues:
- Architecture: Review this document
- API: See API.md
- Deployment: See DEPLOYMENT.md
- Testing: See TESTING.md
- Contract Integration: Coordinate with blockchain-developer agent
