# Visual Specifications - Solva Transparency Dashboard

## Component Measurements & Spacing

### Solvency Status Card

```
┌─────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════╗  │ ← 4px accent bar (top)
│  ║  BADGE              VERIFIED BADGE        ║  │
│  ║  24px h             14px icon + text      ║  │ ← 24px padding top
│  ╚═══════════════════════════════════════════╝  │
│                                                  │
│     150.5%                                       │ ← 36px font size
│     ──────                                       │   Bold, JetBrains Mono
│     6px margin bottom                            │
│                                                  │
│     Reserve Ratio                                │ ← 14px font size
│     ─────────────                                │   Medium weight
│     16px margin bottom                           │
│                                                  │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ ← 1px divider
│                                                  │   16px margin
│     Max LTV:            80%                      │
│     Total Reserves:     10.5000 BTC              │ ← Metric rows
│     Total Liabilities:  7.0000 BTC               │   8px gap between
│     16px margin bottom                           │
│                                                  │
│     Last verified: 2 minutes ago                 │ ← 12px font size
│                                                  │   Mono, tertiary color
│  24px padding bottom                             │
└─────────────────────────────────────────────────┘

Dimensions:
  Width: Flexible (min 280px)
  Height: Auto (min 200px)
  Padding: 24px all sides
  Border Radius: 16px
  Border: 2px solid (tier color)
  Shadow: 0 4px 6px rgba(0,0,0,0.1)

Hover State:
  Transform: translateY(-4px)
  Shadow: 0 10px 15px rgba(0,0,0,0.1) + tier glow
  Transition: 300ms ease-out
```

### Proof Progress Indicator

```
┌─────────────────────────────────────────────────────────────────┐
│  Proof Generation in Progress              00:32                │ ← Header
│  24px font, semibold          14px mono, timer                  │   32px h
│                                                                  │
│  ═══════════════════════════════════════                        │ ← Progress bar
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                   │   8px height
│  Gradient: primary → bitcoin, with shimmer overlay              │   24px margin
│  65% width (calculated from elapsed time)                       │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✓  Fetching Bitcoin UTXOs        Completed in 2.8s      │ │ ← Complete
│  │    14px subtext, gray                                     │ │   stage
│  └───────────────────────────────────────────────────────────┘ │   Opacity 0.6
│                                                                  │   12px gap
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✓  Building Merkle Tree          Completed in 1.9s      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ ⚡ Generating ZK Proof           18s elapsed            ║ │ ← Active
│  ║    UltraKeccakHonk on BN254 curve                       ║ │   stage
│  ╚═══════════════════════════════════════════════════════════╝ │   Primary bg
│  4px left border, primary color                               │   Scale 1.02
│  Background: primary-50                                        │   Bounce anim
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ↑  Submitting to Starknet        Pending                 │ │ ← Pending
│  └───────────────────────────────────────────────────────────┘ │   Opacity 0.4
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✓  Verifying On-Chain            Pending                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  32px padding all sides                                         │
└─────────────────────────────────────────────────────────────────┘

Dimensions:
  Width: Flexible (min 600px)
  Height: Auto (~400px)
  Padding: 32px
  Border Radius: 16px
  Border: 2px solid neutral-200
  Background: white

Stage Item:
  Height: 64px
  Padding: 16px
  Border Radius: 12px
  Icon: 24x24px, left aligned
  Gap: 12px between icon and text

Progress Bar:
  Height: 8px
  Border Radius: 9999px
  Background: neutral-200
  Fill: Gradient (primary → bitcoin)
  Shimmer overlay: 2s infinite animation
```

### Bitcoin Address Card

```
┌─────────────────────────────────────────────────┐
│  Reserve Address #1                              │ ← Label
│  14px semibold, 8px margin bottom                │
│                                                  │
│  tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx   │ ← Address
│  14px mono, truncated                      [📋][🔗]│   Actions
│  48px height container                           │
│                                                  │
│  Balance                                         │ ← Label
│  12px, uppercase, tertiary, 4px margin           │
│                                                  │
│  5.0000 BTC                                      │ ← Balance
│  18px mono, bold, bitcoin orange                 │   16px margin
│                                                  │
│  12 transactions                                 │ ← Metadata
│  12px, gray, 12px margin                         │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ ✓ Verified in Merkle Tree              │    │ ← Badge
│  └─────────────────────────────────────────┘    │   Success green
│  20px height, full radius, 12px margin           │
│                                                  │
│  16px padding all sides                          │
└─────────────────────────────────────────────────┘

Dimensions:
  Width: Flexible (min 280px)
  Height: Auto (~180px)
  Padding: 16px
  Border Radius: 12px
  Border: 1px solid neutral-200
  Background: neutral-50

Verified State:
  Border: 1px solid success-300
  Background: success-50

Action Buttons:
  Size: 32x32px
  Border Radius: 6px
  Icon: 16x16px
  Hover: background neutral-100, scale 1.1
  Transition: 150ms
```

### Live Proof Feed Item

```
┌─────────────────────────────────────────────────┐
│  ● Proof Verified              2 min ago        │ ← Header
│  Status indicator (8px dot) + label             │   32px height
│                                                  │
│  Issuer: 0x1234...5678                          │ ← Content
│  14px, secondary color                          │   8px gap
│                                                  │
│  Tx: 0xabcd...ef01                              │ ← Link
│  14px mono, primary color, underline on hover   │   8px gap
│                                                  │
│  Tier A  •  150.5% ratio                        │ ← Details
│  14px, success color for tier                   │
│                                                  │
│  16px padding all sides                          │
└─────────────────────────────────────────────────┘

Dimensions:
  Width: 100%
  Height: Auto (~100px)
  Padding: 16px
  Border Radius: 12px
  Border: 1px solid neutral-200
  Background: white
  Margin Bottom: 12px

New Item State:
  Border: 2px solid primary-400
  Background: primary-50
  Animation: slideInRight 400ms spring easing

Status Dots:
  Verified: green-500, static
  Pending: warning-500, pulse animation
  Failed: danger-500, static
```

### Trust Badge

```
┌────────────────────────┐
│ ✓ Verified On-Chain   │
└────────────────────────┘

Dimensions:
  Height: 24px
  Padding: 8px 12px
  Border Radius: 9999px (full)
  Border: 1px solid
  Font: 12px, semibold
  Icon: 14x14px

Variants:
  Verified:
    Background: success-50
    Border: success-300
    Text: success-600
    Icon: shield-check

  Live:
    Background: bitcoin-50
    Border: bitcoin-300
    Text: bitcoin-600
    Icon: activity (pulse animation)

  Stale:
    Background: warning-50
    Border: warning-300
    Text: warning-600
    Icon: alert-triangle
```

### Button Specifications

```
Primary Button:
┌─────────────────────┐
│  Generate Proof    │
└─────────────────────┘

Dimensions:
  Height: 40px
  Padding: 12px 24px
  Border Radius: 12px
  Font: 16px, semibold
  Gap: 8px (icon + text)

States:
  Default:
    Background: primary-600
    Color: white
    Border: none

  Hover:
    Background: primary-700
    Transform: translateY(-1px)
    Shadow: 0 4px 6px rgba(0,0,0,0.1)

  Active:
    Background: primary-800
    Transform: translateY(0)

  Loading:
    Opacity: 0.7
    Icon: spinner (spin animation)
    Cursor: not-allowed

  Disabled:
    Background: neutral-300
    Opacity: 0.5
    Cursor: not-allowed

Secondary Button:
  Background: white
  Border: 1px solid neutral-300
  Color: neutral-900

  Hover:
    Background: neutral-50
    Border: neutral-400
```

### Metric Display

```
    ┌─────────────┐
    │   150.5%    │  ← Value: 36px bold
    │             │     Gradient text
    │ RESERVE     │  ← Label: 14px
    │   RATIO     │     Uppercase
    └─────────────┘

Dimensions:
  Padding: 24px
  Text Align: center

Value:
  Font Size: 36px
  Font Weight: Bold
  Font Family: JetBrains Mono
  Background: linear-gradient(primary-600, bitcoin-500)
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent

Label:
  Font Size: 14px
  Font Weight: Medium
  Color: neutral-600
  Text Transform: uppercase
  Letter Spacing: 0.05em
  Margin Top: 8px
```

## Layout Grid Specifications

### Desktop Grid (1024px+)

```
┌────────────────────────────────────────────────────────────────────┐
│  Header (12 columns)                                              │
│                                                                    │
├────────────┬────────────┬────────────┬────────────┬──────────────┤
│  Status    │  Metrics   │  Metrics   │  Alerts    │              │
│  (4 cols)  │  (4 cols)  │            │  (4 cols)  │              │
│            │            │            │            │              │
├────────────┴────────────┼────────────┴────────────┴──────────────┤
│  Proof Progress         │  Chart                                 │
│  (6 cols)               │  (6 cols)                              │
│                         │                                        │
├─────────────────────────┼────────────────────────────────────────┤
│  Bitcoin Addresses      │  Live Proof Feed                       │
│  (6 cols)               │  (6 cols)                              │
│                         │                                        │
├─────────────────────────┴────────────────────────────────────────┤
│  Lending Protocol Demo  │  History                               │
│  (6 cols)               │  (6 cols)                              │
└─────────────────────────┴────────────────────────────────────────┘

Container:
  Max Width: 1536px
  Margin: 0 auto
  Padding: 32px
  Gap: 24px
```

### Tablet Grid (768px - 1023px)

```
┌────────────────────────────────────┐
│  Header (6 columns)                │
├────────────┬───────────────────────┤
│  Status    │  Metrics              │
│  (3 cols)  │  (3 cols)             │
├────────────┴───────────────────────┤
│  Alerts (6 columns)                │
├────────────────────────────────────┤
│  Proof Progress (6 columns)        │
├────────────────────────────────────┤
│  Chart (6 columns)                 │
├────────────────────────────────────┤
│  Bitcoin Addresses (6 columns)     │
├────────────────────────────────────┤
│  Live Proof Feed (6 columns)       │
└────────────────────────────────────┘

Container:
  Padding: 24px
  Gap: 16px
```

### Mobile Grid (<768px)

```
┌──────────────────────┐
│  Header (1 column)   │
├──────────────────────┤
│  Status              │
├──────────────────────┤
│  Alerts              │
├──────────────────────┤
│  Metrics             │
├──────────────────────┤
│  Proof Progress      │
├──────────────────────┤
│  Chart               │
├──────────────────────┤
│  Bitcoin Addresses   │
├──────────────────────┤
│  Live Proof Feed     │
└──────────────────────┘

Container:
  Padding: 16px
  Gap: 16px
```

## Color Specifications

### Color Values with Use Cases

```
Primary Blue:
  50:  #F0F9FF  → Backgrounds, subtle highlights
  100: #E0F2FE  → Hover backgrounds
  200: #BAE6FD  → Disabled states
  400: #38BDF8  → Borders, accents
  500: #0EA5E9  → Interactive elements
  600: #0284C7  → Primary actions
  700: #0369A1  → Hover states
  900: #0C4A6E  → Text emphasis

Bitcoin Orange:
  50:  #FFF7ED  → Backgrounds
  100: #FFEDD5  → Subtle accents
  500: #F97316  → Bitcoin emphasis
  600: #EA580C  → Strong accents
  700: #C2410C  → Hover states

Success Green:
  50:  #F0FDF4  → Success backgrounds
  100: #DCFCE7  → Light success
  300: #86EFAC  → Borders
  500: #22C55E  → Success actions
  600: #16A34A  → Verified badges
  700: #15803D  → Emphasis

Neutral Gray:
  50:  #FAFAFA  → Page background
  100: #F5F5F5  → Card backgrounds
  200: #E5E5E5  → Borders
  300: #D4D4D4  → Strong borders
  400: #A3A3A3  → Disabled text
  500: #737373  → Secondary text
  600: #525252  → Body text
  900: #171717  → Headings, emphasis
```

## Typography Scale

```
Display:
  6xl: 60px / 3.75rem    Line: 1.0   Weight: 800   Use: Hero
  5xl: 48px / 3rem       Line: 1.0   Weight: 800   Use: Page title
  4xl: 36px / 2.25rem    Line: 1.2   Weight: 700   Use: Section, metrics
  3xl: 30px / 1.875rem   Line: 1.2   Weight: 700   Use: Card title

Body:
  2xl: 24px / 1.5rem     Line: 1.3   Weight: 600   Use: Subheading
  xl:  20px / 1.25rem    Line: 1.4   Weight: 600   Use: Label
  lg:  18px / 1.125rem   Line: 1.5   Weight: 500   Use: Emphasis
  base:16px / 1rem       Line: 1.5   Weight: 400   Use: Body
  sm:  14px / 0.875rem   Line: 1.5   Weight: 400   Use: Small text
  xs:  12px / 0.75rem    Line: 1.5   Weight: 400   Use: Caption

Code/Mono:
  Use JetBrains Mono for:
    - Bitcoin addresses
    - Transaction hashes
    - Timestamps
    - Numeric values
    - Code snippets
```

## Shadow Specifications

```
sm:    0 1px 2px 0 rgba(0,0,0,0.05)
       → Subtle depth

base:  0 1px 3px 0 rgba(0,0,0,0.1)
       → Default cards

md:    0 4px 6px -1px rgba(0,0,0,0.1)
       → Elevated cards

lg:    0 10px 15px -3px rgba(0,0,0,0.1)
       → Hover states

xl:    0 20px 25px -5px rgba(0,0,0,0.1)
       → Modals, popovers

Glow effects:
  success: 0 0 20px rgba(34, 197, 94, 0.3)
  primary: 0 0 20px rgba(14, 165, 233, 0.3)
  bitcoin: 0 0 20px rgba(249, 115, 22, 0.3)
```

## Animation Timing

```
Duration:
  Fast:    150ms  → Button hover, icon scale
  Normal:  300ms  → Card hover, modal open
  Slow:    500ms  → Page transitions
  Slower:  800ms  → Complex animations

Easing:
  linear:        For spin animations
  ease-in:       cubic-bezier(0.4, 0, 1, 1)
  ease-out:      cubic-bezier(0, 0, 0.2, 1)
  ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1)
  spring:        cubic-bezier(0.34, 1.56, 0.64, 1)

Common Patterns:
  Hover:     all 150ms ease-out
  Transform: transform 300ms cubic-bezier(0.4, 0, 0.2, 1)
  Fade:      opacity 200ms ease-in-out
  Slide:     transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

## Icon Specifications

```
Size Scale:
  xs:  12px  → Inline text icons
  sm:  16px  → Button icons
  md:  20px  → Card icons
  lg:  24px  → Feature icons
  xl:  32px  → Hero icons

Stroke Width:
  Regular: 2px
  Emphasis: 2.5px

Recommended Library:
  Lucide React or Heroicons
  - Consistent stroke width
  - Good coverage
  - Tree-shakeable
  - MIT license
```

## Accessibility Specifications

```
Color Contrast Ratios (WCAG 2.1 AA):
  Normal Text:        4.5:1 minimum
  Large Text (18px+): 3.0:1 minimum
  UI Components:      3.0:1 minimum

Focus Indicators:
  Outline: 2px solid primary-600
  Offset: 2px
  Border Radius: matches element

Touch Targets:
  Minimum: 44x44px
  Recommended: 48x48px
  Spacing: 8px between

Keyboard Navigation:
  Tab Order: logical, top to bottom
  Enter/Space: activate buttons
  Escape: close modals/dropdowns
  Arrow Keys: navigate lists/menus
```

---

**Note**: All measurements are in pixels unless otherwise specified. Use relative units (rem/em) in actual implementation for better accessibility and scaling.
