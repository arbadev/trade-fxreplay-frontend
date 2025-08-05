import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type SpinnerVariant = 'default' | 'primary' | 'success' | 'error' | 'warning';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()">
      <div [class]="spinnerClasses()" [attr.aria-label]="ariaLabel()">
        <div class="spinner-circle" [style]="customSizeStyle()"></div>
      </div>
      
      @if (message()) {
        <p class="spinner-message">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
    }
    
    .spinner-container--inline {
      flex-direction: row;
      gap: var(--space-2);
    }
    
    .spinner {
      display: inline-block;
      position: relative;
    }
    
    .spinner-circle {
      border-radius: 50%;
      border-style: solid;
      animation: spin 1s linear infinite;
    }
    
    /* Sizes */
    .spinner--xs .spinner-circle {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }
    
    .spinner--sm .spinner-circle {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }
    
    .spinner--md .spinner-circle {
      width: 24px;
      height: 24px;
      border-width: 3px;
    }
    
    .spinner--lg .spinner-circle {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }
    
    .spinner--xl .spinner-circle {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }
    
    .spinner--custom .spinner-circle {
      /* Custom size styles applied via [style] binding */
    }
    
    /* Variants */
    .spinner--default .spinner-circle {
      border-color: var(--text-tertiary);
      border-top-color: var(--text-primary);
    }
    
    .spinner--primary .spinner-circle {
      border-color: rgba(var(--primary-blue-rgb), 0.3);
      border-top-color: var(--primary-blue);
    }
    
    .spinner--success .spinner-circle {
      border-color: rgba(var(--profit-green-rgb), 0.3);
      border-top-color: var(--profit-green);
    }
    
    .spinner--error .spinner-circle {
      border-color: rgba(var(--loss-red-rgb), 0.3);
      border-top-color: var(--loss-red);
    }
    
    .spinner--warning .spinner-circle {
      border-color: rgba(var(--pending-yellow-rgb), 0.3);
      border-top-color: var(--pending-yellow);
    }
    
    /* Message styling */
    .spinner-message {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      text-align: center;
      font-weight: var(--font-medium);
    }
    
    .spinner-container--inline .spinner-message {
      font-size: var(--text-xs);
    }
    
    /* Animation */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Overlay variant */
    .spinner-container--overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(var(--bg-primary), 0.8);
      backdrop-filter: blur(2px);
      z-index: 9999;
      
      .spinner-message {
        color: var(--text-primary);
        font-size: var(--text-base);
      }
    }
    
    /* Centered in container */
    .spinner-container--centered {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .spinner-circle {
        animation: none;
        border-top-color: transparent;
        border-right-color: transparent;
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  // Inputs
  readonly size = input<SpinnerSize>('md');
  readonly variant = input<SpinnerVariant>('default');
  readonly message = input<string | null>(null);
  readonly inline = input<boolean>(false);
  readonly overlay = input<boolean>(false);
  readonly centered = input<boolean>(false);
  readonly ariaLabel = input<string>('Loading');

  // Computed CSS classes
  readonly containerClasses = computed(() => {
    const classes = ['spinner-container'];
    
    if (this.inline()) {
      classes.push('spinner-container--inline');
    }
    
    if (this.overlay()) {
      classes.push('spinner-container--overlay');
    }
    
    if (this.centered()) {
      classes.push('spinner-container--centered');
    }
    
    return classes.join(' ');
  });

  readonly spinnerClasses = computed(() => {
    const classes = ['spinner'];
    
    const size = this.size();
    if (typeof size === 'number') {
      classes.push('spinner--custom');
    } else {
      classes.push(`spinner--${size}`);
    }
    classes.push(`spinner--${this.variant()}`);
    
    return classes.join(' ');
  });

  readonly customSizeStyle = computed(() => {
    const size = this.size();
    if (typeof size === 'number') {
      return {
        width: `${size}px`,
        height: `${size}px`,
        'border-width': `${Math.max(2, Math.floor(size / 8))}px`
      };
    }
    return null;
  });
}