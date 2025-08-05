import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'trade';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses()">
      @if (header()) {
        <header class="card-header">
          <ng-content select="[slot=header]"></ng-content>
        </header>
      }
      
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      
      @if (footer()) {
        <footer class="card-footer">
          <ng-content select="[slot=footer]"></ng-content>
        </footer>
      }
    </div>
  `,
  styles: [`
    .card {
      background: var(--bg-secondary);
      border-radius: var(--radius-xl);
      transition: all 0.2s ease;
      overflow: hidden;
      
      &:hover {
        transform: translateY(-1px);
      }
    }
    
    /* Variants */
    .card--default {
      border: 1px solid var(--border-primary);
    }
    
    .card--elevated {
      border: 1px solid var(--border-primary);
      box-shadow: var(--shadow-sm);
      
      &:hover {
        box-shadow: var(--shadow-md);
        border-color: var(--border-secondary);
      }
    }
    
    .card--outlined {
      border: 2px solid var(--border-secondary);
      
      &:hover {
        border-color: var(--border-focus);
      }
    }
    
    .card--trade {
      border: 1px solid var(--border-primary);
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: var(--profit-green);
        border-radius: var(--radius-sm);
      }
      
      &.trade-sell::before {
        background: var(--loss-red);
      }
      
      &.trade-pending::before {
        background: var(--pending-yellow);
      }
      
      &.trade-cancelled::before {
        background: var(--text-tertiary);
      }
    }
    
    /* Padding variants */
    .card--padding-none {
      .card-content {
        padding: 0;
      }
      
      .card-header {
        padding: var(--space-4) var(--space-4) 0;
      }
      
      .card-footer {
        padding: 0 var(--space-4) var(--space-4);
      }
    }
    
    .card--padding-sm {
      .card-content {
        padding: var(--space-3);
      }
      
      .card-header {
        padding: var(--space-3) var(--space-3) 0;
      }
      
      .card-footer {
        padding: 0 var(--space-3) var(--space-3);
      }
    }
    
    .card--padding-md {
      .card-content {
        padding: var(--space-4);
      }
      
      .card-header {
        padding: var(--space-4) var(--space-4) 0;
      }
      
      .card-footer {
        padding: 0 var(--space-4) var(--space-4);
      }
    }
    
    .card--padding-lg {
      .card-content {
        padding: var(--space-6);
      }
      
      .card-header {
        padding: var(--space-6) var(--space-6) 0;
      }
      
      .card-footer {
        padding: 0 var(--space-6) var(--space-6);
      }
    }
    
    /* Header and Footer */
    .card-header {
      border-bottom: 1px solid var(--border-primary);
      padding-bottom: var(--space-4);
      margin-bottom: var(--space-4);
    }
    
    .card-footer {
      border-top: 1px solid var(--border-primary);
      padding-top: var(--space-4);
      margin-top: var(--space-4);
    }
    
    /* Interactive states */
    .card--clickable {
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
      
      &:active {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
    }
    
    /* Loading state */
    .card--loading {
      .card-content {
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg, 
            transparent 25%, 
            rgba(var(--primary-blue-rgb), 0.1) 50%, 
            transparent 75%
          );
          background-size: 200% 100%;
          animation: loading-shimmer 1.5s infinite;
        }
      }
    }
    
    @keyframes loading-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class CardComponent {
  // Inputs
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('md');
  readonly clickable = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly header = input<boolean>(false);
  readonly footer = input<boolean>(false);
  readonly tradeSide = input<'buy' | 'sell' | 'pending' | 'cancelled' | null>(null);

  // Computed CSS classes
  readonly cardClasses = computed(() => {
    const classes = ['card'];
    
    classes.push(`card--${this.variant()}`);
    classes.push(`card--padding-${this.padding()}`);
    
    if (this.clickable()) {
      classes.push('card--clickable');
    }
    
    if (this.loading()) {
      classes.push('card--loading');
    }
    
    if (this.variant() === 'trade' && this.tradeSide()) {
      classes.push(`trade-${this.tradeSide()}`);
    }
    
    return classes.join(' ');
  });
}