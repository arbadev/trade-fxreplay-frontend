import { Component, input, output, computed, signal, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'error' | 'success';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div [class]="containerClasses()">
      @if (label()) {
        <label [for]="inputId()" class="input-label">
          {{ label() }}
          @if (required()) {
            <span class="input-required" aria-label="required">*</span>
          }
        </label>
      }
      
      <div class="input-wrapper">
        @if (prefixIcon()) {
          <div class="input-prefix" [innerHTML]="prefixIcon()"></div>
        }
        
        <input
          [id]="inputId()"
          [type]="type()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [class]="inputClasses()"
          [value]="value()"
          [attr.aria-describedby]="errorMessage() ? inputId() + '-error' : null"
          [attr.aria-invalid]="variant() === 'error'"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        />
        
        @if (suffixIcon()) {
          <div class="input-suffix" [innerHTML]="suffixIcon()"></div>
        }
      </div>
      
      @if (errorMessage()) {
        <div [id]="inputId() + '-error'" class="input-error" role="alert">
          {{ errorMessage() }}
        </div>
      }
      
      @if (helpText() && !errorMessage()) {
        <div class="input-help">{{ helpText() }}</div>
      }
    </div>
  `,
  styles: [`
    .input-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    
    .input-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    
    .input-required {
      color: var(--loss-red);
      font-size: var(--text-sm);
    }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .input {
      width: 100%;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: var(--text-base);
      font-family: inherit;
      transition: all 0.2s ease;
      outline: none;
      
      &::placeholder {
        color: var(--text-tertiary);
      }
      
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
      
      &:readonly {
        background: var(--bg-secondary);
      }
    }
    
    /* Sizes */
    .input--sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      min-height: var(--touch-target-minimum);
    }
    
    .input--md {
      padding: var(--space-3) var(--space-4);
      font-size: var(--text-base);
      min-height: var(--touch-target-comfortable);
    }
    
    .input--lg {
      padding: var(--space-4) var(--space-5);
      font-size: var(--text-lg);
      min-height: 56px;
    }
    
    /* Variants */
    .input--error {
      border-color: var(--loss-red);
      
      &:focus {
        border-color: var(--loss-red);
        box-shadow: 0 0 0 3px rgba(var(--loss-red-rgb), 0.1);
      }
    }
    
    .input--success {
      border-color: var(--profit-green);
      
      &:focus {
        border-color: var(--profit-green);
        box-shadow: 0 0 0 3px rgba(var(--profit-green-rgb), 0.1);
      }
    }
    
    /* With prefix/suffix icons */
    .input--with-prefix {
      padding-left: var(--space-10);
    }
    
    .input--with-suffix {
      padding-right: var(--space-10);
    }
    
    .input-prefix,
    .input-suffix {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      pointer-events: none;
      
      svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
        stroke: currentColor;
      }
    }
    
    .input-prefix {
      left: var(--space-3);
    }
    
    .input-suffix {
      right: var(--space-3);
    }
    
    /* Messages */
    .input-error {
      font-size: var(--text-sm);
      color: var(--loss-red);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    
    .input-help {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .input {
        font-size: 16px; /* Prevent zoom on iOS */
      }
      
      .input--sm {
        min-height: var(--touch-target-comfortable);
      }
    }
    
    /* Focus styles for accessibility */
    .input:focus-visible {
      outline: 2px solid var(--primary-blue);
      outline-offset: 2px;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .input {
        &:-webkit-autofill,
        &:-webkit-autofill:hover,
        &:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--bg-primary) inset;
          -webkit-text-fill-color: var(--text-primary);
        }
      }
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  // Inputs
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly type = input<InputType>('text');
  readonly size = input<InputSize>('md');
  readonly variant = input<InputVariant>('default');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('');
  readonly prefixIcon = input<string>('');
  readonly suffixIcon = input<string>('');
  readonly inputId = input<string>(`input-${Math.random().toString(36).substr(2, 9)}`);

  // Outputs
  readonly valueChange = output<string>();
  readonly blur = output<void>();
  readonly focus = output<void>();

  // Internal state
  private readonly _value = signal<string>('');
  readonly value = this._value.asReadonly();

  // ControlValueAccessor implementation
  private onChange = (value: string) => {};
  private onTouched = () => {};

  writeValue(value: string): void {
    this._value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by disabled input
  }

  // Event handlers
  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    this._value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  protected onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  protected onFocus(): void {
    this.focus.emit();
  }

  // Computed classes
  readonly containerClasses = computed(() => {
    return 'input-container';
  });

  readonly inputClasses = computed(() => {
    const classes = ['input'];
    
    classes.push(`input--${this.size()}`);
    classes.push(`input--${this.variant()}`);
    
    if (this.prefixIcon()) {
      classes.push('input--with-prefix');
    }
    
    if (this.suffixIcon()) {
      classes.push('input--with-suffix');
    }
    
    return classes.join(' ');
  });
}