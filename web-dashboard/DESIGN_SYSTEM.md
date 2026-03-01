# Solva ZK Infrastructure Protocol Design System

## Overview

This design system establishes Solva as a cutting-edge zero-knowledge infrastructure protocol with a sophisticated dark mode cyber aesthetic. The visual language combines glassmorphism, holographic effects, and data-dense displays while maintaining professional elegance.

## Design Philosophy

- **Dark by Default**: Core identity is built on dark mode (#0A0E27 base)
- **Cyber Aesthetic**: Grid patterns, circuit-like connections, neon accents
- **Holographic Effects**: Animated gradients, glow effects, and interactive borders
- **Data-Dense but Elegant**: Maximum information density without clutter
- **ZK Protocol Grade**: Visual quality matching Aztec Protocol, zkSync Era, Polygon zkEVM

## Color Palette

### Background Colors
```css
--zk-bg-primary: #0A0E27     /* Main background */
--zk-bg-secondary: #0F1433   /* Elevated surfaces */
--zk-bg-tertiary: #151B3F    /* Cards and panels */
--zk-bg-elevated: #1A2151    /* Hover states */
```

### Neon Accent Colors
```css
--zk-cyan: #00F5FF           /* Primary accent */
--zk-purple: #B794F6         /* Secondary accent */
--zk-green: #00FF88          /* Success states */
--zk-pink: #FF1CF7           /* Tertiary accent */
```

### Text Colors
```css
--zk-text-primary: #FFFFFF   /* Headings, important text */
--zk-text-secondary: #A8B2D1 /* Body text */
--zk-text-tertiary: #6B7A99  /* Labels, metadata */
--zk-text-muted: #4A5568     /* Disabled, placeholder */
```

## Typography

### Font Families
- **Display/Headings**: Inter (sans-serif)
- **Monospace**: JetBrains Mono (code, addresses, metrics)
- **Body**: Inter (sans-serif)

### Type Scale
- `6xl`: 60px - Hero headings
- `5xl`: 48px - Page titles
- `4xl`: 36px - Section headers
- `3xl`: 30px - Card titles
- `2xl`: 24px - Subsections
- `xl`: 20px - Large body
- `base`: 16px - Body text
- `sm`: 14px - Secondary text
- `xs`: 12px - Labels, metadata

### Text Effects
- **Gradient Text**: `.text-gradient-cyber` - Animated cyan to purple to pink
- **Glow Effects**: `.text-glow-cyan`, `.text-glow-purple`, `.text-glow-green`

## Components

### Glass Morphism Cards

**Standard Glass Card**
```tsx
<div className="glass-card p-6 rounded-xl border border-white/10">
  {/* Content */}
</div>
```
- Background: rgba(255, 255, 255, 0.05)
- Backdrop blur: 10px
- Border: rgba(255, 255, 255, 0.1)

**Strong Glass Card**
```tsx
<div className="glass-card-strong p-6 rounded-xl border border-white/10">
  {/* Content */}
</div>
```
- Background: rgba(255, 255, 255, 0.08)
- Backdrop blur: 16px
- Border: rgba(255, 255, 255, 0.15)

### Holographic Borders

**Static Holographic Border**
```tsx
<div className="zk-holographic-border p-6 rounded-xl">
  {/* Content */}
</div>
```

**Hover Holographic Border**
```tsx
<div className="zk-holographic-border-hover p-6 rounded-xl">
  {/* Content */}
</div>
```
- Animated gradient border appears on hover
- Smooth transition effects

### Progress Bars

**Glowing Progress Bar**
```tsx
<div className="zk-progress-bar">
  <div className="zk-progress-fill" style={{ width: '60%' }}>
    {/* Animated shimmer effect included */}
  </div>
</div>
```

**Features:**
- Cyber gradient (cyan → purple → pink)
- Glow shadow effect
- Shimmer animation overlay

### Buttons

**Primary Action Button**
```tsx
<button className="zk-button-glow">
  Generate ZK Proof
</button>
```
- Gradient background (cyan to purple)
- Animated shine effect
- Glow on hover
- Lift animation

**Custom Styled Button**
```tsx
<button className="px-6 py-4 rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500
  text-white font-bold shadow-glow-primary hover:-translate-y-1 transition-all">
  Action
</button>
```

### Metric Cards

**Enhanced Metric Display**
```tsx
<MetricCard
  label="Solvency Ratio"
  value="130%"
  subtext="Reserves / Liabilities"
  gradient="from-success-600 to-success-500"
/>
```

**Features:**
- Glass morphism background
- Hover lift effect
- Gradient text values
- Animated corner accents

### Status Badges

**Tier Badges**
```tsx
<div className="zk-tier-a px-4 py-1.5 rounded-full text-xs font-bold">
  TIER A - PREMIUM
</div>
```
- Tier A: Green to cyan gradient
- Tier B: Cyan to purple gradient
- Tier C: Purple to pink gradient

**Verification Badge**
```tsx
<div className="zk-verified-badge">
  <svg>...</svg>
  VERIFIED
</div>
```
- Green to cyan gradient
- Pulsing glow animation

## Visual Effects

### Grid Background

**Cyber Grid**
```tsx
<div className="cyber-grid min-h-screen">
  {/* Content */}
</div>
```

**Animated Grid**
```tsx
<div className="cyber-grid-animated min-h-screen">
  {/* Content */}
</div>
```
- Grid flows continuously
- Subtle cyan accent lines

### Glow Effects

**Shadow Utilities**
- `.shadow-glow-primary` - Cyan glow
- `.shadow-glow-success` - Green glow
- `.shadow-glow-purple` - Purple glow
- `.shadow-glow-pink` - Pink glow

### Animations

**Float Animation**
```tsx
<div className="float">
  {/* Floats up and down */}
</div>
```

**Pulse Glow**
```tsx
<div className="pulse-glow">
  {/* Pulsing glow effect */}
</div>
```

**Hover Lift**
```tsx
<div className="hover-lift">
  {/* Lifts on hover */}
</div>
```

**Scan Line Effect**
```tsx
<div className="relative">
  <div className="zk-scan-line" />
  {/* Content */}
</div>
```

## ZK-Specific Visual Elements

### Merkle Tree Visualization
```tsx
import { MerkleTreeVisualization } from '@/components';

<MerkleTreeVisualization className="w-64" />
```

### Circuit Lines
```tsx
import { CircuitLines } from '@/components';

<CircuitLines className="opacity-20" />
```

### Hash Display
```tsx
import { HashVisualization } from '@/components';

<HashVisualization hash="0x1234...5678" />
```

### Proof Verification Animation
```tsx
import { ProofVerificationAnimation } from '@/components';

<ProofVerificationAnimation isVerifying={true} />
```

### Starknet Logo
```tsx
import { StarknetLogo } from '@/components';

<StarknetLogo size={24} />
```

## Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen relative">
  {/* Background Gradient Orbs */}
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
  </div>

  {/* Header */}
  <header className="relative z-10 border-b border-white/10 glass-card">
    {/* Header content */}
  </header>

  {/* Main Content */}
  <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </main>
</div>
```

### Navigation
```tsx
<nav className="flex gap-6">
  <Link href="/" className="text-cyan-400 font-semibold relative group">
    Dashboard
    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
  </Link>
  <Link href="/feed" className="text-gray-400 hover:text-cyan-400 transition-all relative group">
    Live Feed
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all" />
  </Link>
</nav>
```

## Accessibility

### Focus States
All interactive elements include visible focus states with cyan glow:
```css
focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zk-bg-primary
```

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Neon accents used for decoration only, not critical information
- Important states use multiple indicators (color + icon + text)

### Motion
- Respects `prefers-reduced-motion`
- Animations are decorative, not functional
- All content accessible without animation

## Responsive Behavior

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Optimizations
- Glass morphism effects reduced on mobile
- Animations simplified
- Grid patterns made subtler
- Touch targets minimum 44x44px

## Performance Considerations

### Optimization Techniques
- Backdrop filters used sparingly (GPU acceleration)
- Animations use `transform` and `opacity` (compositor properties)
- Gradients cached with CSS custom properties
- SVG effects optimized with minimal paths

### Loading States
```tsx
<div className="glass-card p-6">
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-white/10 rounded w-3/4" />
    <div className="h-4 bg-white/10 rounded w-1/2" />
  </div>
</div>
```

## Brand Assets

### Logo Variants
- Full color holographic (primary)
- Cyan monochrome
- White on dark
- Dark on light (minimal use)

### Icon Style
- Outlined stroke (2px weight)
- Rounded corners
- Consistent sizing (16px, 20px, 24px, 32px)
- Cyan/purple accent colors

## Usage Guidelines

### Do's
✓ Use dark backgrounds exclusively
✓ Apply glow effects to emphasize interactive elements
✓ Maintain consistent spacing (4px grid)
✓ Use monospace fonts for data/addresses
✓ Include loading states for all async operations
✓ Add subtle animations for state changes

### Don'ts
✗ Don't use light mode or light backgrounds
✗ Don't overuse glow effects (causes visual fatigue)
✗ Don't mix font families within components
✗ Don't create custom colors outside the palette
✗ Don't disable animations without fallbacks
✗ Don't sacrifice readability for aesthetics

## Examples

### Complete Component Example
```tsx
<div className="glass-card-strong rounded-xl p-8 border-2 border-cyan-500/20
  relative overflow-hidden group hover-lift">
  {/* Background glow */}
  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5
    via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100
    transition-opacity duration-500" />

  {/* Content */}
  <div className="relative z-10">
    <h3 className="text-2xl font-bold text-gradient-cyber mb-4">
      Component Title
    </h3>
    <p className="text-gray-400 font-mono text-sm">
      Component description
    </p>
  </div>

  {/* Scan line effect */}
  <div className="zk-scan-line opacity-0 group-hover:opacity-100" />
</div>
```

## Files Reference

### Core Style Files
- `/src/styles/zk-theme.css` - ZK theme variables and utilities
- `/src/styles/globals.css` - Global styles and animations
- `/tailwind.config.ts` - Tailwind configuration

### Component Files
- `/src/components/SolvencyStatus.tsx` - Status display
- `/src/components/ProofGenerator.tsx` - Proof generation UI
- `/src/components/MetricCard.tsx` - Metric displays
- `/src/components/BitcoinAddresses.tsx` - Address management
- `/src/components/ZKVisuals.tsx` - ZK-specific visual elements

### Page Files
- `/src/app/page.tsx` - Dashboard
- `/src/app/feed/page.tsx` - Live proof feed
- `/src/app/lending/page.tsx` - DeFi integration

## Version History

**v1.0.0** - Initial ZK Infrastructure Protocol Grade Design System
- Dark mode cyber aesthetic
- Glassmorphism components
- Holographic effects
- Complete component library
- ZK-specific visual elements
