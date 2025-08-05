# Trade FX Replay Frontend

A modern, mobile-first Angular trading application for managing forex, crypto, and commodity orders with real-time portfolio tracking and comprehensive order management.

![Angular](https://img.shields.io/badge/Angular-20.1.4-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![PNPM](https://img.shields.io/badge/PNPM-9.15-orange?logo=pnpm)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

### Trading Core
- **Multi-Asset Support**: Trade FOREX (EUR/USD, GBP/USD), Crypto (BTC/USD, ETH/USD), and Commodities
- **Order Types**: Market, Limit, Stop, and Stop-Limit orders
- **Risk Management**: Stop Loss and Take Profit levels
- **Real-time P&L**: Live profit/loss tracking with percentage calculations
- **Order Management**: Modify, close, and duplicate existing orders

### User Experience
- **Mobile-First Design**: Optimized for touch interfaces with 44px minimum touch targets
- **Dark Theme**: Professional trading interface with carefully chosen color palette
- **Responsive Layout**: Seamless experience across mobile, tablet, and desktop
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support

### Technical Excellence
- **Angular Signals**: Modern reactive state management
- **Standalone Components**: No NgModules, fully modular architecture
- **TypeScript Strict Mode**: Type-safe development with comprehensive interfaces
- **Performance Optimized**: OnPush change detection and lazy loading

## 🎨 Design System

### Color Palette
```scss
// Trading Colors
--profit-green: #10B981;    // Buy orders, profits
--loss-red: #EF4444;        // Sell orders, losses  
--pending-yellow: #F59E0B;  // Pending orders
--info-blue: #3B82F6;       // Information states

// Dark Theme
--primary-bg: #0F172A;      // Main background
--secondary-bg: #1E293B;    // Cards and containers
--tertiary-bg: #334155;     // Inputs and interactive elements
--primary-text: #F8FAFC;    // Main text
--secondary-text: #CBD5E1;  // Secondary text
--tertiary-text: #64748B;   // Subtle text
```

### Typography
- **UI Font**: Inter (system fallback)
- **Price Font**: JetBrains Mono (monospace for precision)
- **Scale**: 16px base, 1.5 line height
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 📱 Application Structure

### Pages & Routes
```
/                           # Dashboard redirect
/trades                     # Trade list with filters and portfolio stats
/trades/new                 # Create new trade order
/trades/:id                 # Individual trade order details
/analytics                  # Portfolio analytics (planned)
/settings                   # Application settings (planned)
```

### Component Architecture
```
src/app/
├── core/                   # Core services and models
│   ├── models/            # TypeScript interfaces
│   └── services/          # API and business logic services
├── shared/                # Reusable components
│   └── components/        # UI components (Button, Card, Badge, etc.)
├── features/              # Feature-specific components
│   ├── dashboard/         # Main trading dashboard
│   ├── trade-detail/      # Individual trade order details
│   └── order-form/        # New order creation (planned)
└── layouts/               # Application layouts
```

## 🛠️ Development

### Prerequisites
- **Node.js**: 18.19+ or 20.9+
- **PNPM**: 9.15+ (preferred package manager)
- **Angular CLI**: 20.1.4

### Installation
```bash
# Clone the repository
git clone git@github.com:arbadev/trade-fxreplay-frontend.git
cd trade-fxreplay-frontend

# Install dependencies
pnpm install
```

### Development Server
```bash
# Start development server
pnpm start
# or
pnpm ng serve

# Server runs on http://localhost:4200
# Auto-reloads on file changes
```

### Build Commands
```bash
# Development build with watch mode
pnpm run watch

# Production build
pnpm run build

# Production build artifacts in dist/
```

### Testing
```bash
# Run unit tests with Karma
pnpm test

# Run tests in watch mode
pnpm run test:watch
```

### Code Generation
```bash
# Generate new component
pnpm ng generate component component-name

# Generate new service  
pnpm ng generate service service-name

# See all available schematics
pnpm ng generate --help
```

## 🏗️ Architecture

### State Management
- **Angular Signals**: Reactive state with computed properties
- **Services**: Injectable services for API communication and business logic
- **Local State**: Component-level state for UI interactions

### API Integration
```typescript
// Base API URL
const API_BASE = 'http://localhost:3000';

// Available endpoints
GET  /trade-orders           # Paginated trade orders with filtering
POST /trade-orders           # Create new trade order  
GET  /trade-orders/{id}      # Get specific trade order
```

### Data Models
```typescript
interface TradeOrderResponseDto {
  id: string;
  symbol: 'BTCUSD' | 'EURUSD' | 'ETHUSD' | string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected' | 'expired';
  profit?: number;
  commission: number;
  swap: number;
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  // ... additional fields
}
```

## 📊 Features Deep Dive

### Trade Dashboard
- **Portfolio Stats**: Total orders, active positions, net P&L
- **Quick Filters**: Status-based filtering (Active, Filled, Cancelled)
- **Trade Cards**: Comprehensive order information with status indicators
- **Real-time Updates**: Live P&L calculations and status changes

### Trade Detail Page
- **Comprehensive View**: All order details including risk management
- **Status Timeline**: Visual timeline of order events
- **Action Buttons**: Conditional actions based on order status
- **Professional Formatting**: Precise price display with proper decimal places

### Order Management
- **Multi-Asset Trading**: Support for FOREX, Crypto, and Commodities
- **Risk Controls**: Mandatory stop-loss and optional take-profit levels
- **Order Validation**: Client-side validation with server-side confirmation
- **Position Sizing**: Flexible quantity input with unit validation

## 🎯 Performance

### Bundle Size Limits
- **Initial Bundle**: 500kB warning, 1MB error
- **Component Styles**: 4kB warning, 8kB error
- **Assets**: Optimized images and fonts

### Optimization Strategies
- **OnPush Change Detection**: Minimizes unnecessary re-renders
- **Lazy Loading**: Features loaded on demand
- **Tree Shaking**: Dead code elimination
- **AOT Compilation**: Ahead-of-time compilation for production

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Comprehensive ARIA labels and roles
- **Focus Management**: Visible focus indicators and logical tab order

### Mobile Accessibility
- **Touch Targets**: Minimum 44px for all interactive elements
- **Gesture Support**: Swipe actions where appropriate
- **Viewport Optimization**: Proper scaling and zoom behavior

## 🔧 Configuration

### Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  // Add environment-specific settings
};
```

### Angular Configuration
```json
// angular.json
{
  "projects": {
    "trade-fxreplay-frontend": {
      "architect": {
        "build": {
          "options": {
            "budgets": [
              {
                "type": "initial",
                "maximumWarning": "500kB",
                "maximumError": "1MB"
              }
            ]
          }
        }
      }
    }
  }
}
```

## 📈 Future Roadmap

### Phase 1 (Current)
- ✅ Trade dashboard with portfolio stats
- ✅ Trade detail page with comprehensive order information
- ✅ Mobile-first responsive design
- ✅ Dark theme implementation

### Phase 2 (Planned)
- 🔄 Order creation form with validation
- 🔄 Real-time price feeds integration
- 🔄 Advanced filtering and search
- 🔄 Order modification interface

### Phase 3 (Future)
- 📊 Analytics dashboard with charts
- 📱 Progressive Web App (PWA) features
- 🔔 Push notifications for order updates
- 📤 Data export capabilities

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled, full type coverage
- **Angular**: Standalone components, OnPush change detection
- **SCSS**: Component-scoped styles, CSS custom properties
- **Accessibility**: WCAG 2.1 AA compliance required

### Commit Convention
```
feat: add new trading feature
fix: resolve order calculation bug
docs: update API documentation
style: format code with prettier
refactor: simplify order service logic
test: add unit tests for trade component
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

### Documentation
- **CLAUDE.md**: Project-specific instructions and conventions
- **Component Documentation**: Inline JSDoc comments
- **API Documentation**: OpenAPI/Swagger specifications (planned)

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/arbadev/trade-fxreplay-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/arbadev/trade-fxreplay-frontend/discussions)

---

**Built with ❤️ using Angular 20.1.4 and modern web technologies**