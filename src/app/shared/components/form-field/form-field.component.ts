import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FormFieldVariant = 'default' | 'error' | 'success';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()">
      @if (label()) {
        <label [for]="inputId()" class="form-field-label">
          {{ label() }}
          @if (required()) {
            <span class="form-field-required" aria-label="required">*</span>
          }
        </label>
      }
      
      <div class="form-field-content">
        <ng-content />
      </div>
      
      @if (errorMessage()) {
        <div [id]="inputId() + '-error'" class="form-field-error" role="alert">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ errorMessage() }}
        </div>
      }
      
      @if (helpText() && !errorMessage()) {
        <div class="form-field-help">
          <svg class="help-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {{ helpText() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      width: 100%;
    }
    
    .form-field-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-bottom: var(--space-1);
    }
    
    .form-field-required {
      color: var(--loss-red);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
    }
    
    .form-field-content {
      position: relative;
      width: 100%;
    }
    
    .form-field-error {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--loss-red);
      margin-top: var(--space-1);
      padding: var(--space-2);
      background: rgba(var(--loss-red-rgb), 0.05);
      border: 1px solid rgba(var(--loss-red-rgb), 0.2);
      border-radius: var(--radius-md);
    }
    
    .form-field-help {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin-top: var(--space-1);
      padding: var(--space-2);
      background: rgba(var(--info-blue-rgb), 0.05);
      border: 1px solid rgba(var(--info-blue-rgb), 0.2);
      border-radius: var(--radius-md);
    }
    
    .error-icon,
    .help-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      stroke: currentColor;
    }
    
    /* Variant styling */
    .form-field--error .form-field-label {
      color: var(--loss-red);
    }
    
    .form-field--success .form-field-label {
      color: var(--profit-green);
    }
    
    /* Focus-within styling for better UX */
    .form-field:focus-within .form-field-label {
      color: var(--primary-blue);
    }
    
    .form-field--error:focus-within .form-field-label {
      color: var(--loss-red);
    }
    
    .form-field--success:focus-within .form-field-label {
      color: var(--profit-green);
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .form-field-error,
      .form-field-help {
        font-size: var(--text-xs);
        padding: var(--space-1) var(--space-2);
      }
      
      .error-icon,
      .help-icon {
        width: 14px;
        height: 14px;
      }
    }
    
    /* Animation for error/help messages */
    .form-field-error,
    .form-field-help {
      animation: fade-in 0.2s ease-out;
    }
    
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Accessibility improvements */
    .form-field-error:focus {
      outline: 2px solid var(--loss-red);
      outline-offset: 2px;
    }
    
    .form-field-help:focus {
      outline: 2px solid var(--info-blue);
      outline-offset: 2px;
    }
  `]
})
export class FormFieldComponent {
  // Inputs
  readonly label = input<string>('');
  readonly inputId = input<string>('');
  readonly required = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('');
  readonly variant = input<FormFieldVariant>('default');

  // Computed classes
  readonly containerClasses = computed(() => {
    const classes = ['form-field'];
    
    classes.push(`form-field--${this.variant()}`);
    
    return classes.join(' ');
  });
}