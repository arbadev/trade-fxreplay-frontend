# Trade FX Replay - Frontend Implementation Guide

## Overview
A comprehensive design system and implementation guide for a mobile-first forex trading application targeting active traders with focus on speed, clarity, and confidence-building interactions.

## Design Principles

### 1. Mobile-First Priority
- 60% mobile usage requires touch-optimized interfaces
- Minimum 44px touch targets
- Thumb-reach navigation patterns
- Swipe gestures for common actions

### 2. Speed & Efficiency
- One-tap primary actions
- Minimal cognitive load
- Clear visual hierarchy
- Instant feedback on interactions

### 3. Emotional Design
- Build confidence through clear status indicators
- Reduce anxiety with predictable patterns
- Create urgency with appropriate color coding
- Maintain calm through consistent spacing

## Color System

### Primary Colors
```css
/* Brand Colors */
--primary-blue: #1E40AF;          /* Primary CTAs */
--primary-blue-light: #3B82F6;    /* Hover states */
--primary-blue-dark: #1E3A8A;     /* Active states */

/* Trading Colors */
--profit-green: #10B981;          /* Profit, buy orders */
--profit-green-light: #34D399;    /* Profit backgrounds */
--profit-green-dark: #059669;     /* Profit emphasis */

--loss-red: #EF4444;              /* Loss, sell orders */
--loss-red-light: #F87171;        /* Loss backgrounds */
--loss-red-dark: #DC2626;         /* Loss emphasis */

--pending-yellow: #F59E0B;        /* Pending orders */
--pending-yellow-light: #FBBF24;  /* Pending backgrounds */
--pending-yellow-dark: #D97706;   /* Pending emphasis */

--info-blue: #3B82F6;             /* Information */
--info-blue-light: #60A5FA;       /* Info backgrounds */
--info-blue-dark: #2563EB;        /* Info emphasis */
```

### Neutral Colors (Dark Theme Primary)
```css
/* Dark Theme */
--bg-primary: #0F172A;            /* Main background */
--bg-secondary: #1E293B;          /* Card backgrounds */
--bg-tertiary: #334155;           /* Input backgrounds */

--text-primary: #F8FAFC;          /* Primary text */
--text-secondary: #CBD5E1;        /* Secondary text */
--text-tertiary: #64748B;         /* Tertiary text */

--border-primary: #334155;        /* Primary borders */
--border-secondary: #475569;      /* Secondary borders */
--border-focus: #3B82F6;          /* Focus borders */
```

### Light Theme (Secondary)
```css
/* Light Theme */
--bg-primary-light: #FFFFFF;      /* Main background */
--bg-secondary-light: #F8FAFC;    /* Card backgrounds */
--bg-tertiary-light: #F1F5F9;     /* Input backgrounds */

--text-primary-light: #0F172A;    /* Primary text */
--text-secondary-light: #475569;  /* Secondary text */
--text-tertiary-light: #64748B;   /* Tertiary text */

--border-primary-light: #E2E8F0;  /* Primary borders */
--border-secondary-light: #CBD5E1; /* Secondary borders */
```

## Typography Scale

### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### Mobile-First Scale
```css
/* Display */
--text-4xl: 2.25rem;      /* 36px - Hero headlines */
--text-3xl: 1.875rem;     /* 30px - Page titles */
--text-2xl: 1.5rem;       /* 24px - Section headers */
--text-xl: 1.25rem;       /* 20px - Card titles */
--text-lg: 1.125rem;      /* 18px - Large text */
--text-base: 1rem;        /* 16px - Body text */
--text-sm: 0.875rem;      /* 14px - Secondary text */
--text-xs: 0.75rem;       /* 12px - Captions */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

### Base Scale (4px grid)
```css
--space-0: 0;
--space-1: 0.25rem;       /* 4px */
--space-2: 0.5rem;        /* 8px */
--space-3: 0.75rem;       /* 12px */
--space-4: 1rem;          /* 16px */
--space-5: 1.25rem;       /* 20px */
--space-6: 1.5rem;        /* 24px */
--space-8: 2rem;          /* 32px */
--space-10: 2.5rem;       /* 40px */
--space-12: 3rem;         /* 48px */
--space-16: 4rem;         /* 64px */
--space-20: 5rem;         /* 80px */
```

### Component Spacing
```css
--spacing-component-xs: var(--space-2);    /* 8px - Tight spacing */
--spacing-component-sm: var(--space-4);    /* 16px - Default small */
--spacing-component-md: var(--space-6);    /* 24px - Default medium */
--spacing-component-lg: var(--space-8);    /* 32px - Large spacing */
--spacing-component-xl: var(--space-12);   /* 48px - Section spacing */
```

## Border Radius
```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-full: 9999px;    /* Pill shape */
```

## Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## Component Library

### 1. Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--primary-blue);
  color: var(--text-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  min-height: 44px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-blue-light);
  transform: translateY(-1px);
}

.btn-primary:active {
  background: var(--primary-blue-dark);
  transform: translateY(0);
}
```

#### Trading Action Buttons
```css
.btn-buy {
  background: var(--profit-green);
  color: white;
  /* Same structure as primary */
}

.btn-sell {
  background: var(--loss-red);
  color: white;
  /* Same structure as primary */
}

.btn-cancel {
  background: var(--pending-yellow);
  color: var(--bg-primary);
  /* Same structure as primary */
}
```

#### Button Sizes
```css
.btn-xs { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); min-height: 32px; }
.btn-sm { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); min-height: 36px; }
.btn-md { padding: var(--space-3) var(--space-6); font-size: var(--text-base); min-height: 44px; }
.btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); min-height: 52px; }
```

### 2. Cards

#### Base Card
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-component-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-secondary);
}
```

#### Trade Order Card
```css
.trade-card {
  /* Extends .card */
  position: relative;
  padding: var(--space-4);
}

.trade-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: var(--radius-sm);
  background: var(--profit-green); /* Dynamic based on side */
}

.trade-card--sell::before {
  background: var(--loss-red);
}

.trade-card--pending::before {
  background: var(--pending-yellow);
}
```

### 3. Status Badges

#### Base Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

#### Status Variants
```css
.badge--filled {
  background: rgba(var(--profit-green-rgb), 0.1);
  color: var(--profit-green);
  border: 1px solid rgba(var(--profit-green-rgb), 0.2);
}

.badge--pending {
  background: rgba(var(--pending-yellow-rgb), 0.1);
  color: var(--pending-yellow);
  border: 1px solid rgba(var(--pending-yellow-rgb), 0.2);
}

.badge--cancelled {
  background: rgba(var(--loss-red-rgb), 0.1);
  color: var(--loss-red);
  border: 1px solid rgba(var(--loss-red-rgb), 0.2);
}
```

### 4. Form Components

#### Input Field
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--text-base);
  min-height: 44px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(var(--primary-blue-rgb), 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

#### Select Dropdown
```css
.select {
  /* Extends .input */
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  background-size: 20px;
  padding-right: var(--space-10);
}
```

### 5. Data Display

#### Price Display
```css
.price {
  font-family: var(--font-mono);
  font-weight: var(--font-semibold);
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.price--profit {
  color: var(--profit-green);
}

.price--loss {
  color: var(--loss-red);
}

.price--pending {
  color: var(--pending-yellow);
}
```

#### Profit/Loss Indicator
```css
.pnl {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-weight: var(--font-semibold);
}

.pnl::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.pnl--profit {
  color: var(--profit-green);
}

.pnl--loss {
  color: var(--loss-red);
}
```

### 6. Navigation

#### Bottom Tab Bar (Mobile)
```css
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  padding: var(--space-2) var(--space-4);
  display: flex;
  justify-content: space-around;
  z-index: 50;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  transition: color 0.2s ease;
  min-width: 44px;
  min-height: 44px;
}

.tab--active {
  color: var(--primary-blue);
}

.tab-icon {
  width: 24px;
  height: 24px;
}
```

### 7. Floating Action Button
```css
.fab {
  position: fixed;
  bottom: 80px; /* Above tab bar */
  right: var(--space-4);
  width: 56px;
  height: 56px;
  background: var(--primary-blue);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  z-index: 40;
  transition: all 0.2s ease;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}
```

## Page Layouts

### 1. Dashboard (/trades)

#### Mobile Layout Structure
```
┌─────────────────────┐
│ Header              │
│ ┌─────────────────┐ │
│ │ Portfolio Stats │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Quick Filters   │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Trade List      │ │
│ │ ┌─────────────┐ │ │
│ │ │ Trade Card  │ │ │
│ │ └─────────────┘ │ │
│ │ ┌─────────────┐ │ │
│ │ │ Trade Card  │ │ │
│ │ └─────────────┘ │ │
│ └─────────────────┘ │
│ Tab Bar             │
│ FAB (+)             │
└─────────────────────┘
```

#### Header Component
```css
.header {
  padding: var(--space-4);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.header-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.header-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
```

#### Portfolio Stats Component
```css
.portfolio-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-secondary);
  margin: var(--space-4);
  border-radius: var(--radius-xl);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: var(--space-1);
}
```

#### Quick Filters Component
```css
.quick-filters {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--space-4) var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-chip {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-chip--active {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}
```

### 2. Order Creation (/trades/new)

#### Mobile Layout Structure
```
┌─────────────────────┐
│ Header with Back    │
│ ┌─────────────────┐ │
│ │ Order Type      │ │
│ │ Selector        │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Symbol Selector │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Buy/Sell Toggle │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Order Form      │ │
│ │ Fields          │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Order Preview   │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Submit Button   │ │
│ └─────────────────┘ │
└─────────────────────┘
```

#### Buy/Sell Toggle Component
```css
.order-toggle {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
  margin: var(--space-4);
}

.toggle-option {
  flex: 1;
  padding: var(--space-3);
  text-align: center;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.toggle-option--buy.active {
  background: var(--profit-green);
  color: white;
}

.toggle-option--sell.active {
  background: var(--loss-red);
  color: white;
}
```

## Primary Navigation (Mobile-First)

📱 Bottom Tab Navigation:
├── 🏠 Dashboard (/trades)
├── ➕ New Trade (/trades/new)
├── 📊 Analytics (/analytics)
└── ⚙️ Settings (/settings)

## Component Hierarchy

### TradeCard Component Structure
**Purpose**: Display individual trade information in a card format

**Component Tree**:
```
TradeCard
├── TradeCardHeader
│   ├── TradeSymbol
│   │   ├── SymbolText (BTCUSD, EURUSD, etc.)
│   │   └── StatusBadge (filled, pending, cancelled)
│   └── TradeSide
│       └── SideBadge (BUY/SELL with color coding)
├── TradeCardBody
│   └── TradeDetails
│       ├── DetailRow (Quantity)
│       ├── DetailRow (Price) - conditional
│       └── DetailRow (P&L) - conditional with profit/loss styling
└── TradeCardFooter
    └── TradeTime (formatted creation date)
```

**Data Requirements**:
- Uses `TradeOrderResponseDto` from API
- Dynamic styling based on trade.side (buy/sell)
- Conditional rendering based on trade status
- P&L color coding (green for profit, red for loss)

### OrderForm Component Structure
**Purpose**: Create new trade orders with validation and real-time feedback

**Component Tree**:
```
OrderForm
├── FormGroup (Order Type)
│   ├── FormLabel
│   └── Select (Market, Limit, Stop, Stop-Limit)
├── FormGroup (Symbol)
│   ├── FormLabel
│   └── Select (BTCUSD, EURUSD, ETHUSD)
├── FormGroup (Side)
│   ├── FormLabel
│   └── OrderToggle
│       ├── ToggleOption (BUY) - green when active
│       └── ToggleOption (SELL) - red when active
├── FormGroup (Quantity)
│   ├── FormLabel
│   └── NumberInput (with min/step validation)
├── FormGroup (Price) - conditional for non-market orders
│   ├── FormLabel
│   └── NumberInput
├── FormGroup (Stop Loss) - optional
│   ├── FormLabel
│   └── NumberInput
├── FormGroup (Take Profit) - optional
│   ├── FormLabel
│   └── NumberInput
└── SubmitButton (dynamic styling based on BUY/SELL)
```

**Data Flow**:
- Accepts `CreateTradeOrderRequestDto` structure
- Real-time form validation
- Loading states during submission
- Smart defaults based on order type selection

### PortfolioStats Component Structure
**Purpose**: Display key portfolio metrics in a grid layout

**Component Tree**:
```
PortfolioStats
├── StatItem (Total Orders)
│   ├── StatValue (numeric display)
│   └── StatLabel (descriptive text)
├── StatItem (Active Orders)
│   ├── StatValue
│   └── StatLabel
└── StatItem (Total P&L)
    ├── StatValue (with profit/loss color coding)
    └── StatLabel
```

**Props Interface**:
- totalOrders: number
- activeOrders: number
- totalProfit: number (with dynamic color based on positive/negative)

## User Journey Maps

### Dashboard Page (/trades) - Information Hierarchy

1. 🚨 Critical Alerts Bar (margin calls, system alerts)
2. 📈 Portfolio Summary Cards
   ├── Total P&L (large, color-coded)
   ├── Active Positions Count
   └── Today's Performance
3. 🔍 Quick Filter Pills
   ├── [Active] [Pending] [Closed] [Profitable] [All]
4. 📋 Trade Cards List (prioritized)
   ├── Symbol + Side Badge (BUY/SELL)
   ├── Quantity + Entry Price
   ├── Current P&L (prominent, color-coded)
   ├── Status Badge
   └── Quick Actions (Close/Modify)
5. 📄 Pagination Controls

### New Trade Page (/trades/new) - Form Hierarchy

1. 📍 Header (Back + "New Trade" + Save Draft)
2. 🎯 Trading Pair Selector
   ├── BTCUSD | EURUSD | ETHUSD (tabs)
   ├── Current Market Price Display
3. 📊 Order Configuration
   ├── Order Type Toggle (Market/Limit/Stop/Stop-Limit)
   ├── Side Selection (BUY 🟢 | SELL 🔴)
   ├── Quantity Input (with calculator helper)
   ├── Price Input (conditional, with market reference)
4. 🛡️ Risk Management (Collapsible)
   ├── Stop Loss Input
   ├── Take Profit Input
   ├── Risk/Reward Ratio Display
5. 📊 Order Summary
   ├── Margin Required
   ├── Potential P&L Preview
   ├── Order Validation Status
6. 🚀 Submit Button ("Place Order")

## Complete User Journey Maps

### Journey 1: Morning Trade Review

**User Opens App → Dashboard Loads → Quick P&L Scan → Filter Active Trades → Review Individual Positions → Take Action (Close/Modify)**

**Key Touchpoints**:
• Fast load (<2s) with skeleton screens
• Immediate P&L visibility with color coding
• One-tap filtering for active positions
• Swipe actions for quick trade management
• Clear confirmation dialogs for actions

### Journey 2: New Trade Creation

**Spot Opportunity → Access New Trade → Select Symbol → Configure Order → Set Risk Parameters → Review & Submit → Confirmation**

**Key Touchpoints**:
• Floating Action Button for quick access
• Symbol tabs with current prices
• Smart defaults based on user history
• Real-time validation with helpful errors
• Clear success state with order ID

## Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) {
  /* Tablet adjustments */
  .container { max-width: 640px; }
  .grid-cols-mobile { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  /* Desktop adjustments */
  .container { max-width: 1024px; }
  .grid-cols-mobile { grid-template-columns: repeat(4, 1fr); }
  
  /* Show sidebar navigation */
  .sidebar { display: block; }
  .tab-bar { display: none; }
  .fab { bottom: var(--space-4); }
}
```

## State Management

### Loading States
```css
.skeleton {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1em;
  margin-bottom: var(--space-2);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}
```

### Error States
```css
.error-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--text-secondary);
}

.error-icon {
  width: 48px;
  height: 48px;
  color: var(--loss-red);
  margin: 0 auto var(--space-4);
}

.error-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.error-message {
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}
```

### Empty States
```css
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-4);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
  margin: 0 auto var(--space-4);
}

.empty-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}
```

## API Integration Types

### TypeScript Interfaces
```typescript
// API Response Types
export interface TradeOrderResponseDto {
  id: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  filledAt?: string;
  filledPrice?: number;
  filledQuantity?: number;
  commission: number;
  swap: number;
  profit?: number;
  accountId: string;
  userId: string;
  isActive: boolean;
  isClosed: boolean;
}

export interface PaginatedTradeOrdersResponseDto {
  orders: TradeOrderResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateTradeOrderRequestDto {
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  accountId: string;
  userId: string;
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}
```

## Backend API Integration

### Available Endpoints

**Base URL**: `http://localhost:3000`

The backend provides a fully implemented REST API with the following endpoints:

#### 1. GET /trade-orders
- **Purpose**: Retrieve paginated list of trade orders with filtering
- **Method**: GET
- **Authentication**: Bearer JWT token required
- **Query Parameters**: Extensive filtering and pagination options
- **Response**: `PaginatedTradeOrdersResponseDto`

#### 2. POST /trade-orders  
- **Purpose**: Create new trade order with validation
- **Method**: POST
- **Authentication**: Bearer JWT token required
- **Request Body**: `CreateTradeOrderRequestDto`
- **Response**: `TradeOrderResponseDto` (201 status)

#### 3. GET /trade-orders/{id}
- **Purpose**: Retrieve specific trade order by ID
- **Method**: GET
- **Authentication**: Bearer JWT token required
- **Path Parameter**: Order UUID
- **Response**: `TradeOrderResponseDto`

### API Schema Mapping

#### CreateTradeOrderRequestDto (POST /trade-orders)
```typescript
interface CreateTradeOrderRequestDto {
  symbol: 'BTCUSD' | 'EURUSD' | 'ETHUSD';           // Required
  type: 'market' | 'limit' | 'stop' | 'stop_limit';   // Required
  side: 'buy' | 'sell';                                // Required
  quantity: number;                                    // Required, min: 0.01
  price?: number;                                      // Optional, required for non-market orders
  stopLoss?: number;                                   // Optional
  takeProfit?: number;                                 // Optional  
  accountId: string;                                   // Required UUID
  userId: string;                                      // Required UUID
}
```

#### TradeOrderResponseDto (Response from all endpoints)
```typescript
interface TradeOrderResponseDto {
  // Core Order Info
  id: string;                                          // UUID
  symbol: string;                                      // e.g., "EUR/USD"
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  
  // Pricing (optional fields)
  price?: number;                                      // For limit/stop orders
  stopLoss?: number;
  takeProfit?: number;
  
  // Execution Status
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
  filledAt?: string;                                   // ISO timestamp
  filledPrice?: number;                                // Actual execution price
  filledQuantity?: number;                             // Amount filled
  
  // Timestamps
  createdAt: string;                                   // ISO timestamp
  updatedAt: string;                                   // ISO timestamp
  
  // Financial Info
  commission: number;                                  // Trading fees
  swap: number;                                        // Overnight fees
  profit?: number;                                     // Realized P&L
  
  // Ownership
  accountId: string;                                   // UUID
  userId: string;                                      // UUID
  
  // Computed Status
  isActive: boolean;                                   // Derived from status
  isClosed: boolean;                                   // Derived from status
}
```

#### PaginatedTradeOrdersResponseDto (GET /trade-orders response)
```typescript
interface PaginatedTradeOrdersResponseDto {
  orders: TradeOrderResponseDto[];                     // Array of orders
  total: number;                                       // Total matching records
  page: number;                                        // Current page (1-based)
  pageSize: number;                                    // Items per page
  totalPages: number;                                  // Total available pages
  hasNext: boolean;                                    // More pages available
  hasPrevious: boolean;                                // Previous pages exist
}
```

### GET /trade-orders Query Parameters

**Filtering Options**:
- `status[]`: Filter by order status (array)
- `symbol[]`: Filter by trading pairs (array) 
- `accountId`: Filter by account UUID
- `userId`: Filter by user UUID
- `dateFrom`: Filter orders after date (ISO string)
- `dateTo`: Filter orders before date (ISO string)
- `minProfit`: Minimum profit filter
- `maxProfit`: Maximum profit filter
- `minQuantity`: Minimum quantity filter
- `maxQuantity`: Maximum quantity filter

**Pagination**:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 50, max: 200)

**Sorting**:
- `sortBy`: Field to sort by (default: 'createdAt')
  - Options: 'id', 'symbol', 'createdAt', 'updatedAt', 'filledAt', 'status', 'quantity', 'price', 'profit'
- `sortOrder`: 'ASC' | 'DESC' (default: 'DESC')

### Angular Service Integration

**TradeOrderService Implementation**:
```typescript
@Injectable({ providedIn: 'root' })
export class TradeOrderService {
  private readonly baseUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  // GET /trade-orders
  getTradeOrders(params?: GetTradeOrdersParams): Observable<PaginatedTradeOrdersResponseDto> {
    const queryParams = new HttpParams({ fromObject: params as any });
    return this.http.get<PaginatedTradeOrdersResponseDto>(
      `${this.baseUrl}/trade-orders`,
      { params: queryParams }
    );
  }

  // POST /trade-orders  
  createTradeOrder(order: CreateTradeOrderRequestDto): Observable<TradeOrderResponseDto> {
    return this.http.post<TradeOrderResponseDto>(
      `${this.baseUrl}/trade-orders`,
      order
    );
  }

  // GET /trade-orders/{id}
  getTradeOrder(id: string): Observable<TradeOrderResponseDto> {
    return this.http.get<TradeOrderResponseDto>(
      `${this.baseUrl}/trade-orders/${id}`
    );
  }
}
```

### Error Handling

**HTTP Status Codes**:
- **200**: Success (GET requests)
- **201**: Created (POST success)
- **400**: Bad Request (validation errors)
- **404**: Not Found (invalid order ID)
- **409**: Conflict (unsupported symbol/price conflicts)
- **500**: Internal Server Error

**Error Response Format**:
```typescript
interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Authentication

All endpoints require Bearer token authentication:
```typescript
// Add to HttpClient interceptor
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Usage Examples

**Fetch Recent Orders**:
```typescript
const recentOrders$ = this.tradeOrderService.getTradeOrders({
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});
```

**Create Market Order**:
```typescript
const newOrder: CreateTradeOrderRequestDto = {
  symbol: 'BTCUSD',
  type: 'market',
  side: 'buy',
  quantity: 1.0,
  accountId: 'acc-uuid',
  userId: 'user-uuid'
};

const order$ = this.tradeOrderService.createTradeOrder(newOrder);
```

**Filter Active Orders**:
```typescript
const activeOrders$ = this.tradeOrderService.getTradeOrders({
  status: ['pending', 'partially_filled'],
  page: 1,
  pageSize: 50
});
```

## Accessibility

### Focus Management
```css
.focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-blue);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}
```

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Micro-Interactions

### Button Interactions
```css
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.btn:active {
  animation: button-press 0.1s ease;
}
```

### Card Interactions
```css
@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter {
  animation: card-appear 0.3s ease;
}
```

### Success Feedback
```css
@keyframes success-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.success-feedback {
  animation: success-pulse 0.3s ease;
  background: var(--profit-green);
  color: white;
}
```

## Implementation Guidelines

### CSS Architecture
1. Use CSS custom properties for theming
2. Follow BEM naming convention
3. Mobile-first media queries
4. Component-based organization
5. Utility classes for spacing/sizing

### Performance Optimization
1. Lazy load images and heavy components
2. Use CSS transforms for animations
3. Minimize reflows with absolute positioning
4. Optimize font loading with font-display: swap
5. Use will-change for animated elements

### Browser Support
- iOS Safari 14+
- Chrome 90+
- Firefox 88+
- Samsung Internet 14+

### Development Workflow
1. Build components in isolation
2. Test on real devices
3. Validate touch targets (minimum 44px)
4. Test with screen readers
5. Verify color contrast ratios (4.5:1 minimum)

### Technology Stack Recommendations
- **Framework**: Angular 18+ with TypeScript (standalone components)
- **Styling**: Tailwind CSS with custom design tokens + Angular Material CDK
- **State Management**: Angular Signals for local state, NgRx Signal Store for global state
- **HTTP Client**: Angular HttpClient with interceptors for error handling
- **Icons**: Angular Material Icons or Lucide Angular
- **Animations**: Angular Animations API with @angular/animations
- **Build Tool**: Angular CLI with Vite (default in Angular 17+)
- **Testing**: Jest + Angular Testing Library + Cypress for e2e
- **Forms**: Angular Reactive Forms with typed FormControl
- **Routing**: Angular Router with lazy loading and route guards
- **PWA**: Angular Service Worker for offline capabilities
- **Performance**: OnPush change detection, NgOptimizedImage, lazy loading modules

This comprehensive frontend implementation guide provides everything needed to build a professional, mobile-first forex trading application that meets the needs of active traders while maintaining accessibility and performance standards.
