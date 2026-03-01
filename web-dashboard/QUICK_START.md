# Solva Dashboard Components - Quick Start Guide

## Installation

```bash
cd /Users/agnijdutta/Desktop/solva/web-dashboard
npm install
```

## Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## Component Import

```tsx
import {
  MetricCard,
  SolvencyStatus,
  ProofGenerator,
  BitcoinAddresses,
  LiveProofFeed,
  LendingDemo,
} from '@/components';
```

## Component Cheat Sheet

### MetricCard
```tsx
<MetricCard
  label="Total Reserve"
  value="2.5 BTC"
  subtext="≈ $125,000 USD"
  gradient="bitcoin" // 'primary' | 'bitcoin' | 'success' | 'warning'
/>
```

### SolvencyStatus
```tsx
<SolvencyStatus
  tier={SolvencyTier.TierA}
  ratio={152.5}
  lastProof={Math.floor(Date.now() / 1000)}
  isVerified={true}
/>
```

### ProofGenerator
```tsx
<ProofGenerator />
// No props - handles state internally
// Requires API: POST /api/generate-proof
//               GET /api/generate-proof/stream (SSE)
```

### BitcoinAddresses
```tsx
<BitcoinAddresses
  addresses={[
    {
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 1.25,
      verified: true,
      label: 'Main Reserve' // optional
    }
  ]}
/>
```

### LiveProofFeed
```tsx
<LiveProofFeed
  proofs={proofRecords}
  maxItems={10} // optional, default 10
/>
```

### LendingDemo
```tsx
<LendingDemo />
// No props - handles state internally
// Requires API: GET /api/proof-status
```

## Design System Colors

### Tailwind Classes

**Primary Blue:**
- `bg-primary-500` `text-primary-600` `border-primary-400`

**Bitcoin Orange:**
- `bg-bitcoin-500` `text-bitcoin-600` `border-bitcoin-400`

**Success Green:**
- `bg-success-500` `text-success-600` `border-success-400`

**Warning Yellow:**
- `bg-warning-500` `text-warning-600` `border-warning-400`

**Neutral Gray:**
- `bg-neutral-50` `text-neutral-900` `border-neutral-300`

### Gradients

```tsx
className="bg-gradient-to-r from-primary-600 to-bitcoin-500"
```

## Animations

Available Tailwind animations:
- `animate-pulse` - Pulsing effect
- `animate-bounce` - Bouncing effect
- `animate-shimmer` - Shimmer/shine effect
- `animate-slideIn` - Slide in from top
- `animate-slideInRight` - Slide in from right
- `animate-spin` - Rotation

## Typography

```tsx
// Sans-serif (Inter)
className="font-sans"

// Monospace (JetBrains Mono)
className="font-mono"

// Sizes
className="text-xs sm base lg xl 2xl 3xl 4xl"
```

## Spacing

```tsx
// Padding/Margin
className="p-4 px-6 py-3 m-2 mx-4 my-6"

// Gap (Flexbox/Grid)
className="gap-3 gap-x-4 gap-y-2"
```

## API Endpoints Required

### 1. Generate Proof
```
POST /api/generate-proof
Content-Type: application/json

Body: { useSampleData: boolean }

Response: {
  success: boolean,
  data?: any,
  error?: string
}
```

### 2. Proof Progress Stream (SSE)
```
GET /api/generate-proof/stream

Event Stream Format:
data: {
  status: 'fetching_utxos' | 'building_tree' | 'proving' | 'verifying' | 'complete' | 'error',
  message: string,
  progress: number, // 0-100
  transaction_hash?: string
}
```

### 3. Proof Status
```
GET /api/proof-status

Response: {
  success: boolean,
  data: {
    issuer: string,
    solvencyInfo: {
      tier: 'TierA' | 'TierB' | 'TierC' | 'None',
      last_proof_time: bigint,
      merkle_root: bigint,
      total_liabilities: bigint,
      is_valid: boolean
    } | null,
    isValid: boolean,
    isFresh: boolean
  }
}
```

## File Locations

**Components:**
- `/Users/agnijdutta/Desktop/solva/web-dashboard/src/components/`

**Styles:**
- `/Users/agnijdutta/Desktop/solva/web-dashboard/src/styles/globals.css`
- `/Users/agnijdutta/Desktop/solva/web-dashboard/src/styles/design-system.css`

**Config:**
- `/Users/agnijdutta/Desktop/solva/web-dashboard/tailwind.config.ts`
- `/Users/agnijdutta/Desktop/solva/web-dashboard/postcss.config.mjs`

**Types:**
- `/Users/agnijdutta/Desktop/solva/web-dashboard/src/types/index.ts`

## TypeScript Types

```typescript
import { SolvencyTier, ProofStatus, ProofRecord, SolvencyInfo } from '@/types';

// Solvency Tiers
SolvencyTier.TierA    // ≥150% reserve ratio, 80% LTV
SolvencyTier.TierB    // ≥120% reserve ratio, 60% LTV
SolvencyTier.TierC    // ≥100% reserve ratio, 40% LTV
SolvencyTier.None     // Not verified, 0% LTV

// Proof Statuses
ProofStatus.FETCHING_UTXOS
ProofStatus.BUILDING_TREE
ProofStatus.PROVING
ProofStatus.VERIFYING
ProofStatus.COMPLETE
ProofStatus.ERROR
```

## Responsive Design

All components are mobile-first responsive:

```tsx
// Mobile: default styles
// Tablet: sm: prefix (640px+)
// Desktop: md: prefix (768px+)
// Large: lg: prefix (1024px+)

className="p-4 md:p-6 lg:p-8"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## Common Patterns

### Card Layout
```tsx
<div className="bg-white rounded-xl p-6 border-2 border-neutral-200 shadow-md">
  {/* Content */}
</div>
```

### Button
```tsx
<button className="px-6 py-3 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-all duration-300">
  Click Me
</button>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>
```

## Troubleshooting

### Components not styled?
- Check `src/styles/globals.css` is imported in `layout.tsx`
- Run `npm install` to ensure Tailwind dependencies are installed

### TypeScript errors?
- Ensure `@/types` path is configured in `tsconfig.json`
- Check all imports use `@/components` or `@/types`

### SSE not working?
- Verify SSE endpoint returns proper `text/event-stream` content type
- Check browser console for connection errors
- Ensure cleanup in `useEffect` return function

## Support

For detailed documentation, see:
- `src/components/README.md` - Component documentation
- `COMPONENTS_SUMMARY.md` - Implementation details
- `/design/components.json` - Design specifications

## Build for Production

```bash
npm run build
npm start
```

## Type Checking

```bash
npm run type-check
```

## Linting

```bash
npm run lint
```
