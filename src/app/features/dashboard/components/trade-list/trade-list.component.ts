import { Component, input, output, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TradeOrderResponseDto, GetTradeOrdersParams, SortField, OrderStatus } from '../../../../core/models/trade-order.interface';
import { TradeOrderService } from '../../../../core/services/trade-order.service';
import { TradeCardComponent, TradeCardAction } from '../../../../shared/components/trade-card/trade-card.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FilterType } from '../quick-filters/quick-filters.component';

export interface SortOption {
  field: SortField;
  label: string;
  order: 'ASC' | 'DESC';
}

export interface TradeListState {
  orders: TradeOrderResponseDto[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalOrders: number;
}

@Component({
  selector: 'app-trade-list',
  standalone: true,
  imports: [
    CommonModule, 
    TradeCardComponent, 
    LoadingSpinnerComponent, 
    ButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="trade-list" [class.trade-list--loading]="state().loading">
      <!-- List Header -->
      <div class="trade-list__header">
        <div class="trade-list__title-section">
          <h3 class="trade-list__title">
            Trade Orders
            @if (state().totalOrders > 0) {
              <span class="trade-list__count">({{ state().totalOrders }})</span>
            }
          </h3>
          
          @if (activeFilterText()) {
            <span class="trade-list__filter-status" [attr.aria-label]="'Currently filtering by: ' + activeFilterText()">
              {{ activeFilterText() }}
            </span>
          }
        </div>
        
        <div class="trade-list__actions">
          <!-- Sort Dropdown -->
          <div class="trade-list__sort">
            <select 
              class="trade-list__sort-select"
              [value]="currentSort().field + '_' + currentSort().order"
              (change)="handleSortChange($event)"
              [disabled]="state().loading"
              [attr.aria-label]="'Sort trade orders'">
              @for (option of sortOptions; track option.field + option.order) {
                <option [value]="option.field + '_' + option.order">
                  {{ option.label }}
                </option>
              }
            </select>
          </div>
          
          <!-- Refresh Button -->
          <button 
            class="trade-list__refresh"
            [class.loading]="state().refreshing"
            [disabled]="state().loading || state().refreshing"
            (click)="refreshOrders()"
            [attr.aria-label]="'Refresh trade orders'">
            @if (state().refreshing) {
              <app-loading-spinner [size]="16"></app-loading-spinner>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            }
          </button>
        </div>
      </div>
      
      <!-- Orders List -->
      <div class="trade-list__content" [attr.aria-live]="'polite'">
        @if (state().loading && state().orders.length === 0) {
          <!-- Initial Loading Skeleton -->
          <div class="trade-list__skeleton" role="status" [attr.aria-label]="'Loading trade orders'">
            @for (_ of [1,2,3,4,5]; track $index) {
              <div class="trade-list__skeleton-item">
                <div class="skeleton skeleton--header"></div>
                <div class="skeleton skeleton--content"></div>
                <div class="skeleton skeleton--footer"></div>
              </div>
            }
          </div>
        } @else if (state().error) {
          <!-- Error State -->
          <div class="trade-list__error" role="alert">
            <div class="error-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="error-state__icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h4 class="error-state__title">Failed to Load Orders</h4>
              <p class="error-state__message">{{ state().error }}</p>
              <app-button 
                [variant]="'primary'"
                [size]="'sm'"
                (onClick)="retryLoad()"
                class="error-state__retry">
                Retry
              </app-button>
            </div>
          </div>
        } @else if (state().orders.length === 0) {
          <!-- Empty State -->
          <div class="trade-list__empty" role="status" [attr.aria-label]="'No trade orders found'">
            <div class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-state__icon">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="m17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <h4 class="empty-state__title">
                @if (activeFilter() !== 'all') {
                  No {{ getFilterDisplayName() }} Orders
                } @else {
                  No Trade Orders
                }
              </h4>
              <p class="empty-state__message">
                @if (activeFilter() !== 'all') {
                  Try adjusting your filters or create a new trade order.
                } @else {
                  Get started by creating your first trade order.
                }
              </p>
              <app-button 
                [variant]="'primary'"
                [size]="'md'"
                (onClick)="createNewOrder()"
                class="empty-state__cta">
                Create Trade Order
              </app-button>
            </div>
          </div>
        } @else {
          <!-- Orders Grid -->
          <div 
            class="trade-list__grid" 
            [class.trade-list__grid--compact]="compactView()"
            role="list"
            [attr.aria-label]="'List of ' + state().orders.length + ' trade orders'">
            @for (order of state().orders; track order.id) {
              <div role="listitem" class="trade-list__item">
                <app-trade-card
                  [order]="order"
                  [clickable]="true"
                  [disabled]="state().loading"
                  [showActions]="showActions()"
                  [compact]="compactView()"
                  [showExpandableDetails]="!compactView()"
                  (cardClick)="handleOrderClick(order)"
                  (actionClick)="handleActionClick($event)">
                </app-trade-card>
              </div>
            }
          </div>
          
          <!-- Load More / Pagination -->
          @if (state().hasMore && !infiniteScroll()) {
            <div class="trade-list__pagination">
              <app-button
                [variant]="'secondary'"
                [size]="'lg'"
                [fullWidth]="true"
                [loading]="state().loading"
                [disabled]="state().loading"
                (onClick)="loadMore()"
                class="trade-list__load-more">
                Load More Orders
                @if (state().totalPages > 1) {
                  <span class="trade-list__pagination-info">
                    ({{ state().currentPage }} of {{ state().totalPages }})
                  </span>
                }
              </app-button>
            </div>
          }
          
          <!-- Infinite Scroll Loading -->
          @if (state().hasMore && infiniteScroll() && state().loading) {
            <div class="trade-list__infinite-loading" role="status" [attr.aria-label]="'Loading more orders'">
              <app-loading-spinner [size]="24"></app-loading-spinner>
              <span class="trade-list__loading-text">Loading more orders...</span>
            </div>
          }
        }
      </div>
      
      <!-- Pull to Refresh Indicator (Mobile) -->
      @if (pullToRefreshEnabled() && isPullingDown()) {
        <div class="trade-list__pull-to-refresh" [class.trade-list__pull-to-refresh--active]="state().refreshing">
          <div class="pull-to-refresh-indicator">
            @if (state().refreshing) {
              <app-loading-spinner [size]="20"></app-loading-spinner>
            } @else {
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
                [style.transform]="'rotate(' + pullRotation() + 'deg)'">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            }
            <span class="pull-to-refresh-text">
              {{ state().refreshing ? 'Refreshing...' : 'Pull to refresh' }}
            </span>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './trade-list.component.scss'
})
export class TradeListComponent implements OnInit {
  private readonly tradeOrderService = inject(TradeOrderService);

  // Inputs
  readonly activeFilter = input<FilterType>('all');
  readonly searchQuery = input<string>('');
  readonly pageSize = input<number>(20);
  readonly infiniteScroll = input<boolean>(false);
  readonly compactView = input<boolean>(false);
  readonly showActions = input<boolean>(true);
  readonly pullToRefreshEnabled = input<boolean>(true);

  // Outputs
  readonly orderClick = output<TradeOrderResponseDto>();
  readonly actionClick = output<TradeCardAction>();
  readonly newOrderClick = output<void>();
  readonly filterChange = output<FilterType>();

  // Component state
  protected readonly state = signal<TradeListState>({
    orders: [],
    loading: true,
    refreshing: false,
    hasMore: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  // Pull to refresh state
  private readonly pullingDown = signal<boolean>(false);
  private readonly pullDistance = signal<number>(0);

  // Sort options
  protected readonly sortOptions: SortOption[] = [
    { field: 'createdAt', label: 'Newest First', order: 'DESC' },
    { field: 'createdAt', label: 'Oldest First', order: 'ASC' },
    { field: 'profit', label: 'Most Profitable', order: 'DESC' },
    { field: 'profit', label: 'Least Profitable', order: 'ASC' },
    { field: 'quantity', label: 'Largest Size', order: 'DESC' },
    { field: 'quantity', label: 'Smallest Size', order: 'ASC' },
    { field: 'symbol', label: 'Symbol A-Z', order: 'ASC' },
    { field: 'symbol', label: 'Symbol Z-A', order: 'DESC' }
  ];

  private readonly currentSortSignal = signal<SortOption>(this.sortOptions[0]);

  // Computed properties
  protected readonly currentSort = computed(() => this.currentSortSignal());
  
  protected readonly activeFilterText = computed(() => {
    const filter = this.activeFilter();
    return filter !== 'all' ? this.getFilterDisplayName() : '';
  });

  protected readonly isPullingDown = computed(() => this.pullingDown());
  
  protected readonly pullRotation = computed(() => {
    return Math.min(this.pullDistance() * 2, 180);
  });

  constructor() {
    // Subscribe to orders from the service
    this.tradeOrderService.orders$
      .pipe(takeUntilDestroyed())
      .subscribe(orders => {
        this.updateOrdersState(orders);
      });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  protected async loadOrders(reset: boolean = false): Promise<void> {
    if (reset) {
      this.state.update(state => ({
        ...state,
        currentPage: 1,
        orders: [],
        loading: true,
        error: null
      }));
    }

    try {
      const params = this.buildQueryParams();
      const response = await this.tradeOrderService.getTradeOrders(params).toPromise();
      
      if (response) {
        this.state.update(state => ({
          ...state,
          loading: false,
          error: null,
          hasMore: response.hasNext,
          totalPages: response.totalPages,
          totalOrders: response.total,
          currentPage: response.page
        }));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      this.state.update(state => ({
        ...state,
        loading: false,
        error: 'Failed to load trade orders. Please try again.'
      }));
    }
  }

  protected async loadMore(): Promise<void> {
    if (this.state().loading || !this.state().hasMore) return;

    this.state.update(state => ({ ...state, loading: true }));
    
    try {
      const params = this.buildQueryParams(this.state().currentPage + 1);
      const response = await this.tradeOrderService.getTradeOrders(params).toPromise();
      
      if (response) {
        this.state.update(state => ({
          ...state,
          orders: [...state.orders, ...response.orders],
          loading: false,
          hasMore: response.hasNext,
          currentPage: response.page
        }));
      }
    } catch (error) {
      console.error('Failed to load more orders:', error);
      this.state.update(state => ({
        ...state,
        loading: false,
        error: 'Failed to load more orders'
      }));
    }
  }

  protected async refreshOrders(): Promise<void> {
    this.state.update(state => ({ ...state, refreshing: true }));
    
    try {
      await this.tradeOrderService.refreshOrders().toPromise();
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    } finally {
      this.state.update(state => ({ ...state, refreshing: false }));
      this.pullingDown.set(false);
    }
  }

  protected async retryLoad(): Promise<void> {
    await this.loadOrders(true);
  }

  protected handleSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const [field, order] = target.value.split('_') as [SortField, 'ASC' | 'DESC'];
    
    const sortOption = this.sortOptions.find(opt => 
      opt.field === field && opt.order === order
    );
    
    if (sortOption) {
      this.currentSortSignal.set(sortOption);
      this.loadOrders(true);
    }
  }

  protected handleOrderClick(order: TradeOrderResponseDto): void {
    this.orderClick.emit(order);
  }

  protected handleActionClick(action: TradeCardAction): void {
    this.actionClick.emit(action);
  }

  protected createNewOrder(): void {
    this.newOrderClick.emit();
  }

  protected getFilterDisplayName(): string {
    const filter = this.activeFilter();
    const displayNames: Record<FilterType, string> = {
      all: 'All',
      active: 'Active',
      pending: 'Pending',
      closed: 'Closed',
      profitable: 'Profitable',
      today: 'Today\'s'
    };
    return displayNames[filter] || 'Filtered';
  }

  private buildQueryParams(page: number = 1): GetTradeOrdersParams {
    const params: GetTradeOrdersParams = {
      page,
      pageSize: this.pageSize(),
      sortBy: this.currentSort().field,
      sortOrder: this.currentSort().order
    };

    // Apply filter-based parameters
    const filter = this.activeFilter();
    switch (filter) {
      case 'active':
        params.status = [OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED];
        break;
      case 'pending':
        params.status = [OrderStatus.PENDING];
        break;
      case 'closed':
        params.status = [OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.EXPIRED];
        break;
      case 'profitable':
        params.minProfit = 0.01; // Only profitable trades
        break;
      case 'today':
        params.dateFrom = new Date().toISOString().split('T')[0]; // Today's date
        break;
    }

    return params;
  }

  private updateOrdersState(orders: TradeOrderResponseDto[]): void {
    this.state.update(state => ({
      ...state,
      orders: state.currentPage === 1 ? orders : [...state.orders, ...orders]
    }));
  }
}