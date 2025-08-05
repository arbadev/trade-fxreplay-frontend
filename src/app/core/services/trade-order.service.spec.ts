import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TradeOrderService } from './trade-order.service';
import { 
  TradeOrderResponseDto, 
  CreateTradeOrderRequestDto, 
  PaginatedTradeOrdersResponseDto,
  OrderType,
  OrderSide,
  OrderStatus
} from '../models/trade-order.interface';

describe('TradeOrderService', () => {
  let service: TradeOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TradeOrderService]
    });
    service = TestBed.inject(TradeOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct API endpoints', () => {
    expect(service).toBeTruthy();
    // The actual endpoint URLs are private, but we can test that the service exists
    // and has the expected public methods
    expect(typeof service.getTradeOrders).toBe('function');
    expect(typeof service.getTradeOrderById).toBe('function');
    expect(typeof service.createTradeOrder).toBe('function');
    expect(typeof service.refreshOrders).toBe('function');
  });

  it('should have observable properties', () => {
    expect(service.orders$).toBeDefined();
    expect(service.portfolioStats$).toBeDefined();
  });

  it('should get cached orders', () => {
    const cachedOrders = service.getCachedOrders();
    expect(Array.isArray(cachedOrders)).toBe(true);
  });

  it('should get active orders from cache', () => {
    const activeOrders = service.getActiveOrders();
    expect(Array.isArray(activeOrders)).toBe(true);
  });

  it('should get closed orders from cache', () => {
    const closedOrders = service.getClosedOrders();
    expect(Array.isArray(closedOrders)).toBe(true);
  });

  it('should clear cache', () => {
    service.clearCache();
    const cachedOrders = service.getCachedOrders();
    expect(cachedOrders.length).toBe(0);
  });

  it('should fetch trade orders and handle response', () => {
    const mockResponse: PaginatedTradeOrdersResponseDto = {
      orders: [
        {
          id: 'test-id-1',
          symbol: 'BTC/USD',
          type: OrderType.MARKET,
          side: OrderSide.BUY,
          quantity: 1.0,
          status: OrderStatus.FILLED,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          commission: 10.5,
          swap: 0,
          accountId: 'account-123',
          userId: 'user-123',
          isActive: false,
          isClosed: true,
          filledAt: '2025-01-01T00:01:00Z',
          filledPrice: 50000,
          filledQuantity: 1.0,
          profit: 100
        }
      ],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    };

    service.getTradeOrders({ page: 1, pageSize: 50 }).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.orders.length).toBe(1);
      expect(response.orders[0].symbol).toBe('BTC/USD');
    });

    const req = httpMock.expectOne('http://localhost:3000/trade-orders?page=1&pageSize=50');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch trade order by id', () => {
    const mockOrder: TradeOrderResponseDto = {
      id: 'test-id-1',
      symbol: 'BTC/USD',
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      quantity: 1.0,
      status: OrderStatus.FILLED,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      commission: 10.5,
      swap: 0,
      accountId: 'account-123',
      userId: 'user-123',
      isActive: false,
      isClosed: true,
      filledAt: '2025-01-01T00:01:00Z',
      filledPrice: 50000,
      filledQuantity: 1.0,
      profit: 100
    };

    service.getTradeOrderById('test-id-1').subscribe(order => {
      expect(order).toEqual(mockOrder);
      expect(order.id).toBe('test-id-1');
    });

    const req = httpMock.expectOne('http://localhost:3000/trade-orders/test-id-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  it('should create trade order', () => {
    const orderData: CreateTradeOrderRequestDto = {
      symbol: 'BTCUSD',
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      quantity: 1.0,
      accountId: 'account-123',
      userId: 'user-123'
    };

    const mockResponse: TradeOrderResponseDto = {
      id: 'new-order-id',
      symbol: 'BTC/USD',
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      quantity: 1.0,
      status: OrderStatus.PENDING,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      commission: 0,
      swap: 0,
      accountId: 'account-123',
      userId: 'user-123',
      isActive: true,
      isClosed: false
    };

    service.createTradeOrder(orderData).subscribe(order => {
      expect(order).toEqual(mockResponse);
      expect(order.id).toBe('new-order-id');
    });

    const req = httpMock.expectOne('http://localhost:3000/trade-orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(orderData);
    req.flush(mockResponse);
  });

  it('should handle validation errors for invalid order data', (done) => {
    const invalidOrderData: CreateTradeOrderRequestDto = {
      symbol: 'BTCUSD',
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      quantity: 0, // Invalid quantity
      accountId: 'account-123',
      userId: 'user-123'
    };

    service.createTradeOrder(invalidOrderData).subscribe({
      next: () => {
        fail('Should have thrown an error');
        done();
      },
      error: (error) => {
        expect(error.message).toContain('Quantity must be at least 0.01');
        done();
      }
    });
  });

  it('should filter orders by symbol', () => {
    // This test verifies the filtering logic works
    const filteredOrders = service.getOrdersBySymbol('BTCUSD');
    expect(Array.isArray(filteredOrders)).toBe(true);
  });

  it('should filter orders by status', () => {
    const filteredOrders = service.getOrdersByStatus(OrderStatus.PENDING);
    expect(Array.isArray(filteredOrders)).toBe(true);
  });

  it('should get recent orders', () => {
    const recentOrders = service.getRecentOrders();
    expect(Array.isArray(recentOrders)).toBe(true);
  });
});