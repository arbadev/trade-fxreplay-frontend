import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'buy' | 'sell' | 'cancel' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type()"
      [disabled]="disabled()"
      [class]="buttonClasses()"
      (click)="handleClick($event)">
      @if (loading()) {
        <span class="button-spinner" aria-hidden="true"></span>
      }
      <span [class.sr-only]="loading()">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      border: none;
      border-radius: var(--radius-lg);
      font-family: var(--font-primary);
      font-weight: var(--font-semibold);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
      }
      
      &:not(:disabled):hover {
        transform: translateY(-1px);
      }
      
      &:not(:disabled):active {
        transform: translateY(0);
        animation: button-press 0.1s ease;
      }
    }
    
    /* Sizes */
    .button--xs {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-xs);
      min-height: 32px;
      min-width: 64px;
    }
    
    .button--sm {
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
      min-height: 36px;
      min-width: 80px;
    }
    
    .button--md {
      padding: var(--space-3) var(--space-6);
      font-size: var(--text-base);
      min-height: var(--touch-target-comfortable);
      min-width: 100px;
    }
    
    .button--lg {
      padding: var(--space-4) var(--space-8);
      font-size: var(--text-lg);
      min-height: var(--touch-target-large);
      min-width: 120px;
    }
    
    /* Variants */
    .button--primary {
      background: var(--primary-blue);
      color: white;
      box-shadow: var(--shadow-sm);
      
      &:not(:disabled):hover {
        background: var(--primary-blue-light);
        box-shadow: var(--shadow-md);
      }
      
      &:not(:disabled):active {
        background: var(--primary-blue-dark);
      }
    }
    
    .button--secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-primary);
      
      &:not(:disabled):hover {
        background: var(--bg-tertiary);
        border-color: var(--border-secondary);
      }
      
      &:not(:disabled):active {
        background: var(--bg-surface);
      }
    }
    
    .button--buy {
      background: var(--profit-green);
      color: white;
      box-shadow: var(--shadow-sm);
      
      &:not(:disabled):hover {
        background: var(--profit-green-light);
        box-shadow: var(--shadow-md);
      }
      
      &:not(:disabled):active {
        background: var(--profit-green-dark);
      }
    }
    
    .button--sell {
      background: var(--loss-red);
      color: white;
      box-shadow: var(--shadow-sm);
      
      &:not(:disabled):hover {
        background: var(--loss-red-light);
        box-shadow: var(--shadow-md);
      }
      
      &:not(:disabled):active {
        background: var(--loss-red-dark);
      }
    }
    
    .button--cancel {
      background: var(--pending-yellow);
      color: var(--bg-primary);
      box-shadow: var(--shadow-sm);
      
      &:not(:disabled):hover {
        background: var(--pending-yellow-light);
        box-shadow: var(--shadow-md);
      }
      
      &:not(:disabled):active {
        background: var(--pending-yellow-dark);
      }
    }
    
    .button--ghost {
      background: transparent;
      color: var(--text-secondary);
      
      &:not(:disabled):hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      &:not(:disabled):active {
        background: var(--bg-tertiary);
      }
    }
    
    /* Loading spinner */
    .button-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes button-press {
      0% { transform: scale(1); }
      50% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    
    /* Full width variant */
    .button--full {
      width: 100%;
    }
  `]
})
export class ButtonComponent {
  // Inputs
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  // Outputs
  readonly onClick = output<MouseEvent>();

  // Computed CSS classes
  readonly buttonClasses = computed(() => {
    const classes = ['button'];
    
    classes.push(`button--${this.variant()}`);
    classes.push(`button--${this.size()}`);
    
    if (this.fullWidth()) {
      classes.push('button--full');
    }
    
    return classes.join(' ');
  });

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.onClick.emit(event);
    }
  }
}