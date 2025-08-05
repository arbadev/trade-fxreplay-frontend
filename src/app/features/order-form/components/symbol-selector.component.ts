import { Component, input, output, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { TradingSymbol } from '../../../core/models/trade-order.interface';
import { OrderFormService } from '../services/order-form.service';

export interface SymbolOption {
  value: TradingSymbol;
  label: string;
  fullName: string;
  icon: string;
  marketPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

@Component({
  selector: 'app-symbol-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-field
      [label]="label()"
      [inputId]="inputId()"
      [required]="required()"
      [errorMessage]="errorMessage()"
      [helpText]="helpText()"
    >
      <div class="symbol-selector">
        @for (option of symbolOptions(); track option.value) {
          <button
            type="button"
            [id]="option.value === selectedSymbol() ? inputId() : ''"
            [class]="getOptionClasses(option)"
            [disabled]="disabled()"
            [attr.aria-pressed]="option.value === selectedSymbol()"
            [attr.aria-label]="getAriaLabel(option)"
            (click)="selectSymbol(option.value)"
          >
            <div class="symbol-header">
              <div class="symbol-icon" [innerHTML]="option.icon"></div>
              <div class="symbol-info">
                <div class="symbol-label">{{ option.label }}</div>
                <div class="symbol-name">{{ option.fullName }}</div>
              </div>
            </div>
            
            <div class="symbol-price">
              <div class="current-price">{{ formatPrice(option.marketPrice, option.value) }}</div>
              <div [class]="getPriceChangeClasses(option.priceChange)">
                <span class="price-change-icon" [innerHTML]="getPriceChangeIcon(option.priceChange)"></span>
                <span class="price-change-value">
                  {{ formatPriceChange(option.priceChange, option.value) }}
                  ({{ option.priceChangePercent > 0 ? '+' : '' }}{{ option.priceChangePercent.toFixed(2) }}%)
                </span>
              </div>
            </div>
          </button>
        }
      </div>
    </app-form-field>
  `,
  styles: [`
    .symbol-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-3);
      width: 100%;
    }
    
    .symbol-option {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--bg-tertiary);
      border: 2px solid transparent;
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: var(--touch-target-comfortable);
      text-align: left;
      
      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        border-color: var(--border-secondary);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
      
      &:focus-visible {
        outline: 2px solid var(--primary-blue);
        outline-offset: 2px;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .symbol-option--selected {
      background: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
      
      &:hover {
        background: var(--primary-blue-light);
        border-color: var(--primary-blue-light);
      }
      
      .symbol-name,
      .price-change-value {
        opacity: 0.9;
      }
    }
    
    .symbol-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }
    
    .symbol-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(var(--primary-blue-rgb), 0.1);
      border-radius: var(--radius-md);
      flex-shrink: 0;
      
      svg {
        width: 20px;
        height: 20px;
        fill: var(--primary-blue);
        stroke: var(--primary-blue);
      }
    }
    
    .symbol-option--selected .symbol-icon {
      background: rgba(255, 255, 255, 0.2);
      
      svg {
        fill: white;
        stroke: white;
      }
    }
    
    .symbol-info {
      flex: 1;
      min-width: 0;
    }
    
    .symbol-label {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      line-height: var(--leading-tight);
      margin-bottom: var(--space-1);
    }
    
    .symbol-name {
      font-size: var(--text-sm);
      opacity: 0.7;
      line-height: var(--leading-normal);
    }
    
    .symbol-price {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      align-items: flex-start;
    }
    
    .current-price {
      font-family: var(--font-mono);
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      line-height: var(--leading-none);
    }
    
    .price-change {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
    }
    
    .price-change--positive {
      color: var(--profit-green);
    }
    
    .price-change--negative {
      color: var(--loss-red);
    }
    
    .price-change--neutral {
      color: var(--text-secondary);
    }
    
    .symbol-option--selected .price-change--positive,
    .symbol-option--selected .price-change--negative,
    .symbol-option--selected .price-change--neutral {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .price-change-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 12px;
      height: 12px;
      
      svg {
        width: 10px;
        height: 10px;
        fill: currentColor;
        stroke: currentColor;
      }
    }
    
    .price-change-value {
      line-height: var(--leading-none);
    }
    
    /* Mobile optimization */
    @media (max-width: 768px) {
      .symbol-selector {
        grid-template-columns: 1fr;
        gap: var(--space-2);
      }
      
      .symbol-option {
        padding: var(--space-3);
      }
      
      .symbol-header {
        gap: var(--space-2);
      }
      
      .symbol-icon {
        width: 28px;
        height: 28px;
        
        svg {
          width: 16px;
          height: 16px;
        }
      }
      
      .symbol-label {
        font-size: var(--text-base);
      }
      
      .current-price {
        font-size: var(--text-lg);
      }
      
      .price-change {
        font-size: var(--text-xs);
      }
    }
    
    /* Animation for selection */
    .symbol-option {
      transform: translateY(0) scale(1);
    }
    
    .symbol-option--selected {
      animation: symbol-select 0.3s ease;
    }
    
    @keyframes symbol-select {
      0% {
        transform: translateY(0) scale(0.98);
      }
      50% {
        transform: translateY(-2px) scale(1.01);
      }
      100% {
        transform: translateY(0) scale(1);
      }
    }
    
    /* High contrast support */
    @media (prefers-contrast: high) {
      .symbol-option--selected {
        border: 3px solid white;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .symbol-option {
        transition: none;
      }
      
      .symbol-option--selected {
        animation: none;
      }
      
      .symbol-option:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class SymbolSelectorComponent {
  private readonly orderFormService = inject(OrderFormService);

  // Inputs
  readonly control = input.required<FormControl<TradingSymbol>>();
  readonly label = input<string>('Trading Symbol');
  readonly inputId = input<string>(`symbol-${Math.random().toString(36).substr(2, 9)}`);
  readonly required = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('Select the asset you want to trade');

  // Outputs
  readonly selectionChange = output<TradingSymbol>();

  // Computed values
  readonly selectedSymbol = computed(() => this.control().value);
  readonly marketPrices = computed(() => this.orderFormService.marketPrices());

  readonly symbolOptions = computed<SymbolOption[]>(() => {
    const prices = this.marketPrices();
    
    return [
      {
        value: 'BTCUSD',
        label: 'BTC/USD',
        fullName: 'Bitcoin / US Dollar',
        icon: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5h-1v1h-1v-1h-.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h.5v-3h-.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h.5v-1h1v1h1v1h-1v1h1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-1v3h1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-1v1h-1v-1z"/>
        </svg>`,
        marketPrice: prices.BTCUSD,
        priceChange: 750, // Mock data
        priceChangePercent: 1.69
      },
      {
        value: 'EURUSD',
        label: 'EUR/USD',
        fullName: 'Euro / US Dollar',
        icon: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16.5h-1v-2h-2v-1h2V14H8.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5H10v-2H8.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5H10V8.5h2v1h1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-1v2h1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-1v2z"/>
        </svg>`,
        marketPrice: prices.EURUSD,
        priceChange: -0.0023, // Mock data
        priceChangePercent: -0.21
      },
      {
        value: 'ETHUSD',
        label: 'ETH/USD',
        fullName: 'Ethereum / US Dollar',
        icon: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 12l8 4.5L20 12 12 2zm0 2.85L17.15 12 12 14.57 6.85 12 12 4.85z"/>
          <path d="M4 13.5L12 22l8-8.5L12 18 4 13.5z"/>
        </svg>`,
        marketPrice: prices.ETHUSD,
        priceChange: 125, // Mock data
        priceChangePercent: 4.06
      }
    ];
  });

  // Methods
  selectSymbol(symbol: TradingSymbol): void {
    if (this.disabled()) return;
    
    this.control().setValue(symbol);
    this.selectionChange.emit(symbol);
  }

  getOptionClasses(option: SymbolOption): string {
    const classes = ['symbol-option'];
    
    if (option.value === this.selectedSymbol()) {
      classes.push('symbol-option--selected');
    }
    
    return classes.join(' ');
  }

  getPriceChangeClasses(priceChange: number): string {
    const classes = ['price-change'];
    
    if (priceChange > 0) {
      classes.push('price-change--positive');
    } else if (priceChange < 0) {
      classes.push('price-change--negative');
    } else {
      classes.push('price-change--neutral');
    }
    
    return classes.join(' ');
  }

  getPriceChangeIcon(priceChange: number): string {
    if (priceChange > 0) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 14l5-5 5 5"/>
      </svg>`;
    } else if (priceChange < 0) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 10l5 5 5-5"/>
      </svg>`;
    } else {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14"/>
      </svg>`;
    }
  }

  formatPrice(price: number, symbol: TradingSymbol): string {
    if (symbol === 'BTCUSD' || symbol === 'ETHUSD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    } else {
      return price.toFixed(4);
    }
  }

  formatPriceChange(change: number, symbol: TradingSymbol): string {
    if (symbol === 'BTCUSD' || symbol === 'ETHUSD') {
      return change > 0 ? `+$${change}` : `-$${Math.abs(change)}`;
    } else {
      return change > 0 ? `+${change.toFixed(4)}` : `${change.toFixed(4)}`;
    }
  }

  getAriaLabel(option: SymbolOption): string {
    const direction = option.priceChange > 0 ? 'up' : option.priceChange < 0 ? 'down' : 'unchanged';
    const price = this.formatPrice(option.marketPrice, option.value);
    return `${option.fullName}, current price ${price}, ${direction} ${Math.abs(option.priceChangePercent)}%`;
  }
}