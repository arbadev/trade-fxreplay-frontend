import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradeOrderResponseDto, OrderStatus, OrderSide } from '../../../core/models/trade-order.interface';
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
      
      <!-- Card Header -->
      <div class="trade-card__header" slot="header">
        <div class="trade-card__symbol-section">
          <h3 class="trade-card__symbol" [attr.aria-label]="'Trading pair: ' + formattedSymbol()">
            {{ formattedSymbol() }}
          </h3>
          <div class="trade-card__side-indicator" [class]="sideClasses()">
            {{ order().side.toUpperCase() }}
          </div>
        </div>
        
        <div class="trade-card__status-section">
          <app-badge 
            [variant]="getStatusBadgeVariant()"
            [size]="'sm'"
            class="trade-card__status-badge">
            {{ formatStatus() }}
          </app-badge>
          
          @if (showDuration() && durationText()) {
            <span class="trade-card__duration" [attr.aria-label]="'Order duration: ' + durationText()">
              {{ durationText() }}
            </span>
          }
        </div>
      </div>
      
      <!-- Card Content -->
      <div class="trade-card__content">
        <!-- Price Information -->
        <div class="trade-card__price-section">
          <div class="trade-card__price-row">
            <span class="trade-card__price-label">Entry Price</span>
            <span class="trade-card__price-value" [attr.aria-label]="'Entry price: ' + formatPrice(order().price)">
              {{ formatPrice(order().price) }}
            </span>
          </div>
          
          @if (order().filledPrice && order().filledPrice !== order().price) {
            <div class="trade-card__price-row">
              <span class="trade-card__price-label">Fill Price</span>
              <span class="trade-card__price-value" [attr.aria-label]="'Fill price: ' + formatPrice(order().filledPrice)">
                {{ formatPrice(order().filledPrice) }}
              </span>
            </div>
          }
          
          @if (order().stopLoss) {
            <div class="trade-card__price-row trade-card__price-row--sl">
              <span class="trade-card__price-label">Stop Loss</span>
              <span class="trade-card__price-value trade-card__price-value--loss" [attr.aria-label]="'Stop loss: ' + formatPrice(order().stopLoss)">
                {{ formatPrice(order().stopLoss) }}
              </span>
            </div>
          }
          
          @if (order().takeProfit) {
            <div class="trade-card__price-row trade-card__price-row--tp">
              <span class="trade-card__price-label">Take Profit</span>
              <span class="trade-card__price-value trade-card__price-value--profit" [attr.aria-label]="'Take profit: ' + formatPrice(order().takeProfit)">
                {{ formatPrice(order().takeProfit) }}
              </span>
            </div>
          }
        </div>
        
        <!-- Quantity and P&L -->
        <div class="trade-card__metrics">
          <div class="trade-card__metric">
            <span class="trade-card__metric-label">Quantity</span>
            <span class="trade-card__metric-value" [attr.aria-label]="'Quantity: ' + formatQuantity()">
              {{ formatQuantity() }}
            </span>
          </div>
          
          @if (order().profit !== undefined) {
            <div class="trade-card__metric trade-card__metric--pnl">
              <span class="trade-card__metric-label">P&L</span>
              <span 
                class="trade-card__metric-value trade-card__pnl" 
                [class]="pnlClasses()"
                [attr.aria-label]="'Profit and loss: ' + formatPnL()">
                {{ formatPnL() }}
              </span>
            </div>
          }
          
          @if (showFees() && (order().commission || order().swap)) {
            <div class="trade-card__metric">
              <span class="trade-card__metric-label">Fees</span>
              <span class="trade-card__metric-value trade-card__fees" [attr.aria-label]="'Total fees: ' + formatFees()">
                {{ formatFees() }}
              </span>
            </div>
          }
        </div>
        
        <!-- Expandable Details -->
        @if (showExpandableDetails() && isExpanded()) {
          <div class="trade-card__details" [@expandCollapse]>
            <div class="trade-card__details-grid">
              <div class="trade-card__detail-item">
                <span class="trade-card__detail-label">Order ID</span>
                <span class="trade-card__detail-value">{{ order().id.slice(-8) }}</span>
              </div>
              
              <div class="trade-card__detail-item">
                <span class="trade-card__detail-label">Created</span>
                <span class="trade-card__detail-value">{{ formatDate(order().createdAt) }}</span>
              </div>
              
              @if (order().filledAt) {
                <div class="trade-card__detail-item">
                  <span class="trade-card__detail-label">Filled</span>
                  <span class="trade-card__detail-value">{{ formatDate(order().filledAt!) }}</span>
                </div>
              }
              
              <div class="trade-card__detail-item">
                <span class="trade-card__detail-label">Type</span>
                <span class="trade-card__detail-value">{{ order().type.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        }
      </div>
      
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

  // Computed properties
  readonly formattedSymbol = computed(() => {
    const symbol = this.order().symbol;
    return symbol.includes('/') ? symbol : symbol.replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
  });

  readonly sideClasses = computed(() => {
    const side = this.order().side;
    return `trade-card__side-indicator--${side}`;
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
    
    return price.toLocaleString('en-US', {
      minimumFractionDigits: this.getPriceDecimals(),
      maximumFractionDigits: this.getPriceDecimals()
    });
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