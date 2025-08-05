# TradeOrderService Usage Guide

## Overview

The `TradeOrderService` is a comprehensive Angular service that provides full API integration for managing trade orders. It implements all three required endpoints with advanced features like caching, filtering, pagination, and portfolio analytics.

## Service Features

### ✅ Complete API Integration
- **GET** `/trade-orders` - Fetch orders with filtering, pagination, and sorting
- **POST** `/trade-orders` - Create new trade orders with validation
- **GET** `/trade-orders/{id}` - Get specific order details

### ✅ Advanced Functionality
- Reactive state management with RxJS observables
- Comprehensive query parameter building
- Client-side caching for improved performance
- Portfolio statistics calculation
- Input validation and error handling
- Mobile-optimized API calls

### ✅ Type Safety
- Full TypeScript integration with existing interfaces
- No `any` types used
- Comprehensive error typing

## Quick Start

### 1. Import and Inject

```typescript
import { Component, inject } from '@angular/core';
import { TradeOrderService } from '@/core/services';

@Component({...})
export class MyComponent {
  private readonly tradeOrderService = inject(TradeOrderService);
}
```

### 2. Basic Usage

```typescript
// Fetch recent orders
this.tradeOrderService.getTradeOrders({ 
  page: 1, 
  pageSize: 50,
  sortBy: 'createdAt',
  sortOrder: 'DESC' 
}).subscribe(response => {
  console.log('Orders:', response.orders);
  console.log('Total:', response.total);
});

// Create a new order
const orderData: CreateTradeOrderRequestDto = {
  symbol: 'BTCUSD',
  type: OrderType.MARKET,
  side: OrderSide.BUY,
  quantity: 1.0,
  accountId: 'account-uuid',
  userId: 'user-uuid'
};

this.tradeOrderService.createTradeOrder(orderData).subscribe(order => {
  console.log('Order created:', order.id);
});
```

## API Methods

### `getTradeOrders(params?: GetTradeOrdersParams)`

Fetch paginated orders with comprehensive filtering options.

**Parameters:**
```typescript
interface GetTradeOrdersParams {
  // Filtering
  status?: OrderStatus[];           // ['pending', 'filled', etc.]
  symbol?: TradingSymbol[];         // ['BTCUSD', 'EURUSD', etc.]
  accountId?: string;               // Account UUID
  userId?: string;                  // User UUID
  dateFrom?: string;                // ISO date string
  dateTo?: string;                  // ISO date string
  minProfit?: number;               // Minimum profit filter
  maxProfit?: number;               // Maximum profit filter
  minQuantity?: number;             // Minimum quantity
  maxQuantity?: number;             // Maximum quantity
  
  // Pagination
  page?: number;                    // Default: 1
  pageSize?: number;                // Default: 50, max: 200
  
  // Sorting
  sortBy?: SortField;               // Default: 'createdAt'
  sortOrder?: 'ASC' | 'DESC';       // Default: 'DESC'
}
```

**Example Usage:**
```typescript
// Advanced filtering
const params: GetTradeOrdersParams = {
  status: [OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED],
  symbol: ['BTCUSD'],
  dateFrom: '2025-01-01T00:00:00Z',
  dateTo: '2025-01-31T23:59:59Z',
  minProfit: -100,
  maxProfit: 1000,
  page: 1,
  pageSize: 25,
  sortBy: 'profit',
  sortOrder: 'DESC'
};

this.tradeOrderService.getTradeOrders(params).subscribe(response => {
  // Handle paginated response
  console.log(`Page ${response.page} of ${response.totalPages}`);
  console.log(`${response.orders.length} orders of ${response.total} total`);
});
```

### `getTradeOrderById(orderId: string)`

Fetch a specific order by its unique identifier.

```typescript
this.tradeOrderService.getTradeOrderById('order-uuid').subscribe({
  next: (order) => {
    console.log('Order details:', order);
  },
  error: (error) => {
    // Handle 404 or other errors
    console.error('Order not found:', error);
  }
});
```

### `createTradeOrder(orderData: CreateTradeOrderRequestDto)`

Create a new trade order with comprehensive validation.

**Order Data:**
```typescript
interface CreateTradeOrderRequestDto {
  symbol: TradingSymbol;            // 'BTCUSD' | 'EURUSD' | 'ETHUSD'
  type: OrderType;                  // 'market' | 'limit' | 'stop' | 'stop_limit'
  side: OrderSide;                  // 'buy' | 'sell'
  quantity: number;                 // Min: 0.01
  price?: number;                   // Required for non-market orders
  stopLoss?: number;                // Optional
  takeProfit?: number;              // Optional
  accountId: string;                // UUID
  userId: string;                   // UUID
}
```

**Validation Rules:**
- Quantity must be >= 0.01
- Price required for limit/stop orders
- Stop loss must be logical relative to entry price
- Take profit must be logical relative to entry price

**Example:**
```typescript
// Market order
const marketOrder: CreateTradeOrderRequestDto = {
  symbol: 'BTCUSD',
  type: OrderType.MARKET,
  side: OrderSide.BUY,
  quantity: 0.5,
  accountId: this.currentAccountId,
  userId: this.currentUserId
};

// Limit order with stop loss and take profit
const limitOrder: CreateTradeOrderRequestDto = {
  symbol: 'EURUSD',
  type: OrderType.LIMIT,
  side: OrderSide.SELL,
  quantity: 10000,
  price: 1.1000,
  stopLoss: 1.1050,     // Above entry for sell
  takeProfit: 1.0950,   // Below entry for sell
  accountId: this.currentAccountId,
  userId: this.currentUserId
};

this.tradeOrderService.createTradeOrder(limitOrder).subscribe({
  next: (order) => {
    console.log('Order created:', order.id);
    // Order automatically added to cache
  },
  error: (error) => {
    console.error('Validation failed:', error.message);
  }
});
```

## Cache and State Management

### Observable Streams

```typescript
// Subscribe to orders updates
this.tradeOrderService.orders$.subscribe(orders => {
  console.log('Orders updated:', orders.length);
});

// Subscribe to portfolio statistics
this.tradeOrderService.portfolioStats$.subscribe(stats => {
  if (stats) {
    console.log('Total P&L:', stats.totalProfitLoss);
    console.log('Win Rate:', stats.winRate);
    console.log('Active Orders:', stats.activeOrders);
  }
});
```

### Cache Methods

```typescript
// Get cached data without API calls
const cachedOrders = this.tradeOrderService.getCachedOrders();
const activeOrders = this.tradeOrderService.getActiveOrders();
const closedOrders = this.tradeOrderService.getClosedOrders();

// Filter cached data
const btcOrders = this.tradeOrderService.getOrdersBySymbol('BTCUSD');
const pendingOrders = this.tradeOrderService.getOrdersByStatus(OrderStatus.PENDING);
const recentOrders = this.tradeOrderService.getRecentOrders(); // Last 24h

// Custom filtering
const profitableOrders = this.tradeOrderService.getFilteredCachedOrders(
  order => order.profit !== undefined && order.profit > 0
);

// Refresh data
this.tradeOrderService.refreshOrders().subscribe();

// Clear cache
this.tradeOrderService.clearCache();
```

## Error Handling

The service integrates with the existing HTTP error interceptor for consistent error handling:

```typescript
this.tradeOrderService.createTradeOrder(orderData).subscribe({
  next: (order) => {
    // Success
  },
  error: (error) => {
    // Error object has enhanced properties:
    console.log('User message:', error.message);
    console.log('Technical message:', error.technicalMessage);
    console.log('HTTP status:', error.status);
    console.log('Original error:', error.originalError);
  }
});
```

**Common Error Scenarios:**
- **400 Bad Request**: Validation errors, invalid parameters
- **404 Not Found**: Order ID doesn't exist
- **409 Conflict**: Unsupported symbol, price conflicts
- **500 Internal Server Error**: Server-side issues

## Real-World Usage Examples

### 1. Dashboard Component

```typescript
@Component({...})
export class DashboardComponent implements OnInit {
  private readonly tradeOrderService = inject(TradeOrderService);
  
  portfolioStats = signal<PortfolioStats | null>(null);
  recentOrders = signal<TradeOrderResponseDto[]>([]);

  ngOnInit() {
    // Load initial data
    this.tradeOrderService.getTradeOrders({ 
      page: 1, 
      pageSize: 10 
    }).subscribe();
    
    // Subscribe to updates
    this.tradeOrderService.portfolioStats$.subscribe(stats => {
      this.portfolioStats.set(stats);
    });
    
    this.tradeOrderService.orders$.subscribe(orders => {
      this.recentOrders.set(orders.slice(0, 10));
    });
  }
}
```

### 2. Order Form Component

```typescript
@Component({...})
export class OrderFormComponent {
  private readonly tradeOrderService = inject(TradeOrderService);
  
  isSubmitting = signal(false);
  validationErrors = signal<string[]>([]);

  onSubmit(formData: OrderFormData) {
    this.isSubmitting.set(true);
    this.validationErrors.set([]);
    
    const orderData: CreateTradeOrderRequestDto = {
      ...formData,
      accountId: this.authService.currentAccountId(),
      userId: this.authService.currentUserId()
    };
    
    this.tradeOrderService.createTradeOrder(orderData).subscribe({
      next: (order) => {
        this.isSubmitting.set(false);
        this.notificationService.success('Order created successfully');
        this.router.navigate(['/orders', order.id]);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.validationErrors.set([error.message]);
      }
    });
  }
}
```

### 3. Orders List with Filtering

```typescript
@Component({...})
export class OrdersListComponent {
  private readonly tradeOrderService = inject(TradeOrderService);
  
  orders = signal<TradeOrderResponseDto[]>([]);
  currentFilters = signal<GetTradeOrdersParams>({});
  pagination = signal<any>(null);
  
  onFiltersChange(newFilters: GetTradeOrdersParams) {
    this.currentFilters.set(newFilters);
    this.loadOrders();
  }
  
  onPageChange(page: number) {
    const filters = { ...this.currentFilters(), page };
    this.loadOrders(filters);
  }
  
  private loadOrders(params = this.currentFilters()) {
    this.tradeOrderService.getTradeOrders(params).subscribe(response => {
      this.orders.set(response.orders);
      this.pagination.set({
        page: response.page,
        totalPages: response.totalPages,
        total: response.total,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious
      });
    });
  }
}
```

## Performance Considerations

### Mobile Optimization
- Intelligent caching reduces API calls
- Pagination limits data transfer
- Query parameters are optimized for mobile networks

### Memory Management
- Observable subscriptions should use `takeUntil` pattern
- Cache is automatically managed
- Clear cache when appropriate

```typescript
export class MyComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.tradeOrderService.orders$
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        // Handle orders
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Testing

The service includes comprehensive unit tests covering:

- Service instantiation and dependency injection
- HTTP request/response handling
- Data validation and error scenarios
- Cache management
- Observable streams
- Portfolio statistics calculation

Run tests with:
```bash
pnpm ng test --include="**/trade-order.service.spec.ts"
```

## Next Steps

The TradeOrderService is now ready for use in:

1. **Phase 4**: Dashboard implementation
2. **Phase 5**: Order form with validation  
3. **Phase 6**: Angular Signals state management

All components can now inject and use this service for complete trade order management functionality.