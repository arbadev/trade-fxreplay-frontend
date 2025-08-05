import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, takeUntil, catchError, of, finalize } from 'rxjs';

import { TradeOrderService } from '../../core/services/trade-order.service';
import { TradeOrderResponseDto } from '../../core/models/trade-order.interface';
import { CardComponent } from '../../shared/components/card/card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

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
    LoadingSpinnerComponent
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

  private calculatePnLPercentage(): number | null {
    const order = this.order();
    if (!order || !order.profit || !order.price || !order.quantity) return null;
    
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