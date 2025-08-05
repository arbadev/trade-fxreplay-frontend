import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { TradeOrderService } from '../../core/services/trade-order.service';
import { TradeOrderResponseDto } from '../../core/models/trade-order.interface';

// Dashboard Components
import { PortfolioStatsComponent } from './components/portfolio-stats/portfolio-stats.component';
import { QuickFiltersComponent, FilterType, FilterChangeEvent, FilterOption } from './components/quick-filters/quick-filters.component';
import { TradeListComponent } from './components/trade-list/trade-list.component';

// Shared Components
import { TradeCardAction } from '../../shared/components/trade-card/trade-card.component';
import { FabComponent, FabAction } from '../../shared/components/floating-action-button/fab.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PortfolioStatsComponent,
    QuickFiltersComponent,
    TradeListComponent,
    FabComponent,
    LoadingSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard" [class.dashboard--loading]="isInitialLoading()">
      <!-- Dashboard Header -->
      <header class="dashboard__header">
        <div class="dashboard__title-section">
          <h1 class="dashboard__title">Trade Dashboard</h1>
          <p class="dashboard__subtitle">
            {{ getSubtitleText() }}
          </p>
        </div>
        
        @if (showQuickActions()) {
          <div class="dashboard__quick-actions">
            <button 
              class="dashboard__action-btn dashboard__action-btn--refresh"
              [class.loading]="isRefreshing()"
              [disabled]="isRefreshing()"
              (click)="refreshDashboard()"
              [attr.aria-label]="'Refresh dashboard data'">
              @if (isRefreshing()) {
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
        }
      </header>

      <!-- Main Dashboard Content -->
      <main class="dashboard__content" [attr.aria-busy]="isInitialLoading()">
        <!-- Portfolio Statistics Section -->
        <section class="dashboard__section dashboard__section--stats" [attr.aria-label]="'Portfolio statistics'">
          <app-portfolio-stats></app-portfolio-stats>
        </section>

        <!-- Quick Filters Section -->
        <section class="dashboard__section dashboard__section--filters" [attr.aria-label]="'Trade filters'">
          <app-quick-filters
            [activeFilter]="activeFilter()"
            [filters]="filterOptions()"
            [disabled]="isInitialLoading()"
            [showCounts]="true"
            [showCustomFilter]="false"
            (filterChange)="handleFilterChange($event)"
            (clearFilters)="handleClearFilters()">
          </app-quick-filters>
        </section>

        <!-- Trade List Section -->
        <section class="dashboard__section dashboard__section--trades" [attr.aria-label]="'Trade orders list'">
          <app-trade-list
            [activeFilter]="activeFilter()"
            [pageSize]="20"
            [infiniteScroll]="false"
            [compactView]="compactView()"
            [showActions]="true"
            [pullToRefreshEnabled]="true"
            (orderClick)="handleOrderClick($event)"
            (actionClick)="handleTradeAction($event)"
            (newOrderClick)="handleNewOrderClick()">
          </app-trade-list>
        </section>
      </main>

      <!-- Floating Action Button -->
      <app-fab
        [size]="'md'"
        [position]="'bottom-right'"
        [variant]="'success'"
        [speedDial]="true"
        [actions]="fabActions()"
        [ariaLabel]="'Quick trading actions'"
        [badge]="activeBadgeCount()"
        (click)="handleFabClick($event)"
        (actionClick)="handleFabAction($event)">
      </app-fab>

      <!-- Loading Overlay for Initial Load -->
      @if (isInitialLoading()) {
        <div class="dashboard__loading-overlay" role="status" [attr.aria-label]="'Loading dashboard'">
          <div class="loading-content">
            <app-loading-spinner [size]="48"></app-loading-spinner>
            <h2 class="loading-title">Loading Dashboard</h2>
            <p class="loading-message">Fetching your trading data...</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (hasError()) {
        <div class="dashboard__error-overlay" role="alert">
          <div class="error-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="error-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2 class="error-title">Dashboard Error</h2>
            <p class="error-message">{{ errorMessage() }}</p>
            <button 
              class="error-retry-btn"
              (click)="retryDashboardLoad()"
              [disabled]="isRetrying()">
              {{ isRetrying() ? 'Retrying...' : 'Retry' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly tradeOrderService = inject(TradeOrderService);

  // Component state
  protected readonly isInitialLoading = signal<boolean>(true);
  protected readonly isRefreshing = signal<boolean>(false);
  protected readonly isRetrying = signal<boolean>(false);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly activeFilter = signal<FilterType>('all');
  protected readonly compactView = signal<boolean>(false);

  // Dashboard configuration
  protected readonly showQuickActions = signal<boolean>(true);

  // Filter options with computed counts
  protected readonly filterOptions = computed<FilterOption[]>(() => {
    const orders = this.tradeOrderService.getCachedOrders();
    
    return [
      {
        id: 'all',
        label: 'All',
        count: orders.length,
        description: 'Show all trade orders'
      },
      {
        id: 'active',
        label: 'Active',
        count: orders.filter(order => order.isActive).length,
        description: 'Show active orders'
      },
      {
        id: 'pending',
        label: 'Pending',
        count: orders.filter(order => order.status === 'pending').length,
        description: 'Show pending orders'
      },
      {
        id: 'closed',
        label: 'Closed',
        count: orders.filter(order => order.isClosed).length,
        description: 'Show completed orders'
      },
      {
        id: 'profitable',
        label: 'Profitable',
        count: orders.filter(order => order.profit && order.profit > 0).length,
        description: 'Show profitable trades'
      },
      {
        id: 'today',
        label: 'Today',
        count: this.getTodayOrdersCount(orders),
        description: 'Show today\'s orders'
      }
    ];
  });

  // FAB actions
  protected readonly fabActions = computed<FabAction[]>(() => [
    {
      id: 'new-order',
      label: 'New Trade',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <line x1="12" y1="5" x2="12" y2="19"></line>
               <line x1="5" y1="12" x2="19" y2="12"></line>
             </svg>`,
      variant: 'success'
    },
    {
      id: 'quick-buy',
      label: 'Quick Buy',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
             </svg>`,
      variant: 'success'
    },
    {
      id: 'quick-sell',
      label: 'Quick Sell',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="2 12 6 12 9 3 15 21 18 12 22 12"></polyline>
             </svg>`,
      variant: 'error'
    },
    {
      id: 'close-all',
      label: 'Close All',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <line x1="18" y1="6" x2="6" y2="18"></line>
               <line x1="6" y1="6" x2="18" y2="18"></line>
             </svg>`,
      variant: 'warning',
      disabled: this.getActiveOrdersCount() === 0
    }
  ]);

  protected readonly activeBadgeCount = computed<number>(() => {
    return this.getActiveOrdersCount();
  });

  // Computed subtitle text
  protected readonly getSubtitleText = computed(() => {
    const orders = this.tradeOrderService.getCachedOrders();
    const activeCount = orders.filter(order => order.isActive).length;
    
    if (orders.length === 0) {
      return 'Start trading to see your portfolio';
    }
    
    if (activeCount === 0) {
      return `${orders.length} orders • No active positions`;
    }
    
    return `${orders.length} orders • ${activeCount} active positions`;
  });

  constructor() {
    // Subscribe to service state for error handling
    this.tradeOrderService.orders$
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (_orders) => {
          this.isInitialLoading.set(false);
          this.hasError.set(false);
        },
        error: (error) => {
          this.isInitialLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(error.message || 'Failed to load dashboard data');
        }
      });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected async refreshDashboard(): Promise<void> {
    this.isRefreshing.set(true);
    
    try {
      await firstValueFrom(this.tradeOrderService.refreshOrders());
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected async retryDashboardLoad(): Promise<void> {
    this.isRetrying.set(true);
    this.hasError.set(false);
    
    await this.loadDashboard();
    this.isRetrying.set(false);
  }

  protected handleFilterChange(event: FilterChangeEvent): void {
    this.activeFilter.set(event.filterId);
  }

  protected handleClearFilters(): void {
    this.activeFilter.set('all');
  }

  protected handleOrderClick(order: TradeOrderResponseDto): void {
    // Navigate to order details
    this.router.navigate(['/trades', order.id]);
  }

  protected handleTradeAction(action: TradeCardAction): void {
    switch (action.type) {
      case 'close':
        this.handleCloseOrder(action.order);
        break;
      case 'modify':
        this.handleModifyOrder(action.order);
        break;
      case 'duplicate':
        this.handleDuplicateOrder(action.order);
        break;
      case 'view':
        this.handleOrderClick(action.order);
        break;
      default:
        console.warn('Unknown trade action:', action.type);
    }
  }

  protected handleNewOrderClick(): void {
    this.router.navigate(['/trades/new']);
  }

  protected handleFabClick(_event: MouseEvent): void {
    // Primary FAB action - create new order
    this.handleNewOrderClick();
  }

  protected handleFabAction(event: { action: FabAction; event: MouseEvent }): void {
    const { action } = event;
    
    switch (action.id) {
      case 'new-order':
        this.handleNewOrderClick();
        break;
      case 'quick-buy':
        this.handleQuickTrade('buy');
        break;
      case 'quick-sell':
        this.handleQuickTrade('sell');
        break;
      case 'close-all':
        this.handleCloseAllOrders();
        break;
      default:
        console.warn('Unknown FAB action:', action.id);
    }
  }

  private async loadDashboard(): Promise<void> {
    try {
      this.isInitialLoading.set(true);
      await firstValueFrom(this.tradeOrderService.getTradeOrders({ pageSize: 50 }));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      this.hasError.set(true);
      this.errorMessage.set('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      this.isInitialLoading.set(false);
    }
  }

  private handleCloseOrder(order: TradeOrderResponseDto): void {
    // TODO: Implement order closing logic
    console.log('Closing order:', order.id);
    // This would typically call a service method to close the order
  }

  private handleModifyOrder(order: TradeOrderResponseDto): void {
    // Navigate to modify order page
    this.router.navigate(['/trades', order.id, 'modify']);
  }

  private handleDuplicateOrder(order: TradeOrderResponseDto): void {
    // Navigate to new order page with pre-filled data
    this.router.navigate(['/trades/new'], {
      queryParams: { duplicate: order.id }
    });
  }

  private handleQuickTrade(side: 'buy' | 'sell'): void {
    // Navigate to new order page with pre-selected side
    this.router.navigate(['/trades/new'], {
      queryParams: { side }
    });
  }

  private handleCloseAllOrders(): void {
    // TODO: Implement close all orders logic
    console.log('Closing all active orders');
    // This would typically show a confirmation dialog and then close all active orders
  }

  private getTodayOrdersCount(orders: TradeOrderResponseDto[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
  }

  private getActiveOrdersCount(): number {
    return this.tradeOrderService.getCachedOrders().filter(order => order.isActive).length;
  }
}