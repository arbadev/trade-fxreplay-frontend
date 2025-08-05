import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { SelectComponent } from '../../../shared/components/select/select.component';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { OrderType } from '../../../core/models/trade-order.interface';

export interface OrderTypeOption {
  value: OrderType;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-order-type-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-field
      [label]="label()"
      [inputId]="inputId()"
      [required]="required()"
      [errorMessage]="errorMessage()"
      [helpText]="helpText()"
    >
      <div class="order-type-selector">
        @for (option of orderTypeOptions(); track option.value) {
          <button
            type="button"
            [id]="option.value === selectedType() ? inputId() : ''"
            [class]="getOptionClasses(option)"
            [disabled]="disabled()"
            [attr.aria-pressed]="option.value === selectedType()"
            [attr.aria-describedby]="option.value === selectedType() ? (inputId() + '-desc') : null"
            (click)="selectOrderType(option.value)"
          >
            <div class="option-icon" [innerHTML]="option.icon"></div>
            <div class="option-content">
              <div class="option-label">{{ option.label }}</div>
              <div class="option-description">{{ option.description }}</div>
            </div>
          </button>
        }
        
        @if (selectedType() && selectedOrderTypeDescription()) {
          <div 
            [id]="inputId() + '-desc'" 
            class="selected-description"
            role="status"
            aria-live="polite"
          >
            {{ selectedOrderTypeDescription() }}
          </div>
        }
      </div>
    </app-form-field>
  `,
  styles: [`
    .order-type-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3);
      width: 100%;
    }
    
    .order-type-option {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--bg-tertiary);
      border: 2px solid transparent;
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: var(--touch-target-comfortable);
      text-align: left;
      width: 100%;
      
      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        border-color: var(--border-secondary);
        color: var(--text-primary);
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
    
    .order-type-option--selected {
      background: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
      
      &:hover {
        background: var(--primary-blue-light);
        border-color: var(--primary-blue-light);
      }
    }
    
    .option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      
      svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
        stroke: currentColor;
      }
    }
    
    .option-content {
      flex: 1;
      min-width: 0;
    }
    
    .option-label {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      margin-bottom: var(--space-1);
      line-height: var(--leading-tight);
    }
    
    .option-description {
      font-size: var(--text-sm);
      opacity: 0.9;
      line-height: var(--leading-normal);
    }
    
    .selected-description {
      grid-column: 1 / -1;
      margin-top: var(--space-2);
      padding: var(--space-3);
      background: rgba(var(--primary-blue-rgb), 0.1);
      border: 1px solid rgba(var(--primary-blue-rgb), 0.2);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      line-height: var(--leading-normal);
    }
    
    /* Mobile optimization */
    @media (max-width: 768px) {
      .order-type-selector {
        grid-template-columns: 1fr;
        gap: var(--space-2);
      }
      
      .order-type-option {
        padding: var(--space-3);
        min-height: var(--touch-target-comfortable);
      }
      
      .option-label {
        font-size: var(--text-sm);
      }
      
      .option-description {
        font-size: var(--text-xs);
      }
    }
    
    /* Animation for selection */
    .order-type-option {
      transform: scale(1);
    }
    
    .order-type-option--selected {
      animation: option-select 0.2s ease;
    }
    
    @keyframes option-select {
      0% {
        transform: scale(0.98);
      }
      50% {
        transform: scale(1.02);
      }
      100% {
        transform: scale(1);
      }
    }
    
    /* High contrast support */
    @media (prefers-contrast: high) {
      .order-type-option--selected {
        border: 3px solid currentColor;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .order-type-option {
        transition: none;
      }
      
      .order-type-option--selected {
        animation: none;
      }
    }
  `]
})
export class OrderTypeSelectorComponent {
  // Inputs
  readonly control = input.required<FormControl<OrderType>>();
  readonly label = input<string>('Order Type');
  readonly inputId = input<string>(`order-type-${Math.random().toString(36).substr(2, 9)}`);
  readonly required = input<boolean>(true);
  readonly disabled = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('');

  // Outputs
  readonly selectionChange = output<OrderType>();

  // Computed values
  readonly selectedType = computed(() => this.control().value);
  
  readonly orderTypeOptions = computed<OrderTypeOption[]>(() => [
    {
      value: OrderType.MARKET,
      label: 'Market',
      description: 'Execute immediately at current market price',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>`
    },
    {
      value: OrderType.LIMIT,
      label: 'Limit',
      description: 'Execute only at specified price or better',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18-3a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
      </svg>`
    },
    {
      value: OrderType.STOP,
      label: 'Stop',
      description: 'Market order triggered when price reaches stop level',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`
    },
    {
      value: OrderType.STOP_LIMIT,
      label: 'Stop Limit',
      description: 'Limit order triggered when price reaches stop level',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 9h6v6H9z"/>
        <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>
      </svg>`
    }
  ]);

  readonly selectedOrderTypeDescription = computed(() => {
    const selected = this.orderTypeOptions().find(opt => opt.value === this.selectedType());
    return selected ? this.getDetailedDescription(selected.value) : '';
  });

  // Methods
  selectOrderType(orderType: OrderType): void {
    if (this.disabled()) return;
    
    this.control().setValue(orderType);
    this.selectionChange.emit(orderType);
  }

  getOptionClasses(option: OrderTypeOption): string {
    const classes = ['order-type-option'];
    
    if (option.value === this.selectedType()) {
      classes.push('order-type-option--selected');
    }
    
    return classes.join(' ');
  }

  private getDetailedDescription(orderType: OrderType): string {
    switch (orderType) {
      case OrderType.MARKET:
        return 'Market orders are executed immediately at the best available price. Use when you want to enter or exit a position quickly, regardless of small price variations.';
      
      case OrderType.LIMIT:
        return 'Limit orders are executed only when the market reaches your specified price or better. Use when you want to control the exact price of your trade and are willing to wait.';
      
      case OrderType.STOP:
        return 'Stop orders become market orders when the stop price is reached. Use for stop-loss protection or to enter trades when price breaks through key levels.';
      
      case OrderType.STOP_LIMIT:
        return 'Stop-limit orders become limit orders when the stop price is reached. Use when you want the trigger behavior of a stop order but with price control of a limit order.';
      
      default:
        return '';
    }
  }
}