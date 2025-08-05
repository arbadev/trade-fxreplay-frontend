import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, throwError, of } from 'rxjs';

import {
  TradeOrderResponseDto,
  CreateTradeOrderRequestDto,
  PaginatedTradeOrdersResponseDto,
  GetTradeOrdersParams,
  OrderStatus,
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

  // Cache management
  private readonly _ordersCache = new BehaviorSubject<TradeOrderResponseDto[]>([]);
  private readonly _lastFetchParams = new BehaviorSubject<GetTradeOrdersParams | null>(null);
  private readonly _portfolioStats = new BehaviorSubject<PortfolioStats | null>(null);
  
  // Public observables
  readonly orders$ = this._ordersCache.asObservable();
  readonly portfolioStats$ = this._portfolioStats.asObservable();

  /**
   * Fetch paginated trade orders with comprehensive filtering and sorting
   * 
   * @param params Query parameters for filtering, pagination, and sorting
   * @returns Observable of paginated trade orders response
   */
  getTradeOrders(params: GetTradeOrdersParams = {}): Observable<PaginatedTradeOrdersResponseDto> {
    const httpParams = this.buildQueryParams(params);
    
    return this.http.get<PaginatedTradeOrdersResponseDto>(
      this.API_ENDPOINTS.ORDERS,
      { params: httpParams }
    ).pipe(
      tap(response => {
        // Update cache with fresh data
        this._ordersCache.next(response.orders);
        this._lastFetchParams.next(params);
        
        // Update portfolio statistics
        this.updatePortfolioStats(response.orders);
      }),
      catchError(error => {
        console.error('Failed to fetch trade orders:', error);
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

    return this.http.get<TradeOrderResponseDto>(
      this.API_ENDPOINTS.ORDER_BY_ID(orderId)
    ).pipe(
      tap(order => {
        // Update order in cache if it exists
        this.updateOrderInCache(order);
      }),
      catchError(error => {
        console.error(`Failed to fetch trade order ${orderId}:`, error);
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
    const lastParams = this._lastFetchParams.value;
    return this.getTradeOrders(lastParams || {});
  }

  /**
   * Get cached orders without making an API call
   * 
   * @returns Current cached orders
   */
  getCachedOrders(): TradeOrderResponseDto[] {
    return this._ordersCache.value;
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
    return this._ordersCache.value.filter(filter);
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
    this._ordersCache.next([]);
    this._lastFetchParams.next(null);
    this._portfolioStats.next(null);
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
    const currentOrders = this._ordersCache.value;
    const orderIndex = currentOrders.findIndex(order => order.id === updatedOrder.id);
    
    if (orderIndex !== -1) {
      const newOrders = [...currentOrders];
      newOrders[orderIndex] = updatedOrder;
      this._ordersCache.next(newOrders);
      
      // Update portfolio stats
      this.updatePortfolioStats(newOrders);
    }
  }

  /**
   * Add a new order to the cache
   * 
   * @param newOrder New order to add
   */
  private addOrderToCache(newOrder: TradeOrderResponseDto): void {
    const currentOrders = this._ordersCache.value;
    const newOrders = [newOrder, ...currentOrders];
    this._ordersCache.next(newOrders);
    
    // Update portfolio stats
    this.updatePortfolioStats(newOrders);
  }

  /**
   * Calculate and update portfolio statistics
   * 
   * @param orders Array of trade orders
   */
  private updatePortfolioStats(orders: TradeOrderResponseDto[]): void {
    if (!orders || orders.length === 0) {
      this._portfolioStats.next(null);
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

    this._portfolioStats.next(stats);
  }
}