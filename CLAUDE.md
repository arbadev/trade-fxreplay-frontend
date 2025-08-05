# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Angular 20.1.4 application called `trade-fxreplay-frontend` that uses:
- **Package Manager**: pnpm (configured in angular.json)
- **Component Architecture**: Standalone components (modern Angular approach)
- **State Management**: Angular Signals for reactive state
- **Styling**: SCSS with component-level styles
- **Routing**: Angular Router enabled
- **Testing**: Karma + Jasmine for unit tests

## Key Commands

### Development
```bash
pnpm start                    # Start development server (ng serve)
pnpm run build               # Production build
pnpm run watch               # Development build with watch mode
pnpm test                    # Run unit tests with Karma
```

### Angular CLI Commands
```bash
pnpm ng generate component <name>    # Generate new component
pnpm ng generate service <name>      # Generate new service
pnpm ng generate --help              # List all available schematics
```

## Architecture

### Application Bootstrap
- **Entry Point**: `src/main.ts` bootstraps the app using `bootstrapApplication()`
- **App Configuration**: `src/app/app.config.ts` provides application-wide configuration
- **Root Component**: `src/app/app.ts` uses standalone component architecture

### Component Structure
- Components use standalone imports (no NgModules)
- Template files are separate (`.html`) rather than inline
- SCSS styling is configured by default for all components
- Signal-based reactive state (e.g., `protected readonly title = signal('...')`)

### TypeScript Configuration
- **Strict Mode**: Full TypeScript strict mode enabled
- **Angular Compiler**: Strict templates and injection parameters
- **Target**: ES2022 with module preservation
- **Isolated Modules**: Enabled for better performance

### Build Configuration
- **Production Bundle Limits**: 500kB warning, 1MB error for initial bundle
- **Component Styles**: 4kB warning, 8kB error per component
- **Assets**: Located in `public/` directory
- **Global Styles**: `src/styles.scss`

## Development Notes

### Component Generation
New components are automatically configured to use SCSS styling due to the schematics configuration in `angular.json`.

### Testing
- Unit tests use Karma with Jasmine
- Test configuration in `tsconfig.spec.json`
- Zone.js testing utilities are automatically included

### Prettier Configuration
HTML files use Angular parser for proper formatting.

## Design System

### Color Palette
This application follows a mobile-first forex trading design system with the following color scheme:

#### Primary Colors
- **Brand Blue**: `#1E40AF` (primary CTAs)
- **Profit Green**: `#10B981` (buy orders, profits)
- **Loss Red**: `#EF4444` (sell orders, losses)
- **Pending Yellow**: `#F59E0B` (pending orders)
- **Info Blue**: `#3B82F6` (information states)

#### Dark Theme (Primary)
- **Primary Background**: `#0F172A`
- **Secondary Background**: `#1E293B` (cards)
- **Tertiary Background**: `#334155` (inputs)
- **Primary Text**: `#F8FAFC`
- **Secondary Text**: `#CBD5E1`
- **Tertiary Text**: `#64748B`

### Typography
- **Font Stack**: Inter for UI, JetBrains Mono for prices/numbers
- **Scale**: Mobile-first with 16px base, 1.5 line height
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing System
Based on 4px grid system:
- **Component spacing**: 8px (xs), 16px (sm), 24px (md), 32px (lg), 48px (xl)
- **Touch targets**: Minimum 44px for mobile accessibility

## Component Architecture

### Core Components

#### TradeCard
**Purpose**: Display individual trade information
```
TradeCard
├── TradeCardHeader (symbol, status badge)
├── TradeCardBody (quantity, price, P&L)
└── TradeCardFooter (timestamp)
```

#### OrderForm
**Purpose**: Create new trade orders
```
OrderForm
├── FormGroup (Order Type: Market/Limit/Stop)
├── FormGroup (Symbol: BTCUSD/EURUSD/ETHUSD)
├── OrderToggle (BUY/SELL with color coding)
├── FormGroup (Quantity with validation)
├── FormGroup (Price - conditional)
└── SubmitButton (dynamic styling)
```

#### PortfolioStats
**Purpose**: Display portfolio metrics
```
PortfolioStats
├── StatItem (Total Orders)
├── StatItem (Active Orders)
└── StatItem (Total P&L with color coding)
```

### Component Guidelines
- Use standalone components (no NgModules)
- Implement OnPush change detection for performance
- Use Angular Signals for reactive state
- Separate template files (.html) with SCSS styling
- Include accessibility attributes (ARIA labels, roles)

## API Integration

### Backend Endpoints
**Base URL**: `http://localhost:3000`

#### Available Endpoints
1. **GET /trade-orders** - Paginated trade orders with filtering
2. **POST /trade-orders** - Create new trade order
3. **GET /trade-orders/{id}** - Get specific trade order

### TypeScript Interfaces

#### Core Types
```typescript
export interface TradeOrderResponseDto {
  id: string;
  symbol: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
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

export interface CreateTradeOrderRequestDto {
  symbol: 'BTCUSD' | 'EURUSD' | 'ETHUSD';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  accountId: string;
  userId: string;
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
```

### Service Implementation
```typescript
@Injectable({ providedIn: 'root' })
export class TradeOrderService {
  private readonly baseUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  getTradeOrders(params?: GetTradeOrdersParams): Observable<PaginatedTradeOrdersResponseDto> {
    const queryParams = new HttpParams({ fromObject: params as any });
    return this.http.get<PaginatedTradeOrdersResponseDto>(
      `${this.baseUrl}/trade-orders`,
      { params: queryParams }
    );
  }

  createTradeOrder(order: CreateTradeOrderRequestDto): Observable<TradeOrderResponseDto> {
    return this.http.post<TradeOrderResponseDto>(
      `${this.baseUrl}/trade-orders`,
      order
    );
  }

  getTradeOrder(id: string): Observable<TradeOrderResponseDto> {
    return this.http.get<TradeOrderResponseDto>(
      `${this.baseUrl}/trade-orders/${id}`
    );
  }
}
```

## Mobile-First Development

### Design Principles
1. **Touch-First**: 44px minimum touch targets
2. **Thumb Navigation**: Bottom tab bar for primary navigation
3. **Speed**: One-tap primary actions, minimal cognitive load
4. **Clarity**: Clear visual hierarchy with status color coding

### Navigation Structure
```
Bottom Tab Navigation:
├── 🏠 Dashboard (/trades)
├── ➕ New Trade (/trades/new)
├── 📊 Analytics (/analytics)
└── ⚙️ Settings (/settings)
```

### Responsive Breakpoints
- **Mobile**: < 640px (primary target)
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px (sidebar navigation replaces tabs)

## Performance & Accessibility

### Performance Requirements
- Initial bundle: < 500kB warning, < 1MB error
- Component styles: < 4kB warning, < 8kB error
- Load time: < 2 seconds on 3G networks

### Accessibility Standards
- WCAG 2.1 AA compliance
- Minimum 4.5:1 color contrast ratio
- Full keyboard navigation support
- Screen reader compatibility
- Focus visible indicators

### State Management
- Use Angular Signals for component state
- Loading states with skeleton screens
- Error states with retry options
- Empty states with helpful guidance

## User Experience Guidelines

### Trade Card Interactions
- Color-coded left border (green=buy, red=sell, yellow=pending)
- P&L display with profit/loss color coding
- Status badges with clear visual hierarchy
- Swipe actions for quick management

### Form Validation
- Real-time validation feedback
- Clear error messages
- Smart defaults based on order type
- Loading states during submission

### Emotional Design
- Build confidence through clear status indicators
- Reduce anxiety with predictable patterns
- Create appropriate urgency with color coding
- Maintain calm through consistent spacing