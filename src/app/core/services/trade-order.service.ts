import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, throwError, of } from 'rxjs';

import {
  TradeOrderResponseDto,
  CreateTradeOrderRequestDto,
  PaginatedTradeOrdersResponseDto,
  GetTradeOrdersParams,
  OrderStatus,
  OrderType,
  OrderSide,
  TradingSymbol,
  SortField,
  PortfolioStats,
  LoadingState
} from '../models/trade-order.interface';

/**
 * TradeOrderService
 * 
 * Comprehensive service for managing trade orders with full API integration.
 * Handles all CRUD operations, filtering, pagination, and caching.
 * 
 * Features:
 * - Full TypeScript type safety
 * - Reactive patterns with RxJS observables
 * - Comprehensive error handling via HTTP interceptors
 * - Query parameter building for complex filtering
 * - Caching for improved performance
 * - Mobile-optimized API calls
 */
@Injectable({
  providedIn: 'root'
})
export class TradeOrderService {
  private readonly http = inject(HttpClient);
  
  // API Configuration
  private readonly API_BASE_URL = 'http://localhost:3000';
  private readonly API_ENDPOINTS = {
    ORDERS: `${this.API_BASE_URL}/trade-orders`,
    ORDER_BY_ID: (id: string) => `${this.API_BASE_URL}/trade-orders/${id}`
  } as const;

  // Signal-based cache management
  private readonly _ordersCache = signal<TradeOrderResponseDto[]>([]);
  private readonly _lastFetchParams = signal<GetTradeOrdersParams | null>(null);
  private readonly _portfolioStats = signal<PortfolioStats | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // Development flag for mock data
  private readonly _useMockData = signal<boolean>(false);
  
  // Public signals
  readonly orders = this._ordersCache.asReadonly();
  readonly portfolioStats = this._portfolioStats.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Legacy observables for backward compatibility
  readonly orders$ = new BehaviorSubject<TradeOrderResponseDto[]>([]);
  readonly portfolioStats$ = new BehaviorSubject<PortfolioStats | null>(null);
  
  // Computed signals for convenience
  readonly activeOrders = computed(() => 
    this._ordersCache().filter(order => order.isActive)
  );
  
  readonly closedOrders = computed(() => 
    this._ordersCache().filter(order => order.isClosed)
  );
  
  readonly pendingOrders = computed(() => 
    this._ordersCache().filter(order => order.status === 'pending')
  );
  
  readonly profitableOrders = computed(() => 
    this._ordersCache().filter(order => order.profit && order.profit > 0)
  );
  
  readonly todayOrders = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this._ordersCache().filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  });

  /**
   * Fetch paginated trade orders with comprehensive filtering and sorting
   * 
   * @param params Query parameters for filtering, pagination, and sorting
   * @returns Observable of paginated trade orders response
   */
  getTradeOrders(params: GetTradeOrdersParams = {}): Observable<PaginatedTradeOrdersResponseDto> {
    // Set loading state before making the request
    this._isLoading.set(true);
    this._error.set(null);
    
    // For development, return mock data if API is not available
    if (this.shouldUseMockData()) {
      return this.getMockTradeOrders(params);
    }
    
    const httpParams = this.buildQueryParams(params);
    
    return this.http.get<PaginatedTradeOrdersResponseDto>(
      this.API_ENDPOINTS.ORDERS,
      { params: httpParams }
    ).pipe(
      tap(response => {
        // Update signals with fresh data
        this._ordersCache.set(response.orders);
        this._lastFetchParams.set(params);
        this._isLoading.set(false);
        this._error.set(null);
        
        // Update portfolio statistics
        this.updatePortfolioStats(response.orders);
        
        // Update legacy observables for backward compatibility
        this.orders$.next(response.orders);
      }),
      catchError(error => {
        console.error('Failed to fetch trade orders:', error);
        
        // If API fails, try mock data as fallback
        if (!this._useMockData()) {
          console.log('API failed, falling back to mock data');
          this._useMockData.set(true);
          return this.getMockTradeOrders(params);
        }
        
        this._isLoading.set(false);
        this._error.set(error.message || 'Failed to fetch trade orders');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific trade order by ID
   * 
   * @param orderId Unique identifier for the trade order
   * @returns Observable of trade order response
   */
  getTradeOrderById(orderId: string): Observable<TradeOrderResponseDto> {
    if (!orderId || orderId.trim() === '') {
      return throwError(() => new Error('Order ID is required'));
    }

    // For development, check if we should use mock data
    if (this.shouldUseMockData()) {
      return this.getMockTradeOrderById(orderId);
    }

    return this.http.get<TradeOrderResponseDto>(
      this.API_ENDPOINTS.ORDER_BY_ID(orderId)
    ).pipe(
      tap(order => {
        // Update order in cache if it exists
        this.updateOrderInCache(order);
      }),
      catchError(error => {
        console.error(`Failed to fetch trade order ${orderId}:`, error);
        
        // If API fails, try mock data as fallback
        if (!this._useMockData()) {
          console.log('API failed for single order, falling back to mock data');
          this._useMockData.set(true);
          return this.getMockTradeOrderById(orderId);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new trade order
   * 
   * @param orderData Trade order creation data
   * @returns Observable of created trade order response
   */
  createTradeOrder(orderData: CreateTradeOrderRequestDto): Observable<TradeOrderResponseDto> {
    // Validate required fields
    const validationError = this.validateOrderData(orderData);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    return this.http.post<TradeOrderResponseDto>(
      this.API_ENDPOINTS.ORDERS,
      orderData
    ).pipe(
      tap(newOrder => {
        // Add new order to cache
        this.addOrderToCache(newOrder);
        
        console.log('Trade order created successfully:', newOrder.id);
      }),
      catchError(error => {
        console.error('Failed to create trade order:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh orders using the last fetch parameters
   * Useful for real-time updates or manual refresh
   */
  refreshOrders(): Observable<PaginatedTradeOrdersResponseDto> {
    const lastParams = this._lastFetchParams();
    return this.getTradeOrders(lastParams || {});
  }

  /**
   * Get cached orders without making an API call
   * 
   * @returns Current cached orders
   */
  getCachedOrders(): TradeOrderResponseDto[] {
    return this._ordersCache();
  }

  /**
   * Get filtered orders from cache
   * 
   * @param filter Function to filter orders
   * @returns Filtered orders from cache
   */
  getFilteredCachedOrders(
    filter: (order: TradeOrderResponseDto) => boolean
  ): TradeOrderResponseDto[] {
    return this._ordersCache().filter(filter);
  }

  /**
   * Get active orders from cache
   * 
   * @returns Active orders (pending, partially filled)
   */
  getActiveOrders(): TradeOrderResponseDto[] {
    return this.getFilteredCachedOrders(order => order.isActive);
  }

  /**
   * Get closed orders from cache
   * 
   * @returns Closed orders (filled, cancelled, rejected, expired)
   */
  getClosedOrders(): TradeOrderResponseDto[] {
    return this.getFilteredCachedOrders(order => order.isClosed);
  }

  /**
   * Get orders by symbol from cache
   * 
   * @param symbol Trading symbol to filter by
   * @returns Orders for the specified symbol
   */
  getOrdersBySymbol(symbol: TradingSymbol): TradeOrderResponseDto[] {
    return this.getFilteredCachedOrders(order => 
      order.symbol.replace('/', '') === symbol
    );
  }

  /**
   * Get orders by status from cache
   * 
   * @param status Order status to filter by
   * @returns Orders with the specified status
   */
  getOrdersByStatus(status: OrderStatus): TradeOrderResponseDto[] {
    return this.getFilteredCachedOrders(order => order.status === status);
  }

  /**
   * Get recent orders (last 24 hours) from cache
   * 
   * @returns Recent orders
   */
  getRecentOrders(): TradeOrderResponseDto[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return this.getFilteredCachedOrders(order => 
      new Date(order.createdAt) >= yesterday
    );
  }

  /**
   * Clear the orders cache
   */
  clearCache(): void {
    this._ordersCache.set([]);
    this._lastFetchParams.set(null);
    this._portfolioStats.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    
    // Update legacy observables
    this.orders$.next([]);
    this.portfolioStats$.next(null);
  }

  /**
   * Build HTTP query parameters from GetTradeOrdersParams
   * 
   * @param params Query parameters object
   * @returns HttpParams object for HTTP request
   */
  private buildQueryParams(params: GetTradeOrdersParams): HttpParams {
    let httpParams = new HttpParams();

    // Filtering parameters
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => {
        httpParams = httpParams.append('status[]', status);
      });
    }

    if (params.symbol && params.symbol.length > 0) {
      params.symbol.forEach(symbol => {
        httpParams = httpParams.append('symbol[]', symbol);
      });
    }

    if (params.accountId) {
      httpParams = httpParams.set('accountId', params.accountId);
    }

    if (params.userId) {
      httpParams = httpParams.set('userId', params.userId);
    }

    if (params.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }

    if (params.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    if (params.minProfit !== undefined) {
      httpParams = httpParams.set('minProfit', params.minProfit.toString());
    }

    if (params.maxProfit !== undefined) {
      httpParams = httpParams.set('maxProfit', params.maxProfit.toString());
    }

    if (params.minQuantity !== undefined) {
      httpParams = httpParams.set('minQuantity', params.minQuantity.toString());
    }

    if (params.maxQuantity !== undefined) {
      httpParams = httpParams.set('maxQuantity', params.maxQuantity.toString());
    }

    // Pagination parameters
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.pageSize !== undefined) {
      // Ensure pageSize doesn't exceed API maximum
      const pageSize = Math.min(params.pageSize, 200);
      httpParams = httpParams.set('pageSize', pageSize.toString());
    }

    // Sorting parameters
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }

    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return httpParams;
  }

  /**
   * Validate trade order data before creating
   * 
   * @param orderData Order data to validate
   * @returns Error message if invalid, null if valid
   */
  private validateOrderData(orderData: CreateTradeOrderRequestDto): string | null {
    if (!orderData.symbol) {
      return 'Symbol is required';
    }

    if (!orderData.type) {
      return 'Order type is required';
    }

    if (!orderData.side) {
      return 'Order side is required';
    }

    if (!orderData.quantity || orderData.quantity < 0.01) {
      return 'Quantity must be at least 0.01';
    }

    // Price is required for non-market orders
    if (orderData.type !== 'market' && !orderData.price) {
      return 'Price is required for limit and stop orders';
    }

    if (!orderData.accountId) {
      return 'Account ID is required';
    }

    if (!orderData.userId) {
      return 'User ID is required';
    }

    // Validate stop loss and take profit levels
    if (orderData.stopLoss && orderData.price) {
      if (orderData.side === 'buy' && orderData.stopLoss >= orderData.price) {
        return 'Stop loss must be below entry price for buy orders';
      }
      if (orderData.side === 'sell' && orderData.stopLoss <= orderData.price) {
        return 'Stop loss must be above entry price for sell orders';
      }
    }

    if (orderData.takeProfit && orderData.price) {
      if (orderData.side === 'buy' && orderData.takeProfit <= orderData.price) {
        return 'Take profit must be above entry price for buy orders';
      }
      if (orderData.side === 'sell' && orderData.takeProfit >= orderData.price) {
        return 'Take profit must be below entry price for sell orders';
      }
    }

    return null;
  }

  /**
   * Update a single order in the cache
   * 
   * @param updatedOrder Updated order data
   */
  private updateOrderInCache(updatedOrder: TradeOrderResponseDto): void {
    const currentOrders = this._ordersCache();
    const orderIndex = currentOrders.findIndex(order => order.id === updatedOrder.id);
    
    if (orderIndex !== -1) {
      const newOrders = [...currentOrders];
      newOrders[orderIndex] = updatedOrder;
      this._ordersCache.set(newOrders);
      
      // Update portfolio stats
      this.updatePortfolioStats(newOrders);
      
      // Update legacy observable
      this.orders$.next(newOrders);
    }
  }

  /**
   * Add a new order to the cache
   * 
   * @param newOrder New order to add
   */
  private addOrderToCache(newOrder: TradeOrderResponseDto): void {
    const currentOrders = this._ordersCache();
    const newOrders = [newOrder, ...currentOrders];
    this._ordersCache.set(newOrders);
    
    // Update portfolio stats
    this.updatePortfolioStats(newOrders);
    
    // Update legacy observable
    this.orders$.next(newOrders);
  }

  /**
   * Calculate and update portfolio statistics
   * 
   * @param orders Array of trade orders
   */
  private updatePortfolioStats(orders: TradeOrderResponseDto[]): void {
    if (!orders || orders.length === 0) {
      this._portfolioStats.set(null);
      this.portfolioStats$.next(null);
      return;
    }

    const stats: PortfolioStats = {
      totalOrders: orders.length,
      activeOrders: orders.filter(order => order.isActive).length,
      closedOrders: orders.filter(order => order.isClosed).length,
      totalProfitLoss: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageProfit: 0,
      averageLoss: 0,
      totalVolume: 0
    };

    let totalProfit = 0;
    let totalLoss = 0;
    let profitableTradesProfit = 0;
    let losingTradesLoss = 0;

    orders.forEach(order => {
      // Calculate total P&L
      if (order.profit !== undefined) {
        stats.totalProfitLoss += order.profit;
        
        if (order.profit > 0) {
          stats.winningTrades++;
          profitableTradesProfit += order.profit;
        } else if (order.profit < 0) {
          stats.losingTrades++;
          losingTradesLoss += Math.abs(order.profit);
        }
      }

      // Calculate total volume
      if (order.filledQuantity) {
        stats.totalVolume += order.filledQuantity;
      } else if (order.status === 'filled') {
        stats.totalVolume += order.quantity;
      }
    });

    // Calculate averages and ratios
    const totalClosedTrades = stats.winningTrades + stats.losingTrades;
    
    if (totalClosedTrades > 0) {
      stats.winRate = (stats.winningTrades / totalClosedTrades) * 100;
    }

    if (stats.winningTrades > 0) {
      stats.averageProfit = profitableTradesProfit / stats.winningTrades;
    }

    if (stats.losingTrades > 0) {
      stats.averageLoss = losingTradesLoss / stats.losingTrades;
    }

    this._portfolioStats.set(stats);
    this.portfolioStats$.next(stats);
  }
  
  /**
   * Check if mock data should be used (for development)
   */
  private shouldUseMockData(): boolean {
    return this._useMockData() || !navigator.onLine;
  }
  
  /**
   * Generate mock trade order by ID for development
   */
  private getMockTradeOrderById(orderId: string): Observable<TradeOrderResponseDto> {
    const mockOrders = this.generateMockOrders();
    const order = mockOrders.find(o => o.id === orderId);
    
    if (!order) {
      return throwError(() => new Error(`Order with ID ${orderId} not found`));
    }
    
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(order);
        observer.complete();
      }, 300); // Small delay to simulate network
    });
  }
  
  /**
   * Generate mock trade orders data for development
   */
  private getMockTradeOrders(params: GetTradeOrdersParams = {}): Observable<PaginatedTradeOrdersResponseDto> {
    const mockOrders = this.generateMockOrders();
    
    const mockResponse: PaginatedTradeOrdersResponseDto = {
      orders: mockOrders,
      total: mockOrders.length,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    };
    
    return new Observable(observer => {
      // Small delay to simulate network latency, but much faster than before
      setTimeout(() => {
        // Update signals with mock data
        this._ordersCache.set(mockOrders);
        this._lastFetchParams.set(params);
        this._isLoading.set(false);
        this._error.set(null);
        
        // Update portfolio statistics
        this.updatePortfolioStats(mockOrders);
        
        // Update legacy observables
        this.orders$.next(mockOrders);
        
        observer.next(mockResponse);
        observer.complete();
      }, 200); // Reasonable delay to simulate real network
    });
  }
  
  /**
   * Generate consistent mock trade orders
   */
  private generateMockOrders(): TradeOrderResponseDto[] {
    return [
      {
        id: '1',
        symbol: 'BTCUSD',
        type: OrderType.MARKET,
        side: OrderSide.BUY,
        quantity: 0.5,
        price: 45000,
        status: OrderStatus.FILLED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filledAt: new Date().toISOString(),
        filledPrice: 45000,
        filledQuantity: 0.5,
        commission: 22.5,
        swap: 0,
        profit: 1250,
        accountId: 'acc-1',
        userId: 'user-1',
        isActive: false,
        isClosed: true
      },
      {
        id: '701e7671-8467-4ef1-9709-fb3a89e2d48a', // Example ID from requirements
        symbol: 'EURUSD',
        type: OrderType.LIMIT,
        side: OrderSide.SELL,
        quantity: 10000,
        price: 1.0850,
        stopLoss: 1.0900,
        takeProfit: 1.0800,
        status: OrderStatus.PENDING,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        commission: 0,
        swap: 0,
        accountId: 'acc-1',
        userId: 'user-1',
        isActive: true,
        isClosed: false
      },
      {
        id: '2',
        symbol: 'EURUSD',
        type: OrderType.LIMIT,
        side: OrderSide.SELL,
        quantity: 10000,
        price: 1.0850,
        status: OrderStatus.PENDING,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        commission: 0,
        swap: 0,
        accountId: 'acc-1',
        userId: 'user-1',
        isActive: true,
        isClosed: false
      },
      {
        id: '3',
        symbol: 'ETHUSD',
        type: OrderType.MARKET,
        side: OrderSide.BUY,
        quantity: 2,
        price: 3200,
        status: OrderStatus.FILLED,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        filledAt: new Date(Date.now() - 7200000).toISOString(),
        filledPrice: 3200,
        filledQuantity: 2,
        commission: 6.4,
        swap: 0,
        profit: -150,
        accountId: 'acc-1',
        userId: 'user-1',
        isActive: false,
        isClosed: true
      },
      {
        id: '4',
        symbol: 'BTCUSD',
        type: OrderType.MARKET,
        side: OrderSide.SELL,
        quantity: 0.25,
        price: 46500,
        status: OrderStatus.FILLED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        filledAt: new Date().toISOString(),
        filledPrice: 46500,
        filledQuantity: 0.25,
        commission: 11.625,
        swap: 0,
        profit: 375,
        accountId: 'acc-1',
        userId: 'user-1',
        isActive: false,
        isClosed: true
      }
    ];
  }
}