# Solva Transparency Dashboard - Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing the Solva Transparency Dashboard UI components. The design system is production-ready, focusing on trust signals, real-time data display, and professional aesthetics for crypto/fintech applications.

## Design Philosophy

### Core Principles
1. **Trust & Transparency**: Every component emphasizes verification status and on-chain data
2. **Real-time Feedback**: Live updates with clear progress indicators
3. **Professional Polish**: Production-grade aesthetics, not hackathon demo
4. **Accessibility**: WCAG 2.1 AA compliant with semantic HTML
5. **Performance**: Optimized animations and efficient rendering

### Visual Language
- **Colors**: Blue for blockchain/trust, Orange for Bitcoin, Green for verified
- **Typography**: Inter for UI, JetBrains Mono for addresses/hashes
- **Spacing**: Consistent 4px base unit system
- **Animation**: Purposeful, performance-optimized micro-interactions

## Quick Start

### 1. Import Design Tokens

```javascript
import designTokens from './design/design-system.json';
```

### 2. Import Base Styles

```html
<link rel="stylesheet" href="./design/styles.css">
```

### 3. Use Components

```javascript
import { SolvencyStatusCard } from './components/SolvencyStatusCard';
```

## Component Specifications

### 1. Solvency Status Card

**Purpose**: Display real-time solvency status with tier indicators

**States**:
- Tier A (≥150% reserves): Green theme, 80% LTV
- Tier B (≥120% reserves): Blue theme, 60% LTV
- Tier C (≥100% reserves): Orange theme, 40% LTV
- None: Gray theme, 0% LTV

**HTML Structure**:
```html
<div class="solvency-card solvency-card--tier-a">
  <div class="solvency-card__header">
    <div class="solvency-card__badge">
      <svg class="verified-icon"><!-- Shield Check Icon --></svg>
      TIER A - PREMIUM
    </div>
    <div class="trust-badge trust-badge--verified">
      Verified On-Chain
    </div>
  </div>

  <div class="solvency-card__metric">
    150.5%
  </div>

  <div class="solvency-card__label">
    Reserve Ratio
  </div>

  <div class="solvency-card__details">
    <div class="metric-row">
      <span class="label">Max LTV:</span>
      <span class="value">80%</span>
    </div>
    <div class="metric-row">
      <span class="label">Total Reserves:</span>
      <span class="value">10.5000 BTC</span>
    </div>
    <div class="metric-row">
      <span class="label">Total Liabilities:</span>
      <span class="value">7.0000 BTC</span>
    </div>
  </div>

  <div class="solvency-card__timestamp">
    Last verified: 2 minutes ago
  </div>
</div>
```

**React Component**:
```jsx
import React from 'react';

const SolvencyStatusCard = ({ tier, reserveRatio, reserves, liabilities, lastProofTime }) => {
  const getTierConfig = (tier) => {
    const configs = {
      'TierA': { label: 'TIER A - PREMIUM', ltv: '80%', class: 'tier-a' },
      'TierB': { label: 'TIER B - STANDARD', ltv: '60%', class: 'tier-b' },
      'TierC': { label: 'TIER C - MINIMUM', ltv: '40%', class: 'tier-c' },
      'None': { label: 'NOT VERIFIED', ltv: '0%', class: 'tier-none' }
    };
    return configs[tier] || configs['None'];
  };

  const config = getTierConfig(tier);
  const timeAgo = getTimeAgo(lastProofTime);

  return (
    <div className={`solvency-card solvency-card--${config.class}`}>
      <div className="solvency-card__header">
        <div className="solvency-card__badge">
          <ShieldCheckIcon className="verified-icon" />
          {config.label}
        </div>
        <TrustBadge variant="verified" />
      </div>

      <div className="solvency-card__metric">
        {reserveRatio}%
      </div>

      <div className="solvency-card__label">
        Reserve Ratio
      </div>

      <div className="solvency-card__details">
        <MetricRow label="Max LTV" value={config.ltv} />
        <MetricRow label="Total Reserves" value={`${reserves} BTC`} />
        <MetricRow label="Total Liabilities" value={`${liabilities} BTC`} />
      </div>

      <div className="solvency-card__timestamp">
        Last verified: {timeAgo}
      </div>
    </div>
  );
};

export default SolvencyStatusCard;
```

### 2. Proof Progress Indicator

**Purpose**: Visual feedback during 30+ second proof generation

**Stages**:
1. Fetching Bitcoin UTXOs (~3s)
2. Building Merkle Tree (~2s)
3. Generating ZK Proof (~25s) - Main stage
4. Submitting to Starknet (~5s)
5. Verifying On-Chain (~3s)

**HTML Structure**:
```html
<div class="proof-progress">
  <div class="proof-progress__header">
    <h3>Proof Generation in Progress</h3>
    <div class="proof-progress__timer">00:32</div>
  </div>

  <div class="proof-progress__bar-container">
    <div class="proof-progress__bar" style="width: 65%"></div>
  </div>

  <div class="proof-progress__stages">
    <div class="proof-stage proof-stage--complete">
      <CheckIcon class="proof-stage__icon" />
      <div class="proof-stage__content">
        <div class="proof-stage__label">Fetching Bitcoin UTXOs</div>
        <div class="proof-stage__subtext">Completed in 2.8s</div>
      </div>
    </div>

    <div class="proof-stage proof-stage--complete">
      <CheckIcon class="proof-stage__icon" />
      <div class="proof-stage__content">
        <div class="proof-stage__label">Building Merkle Tree</div>
        <div class="proof-stage__subtext">Completed in 1.9s</div>
      </div>
    </div>

    <div class="proof-stage proof-stage--active">
      <ShieldIcon class="proof-stage__icon" />
      <div class="proof-stage__content">
        <div class="proof-stage__label">Generating ZK Proof</div>
        <div class="proof-stage__subtext">UltraKeccakHonk on BN254 curve</div>
      </div>
      <div class="proof-stage__timer">18s elapsed</div>
    </div>

    <div class="proof-stage">
      <UploadIcon class="proof-stage__icon" />
      <div class="proof-stage__content">
        <div class="proof-stage__label">Submitting to Starknet</div>
        <div class="proof-stage__subtext">Pending</div>
      </div>
    </div>

    <div class="proof-stage">
      <CheckCircleIcon class="proof-stage__icon" />
      <div class="proof-stage__content">
        <div class="proof-stage__label">Verifying On-Chain</div>
        <div class="proof-stage__subtext">Pending</div>
      </div>
    </div>
  </div>
</div>
```

**React Component with State Management**:
```jsx
import React, { useState, useEffect } from 'react';

const ProofProgressIndicator = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stageStartTime, setStageStartTime] = useState(Date.now());

  const stages = [
    { id: 'fetching', label: 'Fetching Bitcoin UTXOs', duration: 3000, icon: 'download' },
    { id: 'building', label: 'Building Merkle Tree', duration: 2000, icon: 'tree' },
    { id: 'proving', label: 'Generating ZK Proof', duration: 25000, icon: 'shield', highlight: true },
    { id: 'submitting', label: 'Submitting to Starknet', duration: 5000, icon: 'upload' },
    { id: 'verifying', label: 'Verifying On-Chain', duration: 3000, icon: 'check' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 100);

      const elapsed = Date.now() - stageStartTime;
      if (elapsed >= stages[currentStage].duration) {
        if (currentStage < stages.length - 1) {
          setCurrentStage(prev => prev + 1);
          setStageStartTime(Date.now());
        } else {
          onComplete();
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [currentStage]);

  const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
  const completedDuration = stages.slice(0, currentStage).reduce((sum, stage) => sum + stage.duration, 0);
  const progressPercentage = ((completedDuration + elapsedTime) / totalDuration) * 100;

  return (
    <div className="proof-progress">
      <div className="proof-progress__header">
        <h3>Proof Generation in Progress</h3>
        <div className="proof-progress__timer">
          {Math.floor(elapsedTime / 1000)}s
        </div>
      </div>

      <div className="proof-progress__bar-container">
        <div
          className="proof-progress__bar"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="proof-progress__stages">
        {stages.map((stage, index) => (
          <ProofStage
            key={stage.id}
            stage={stage}
            status={
              index < currentStage ? 'complete' :
              index === currentStage ? 'active' : 'pending'
            }
            elapsedTime={index === currentStage ? elapsedTime : 0}
          />
        ))}
      </div>
    </div>
  );
};

const ProofStage = ({ stage, status, elapsedTime }) => (
  <div className={`proof-stage proof-stage--${status}`}>
    <Icon name={stage.icon} className="proof-stage__icon" />
    <div className="proof-stage__content">
      <div className="proof-stage__label">{stage.label}</div>
      <div className="proof-stage__subtext">
        {status === 'complete' && `Completed in ${stage.duration / 1000}s`}
        {status === 'active' && `In progress...`}
        {status === 'pending' && 'Pending'}
      </div>
    </div>
    {status === 'active' && (
      <div className="proof-stage__timer">
        {(elapsedTime / 1000).toFixed(1)}s
      </div>
    )}
  </div>
);

export default ProofProgressIndicator;
```

### 3. Bitcoin Address Manager

**Purpose**: Display and manage Bitcoin reserve addresses

**Features**:
- Copy address to clipboard
- View on blockchain explorer
- Show verification status
- Display balance

**HTML Structure**:
```html
<div class="address-card address-card--verified">
  <div class="address-card__display">
    <div class="address-card__text">
      tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
    </div>
    <div class="address-card__actions">
      <button class="address-card__action-btn" title="Copy address">
        <CopyIcon />
      </button>
      <a href="#" class="address-card__action-btn" title="View on explorer">
        <ExternalLinkIcon />
      </a>
    </div>
  </div>

  <div class="address-card__balance-label">Balance</div>
  <div class="address-card__balance">5.0000 BTC</div>

  <div class="verification-badge">
    <CheckCircleIcon />
    Verified in Merkle Tree
  </div>
</div>
```

**React Component**:
```jsx
import React, { useState } from 'react';

const BitcoinAddressCard = ({ address, balance, verified, txCount }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const explorerUrl = `https://blockstream.info/testnet/address/${address}`;

  return (
    <div className={`address-card ${verified ? 'address-card--verified' : ''}`}>
      <div className="address-card__display">
        <div className="address-card__text" title={address}>
          {truncateAddress(address)}
        </div>
        <div className="address-card__actions">
          <button
            className="address-card__action-btn"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy address'}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="address-card__action-btn"
            title="View on explorer"
          >
            <ExternalLinkIcon />
          </a>
        </div>
      </div>

      <div className="address-card__balance-label">Balance</div>
      <div className="address-card__balance">
        {balance.toFixed(8)} BTC
      </div>

      <div className="address-card__meta">
        <span className="address-card__tx-count">{txCount} transactions</span>
      </div>

      {verified && (
        <div className="verification-badge">
          <CheckCircleIcon />
          Verified in Merkle Tree
        </div>
      )}
    </div>
  );
};

export default BitcoinAddressCard;
```

### 4. Live Proof Feed

**Purpose**: Real-time feed of proof submissions

**HTML Structure**:
```html
<div class="proof-feed">
  <div class="proof-feed-item proof-feed-item--new">
    <div class="proof-feed-item__header">
      <div class="proof-feed-item__status">
        <span class="status-dot status-dot--verified"></span>
        <span>Proof Verified</span>
      </div>
      <div class="proof-feed-item__timestamp">2 min ago</div>
    </div>

    <div class="proof-feed-item__content">
      <div class="proof-feed-item__issuer">
        Issuer: 0x1234...5678
      </div>
      <div class="proof-feed-item__txhash">
        Tx: 0xabcd...ef01
      </div>
      <div class="proof-feed-item__details">
        <span>Tier A</span>
        <span>•</span>
        <span>150.5% ratio</span>
      </div>
    </div>
  </div>
</div>
```

**React Component with Real-time Updates**:
```jsx
import React, { useState, useEffect } from 'react';

const LiveProofFeed = ({ proofs = [] }) => {
  const [items, setItems] = useState(proofs);

  useEffect(() => {
    // Simulate new proof events
    const interval = setInterval(() => {
      // In production, this would listen to contract events
      // For now, we'll simulate with the initial data
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="proof-feed">
      {items.map((item, index) => (
        <ProofFeedItem
          key={item.txHash}
          item={item}
          isNew={index === 0}
        />
      ))}
    </div>
  );
};

const ProofFeedItem = ({ item, isNew }) => {
  const statusConfig = {
    verified: { dot: 'verified', label: 'Proof Verified' },
    pending: { dot: 'pending', label: 'Verifying...' },
    failed: { dot: 'failed', label: 'Verification Failed' }
  };

  const config = statusConfig[item.status] || statusConfig.pending;

  return (
    <div className={`proof-feed-item ${isNew ? 'proof-feed-item--new' : ''}`}>
      <div className="proof-feed-item__header">
        <div className="proof-feed-item__status">
          <span className={`status-dot status-dot--${config.dot}`}></span>
          <span>{config.label}</span>
        </div>
        <div className="proof-feed-item__timestamp">
          {getTimeAgo(item.timestamp)}
        </div>
      </div>

      <div className="proof-feed-item__content">
        <div className="proof-feed-item__issuer">
          Issuer: {truncateAddress(item.issuer)}
        </div>
        <a
          href={getExplorerUrl(item.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="proof-feed-item__txhash"
        >
          Tx: {truncateHash(item.txHash)}
        </a>
        {item.status === 'verified' && (
          <div className="proof-feed-item__details">
            <span>{item.tier}</span>
            <span>•</span>
            <span>{item.ratio}% ratio</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveProofFeed;
```

## Data Visualization

### Solvency Ratio Gauge

```jsx
import React from 'react';
import { Gauge } from 'recharts'; // or your preferred chart library

const SolvencyGauge = ({ ratio }) => {
  const getColor = (ratio) => {
    if (ratio >= 150) return '#22C55E'; // Tier A
    if (ratio >= 120) return '#0EA5E9'; // Tier B
    if (ratio >= 100) return '#F59E0B'; // Tier C
    return '#EF4444'; // Below minimum
  };

  return (
    <div className="solvency-gauge">
      <svg viewBox="0 0 200 120" className="gauge-svg">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#E5E5E5"
          strokeWidth="20"
        />
        {/* Progress arc */}
        <path
          d={calculateArcPath(ratio)}
          fill="none"
          stroke={getColor(ratio)}
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Value */}
        <text
          x="100"
          y="80"
          textAnchor="middle"
          fontSize="32"
          fontWeight="bold"
          fill={getColor(ratio)}
        >
          {ratio}%
        </text>
        <text
          x="100"
          y="95"
          textAnchor="middle"
          fontSize="12"
          fill="#737373"
        >
          Reserve Ratio
        </text>
      </svg>

      <div className="gauge-thresholds">
        <div className="threshold">
          <span className="threshold-value">100%</span>
          <span className="threshold-label">Minimum</span>
        </div>
        <div className="threshold">
          <span className="threshold-value">120%</span>
          <span className="threshold-label">Tier B</span>
        </div>
        <div className="threshold">
          <span className="threshold-value">150%</span>
          <span className="threshold-label">Tier A</span>
        </div>
      </div>
    </div>
  );
};
```

## Responsive Layouts

### Desktop Grid (1024px+)

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  max-width: 1536px;
  margin: 0 auto;
  padding: 2rem;
}

.status-card {
  grid-column: span 4;
}

.proof-progress {
  grid-column: span 6;
}

.chart {
  grid-column: span 6;
}
```

### Tablet (768px - 1023px)

```css
@media (max-width: 1023px) {
  .dashboard-grid {
    grid-template-columns: repeat(6, 1fr);
    padding: 1.5rem;
  }

  .status-card {
    grid-column: span 3;
  }

  .proof-progress {
    grid-column: span 6;
  }
}
```

### Mobile (< 768px)

```css
@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .status-card,
  .proof-progress,
  .chart {
    grid-column: span 1;
  }
}
```

## Accessibility Guidelines

### Semantic HTML
- Use proper heading hierarchy (h1, h2, h3)
- Label all form controls
- Provide alt text for icons
- Use semantic elements (nav, main, article)

### ARIA Attributes
```html
<button
  aria-label="Copy address to clipboard"
  aria-pressed={copied}
>
  <CopyIcon aria-hidden="true" />
</button>

<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Proof verification in progress
</div>
```

### Keyboard Navigation
- All interactive elements must be focusable
- Provide visible focus indicators
- Support Enter and Space for button activation
- Allow Escape to close modals

### Color Contrast
- Text on backgrounds: minimum 4.5:1 ratio
- UI components: minimum 3:1 ratio
- Status indicators: don't rely on color alone

## Performance Optimization

### Animation Performance
- Use `transform` and `opacity` for animations
- Apply `will-change` sparingly
- Use `requestAnimationFrame` for complex animations

```css
.proof-stage--active {
  will-change: transform;
  transform: translateZ(0); /* Create compositing layer */
}
```

### Loading States
- Show skeleton screens while loading
- Implement progressive enhancement
- Use lazy loading for images

### Bundle Optimization
- Tree-shake unused components
- Code-split by route
- Compress images (WebP format)

## Testing Checklist

### Visual Testing
- [ ] All tier variants render correctly
- [ ] Animations are smooth (60fps)
- [ ] Responsive breakpoints work
- [ ] Dark mode (if implemented)

### Functional Testing
- [ ] Copy to clipboard works
- [ ] External links open correctly
- [ ] Real-time updates display
- [ ] Progress indicator completes

### Accessibility Testing
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Color contrast passes
- [ ] Focus indicators visible

### Performance Testing
- [ ] Load time < 3s
- [ ] First contentful paint < 1.5s
- [ ] No layout shifts
- [ ] Smooth scrolling

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari: iOS 14+
- Chrome Android: Latest

## Resources

### Design Files
- `/design/design-system.json` - Design tokens
- `/design/components.json` - Component specifications
- `/design/layouts.json` - Layout definitions
- `/design/interactions.json` - Interaction patterns
- `/design/styles.css` - Production CSS

### Assets
- Icon library: Lucide React or Heroicons
- Font: Inter (Google Fonts)
- Monospace font: JetBrains Mono

### Tools
- Figma: For design iteration
- Storybook: For component documentation
- React Developer Tools: For debugging
- Lighthouse: For performance audits

## Support

For questions or issues with the design system, contact the design team or open an issue in the project repository.

---

**Version**: 1.0.0
**Last Updated**: 2026-02-14
**Maintained By**: Solva Design Team
