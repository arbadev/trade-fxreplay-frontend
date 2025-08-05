# Trade Order Detail Page - Design Specification

## Overview
This specification provides complete implementation details for the trade order detail page (`/trades/{orderId}`) in the FX Replay Angular application. The page displays comprehensive information about a single trade order with mobile-first responsive design.

## 1. Component Architecture & File Structure

### Required Files Structure
```
src/app/features/trade-detail/
├── trade-detail.component.ts
├── trade-detail.component.html
├── trade-detail.component.scss
└── trade-detail.component.spec.ts
```

### Component Class Structure

#### trade-detail.component.ts
```typescript
import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, takeUntil, catchError, of, finalize } from 'rxjs';

import { TradeOrderService } from '../../core/services/trade-order.service';
import { TradeOrderResponseDto } from '../../core/models/trade-order.interface';
import { CardComponent } from '../../shared/components/card/card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

interface TradeDetailAction {
  type: 'back' | 'modify' | 'close' | 'duplicate' | 'share' | 'retry';
  orderId?: string;
}

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    LoaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trade-detail.component.html',
  styleUrl: './trade-detail.component.scss'
})
export class TradeDetailComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tradeOrderService = inject(TradeOrderService);
  private readonly destroy$ = new Subject<void>();

  // Signals for reactive state
  readonly order = signal<TradeOrderResponseDto | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly orderId = signal<string | null>(null);

  // Computed properties
  readonly enhancedSymbol = computed(() => {
    const order = this.order();
    if (!order) return null;
    
    const symbol = order.symbol;
    const cleanSymbol = symbol.replace('/', '');
    const match = cleanSymbol.match(/([A-Z]{3,4})([A-Z]{3,4})/);
    
    if (match) {
      const [, base, quote] = match;
      return {
        baseCurrency: base,
        quoteCurrency: quote,
        displayFormat: `${base}/${quote}`,
        assetClass: this.getAssetClass(cleanSymbol)
      };
    }
    
    return {
      baseCurrency: symbol.split('/')[0] || symbol.substring(0, 3),
      quoteCurrency: symbol.split('/')[1] || symbol.substring(3),
      displayFormat: symbol.includes('/') ? symbol : symbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2'),
      assetClass: this.getAssetClass(symbol)
    };
  });

  readonly pnlDisplay = computed(() => {
    const order = this.order();
    if (!order?.profit) return null;
    
    const profit = order.profit;
    const percentage = this.calculatePnLPercentage();
    
    return {
      amount: profit,
      formatted: this.formatPnL(profit),
      percentage: percentage,
      formattedPercentage: percentage ? `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%` : null,
      status: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral'
    };
  });

  readonly canModify = computed(() => {
    const order = this.order();
    return order?.isActive && (order.status === 'pending' || order.status === 'partially_filled');
  });

  readonly canClose = computed(() => {
    const order = this.order();
    return order?.isActive && order.status !== 'cancelled';
  });

  readonly statusBadgeVariant = computed(() => {
    const order = this.order();
    if (!order) return 'default';
    
    switch (order.status) {
      case 'filled': return 'success';
      case 'cancelled':
      case 'rejected': return 'error';
      case 'pending':
      case 'partially_filled': return 'warning';
      case 'expired': return 'info';
      default: return 'default';
    }
  });

  readonly durationText = computed(() => {
    const order = this.order();
    if (!order) return '';
    
    const createdAt = new Date(order.createdAt);
    const endTime = order.filledAt ? new Date(order.filledAt) : new Date();
    const diffMs = endTime.getTime() - createdAt.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Less than a minute';
  });

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.orderId.set(id);
        this.loadOrder(id);
      } else {
        this.handleError('No order ID provided');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrder(orderId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.tradeOrderService.getTradeOrderById(orderId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.handleError(error.message || 'Failed to load order details');
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(order => {
      if (order) {
        this.order.set(order);
      }
    });
  }

  protected handleAction(action: TradeDetailAction): void {
    switch (action.type) {
      case 'back':
        this.router.navigate(['/trades']);
        break;
      case 'modify':
        // Navigate to modify order (implement based on requirements)
        console.log('Modify order:', this.order()?.id);
        break;
      case 'close':
        // Close order (implement based on requirements)
        console.log('Close order:', this.order()?.id);
        break;
      case 'duplicate':
        // Navigate to new order with pre-filled data
        this.router.navigate(['/trades/new'], {
          state: { duplicateFrom: this.order() }
        });
        break;
      case 'share':
        this.shareOrder();
        break;
      case 'retry':
        const id = this.orderId();
        if (id) {
          this.loadOrder(id);
        }
        break;
    }
  }

  private shareOrder(): void {
    const order = this.order();
    if (!order) return;

    const shareData = {
      title: `Trade Order ${order.symbol}`,
      text: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol} at ${order.price}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification (implement based on your notification system)
      console.log('Link copied to clipboard');
    }
  }

  private handleError(message: string): void {
    this.error.set(message);
    this.order.set(null);
  }

  private calculatePnLPercentage(): number | null {
    const order = this.order();
    if (!order?.profit || !order.price || !order.quantity) return null;
    
    const investment = order.price * order.quantity;
    return (order.profit / investment) * 100;
  }

  private getAssetClass(symbol: string): 'crypto' | 'forex' | 'commodity' {
    const cleanSymbol = symbol.replace('/', '').toUpperCase();
    
    if (cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH') || cleanSymbol.includes('LTC') || 
        cleanSymbol.includes('ADA') || cleanSymbol.includes('DOT')) {
      return 'crypto';
    }
    
    if (cleanSymbol.includes('XAU') || cleanSymbol.includes('XAG') || cleanSymbol.includes('WTI')) {
      return 'commodity';
    }
    
    return 'forex';
  }

  private formatPnL(profit: number): string {
    const formatted = Math.abs(profit).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return profit >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: this.getPriceDecimals(),
      maximumFractionDigits: this.getPriceDecimals(),
      useGrouping: true
    }).format(price);
  }

  protected formatQuantity(quantity: number): string {
    return quantity.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    });
  }

  protected formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected formatStatus(status: string): string {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getPriceDecimals(): number {
    const order = this.order();
    if (!order) return 4;
    
    const symbol = order.symbol;
    if (symbol.includes('JPY')) return 3;
    if (symbol.includes('BTC')) return 2;
    if (symbol.includes('ETH')) return 4;
    return 4;
  }
}
```

## 2. Template Structure

#### trade-detail.component.html
```html
<div class="trade-detail" [attr.data-status]="order()?.status">
  <!-- Loading State -->
  @if (isLoading()) {
    <div class="trade-detail__loading">
      <app-loader size="lg" message="Loading order details..."></app-loader>
    </div>
  }

  <!-- Error State -->
  @else if (error()) {
    <div class="trade-detail__error">
      <app-card variant="error" padding="lg">
        <div class="error-content">
          <svg class="error-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h2 class="error-title">Failed to Load Order</h2>
          <p class="error-message">{{ error() }}</p>
          <div class="error-actions">
            <app-button 
              variant="primary" 
              (onClick)="handleAction({ type: 'retry' })"
              aria-label="Retry loading order">
              Retry
            </app-button>
            <app-button 
              variant="secondary" 
              (onClick)="handleAction({ type: 'back' })"
              aria-label="Go back to trades list">
              Back to Trades
            </app-button>
          </div>
        </div>
      </app-card>
    </div>
  }

  <!-- Success State - Order Details -->
  @else if (order()) {
    <div class="trade-detail__content">
      <!-- Header with Back Navigation -->
      <header class="trade-detail__header">
        <div class="header-nav">
          <app-button 
            variant="ghost" 
            size="sm"
            (onClick)="handleAction({ type: 'back' })"
            aria-label="Go back to trades list">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </app-button>
          <div class="header-actions">
            <app-button 
              variant="ghost" 
              size="sm"
              (onClick)="handleAction({ type: 'share' })"
              aria-label="Share order details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </app-button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="trade-detail__hero">
        <app-card variant="hero" padding="lg" [tradeSide]="order()!.side">
          <div class="hero-content">
            <div class="hero-primary">
              <div class="symbol-display">
                <h1 class="symbol-pair" [attr.aria-label]="'Trading pair: ' + enhancedSymbol()?.displayFormat">
                  {{ enhancedSymbol()?.displayFormat }}
                </h1>
                <span class="asset-class">{{ enhancedSymbol()?.assetClass | titlecase }}</span>
              </div>
              
              <div class="trade-side-hero">
                <span class="side-indicator side-indicator--{{ order()!.side }}" 
                      [attr.aria-label]="order()!.side.toUpperCase() + ' order'">
                  {{ order()!.side.toUpperCase() }}
                  @if (order()!.side === 'buy') {
                    <svg class="side-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="7 13 12 8 17 13"></polyline>
                      <polyline points="12 18 12 8"></polyline>
                    </svg>
                  } @else {
                    <svg class="side-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <polyline points="12 5 12 15"></polyline>
                    </svg>
                  }
                </span>
              </div>
            </div>

            @if (pnlDisplay()) {
              <div class="hero-pnl">
                <div class="pnl-amount pnl-amount--{{ pnlDisplay()!.status }}">
                  <span class="pnl-value" [attr.aria-label]="'Profit and loss: ' + pnlDisplay()!.formatted">
                    {{ pnlDisplay()!.formatted }}
                  </span>
                  @if (pnlDisplay()!.formattedPercentage) {
                    <span class="pnl-percentage" [attr.aria-label]="'Percentage: ' + pnlDisplay()!.formattedPercentage">
                      {{ pnlDisplay()!.formattedPercentage }}
                    </span>
                  }
                </div>
              </div>
            }

            <div class="hero-status">
              <app-badge 
                [variant]="statusBadgeVariant()"
                size="md"
                [attr.aria-label]="'Order status: ' + formatStatus(order()!.status)">
                {{ formatStatus(order()!.status) }}
              </app-badge>
            </div>
          </div>
        </app-card>
      </section>

      <!-- Order Details Grid -->
      <section class="trade-detail__details">
        <div class="details-grid">
          <!-- Position Information -->
          <app-card variant="default" padding="md">
            <h2 class="section-title">Position Details</h2>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">Position Size</span>
                <span class="detail-value" [attr.aria-label]="'Position size: ' + formatQuantity(order()!.quantity) + ' ' + enhancedSymbol()?.baseCurrency">
                  {{ formatQuantity(order()!.quantity) }} {{ enhancedSymbol()?.baseCurrency }}
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Order Type</span>
                <span class="detail-value">{{ order()!.type.toUpperCase() }}</span>
              </div>

              @if (order()!.price) {
                <div class="detail-row">
                  <span class="detail-label">Entry Price</span>
                  <span class="detail-value detail-value--price" [attr.aria-label]="'Entry price: ' + formatPrice(order()!.price!)">
                    {{ formatPrice(order()!.price!) }}
                  </span>
                </div>
              }

              @if (order()!.filledPrice) {
                <div class="detail-row">
                  <span class="detail-label">Fill Price</span>
                  <span class="detail-value detail-value--price" [attr.aria-label]="'Fill price: ' + formatPrice(order()!.filledPrice!)">
                    {{ formatPrice(order()!.filledPrice!) }}
                  </span>
                </div>
              }

              @if (order()!.filledQuantity && order()!.filledQuantity !== order()!.quantity) {
                <div class="detail-row">
                  <span class="detail-label">Filled Quantity</span>
                  <span class="detail-value">
                    {{ formatQuantity(order()!.filledQuantity!) }} / {{ formatQuantity(order()!.quantity) }}
                  </span>
                </div>
              }
            </div>
          </app-card>

          <!-- Risk Management -->
          @if (order()!.stopLoss || order()!.takeProfit) {
            <app-card variant="default" padding="md">
              <h2 class="section-title">Risk Management</h2>
              <div class="detail-rows">
                @if (order()!.stopLoss) {
                  <div class="detail-row detail-row--risk">
                    <span class="detail-label">Stop Loss</span>
                    <span class="detail-value detail-value--loss" [attr.aria-label]="'Stop loss: ' + formatPrice(order()!.stopLoss!)">
                      {{ formatPrice(order()!.stopLoss!) }}
                    </span>
                  </div>
                }

                @if (order()!.takeProfit) {
                  <div class="detail-row detail-row--risk">
                    <span class="detail-label">Take Profit</span>
                    <span class="detail-value detail-value--profit" [attr.aria-label]="'Take profit: ' + formatPrice(order()!.takeProfit!)">
                      {{ formatPrice(order()!.takeProfit!) }}
                    </span>
                  </div>
                }
              </div>
            </app-card>
          }

          <!-- Financial Summary -->
          <app-card variant="default" padding="md">
            <h2 class="section-title">Financial Summary</h2>
            <div class="detail-rows">
              @if (order()!.commission) {
                <div class="detail-row">
                  <span class="detail-label">Commission</span>
                  <span class="detail-value detail-value--fee">
                    {{ order()!.commission | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                </div>
              }

              @if (order()!.swap) {
                <div class="detail-row">
                  <span class="detail-label">Swap</span>
                  <span class="detail-value detail-value--fee">
                    {{ order()!.swap | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                </div>
              }

              @if (order()!.profit !== undefined) {
                <div class="detail-row detail-row--highlight">
                  <span class="detail-label">Net P&L</span>
                  <span class="detail-value detail-value--{{ pnlDisplay()?.status }}" [attr.aria-label]="'Net profit and loss: ' + pnlDisplay()?.formatted">
                    {{ pnlDisplay()?.formatted }}
                  </span>
                </div>
              }
            </div>
          </app-card>

          <!-- Timing Information -->
          <app-card variant="default" padding="md">
            <h2 class="section-title">Timing</h2>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">Created</span>
                <span class="detail-value" [attr.aria-label]="'Created: ' + formatDateTime(order()!.createdAt)">
                  {{ formatDateTime(order()!.createdAt) }}
                </span>
              </div>

              @if (order()!.filledAt) {
                <div class="detail-row">
                  <span class="detail-label">Filled</span>
                  <span class="detail-value" [attr.aria-label]="'Filled: ' + formatDateTime(order()!.filledAt!)">
                    {{ formatDateTime(order()!.filledAt!) }}
                  </span>
                </div>
              }

              @if (durationText()) {
                <div class="detail-row">
                  <span class="detail-label">Duration</span>
                  <span class="detail-value" [attr.aria-label]="'Duration: ' + durationText()">
                    {{ durationText() }}
                  </span>
                </div>
              }
            </div>
          </app-card>

          <!-- Order Metadata -->
          <app-card variant="default" padding="md">
            <h2 class="section-title">Order Information</h2>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">Order ID</span>
                <span class="detail-value detail-value--mono" [attr.aria-label]="'Order ID: ' + order()!.id">
                  {{ order()!.id }}
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Account ID</span>
                <span class="detail-value detail-value--mono">{{ order()!.accountId }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Last Updated</span>
                <span class="detail-value">{{ formatDateTime(order()!.updatedAt) }}</span>
              </div>
            </div>
          </app-card>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="trade-detail__actions">
        <div class="actions-grid">
          @if (canModify()) {
            <app-button 
              variant="secondary" 
              size="lg"
              (onClick)="handleAction({ type: 'modify' })"
              [attr.aria-label]="'Modify order ' + order()!.symbol">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Modify Order
            </app-button>
          }

          @if (canClose()) {
            <app-button 
              [variant]="order()!.side === 'buy' ? 'sell' : 'buy'"
              size="lg"
              (onClick)="handleAction({ type: 'close' })"
              [attr.aria-label]="'Close order ' + order()!.symbol">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              Close Position
            </app-button>
          }

          <app-button 
            variant="outline" 
            size="lg"
            (onClick)="handleAction({ type: 'duplicate' })"
            [attr.aria-label]="'Duplicate order ' + order()!.symbol">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Duplicate Order
          </app-button>
        </div>
      </section>
    </div>
  }
</div>
```

## 3. SCSS Styling Specifications

#### trade-detail.component.scss
```scss
@use '../../../styles/mixins' as *;
@use '../../../styles/variables' as *;

.trade-detail {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding-bottom: env(safe-area-inset-bottom);

  &[data-status="filled"] .trade-detail__hero app-card {
    border-left: 4px solid var(--color-success);
  }

  &[data-status="pending"] .trade-detail__hero app-card {
    border-left: 4px solid var(--color-warning);
  }

  &[data-status="cancelled"] .trade-detail__hero app-card,
  &[data-status="rejected"] .trade-detail__hero app-card {
    border-left: 4px solid var(--color-error);
  }
}

// Loading State
.trade-detail__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-xl);
}

// Error State
.trade-detail__error {
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .error-content {
    text-align: center;
    max-width: 400px;
  }

  .error-icon {
    color: var(--color-error);
    margin-bottom: var(--spacing-md);
  }

  .error-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .error-message {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.5;
  }

  .error-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
    flex-wrap: wrap;
  }
}

// Header Section
.trade-detail__header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;

  .header-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-xs);
  }
}

// Hero Section
.trade-detail__hero {
  padding: var(--spacing-lg);

  .hero-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .hero-primary {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .symbol-display {
    flex: 1;
  }

  .symbol-pair {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    font-family: var(--font-mono);
    letter-spacing: -0.02em;
  }

  .asset-class {
    display: inline-block;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    font-weight: var(--font-weight-medium);
    letter-spacing: 0.05em;
    margin-top: var(--spacing-xs);
  }

  .trade-side-hero {
    flex-shrink: 0;
  }

  .side-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.05em;

    &--buy {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    &--sell {
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    .side-arrow {
      width: 16px;
      height: 16px;
    }
  }

  .hero-pnl {
    text-align: center;
    margin: var(--spacing-md) 0;
  }

  .pnl-amount {
    &--profit .pnl-value {
      color: var(--color-success);
    }

    &--loss .pnl-value {
      color: var(--color-error);
    }

    &--neutral .pnl-value {
      color: var(--color-text-secondary);
    }
  }

  .pnl-value {
    display: block;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-mono);
    margin-bottom: var(--spacing-xs);
  }

  .pnl-percentage {
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .hero-status {
    display: flex;
    justify-content: center;
  }
}

// Details Section
.trade-detail__details {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.details-grid {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: 1fr;

  @media (min-width: $breakpoint-md) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: $breakpoint-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;

  &--highlight {
    padding: var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--border-radius-sm);
    margin: var(--spacing-sm) 0;
  }

  &--risk {
    .detail-value {
      font-family: var(--font-mono);
      font-weight: var(--font-weight-medium);
    }
  }
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  min-width: 120px;
}

.detail-value {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  text-align: right;
  word-break: break-all;

  &--price {
    font-family: var(--font-mono);
    font-weight: var(--font-weight-semibold);
  }

  &--mono {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
  }

  &--fee {
    color: var(--color-text-tertiary);
  }

  &--profit {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
  }

  &--loss {
    color: var(--color-error);
    font-weight: var(--font-weight-semibold);
  }
}

// Actions Section
.trade-detail__actions {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  position: sticky;
  bottom: 0;

  .actions-grid {
    display: grid;
    gap: var(--spacing-sm);
    grid-template-columns: 1fr;

    @media (min-width: $breakpoint-sm) {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
  }
}

// Responsive Design
@media (max-width: $breakpoint-sm) {
  .trade-detail__header {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .trade-detail__hero {
    padding: var(--spacing-md);

    .symbol-pair {
      font-size: var(--font-size-2xl);
    }

    .hero-primary {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }
  }

  .trade-detail__details {
    padding: 0 var(--spacing-md) var(--spacing-md);
  }

  .trade-detail__actions {
    padding: var(--spacing-md);
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .detail-label {
    min-width: auto;
  }

  .detail-value {
    text-align: left;
    word-break: break-word;
  }
}

// Touch Improvements
@media (hover: none) and (pointer: coarse) {
  .trade-detail__actions .actions-grid {
    gap: var(--spacing-md);
  }

  app-button {
    min-height: var(--touch-target-min);
  }
}

// Dark/Light Theme Support
:host-context(.theme-light) {
  .trade-detail {
    background: var(--color-bg-primary-light);
  }

  .trade-detail__header {
    background: var(--color-bg-secondary-light);
  }
}

// Print Styles
@media print {
  .trade-detail__header,
  .trade-detail__actions {
    display: none;
  }

  .trade-detail__content {
    padding: 0;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}
```

## 4. Data Flow & State Management

### Input/Output Requirements
- **Route Parameter**: `id` (string) - The trade order ID
- **Navigation**: Programmatic navigation back to trades list
- **State**: Reactive signals for order data, loading, and error states

### Signal Usage
```typescript
// Primary state signals
readonly order = signal<TradeOrderResponseDto | null>(null);
readonly isLoading = signal<boolean>(true);
readonly error = signal<string | null>(null);
readonly orderId = signal<string | null>(null);

// Computed signals for derived data
readonly enhancedSymbol = computed(() => { /* symbol parsing logic */ });
readonly pnlDisplay = computed(() => { /* P&L formatting logic */ });
readonly canModify = computed(() => { /* modification permission logic */ });
readonly canClose = computed(() => { /* close permission logic */ });
```

### API Integration
- Use existing `TradeOrderService.getTradeOrderById(orderId: string)`
- Handle loading states with signal updates
- Implement error handling with fallback to mock data
- Support offline functionality

### Error Handling
1. **Network Errors**: Retry mechanism with user feedback
2. **404 Not Found**: Clear error message with navigation back
3. **Invalid ID**: Validation and user guidance
4. **Loading Timeout**: Fallback to cached data if available

## 5. Visual Design Specifications

### Layout Hierarchy
```
├── Header (sticky, back navigation, share action)
├── Hero Section (symbol, P&L, status)
├── Details Grid (responsive cards)
│   ├── Position Details
│   ├── Risk Management (conditional)
│   ├── Financial Summary
│   ├── Timing Information
│   └── Order Metadata
└── Actions (sticky bottom, modify/close/duplicate)
```

### Color Usage Guidelines

#### Status-Based Colors
- **Filled Orders**: Success green (#10B981) left border
- **Pending Orders**: Warning yellow (#F59E0B) left border
- **Cancelled/Rejected**: Error red (#EF4444) left border

#### P&L Display
- **Profit**: Success green (#10B981) text
- **Loss**: Error red (#EF4444) text
- **Neutral**: Secondary text (#CBD5E1)

#### Side Indicators
- **Buy Orders**: Success green background/text
- **Sell Orders**: Error red background/text

### Typography Specifications
- **Symbol Display**: 3xl size, bold weight, monospace font
- **P&L Values**: 2xl size, bold weight, monospace font
- **Price Values**: Medium size, semibold weight, monospace font
- **Labels**: Small size, medium weight, regular font
- **Body Text**: Medium size, medium weight, regular font

### Spacing & Sizing (4px Grid)
- **Component Gaps**: 16px (md)
- **Section Padding**: 24px (lg)
- **Card Padding**: 16px (md)
- **Element Spacing**: 8px (sm), 12px, 16px (md)
- **Touch Targets**: Minimum 44px height

### Mobile-First Responsive Behavior

#### Breakpoints
- **Mobile**: < 640px (single column, vertical layout)
- **Tablet**: 640px - 1024px (2-column grid)
- **Desktop**: > 1024px (3-column grid, sidebar potential)

#### Mobile Optimizations
- Sticky header and footer for navigation
- Single-column card layout
- Larger touch targets (44px minimum)
- Simplified detail rows (vertical stacking)
- Optimized font sizes for readability

## 6. Interactive Elements

### Back Navigation
```typescript
protected handleAction(action: TradeDetailAction): void {
  if (action.type === 'back') {
    this.router.navigate(['/trades']);
  }
}
```

### Action Buttons
- **Modify**: Navigate to edit form (conditional on order status)
- **Close**: Execute close position (conditional on order status)
- **Duplicate**: Navigate to new order form with pre-filled data
- **Share**: Native share API or clipboard copy

### Share Functionality
```typescript
private shareOrder(): void {
  const shareData = {
    title: `Trade Order ${order.symbol}`,
    text: `${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData);
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
}
```

### Error Retry Mechanism
```typescript
protected handleAction(action: TradeDetailAction): void {
  if (action.type === 'retry') {
    const id = this.orderId();
    if (id) {
      this.loadOrder(id);
    }
  }
}
```

## 7. Accessibility Requirements

### ARIA Labels and Roles
```html
<!-- Example implementations -->
<h1 [attr.aria-label]="'Trading pair: ' + enhancedSymbol()?.displayFormat">
<span [attr.aria-label]="'Profit and loss: ' + pnlDisplay()!.formatted">
<button [attr.aria-label]="'Modify order ' + order()!.symbol">
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order from top to bottom
- Enter/Space activation for buttons
- Escape key for modal dismissal (if applicable)

### Screen Reader Announcements
- Loading state announcements
- Error state descriptions
- Success action confirmations
- Status change notifications

### Color Contrast Compliance
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Test with accessibility tools
- Provide alternative indicators beyond color

## 8. Technical Implementation Details

### Route Configuration Updates
The route is already configured in `app.routes.ts`:
```typescript
{
  path: 'trades/:id',
  loadComponent: () => import('./features/trade-detail/trade-detail.component')
    .then(m => m.TradeDetailComponent),
  title: 'Trade Details | FX Replay'
}
```

### Service Method Requirements
The `TradeOrderService.getTradeOrderById()` method already exists and provides:
- Observable-based data fetching
- Error handling with fallback to mock data
- Type-safe response with `TradeOrderResponseDto`

### Component Lifecycle
```typescript
ngOnInit(): void {
  // Subscribe to route parameters
  // Load order data
  // Handle loading states
}

ngOnDestroy(): void {
  // Clean up subscriptions
  // Prevent memory leaks
}
```

### Performance Optimizations
- **OnPush Change Detection**: Implemented for optimal performance
- **Lazy Loading**: Component is loaded only when route is accessed
- **Signal-based State**: Minimal re-rendering with computed values
- **Image Optimization**: Use appropriate formats and sizes
- **Bundle Splitting**: Separate chunk for trade detail feature

## 9. Implementation Checklist

### Phase 1: Basic Structure
- [ ] Create component files in correct directory
- [ ] Implement basic template structure
- [ ] Add route parameter handling
- [ ] Implement loading and error states

### Phase 2: Data Integration
- [ ] Connect to TradeOrderService
- [ ] Implement error handling and retry
- [ ] Add computed properties for display data
- [ ] Test with mock data

### Phase 3: UI Implementation
- [ ] Implement hero section with P&L display
- [ ] Create responsive details grid
- [ ] Add action buttons with conditions
- [ ] Implement sticky header and footer

### Phase 4: Styling & Polish
- [ ] Apply mobile-first SCSS styles
- [ ] Implement responsive design
- [ ] Add hover states and transitions
- [ ] Test across different screen sizes

### Phase 5: Accessibility & Testing
- [ ] Add ARIA labels and roles
- [ ] Test keyboard navigation
- [ ] Verify color contrast ratios
- [ ] Test with screen readers
- [ ] Write unit tests

### Phase 6: Integration Testing
- [ ] Test navigation flow
- [ ] Verify API integration
- [ ] Test error scenarios
- [ ] Performance testing
- [ ] Cross-browser testing

This specification provides a complete blueprint for implementing the trade order detail page with professional-grade quality, mobile-first design, and full accessibility compliance.