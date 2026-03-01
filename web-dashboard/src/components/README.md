# Solva Dashboard Components

Production-ready React components for the Solva transparency dashboard, built with TypeScript, React 18+, and Tailwind CSS.

## Component Overview

All components follow the design system specifications in `/design/` and implement best practices for performance, accessibility, and maintainability.

### 1. MetricCard

Reusable metric display card with gradient text and customizable styling.

**Props:**
- `label` (string): The metric label
- `value` (string | number): The metric value to display
- `subtext?` (string): Optional additional context
- `gradient?` ('primary' | 'bitcoin' | 'success' | 'warning'): Gradient style
- `className?` (string): Additional CSS classes

**Usage:**
```tsx
import { MetricCard } from '@/components';

<MetricCard
  label="Total Reserve"
  value="2.5 BTC"
  subtext="≈ $125,000 USD"
  gradient="bitcoin"
/>
```

### 2. SolvencyStatus

Card displaying current solvency status with tier badge, ratio metric, and verification status.

**Props:**
- `tier` (SolvencyTier): Current solvency tier (TierA, TierB, TierC, None)
- `ratio` (number): Reserve ratio percentage
- `lastProof` (number): Unix timestamp of last proof
- `isVerified` (boolean): Verification status
- `className?` (string): Additional CSS classes

**Features:**
- Dynamic tier-based styling (colors, badges, glow effects)
- Animated verification icon
- Relative timestamp display
- Hover effects with smooth transitions

**Usage:**
```tsx
import { SolvencyStatus, SolvencyTier } from '@/components';

<SolvencyStatus
  tier={SolvencyTier.TierA}
  ratio={152.5}
  lastProof={Date.now() / 1000}
  isVerified={true}
/>
```

### 3. ProofGenerator

Component for generating ZK proofs with real-time progress tracking through 5 stages.

**Features:**
- Server-Sent Events (SSE) streaming for live updates
- 5-stage progress visualization:
  1. Fetching Bitcoin UTXOs
  2. Building Merkle Tree
  3. Generating ZK Proof
  4. Submitting to Starknet
  5. Verifying On-Chain
- Animated progress bar with shimmer effect
- Error handling and display
- Success state with Starkscan transaction link

**API Endpoints:**
- `POST /api/generate-proof`: Initiates proof generation
- `GET /api/generate-proof/stream`: SSE stream for progress updates

**Usage:**
```tsx
import { ProofGenerator } from '@/components';

<ProofGenerator />
```

### 4. BitcoinAddresses

Manages Bitcoin reserve addresses with balance display and explorer links.

**Props:**
- `addresses` (BitcoinAddress[]): Array of address objects
  - `address` (string): Bitcoin address
  - `balance` (number): Balance in BTC
  - `verified` (boolean): Verification status
  - `label?` (string): Optional address label
- `className?` (string): Additional CSS classes

**Features:**
- Copy-to-clipboard functionality with visual feedback
- Links to Blockstream explorer
- Verified address badges
- Total balance summary
- Responsive address truncation

**Usage:**
```tsx
import { BitcoinAddresses } from '@/components';

const addresses = [
  {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    balance: 1.25,
    verified: true,
    label: 'Main Reserve'
  }
];

<BitcoinAddresses addresses={addresses} />
```

### 5. LiveProofFeed

Real-time feed of proof submissions with animated entries.

**Props:**
- `proofs` (ProofRecord[]): Array of proof records
  - `issuer` (string): Proof issuer address
  - `merkle_root` (string): Merkle root hash
  - `total_liabilities` (string): Total liabilities value
  - `tier` (SolvencyTier): Assigned solvency tier
  - `timestamp` (number): Unix timestamp
  - `transaction_hash` (string): Starknet transaction hash
- `maxItems?` (number): Maximum items to display (default: 10)
- `className?` (string): Additional CSS classes

**Features:**
- Animated slide-in for new proofs
- Status indicators with tier badges
- Starkscan transaction links
- Relative timestamps
- Scrollable feed with max height
- Empty state handling

**Usage:**
```tsx
import { LiveProofFeed } from '@/components';

<LiveProofFeed
  proofs={proofRecords}
  maxItems={15}
/>
```

### 6. LendingDemo

Interactive demo of lending protocol with solvency-based LTV.

**Features:**
- Real-time solvency status checking via `/api/proof-status`
- Dynamic LTV calculation based on tier:
  - Tier A (≥150%): 80% LTV
  - Tier B (≥120%): 60% LTV
  - Tier C (≥100%): 40% LTV
  - No Tier: 0% LTV
- Collateral input with validation
- Visual LTV progress bar
- Borrow amount calculation
- Warning states for unverified users

**API Endpoints:**
- `GET /api/proof-status`: Fetches current solvency status

**Usage:**
```tsx
import { LendingDemo } from '@/components';

<LendingDemo />
```

## Design System Integration

All components use the Solva design system tokens:

- **Colors**: Primary, Bitcoin, Success, Warning, Danger, Neutral palettes
- **Typography**: Inter (sans-serif), JetBrains Mono (monospace)
- **Spacing**: 0.25rem to 6rem scale
- **Animations**: pulse, bounce, shimmer, slideIn, fadeIn
- **Shadows**: Including glow effects for tier badges

## Styling

Components use a combination of:
1. **Tailwind CSS** utility classes for rapid development
2. **Design system CSS** (`design-system.css`) for component-specific styles
3. **Inline styles** for dynamic, prop-based styling

## Performance Optimization

All components implement:
- React 18+ best practices
- Proper TypeScript typing
- Client-side rendering where needed (`'use client'` directive)
- Efficient re-rendering with proper dependency arrays
- Cleanup of event listeners and SSE connections

## Accessibility

Components include:
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus states
- Screen reader compatible

## Testing

Components are designed to be testable with:
- React Testing Library
- Jest
- Mock API responses
- Snapshot testing

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When creating new components:
1. Follow the existing component structure
2. Use TypeScript with strict mode
3. Include proper prop types and documentation
4. Follow the design system guidelines
5. Add responsive styles for mobile
6. Test with different data states (loading, error, empty)
7. Export from `index.ts`

## File Structure

```
components/
├── MetricCard.tsx
├── SolvencyStatus.tsx
├── ProofGenerator.tsx
├── BitcoinAddresses.tsx
├── LiveProofFeed.tsx
├── LendingDemo.tsx
├── index.ts           # Central export file
└── README.md          # This file
```

## Dependencies

- React 18.3+
- Next.js 14.2+
- TypeScript 5.5+
- Tailwind CSS (via config)
- Date-fns 3.3+ (for date formatting)

## License

Part of the Solva protocol. See main repository LICENSE file.
