# Deployment Guide for Solva Web Dashboard

## Prerequisites

1. Node.js 18+ installed
2. Contracts deployed to Starknet (run `../scripts/deploy.sh`)
3. `deployments.json` file exists in project root
4. All required dependencies installed (`npm install`)

## Environment Configuration

Create `.env.production`:

```bash
# Starknet Configuration
STARKNET_RPC_URL=https://free-rpc.nethermind.io/sepolia-juno/v0_7
STARKNET_ACCOUNT=production-account

# API Configuration
NODE_ENV=production
PORT=3000

# Session Management
SESSION_TIMEOUT_MS=3600000

# Logging
LOG_LEVEL=info
```

## Build for Production

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build Next.js app
npm run build
```

## Deployment Options

### 1. Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Environment Variables:**
- Set all variables from `.env.production` in Vercel dashboard
- Add `deployments.json` content as environment variable or upload as file

**Vercel Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "STARKNET_RPC_URL": "@starknet_rpc_url",
    "STARKNET_ACCOUNT": "@starknet_account"
  }
}
```

### 2. Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy deployment config
COPY --from=builder /app/../deployments.json ../deployments.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and Run:**
```bash
docker build -t solva-dashboard .
docker run -p 3000:3000 \
  -e STARKNET_RPC_URL="https://free-rpc.nethermind.io/sepolia-juno/v0_7" \
  solva-dashboard
```

### 3. PM2 (VPS/EC2)

```bash
# Install PM2
npm install -g pm2

# Build app
npm run build

# Start with PM2
pm2 start npm --name "solva-dashboard" -- start

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
```

**PM2 Ecosystem File (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [{
    name: 'solva-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/web-dashboard',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      STARKNET_RPC_URL: 'https://free-rpc.nethermind.io/sepolia-juno/v0_7',
    },
  }],
};
```

Run with: `pm2 start ecosystem.config.js`

### 4. Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### 5. Render

1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables in dashboard

## Nginx Reverse Proxy

For VPS deployment, use Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name solva.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Server-Sent Events require special handling
    location /api/generate-proof/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
```

Enable SSL with Certbot:
```bash
sudo certbot --nginx -d solva.yourdomain.com
```

## Production Checklist

### Security
- [ ] Add authentication (JWT/API keys)
- [ ] Implement rate limiting
- [ ] Enable CORS only for trusted domains
- [ ] Add CSRF protection
- [ ] Validate all user inputs
- [ ] Sanitize error messages (don't expose stack traces)
- [ ] Use HTTPS only
- [ ] Set secure HTTP headers

### Performance
- [ ] Enable response caching for GET endpoints
- [ ] Implement Redis for session storage
- [ ] Add CDN for static assets
- [ ] Enable gzip compression
- [ ] Optimize Starknet RPC queries
- [ ] Add connection pooling for HTTP clients

### Monitoring
- [ ] Set up logging service (Datadog, CloudWatch, etc.)
- [ ] Add error tracking (Sentry)
- [ ] Monitor API response times
- [ ] Track proof generation metrics
- [ ] Set up uptime monitoring
- [ ] Configure alerting for failures

### Reliability
- [ ] Add health check endpoint monitoring
- [ ] Implement circuit breakers for external services
- [ ] Set up automatic restarts (PM2/Docker)
- [ ] Configure backup RPC endpoints
- [ ] Add retry logic for transient failures
- [ ] Test disaster recovery procedures

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
STARKNET_RPC_URL=http://localhost:5050  # Local devnet
LOG_LEVEL=debug
```

### Staging
```bash
NODE_ENV=staging
STARKNET_RPC_URL=https://free-rpc.nethermind.io/sepolia-juno/v0_7
LOG_LEVEL=info
```

### Production
```bash
NODE_ENV=production
STARKNET_RPC_URL=https://free-rpc.nethermind.io/mainnet-juno/v0_7
LOG_LEVEL=warn
REDIS_URL=redis://...  # For session storage
SENTRY_DSN=https://...  # For error tracking
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB, etc.)
- Deploy multiple instances with PM2 cluster mode
- Share session state via Redis
- Use message queue (BullMQ) for proof generation

### Vertical Scaling
- Proof generation is CPU-intensive
- Allocate more CPU cores for proof generation workers
- Consider separate compute instances for proof generation

### Database
- Current implementation uses in-memory storage
- For production, use Redis or PostgreSQL for:
  - Session storage
  - Proof generation queue
  - Cached Starknet queries

## Monitoring and Logging

### Prometheus Metrics
```typescript
// Add to src/lib/metrics.ts
import client from 'prom-client';

const register = new client.Registry();

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const proofGenerationDuration = new client.Histogram({
  name: 'proof_generation_duration_seconds',
  help: 'Duration of proof generation in seconds',
  registers: [register],
});
```

### Logging Best Practices
```typescript
// Structured logging
logger.info('Proof generation started', {
  sessionId,
  useSampleData,
  userId,
  timestamp: Date.now(),
});

// Error logging with context
logger.error('Proof submission failed', {
  sessionId,
  error: error.message,
  stack: error.stack,
  registryAddress,
});
```

## Troubleshooting Production Issues

### High CPU Usage
- Check number of concurrent proof generations
- Implement queue with max concurrency limit
- Scale horizontally

### Memory Leaks
- Monitor memory usage with `pm2 monit`
- Check for unclosed file handles
- Review session cleanup logic

### SSE Connection Issues
- Check proxy buffering settings
- Verify firewall allows long-lived connections
- Implement heartbeat to keep connections alive

### Starknet RPC Errors
- Implement retry with exponential backoff
- Use multiple RPC endpoints with fallback
- Cache query results with appropriate TTL

## Cost Optimization

1. **Caching**: Cache Starknet queries to reduce RPC calls
2. **Lazy Loading**: Only load contracts when needed
3. **Resource Limits**: Limit concurrent proof generations
4. **Auto-scaling**: Scale down during low traffic
5. **CDN**: Use CDN for static assets

## Backup and Recovery

### Backup Strategy
- Database backups (if using PostgreSQL)
- Configuration backups
- Contract deployment artifacts
- Proof artifacts storage

### Disaster Recovery
1. Deploy to multiple regions
2. Maintain backup RPC endpoints
3. Document rollback procedures
4. Test recovery regularly

## Support and Maintenance

### Regular Tasks
- Monitor error rates
- Review and rotate logs
- Update dependencies
- Review security advisories
- Test backup/recovery procedures
- Performance optimization

### Incident Response
1. Check monitoring dashboards
2. Review error logs
3. Verify external dependencies (Starknet RPC)
4. Rollback if necessary
5. Post-mortem analysis
