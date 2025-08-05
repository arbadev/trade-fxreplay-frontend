import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TradeOrderService } from '../../../../core/services/trade-order.service';
import { PortfolioStats } from '../../../../core/models/trade-order.interface';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-portfolio-stats',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="portfolio-stats">
      <div class="portfolio-stats__header">
        <h2 class="portfolio-stats__title">Portfolio Overview</h2>
        <button 
          class="portfolio-stats__refresh"
          [class.loading]="isRefreshing()"
          [disabled]="isRefreshing()"
          (click)="refreshStats()"
          aria-label="Refresh portfolio statistics">
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

      @if (isLoading()) {
        <div class="portfolio-stats__loading">
          <div class="stat-card stat-card--loading" [attr.aria-label]="'Loading portfolio statistics'">
            <div class="stat-card__skeleton">
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--value"></div>
            </div>
          </div>
          <div class="stat-card stat-card--loading">
            <div class="stat-card__skeleton">
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--value"></div>
            </div>
          </div>
          <div class="stat-card stat-card--loading">
            <div class="stat-card__skeleton">
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--value"></div>
            </div>
          </div>
          <div class="stat-card stat-card--loading">
            <div class="stat-card__skeleton">
              <div class="skeleton skeleton--title"></div>
              <div class="skeleton skeleton--value"></div>
            </div>
          </div>
        </div>
      } @else if (stats()) {
        <div class="portfolio-stats__grid" role="group" aria-label="Portfolio statistics">
          <!-- Total P&L -->
          <div class="stat-card stat-card--pnl" [class]="totalPLClass()">
            <div class="stat-card__header">
              <span class="stat-card__label">Total P&L</span>
              <span class="stat-card__trend" [class]="totalPLTrendClass()">
                @if (totalPLPercentage() !== 0) {
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    @if (totalPLPercentage() > 0) {
                      <polyline points="18 15 12 9 6 15"></polyline>
                    } @else {
                      <polyline points="6 9 12 15 18 9"></polyline>
                    }
                  </svg>
                  {{ totalPLPercentage() > 0 ? '+' : '' }}{{ totalPLPercentage().toFixed(1) }}%
                }
              </span>
            </div>
            <div class="stat-card__value" [attr.aria-label]="'Total profit and loss: ' + formattedTotalPL()">
              {{ formattedTotalPL() }}
            </div>
          </div>

          <!-- Active Orders -->
          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Active Orders</span>
              <span class="stat-card__icon stat-card__icon--active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </span>
            </div>
            <div class="stat-card__value" [attr.aria-label]="'Active orders: ' + stats()!.activeOrders">
              {{ stats()!.activeOrders }}
            </div>
            <div class="stat-card__subtitle">
              {{ stats()!.totalOrders }} total orders
            </div>
          </div>

          <!-- Win Rate -->
          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Win Rate</span>
              <span class="stat-card__icon stat-card__icon--success" [class]="winRateIconClass()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 11l3 3 8-8"></path>
                </svg>
              </span>
            </div>
            <div class="stat-card__value" [class]="winRateValueClass()" [attr.aria-label]="'Win rate: ' + stats()!.winRate.toFixed(1) + ' percent'">
              {{ stats()!.winRate.toFixed(1) }}%
            </div>
            <div class="stat-card__subtitle">
              {{ stats()!.winningTrades }}W / {{ stats()!.losingTrades }}L
            </div>
          </div>

          <!-- Today's Performance -->
          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Today</span>
              <span class="stat-card__icon stat-card__icon--info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
            </div>
            <div class="stat-card__value" [class]="todayPLClass()" [attr.aria-label]="'Today performance: ' + formattedTodayPL()">
              {{ formattedTodayPL() }}
            </div>
            <div class="stat-card__subtitle">
              {{ todayOrdersCount() }} orders today
            </div>
          </div>
        </div>
      } @else {
        <div class="portfolio-stats__empty" role="status" aria-label="No portfolio data available">
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-state__icon">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="m17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h3 class="empty-state__title">No Trading Data</h3>
            <p class="empty-state__description">
              Start trading to see your portfolio statistics
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './portfolio-stats.component.scss'
})
export class PortfolioStatsComponent implements OnInit {
  private readonly tradeOrderService = inject(TradeOrderService);

  // Component state
  protected readonly isLoading = signal(true);
  protected readonly isRefreshing = signal(false);
  protected readonly stats = signal<PortfolioStats | null>(null);

  // Computed values for UI formatting
  protected readonly formattedTotalPL = computed(() => {
    const pnl = this.stats()?.totalProfitLoss ?? 0;
    const formatted = Math.abs(pnl).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return pnl >= 0 ? `+${formatted}` : `-${formatted}`;
  });

  protected readonly totalPLClass = computed(() => {
    const pnl = this.stats()?.totalProfitLoss ?? 0;
    return pnl > 0 ? 'stat-card--profit' : pnl < 0 ? 'stat-card--loss' : 'stat-card--neutral';
  });

  protected readonly totalPLTrendClass = computed(() => {
    const pnl = this.stats()?.totalProfitLoss ?? 0;
    return pnl > 0 ? 'trend--up' : pnl < 0 ? 'trend--down' : 'trend--neutral';
  });

  protected readonly totalPLPercentage = computed(() => {
    // Mock calculation - in real app this would be based on initial capital
    const pnl = this.stats()?.totalProfitLoss ?? 0;
    const mockInitialCapital = 10000; // $10,000 initial capital
    return (pnl / mockInitialCapital) * 100;
  });

  protected readonly winRateIconClass = computed(() => {
    const winRate = this.stats()?.winRate ?? 0;
    return winRate >= 70 ? 'stat-card__icon--success' : winRate >= 50 ? 'stat-card__icon--warning' : 'stat-card__icon--error';
  });

  protected readonly winRateValueClass = computed(() => {
    const winRate = this.stats()?.winRate ?? 0;
    return winRate >= 70 ? 'value--success' : winRate >= 50 ? 'value--warning' : 'value--error';
  });

  protected readonly todayOrdersCount = computed(() => {
    // This would typically come from a filtered count of today's orders
    // For now, we'll show a mock value
    return Math.floor((this.stats()?.activeOrders ?? 0) * 0.3);
  });

  protected readonly formattedTodayPL = computed(() => {
    // Mock today's P&L calculation - in real app this would be calculated from today's orders
    const totalPL = this.stats()?.totalProfitLoss ?? 0;
    const todayPL = totalPL * 0.1; // Mock: 10% of total P&L happened today
    
    const formatted = Math.abs(todayPL).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return todayPL >= 0 ? `+${formatted}` : `-${formatted}`;
  });

  protected readonly todayPLClass = computed(() => {
    const totalPL = this.stats()?.totalProfitLoss ?? 0;
    const todayPL = totalPL * 0.1; // Mock calculation
    return todayPL > 0 ? 'value--success' : todayPL < 0 ? 'value--error' : 'value--neutral';
  });

  constructor() {
    // Subscribe to portfolio stats from TradeOrderService
    this.tradeOrderService.portfolioStats$
      .pipe(takeUntilDestroyed())
      .subscribe(stats => {
        this.stats.set(stats as PortfolioStats | null);
        this.isLoading.set(false);
      });
  }

  ngOnInit(): void {
    this.loadPortfolioStats();
  }

  protected async refreshStats(): Promise<void> {
    this.isRefreshing.set(true);
    
    try {
      await this.tradeOrderService.refreshOrders().toPromise();
    } catch (error) {
      console.error('Failed to refresh portfolio stats:', error);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  private async loadPortfolioStats(): Promise<void> {
    try {
      // Load initial data - this will trigger the portfolioStats$ observable
      await this.tradeOrderService.getTradeOrders({ pageSize: 50 }).toPromise();
    } catch (error) {
      console.error('Failed to load portfolio stats:', error);
      this.isLoading.set(false);
    }
  }
}