import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradeOrderResponseDto } from '../../../core/models/trade-order.interface';
import { CardComponent } from '../card/card.component';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';

export interface TradeCardAction {
  type: 'close' | 'modify' | 'view' | 'duplicate';
  order: TradeOrderResponseDto;
}

@Component({
  selector: 'app-trade-card',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card 
      [variant]="'trade'"
      [padding]="'md'"
      [clickable]="clickable()"
      [tradeSide]="getCardSide()"
      [class]="cardClasses()"
      (click)="handleCardClick($event)">
      
      <!-- PRIMARY LEVEL: Hero Information -->
      <div class="trade-card__primary" slot="header">
        <div class="trade-card__currency-hero">
          <div class="currency-pair">
            <span class="currency-pair__display" [attr.aria-label]="'Trading pair: ' + enhancedSymbol().displayFormat">
              {{ enhancedSymbol().displayFormat }}
            </span>
            <span class="currency-pair__class">{{ enhancedSymbol().assetClass }}</span>
          </div>
          <div class="trade-side">
            <span class="trade-side__indicator trade-side__indicator--{{ order().side }}" [attr.aria-label]="order().side.toUpperCase() + ' order'">
              {{ order().side.toUpperCase() }}
              @if (order().side === 'buy') {
                <svg class="trade-side__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="7 13 12 8 17 13"></polyline>
                  <polyline points="12 18 12 8"></polyline>
                </svg>
              } @else {
                <svg class="trade-side__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <polyline points="12 5 12 15"></polyline>
                </svg>
              }
            </span>
          </div>
        </div>
        
        @if (pnlDisplay()) {
          <div class="trade-card__pnl-hero">
            <div class="pnl-display pnl-display--{{ pnlDisplay()!.status }}">
              <span class="pnl-display__amount" [attr.aria-label]="'Profit and loss: ' + pnlDisplay()!.formatted">
                {{ pnlDisplay()!.formatted }}
              </span>
              @if (pnlDisplay()!.formattedPercentage) {
                <span class="pnl-display__percentage" [attr.aria-label]="'Percentage: ' + pnlDisplay()!.formattedPercentage">
                  {{ pnlDisplay()!.formattedPercentage }}
                </span>
              }
            </div>
          </div>
        }
        
        <div class="trade-card__status-section">
          <app-badge 
            [variant]="getStatusBadgeVariant()"
            [size]="'sm'"
            class="trade-card__status-badge">
            {{ formatStatus() }}
          </app-badge>
        </div>
      </div>
      
      <!-- SECONDARY LEVEL: Supporting Information -->
      <div class="trade-card__secondary">
        <div class="trade-details-grid">
          <div class="trade-detail">
            <span class="trade-detail__label">Position Size</span>
            <span class="trade-detail__value" [attr.aria-label]="'Position size: ' + formatQuantityWithUnit()">
              {{ formatQuantityWithUnit() }}
            </span>
          </div>
          
          <div class="trade-detail">
            <span class="trade-detail__label">Entry Price</span>
            <span class="trade-detail__value" [attr.aria-label]="'Entry price: ' + formatPriceWithProfessionalPrecision(order().price!)">
              {{ formatPriceWithProfessionalPrecision(order().price!) }}
            </span>
          </div>
          
          @if (order().status === 'filled' || order().isActive) {
            <div class="trade-detail">
              <span class="trade-detail__label">{{ order().isActive ? 'Current' : 'Exit' }} Price</span>
              <span class="trade-detail__value" [attr.aria-label]="(order().isActive ? 'Current' : 'Exit') + ' price: ' + formatCurrentPrice()">
                {{ formatCurrentPrice() }}
              </span>
            </div>
          }
          
          <div class="trade-detail">
            <span class="trade-detail__label">Order Type</span>
            <span class="trade-detail__value">
              {{ order().type.toUpperCase() }}
            </span>
          </div>
          
          @if (order().stopLoss) {
            <div class="trade-detail trade-detail--risk">
              <span class="trade-detail__label">Stop Loss</span>
              <span class="trade-detail__value trade-detail__value--loss" [attr.aria-label]="'Stop loss: ' + formatPriceWithProfessionalPrecision(order().stopLoss!)">
                {{ formatPriceWithProfessionalPrecision(order().stopLoss!) }}
              </span>
            </div>
          }
          
          @if (order().takeProfit) {
            <div class="trade-detail trade-detail--risk">
              <span class="trade-detail__label">Take Profit</span>
              <span class="trade-detail__value trade-detail__value--profit" [attr.aria-label]="'Take profit: ' + formatPriceWithProfessionalPrecision(order().takeProfit!)">
                {{ formatPriceWithProfessionalPrecision(order().takeProfit!) }}
              </span>
            </div>
          }
          
          @if (showFees() && (order().commission || order().swap)) {
            <div class="trade-detail">
              <span class="trade-detail__label">Fees</span>
              <span class="trade-detail__value trade-detail__fees" [attr.aria-label]="'Total fees: ' + formatFees()">
                {{ formatFees() }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- TERTIARY LEVEL: Metadata -->
      <div class="trade-card__tertiary">
        <span class="trade-meta" [attr.aria-label]="'Order ID: ' + order().id.slice(-8)">
          #{{ order().id.slice(-8) }}
        </span>
        <span class="trade-meta" [attr.aria-label]="'Created: ' + formatTimestamp()">
          {{ formatTimestamp() }}
        </span>
        @if (showDuration() && durationText()) {
          <span class="trade-meta" [attr.aria-label]="'Duration: ' + durationText()">
            {{ durationText() }}
          </span>
        }
      </div>
        
      <!-- Expandable Details (if needed) -->
      @if (showExpandableDetails() && isExpanded()) {
        <div class="trade-card__expandable" [@expandCollapse]>
          <div class="trade-card__expandable-grid">
            @if (order().filledAt) {
              <div class="trade-detail">
                <span class="trade-detail__label">Filled At</span>
                <span class="trade-detail__value">{{ formatDate(order().filledAt!) }}</span>
              </div>
            }
            
            @if (order().commission) {
              <div class="trade-detail">
                <span class="trade-detail__label">Commission</span>
                <span class="trade-detail__value">{{ formatCurrency(order().commission!) }}</span>
              </div>
            }
            
            @if (order().swap) {
              <div class="trade-detail">
                <span class="trade-detail__label">Swap</span>
                <span class="trade-detail__value">{{ formatCurrency(order().swap!) }}</span>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- Card Footer with Actions -->
      @if (showActions()) {
        <div class="trade-card__actions" slot="footer">
          <div class="trade-card__actions-row">
            @if (showExpandableDetails()) {
              <app-button
                [variant]="'ghost'"
                [size]="'sm'"
                (onClick)="toggleExpanded()"
                [attr.aria-label]="isExpanded() ? 'Collapse details' : 'Expand details'">
                {{ isExpanded() ? 'Less' : 'More' }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                     [style.transform]="isExpanded() ? 'rotate(180deg)' : 'rotate(0deg)'"
                     style="transition: transform 0.2s ease">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </app-button>
            }
            
            <div class="trade-card__action-buttons">
              @if (canModify()) {
                <app-button
                  [variant]="'secondary'"
                  [size]="'sm'"
                  [disabled]="disabled()"
                  (onClick)="handleAction('modify', $event)"
                  [attr.aria-label]="'Modify order ' + order().symbol">
                  Modify
                </app-button>
              }
              
              @if (canClose()) {
                <app-button
                  [variant]="order().side === 'buy' ? 'sell' : 'buy'"
                  [size]="'sm'"
                  [disabled]="disabled()"
                  (onClick)="handleAction('close', $event)"
                  [attr.aria-label]="'Close order ' + order().symbol">
                  Close
                </app-button>
              }
              
              @if (canDuplicate()) {
                <app-button
                  [variant]="'ghost'"
                  [size]="'sm'"
                  [disabled]="disabled()"
                  (onClick)="handleAction('duplicate', $event)"
                  [attr.aria-label]="'Duplicate order ' + order().symbol">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </app-button>
              }
            </div>
          </div>
        </div>
      }
    </app-card>
  `,
  styleUrl: './trade-card.component.scss',
  animations: [
    // Add expand/collapse animation if needed
  ]
})
export class TradeCardComponent {
  // Inputs
  readonly order = input.required<TradeOrderResponseDto>();
  readonly clickable = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly showActions = input<boolean>(true);
  readonly showExpandableDetails = input<boolean>(true);
  readonly showDuration = input<boolean>(true);
  readonly showFees = input<boolean>(false);
  readonly compact = input<boolean>(false);

  // Outputs
  readonly cardClick = output<TradeOrderResponseDto>();
  readonly actionClick = output<TradeCardAction>();

  // Internal state
  private readonly expanded = signal<boolean>(false);

  // Professional trading precision configuration
  private readonly ASSET_PRECISION: Record<string, number> = {
    // Forex Major Pairs
    'EURUSD': 5, 'GBPUSD': 5, 'AUDUSD': 5, 'NZDUSD': 5, 'USDCAD': 5, 'USDCHF': 5,
    // Forex JPY Pairs  
    'USDJPY': 3, 'EURJPY': 3, 'GBPJPY': 3, 'AUDJPY': 3, 'CADJPY': 3,
    // Crypto Major
    'BTCUSD': 2, 'ETHUSD': 2, 'LTCUSD': 4, 'ADAUSD': 6, 'DOTUSD': 4,
    // Commodities
    'XAUUSD': 2, 'XAGUSD': 4, 'WTIUSD': 2
  };

  // Quantity precision for different asset classes
  private readonly QUANTITY_PRECISION: Record<string, number> = {
    'BTCUSD': 8, 'ETHUSD': 6, 'EURUSD': 2, 'USDJPY': 2
  };

  // Computed properties
  readonly enhancedSymbol = computed(() => {
    const symbol = this.order().symbol;
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
    
    // Fallback for existing formatted symbols
    return {
      baseCurrency: symbol.split('/')[0] || symbol.substring(0, 3),
      quoteCurrency: symbol.split('/')[1] || symbol.substring(3),
      displayFormat: symbol.includes('/') ? symbol : symbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2'),
      assetClass: this.getAssetClass(symbol)
    };
  });

  readonly formattedSymbol = computed(() => {
    return this.enhancedSymbol().displayFormat;
  });

  readonly pnlDisplay = computed(() => {
    const profit = this.order().profit;
    if (profit === undefined) return null;
    
    const percentage = this.calculatePnLPercentage();
    
    return {
      amount: profit,
      formatted: this.formatPnL(),
      percentage: percentage,
      formattedPercentage: percentage ? `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%` : null,
      status: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral'
    };
  });

  readonly sideClasses = computed(() => {
    const side = this.order().side;
    return `trade-side__indicator--${side}`;
  });

  readonly cardClasses = computed(() => {
    const classes = ['trade-card'];
    
    if (this.compact()) {
      classes.push('trade-card--compact');
    }
    
    if (this.order().isActive) {
      classes.push('trade-card--active');
    }
    
    const profit = this.order().profit;
    if (profit !== undefined) {
      if (profit > 0) {
        classes.push('trade-card--profitable');
      } else if (profit < 0) {
        classes.push('trade-card--losing');
      }
    }
    
    return classes.join(' ');
  });

  readonly pnlClasses = computed(() => {
    const profit = this.order().profit;
    if (profit === undefined) return '';
    
    return profit > 0 ? 'trade-card__pnl--profit' : 
           profit < 0 ? 'trade-card__pnl--loss' : 
           'trade-card__pnl--neutral';
  });

  readonly durationText = computed(() => {
    const createdAt = new Date(this.order().createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Now';
  });

  protected isExpanded(): boolean {
    return this.expanded();
  }

  protected getCardSide(): 'buy' | 'sell' | 'pending' | 'cancelled' | null {
    const order = this.order();
    
    if (order.status === 'cancelled' || order.status === 'rejected') {
      return 'cancelled';
    }
    
    if (order.status === 'pending') {
      return 'pending';
    }
    
    return order.side as 'buy' | 'sell';
  }

  protected getStatusBadgeVariant(): 'default' | 'success' | 'error' | 'warning' | 'info' {
    const status = this.order().status;
    
    switch (status) {
      case 'filled':
        return 'success';
      case 'cancelled':
      case 'rejected':
        return 'error';
      case 'pending':
      case 'partially_filled':
        return 'warning';
      case 'expired':
        return 'info';
      default:
        return 'default';
    }
  }

  protected formatStatus(): string {
    const status = this.order().status;
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  protected formatPrice(price?: number): string {
    if (price === undefined) return 'N/A';
    
    return this.formatPriceWithProfessionalPrecision(price);
  }

  protected formatPriceWithProfessionalPrecision(price: number, symbol?: string): string {
    const targetSymbol = symbol || this.order().symbol.replace('/', '');
    const precision = this.ASSET_PRECISION[targetSymbol] || this.getPriceDecimals();
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: true
    }).format(price);
  }

  protected formatQuantityWithUnit(): string {
    const quantity = this.order().quantity;
    const filledQuantity = this.order().filledQuantity;
    const baseCurrency = this.enhancedSymbol().baseCurrency;
    
    const quantityText = filledQuantity && filledQuantity !== quantity 
      ? `${filledQuantity.toLocaleString()} / ${quantity.toLocaleString()}`
      : quantity.toLocaleString();
    
    return `${quantityText} ${baseCurrency}`;
  }

  protected formatCurrentPrice(): string {
    // For active trades, show current market price if available
    // For now, we'll use filled price or entry price
    const currentPrice = this.order().filledPrice || this.order().price;
    return currentPrice ? this.formatPriceWithProfessionalPrecision(currentPrice) : 'N/A';
  }

  protected formatTimestamp(): string {
    const createdAt = new Date(this.order().createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  }

  private calculatePnLPercentage(): number | null {
    const order = this.order();
    if (!order.profit || !order.price || !order.quantity) return null;
    
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

  protected formatQuantity(): string {
    const quantity = this.order().quantity;
    const filledQuantity = this.order().filledQuantity;
    
    if (filledQuantity && filledQuantity !== quantity) {
      return `${filledQuantity.toLocaleString()} / ${quantity.toLocaleString()}`;
    }
    
    return quantity.toLocaleString();
  }

  protected formatPnL(): string {
    const profit = this.order().profit;
    if (profit === undefined) return 'N/A';
    
    const formatted = Math.abs(profit).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return profit >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  protected formatFees(): string {
    const commission = this.order().commission || 0;
    const swap = this.order().swap || 0;
    const totalFees = commission + swap;
    
    return totalFees.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  protected canModify(): boolean {
    const order = this.order();
    return order.isActive && (order.status === 'pending' || order.status === 'partially_filled');
  }

  protected canClose(): boolean {
    const order = this.order();
    return order.isActive && order.status !== 'cancelled';
  }

  protected canDuplicate(): boolean {
    return true; // Allow duplicating any order
  }

  protected toggleExpanded(): void {
    this.expanded.set(!this.expanded());
  }

  protected handleCardClick(event: MouseEvent): void {
    if (this.clickable() && !this.isActionButton(event.target as HTMLElement)) {
      this.cardClick.emit(this.order());
    }
  }

  protected handleAction(type: TradeCardAction['type'], event: MouseEvent): void {
    event.stopPropagation();
    
    this.actionClick.emit({
      type,
      order: this.order()
    });
  }

  private isActionButton(element: HTMLElement): boolean {
    return element.closest('button') !== null || 
           element.closest('.trade-card__actions') !== null;
  }

  private getPriceDecimals(): number {
    const symbol = this.order().symbol;
    
    // Forex pairs typically have 4-5 decimal places
    if (symbol.includes('JPY')) return 3;
    if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) return 4;
    
    // Crypto typically has 2-8 decimal places
    if (symbol.includes('BTC')) return 2;
    if (symbol.includes('ETH')) return 4;
    
    return 4; // Default
  }
}