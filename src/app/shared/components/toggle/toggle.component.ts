import { Component, input, output, computed, signal, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ToggleOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: 'buy' | 'sell' | 'default';
  disabled?: boolean;
}

export type ToggleSize = 'sm' | 'md' | 'lg';
export type ToggleVariant = 'default' | 'trading';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ],
  template: `
    <div [class]="containerClasses()" role="radiogroup" [attr.aria-labelledby]="ariaLabelledBy()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          [class]="getOptionClasses(option)"
          [disabled]="option.disabled || disabled()"
          [attr.aria-checked]="isSelected(option.value)"
          [attr.aria-label]="option.label"
          role="radio"
          (click)="selectOption(option.value)"
        >
          @if (option.icon) {
            <span class="toggle-icon" [innerHTML]="option.icon"></span>
          }
          <span class="toggle-label">{{ option.label }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .toggle-container {
      display: flex;
      background: var(--bg-tertiary);
      border-radius: var(--radius-lg);
      padding: var(--space-1);
      gap: var(--space-1);
      width: 100%;
    }
    
    .toggle-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-family: inherit;
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      
      &:hover:not(:disabled) {
        color: var(--text-primary);
        background: rgba(var(--primary-blue-rgb), 0.1);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &:focus-visible {
        outline: 2px solid var(--primary-blue);
        outline-offset: 2px;
      }
    }
    
    /* Sizes */
    .toggle--sm .toggle-option {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      min-height: var(--touch-target-minimum);
    }
    
    .toggle--md .toggle-option {
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-base);
      min-height: var(--touch-target-comfortable);
    }
    
    .toggle--lg .toggle-option {
      padding: var(--space-4) var(--space-5);
      font-size: var(--text-lg);
      min-height: 56px;
    }
    
    /* Selected state */
    .toggle-option--selected {
      background: var(--primary-blue);
      color: white;
      box-shadow: var(--shadow-sm);
      
      &:hover {
        background: var(--primary-blue-light);
      }
    }
    
    /* Trading variant colors */
    .toggle--trading .toggle-option--buy.toggle-option--selected {
      background: var(--profit-green);
      color: white;
      
      &:hover {
        background: var(--profit-green-light);
      }
    }
    
    .toggle--trading .toggle-option--sell.toggle-option--selected {
      background: var(--loss-red);
      color: white;
      
      &:hover {
        background: var(--loss-red-light);
      }
    }
    
    /* Icon styling */
    .toggle-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
        stroke: currentColor;
      }
    }
    
    .toggle--lg .toggle-icon svg {
      width: 20px;
      height: 20px;
    }
    
    .toggle-label {
      font-weight: inherit;
      white-space: nowrap;
    }
    
    /* Animation for selection */
    .toggle-option {
      transform-origin: center;
    }
    
    .toggle-option--selected {
      animation: toggle-select 0.2s ease;
    }
    
    @keyframes toggle-select {
      0% {
        transform: scale(0.95);
      }
      50% {
        transform: scale(1.02);
      }
      100% {
        transform: scale(1);
      }
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .toggle--sm .toggle-option {
        min-height: var(--touch-target-comfortable);
        font-size: var(--text-sm);
      }
      
      .toggle-label {
        font-size: inherit;
      }
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .toggle-option--selected {
        border: 2px solid currentColor;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .toggle-option {
        transition: none;
      }
      
      .toggle-option--selected {
        animation: none;
      }
    }
    
    /* Full-width variant */
    .toggle-container--full-width {
      width: 100%;
    }
    
    /* Compact variant */
    .toggle-container--compact {
      padding: 2px;
      gap: 2px;
    }
    
    .toggle-container--compact .toggle-option {
      padding: var(--space-1) var(--space-2);
      font-size: var(--text-xs);
      min-height: 32px;
    }
  `]
})
export class ToggleComponent implements ControlValueAccessor {
  // Inputs
  readonly options = input<ToggleOption[]>([]);
  readonly size = input<ToggleSize>('md');
  readonly variant = input<ToggleVariant>('default');
  readonly disabled = input<boolean>(false);
  readonly ariaLabelledBy = input<string>('');
  readonly fullWidth = input<boolean>(true);
  readonly compact = input<boolean>(false);

  // Outputs
  readonly valueChange = output<string | number>();
  readonly selectionChange = output<ToggleOption>();

  // Internal state
  private readonly _value = signal<string | number>('');
  readonly value = this._value.asReadonly();

  // ControlValueAccessor implementation
  private onChange = (value: string | number) => {};
  private onTouched = () => {};

  writeValue(value: string | number): void {
    this._value.set(value || '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by disabled input
  }

  // Methods
  protected selectOption(value: string | number): void {
    if (this.disabled()) return;
    
    const option = this.options().find(opt => opt.value === value);
    if (!option || option.disabled) return;

    this._value.set(value);
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
    this.selectionChange.emit(option);
  }

  protected isSelected(value: string | number): boolean {
    return this.value() === value;
  }

  protected getOptionClasses(option: ToggleOption): string {
    const classes = ['toggle-option'];
    
    if (this.isSelected(option.value)) {
      classes.push('toggle-option--selected');
    }
    
    if (option.color) {
      classes.push(`toggle-option--${option.color}`);
    }
    
    if (option.disabled) {
      classes.push('toggle-option--disabled');
    }
    
    return classes.join(' ');
  }

  // Computed classes
  readonly containerClasses = computed(() => {
    const classes = ['toggle-container'];
    
    classes.push(`toggle--${this.size()}`);
    classes.push(`toggle--${this.variant()}`);
    
    if (this.fullWidth()) {
      classes.push('toggle-container--full-width');
    }
    
    if (this.compact()) {
      classes.push('toggle-container--compact');
    }
    
    return classes.join(' ');
  });

  // Helper method to create trading buy/sell options
  static createTradingOptions(): ToggleOption[] {
    return [
      {
        value: 'buy',
        label: 'BUY',
        color: 'buy',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7"/>
          <path d="M7 7h10v10"/>
        </svg>`
      },
      {
        value: 'sell',
        label: 'SELL',
        color: 'sell',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 7L7 17"/>
          <path d="M17 17H7V7"/>
        </svg>`
      }
    ];
  }
}