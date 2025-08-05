// Trade Order TypeScript Interfaces
// Based on backend API schema for trade-orders endpoints

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

export type TradingSymbol = 'BTCUSD' | 'EURUSD' | 'ETHUSD';

// Response DTO from GET /trade-orders/{id} and POST /trade-orders
export interface TradeOrderResponseDto {
  // Core Order Info
  id: string;                           // UUID
  symbol: string;                       // e.g., "EUR/USD"
  type: OrderType;
  side: OrderSide;
  quantity: number;
  
  // Pricing (optional fields)
  price?: number;                       // For limit/stop orders
  stopLoss?: number;
  takeProfit?: number;
  
  // Execution Status
  status: OrderStatus;
  filledAt?: string;                    // ISO timestamp
  filledPrice?: number;                 // Actual execution price
  filledQuantity?: number;              // Amount filled
  
  // Timestamps
  createdAt: string;                    // ISO timestamp
  updatedAt: string;                    // ISO timestamp
  
  // Financial Info
  commission: number;                   // Trading fees
  swap: number;                         // Overnight fees
  profit?: number;                      // Realized P&L
  
  // Ownership
  accountId: string;                    // UUID
  userId: string;                       // UUID
  
  // Computed Status
  isActive: boolean;                    // Derived from status
  isClosed: boolean;                    // Derived from status
}

// Request DTO for POST /trade-orders
export interface CreateTradeOrderRequestDto {
  symbol: TradingSymbol;                // Required
  type: OrderType;                      // Required
  side: OrderSide;                      // Required
  quantity: number;                     // Required, min: 0.01
  price?: number;                       // Optional, required for non-market orders
  stopLoss?: number;                    // Optional
  takeProfit?: number;                  // Optional  
  accountId: string;                    // Required UUID
  userId: string;                       // Required UUID
}

// Response DTO from GET /trade-orders (paginated)
export interface PaginatedTradeOrdersResponseDto {
  orders: TradeOrderResponseDto[];      // Array of orders
  total: number;                        // Total matching records
  page: number;                         // Current page (1-based)
  pageSize: number;                     // Items per page
  totalPages: number;                   // Total available pages
  hasNext: boolean;                     // More pages available
  hasPrevious: boolean;                 // Previous pages exist
}

// Query parameters for GET /trade-orders
export interface GetTradeOrdersParams {
  // Filtering Options
  status?: OrderStatus[];               // Filter by order status (array)
  symbol?: TradingSymbol[];             // Filter by trading pairs (array)
  accountId?: string;                   // Filter by account UUID
  userId?: string;                      // Filter by user UUID
  dateFrom?: string;                    // Filter orders after date (ISO string)
  dateTo?: string;                      // Filter orders before date (ISO string)
  minProfit?: number;                   // Minimum profit filter
  maxProfit?: number;                   // Maximum profit filter
  minQuantity?: number;                 // Minimum quantity filter
  maxQuantity?: number;                 // Maximum quantity filter
  
  // Pagination
  page?: number;                        // Page number (default: 1)
  pageSize?: number;                    // Items per page (default: 50, max: 200)
  
  // Sorting
  sortBy?: SortField;                   // Field to sort by (default: 'createdAt')
  sortOrder?: 'ASC' | 'DESC';          // Sort order (default: 'DESC')
}

// Available sort fields
export type SortField = 
  | 'id' 
  | 'symbol' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'filledAt' 
  | 'status' 
  | 'quantity' 
  | 'price' 
  | 'profit';

// Error response format from API
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// Frontend-specific interfaces for UI components
export interface TradeOrder extends TradeOrderResponseDto {
  // Additional computed properties for UI
  displaySymbol?: string;               // Formatted symbol (e.g., "BTC/USD")
  profitLossPercentage?: number;        // P&L as percentage
  durationOpen?: string;                // How long order has been open
  statusColor?: 'success' | 'error' | 'warning' | 'info'; // Color coding for status
}

// Portfolio statistics (computed from trade orders)
export interface PortfolioStats {
  totalOrders: number;
  activeOrders: number;
  closedOrders: number;
  totalProfitLoss: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;                      // Percentage
  averageProfit: number;
  averageLoss: number;
  totalVolume: number;
}

// Filter options for UI components
export interface TradeFilters {
  status: OrderStatus | 'all';
  symbol: TradingSymbol | 'all';
  dateRange: {
    from: Date;
    to: Date;
  } | null;
  profitLoss: 'profit' | 'loss' | 'all';
}

// Form interfaces for order creation
export interface OrderFormData {
  symbol: TradingSymbol;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

// Validation errors for forms
export interface OrderFormErrors {
  symbol?: string;
  type?: string;
  side?: string;
  quantity?: string;
  price?: string;
  stopLoss?: string;
  takeProfit?: string;
}

// Loading states for UI
export interface LoadingState {
  isLoading: boolean;
  operation?: 'fetch' | 'create' | 'update' | 'delete';
  message?: string;
}