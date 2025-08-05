import { Component, input, output, computed, signal, forwardRef, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'error' | 'success';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div [class]="containerClasses()">
      @if (label()) {
        <label [for]="selectId()" class="select-label">
          {{ label() }}
          @if (required()) {
            <span class="select-required" aria-label="required">*</span>
          }
        </label>
      }
      
      <div class="select-wrapper">
        <select
          #selectElement
          [id]="selectId()"
          [disabled]="disabled()"
          [class]="selectClasses()"
          [value]="value()"
          [attr.aria-describedby]="errorMessage() ? selectId() + '-error' : null"
          [attr.aria-invalid]="variant() === 'error'"
          (change)="onChange($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        >
          @if (placeholder()) {
            <option value="" disabled [selected]="!value()">{{ placeholder() }}</option>
          }
          
          @for (option of groupedOptions(); track option.value) {
            @if (option.group) {
              <optgroup [label]="option.group">
                @for (groupOption of getGroupOptions(option.group); track groupOption.value) {
                  <option 
                    [value]="groupOption.value" 
                    [disabled]="groupOption.disabled"
                    [selected]="groupOption.value === value()"
                  >
                    {{ groupOption.label }}
                  </option>
                }
              </optgroup>
            } @else {
              <option 
                [value]="option.value" 
                [disabled]="option.disabled"
                [selected]="option.value === value()"
              >
                {{ option.label }}
              </option>
            }
          }
        </select>
        
        <div class="select-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>
      
      @if (errorMessage()) {
        <div [id]="selectId() + '-error'" class="select-error" role="alert">
          {{ errorMessage() }}
        </div>
      }
      
      @if (helpText() && !errorMessage()) {
        <div class="select-help">{{ helpText() }}</div>
      }
    </div>
  `,
  styles: [`
    .select-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    
    .select-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    
    .select-required {
      color: var(--loss-red);
      font-size: var(--text-sm);
    }
    
    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .select {
      width: 100%;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--text-base);
      font-family: inherit;
      transition: all 0.2s ease;
      outline: none;
      appearance: none;
      cursor: pointer;
      
      &:hover:not(:disabled) {
        border-color: var(--border-secondary);
      }
      
      &:focus {
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 3px rgba(var(--primary-blue-rgb), 0.1);
      }
      
      &:disabled {
        background: var(--bg-tertiary);
        color: var(--text-tertiary);
        cursor: not-allowed;
      }
    }
    
    /* Sizes */
    .select--sm {
      padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      min-height: var(--touch-target-minimum);
    }
    
    .select--md {
      padding: var(--space-3) var(--space-10) var(--space-3) var(--space-4);
      font-size: var(--text-base);
      min-height: var(--touch-target-comfortable);
    }
    
    .select--lg {
      padding: var(--space-4) var(--space-12) var(--space-4) var(--space-5);
      font-size: var(--text-lg);
      min-height: 56px;
    }
    
    /* Variants */
    .select--error {
      border-color: var(--loss-red);
      
      &:focus {
        border-color: var(--loss-red);
        box-shadow: 0 0 0 3px rgba(var(--loss-red-rgb), 0.1);
      }
    }
    
    .select--success {
      border-color: var(--profit-green);
      
      &:focus {
        border-color: var(--profit-green);
        box-shadow: 0 0 0 3px rgba(var(--profit-green-rgb), 0.1);
      }
    }
    
    /* Select icon */
    .select-icon {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        transition: transform 0.2s ease;
      }
    }
    
    .select:focus + .select-icon svg {
      transform: rotate(180deg);
    }
    
    /* Option styling */
    .select option {
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: var(--space-2) var(--space-3);
      
      &:disabled {
        color: var(--text-tertiary);
      }
    }
    
    .select optgroup {
      font-weight: var(--font-semibold);
      color: var(--text-secondary);
    }
    
    /* Messages */
    .select-error {
      font-size: var(--text-sm);
      color: var(--loss-red);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    
    .select-help {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .select {
        font-size: 16px; /* Prevent zoom on iOS */
      }
      
      .select--sm {
        min-height: var(--touch-target-comfortable);
      }
    }
    
    /* Focus styles for accessibility */
    .select:focus-visible {
      outline: 2px solid var(--primary-blue);
      outline-offset: 2px;
    }
    
    /* Trading-specific styling for order types */
    .select option[value="buy"] {
      color: var(--profit-green);
    }
    
    .select option[value="sell"] {
      color: var(--loss-red);
    }
    
    .select option[value="pending"] {
      color: var(--pending-yellow);
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  // Template references
  private readonly selectElement = viewChild<ElementRef<HTMLSelectElement>>('selectElement');

  // Inputs
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly options = input<SelectOption[]>([]);
  readonly size = input<SelectSize>('md');
  readonly variant = input<SelectVariant>('default');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('');
  readonly selectId = input<string>(`select-${Math.random().toString(36).substr(2, 9)}`);

  // Outputs
  readonly valueChange = output<string | number>();
  readonly blur = output<void>();
  readonly focus = output<void>();

  // Internal state
  private readonly _value = signal<string | number>('');
  readonly value = this._value.asReadonly();

  // ControlValueAccessor implementation
  private onChangeCallback = (value: string | number) => {};
  private onTouchedCallback = () => {};

  writeValue(value: string | number): void {
    this._value.set(value || '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by disabled input
  }

  // Event handlers
  protected onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    this._value.set(value);
    this.onChangeCallback(value);
    this.valueChange.emit(value);
  }

  protected onBlur(): void {
    this.onTouchedCallback();
    this.blur.emit();
  }

  protected onFocus(): void {
    this.focus.emit();
  }

  // Computed properties
  readonly groupedOptions = computed(() => {
    const options = this.options();
    const grouped = new Map<string, SelectOption[]>();
    const ungrouped: SelectOption[] = [];

    options.forEach(option => {
      if (option.group) {
        if (!grouped.has(option.group)) {
          grouped.set(option.group, []);
        }
        grouped.get(option.group)!.push(option);
      } else {
        ungrouped.push(option);
      }
    });

    // Return ungrouped first, then grouped
    const result: SelectOption[] = [...ungrouped];
    
    grouped.forEach((groupOptions, groupName) => {
      if (groupOptions.length > 0) {
        result.push({ value: '', label: '', group: groupName });
      }
    });

    return result;
  });

  protected getGroupOptions(groupName: string): SelectOption[] {
    return this.options().filter(option => option.group === groupName);
  }

  // Computed classes
  readonly containerClasses = computed(() => {
    return 'select-container';
  });

  readonly selectClasses = computed(() => {
    const classes = ['select'];
    
    classes.push(`select--${this.size()}`);
    classes.push(`select--${this.variant()}`);
    
    return classes.join(' ');
  });
}