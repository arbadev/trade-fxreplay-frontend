import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'filled' | 'pending' | 'cancelled' | 'rejected' | 'success' | 'error' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses()">
      @if (icon()) {
        <span class="badge-icon" [innerHTML]="icon()"></span>
      }
      <span class="badge-text">
        <ng-content></ng-content>
      </span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      border-radius: var(--radius-full);
      font-family: var(--font-primary);
      font-weight: var(--font-semibold);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    
    /* Sizes */
    .badge--sm {
      padding: var(--space-1) var(--space-2);
      font-size: var(--text-xs);
      min-height: 20px;
    }
    
    .badge--md {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-xs);
      min-height: 24px;
    }
    
    .badge--lg {
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
      min-height: 28px;
    }
    
    /* Variants */
    .badge--filled {
      background: rgba(var(--profit-green-rgb), 0.1);
      color: var(--profit-green);
      border: 1px solid rgba(var(--profit-green-rgb), 0.2);
    }
    
    .badge--pending {
      background: rgba(var(--pending-yellow-rgb), 0.1);
      color: var(--pending-yellow);
      border: 1px solid rgba(var(--pending-yellow-rgb), 0.2);
    }
    
    .badge--cancelled,
    .badge--rejected {
      background: rgba(var(--loss-red-rgb), 0.1);
      color: var(--loss-red);
      border: 1px solid rgba(var(--loss-red-rgb), 0.2);
    }
    
    .badge--success {
      background: rgba(var(--profit-green-rgb), 0.1);
      color: var(--profit-green);
      border: 1px solid rgba(var(--profit-green-rgb), 0.2);
    }
    
    .badge--error {
      background: rgba(var(--loss-red-rgb), 0.1);
      color: var(--loss-red);
      border: 1px solid rgba(var(--loss-red-rgb), 0.2);
    }
    
    .badge--warning {
      background: rgba(var(--pending-yellow-rgb), 0.1);
      color: var(--pending-yellow);
      border: 1px solid rgba(var(--pending-yellow-rgb), 0.2);
    }
    
    .badge--info {
      background: rgba(var(--info-blue-rgb), 0.1);
      color: var(--info-blue);
      border: 1px solid rgba(var(--info-blue-rgb), 0.2);
    }
    
    /* Icon styling */
    .badge-icon {
      width: 12px;
      height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 100%;
        height: 100%;
        fill: currentColor;
      }
    }
    
    .badge--lg .badge-icon {
      width: 14px;
      height: 14px;
    }
    
    /* Pulse animation for active states */
    .badge--pulse {
      animation: badge-pulse 2s infinite;
    }
    
    @keyframes badge-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    
    /* Dot indicator variant */
    .badge--dot {
      padding-left: var(--space-2);
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: var(--space-2);
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
    }
    
    .badge--dot.badge--md::before {
      left: var(--space-3);
    }
    
    .badge--dot.badge--lg::before {
      width: 8px;
      height: 8px;
      left: var(--space-4);
    }
  `]
})
export class BadgeComponent {
  // Inputs
  readonly variant = input<BadgeVariant>('info');
  readonly size = input<BadgeSize>('md');
  readonly icon = input<string | null>(null);
  readonly pulse = input<boolean>(false);
  readonly dot = input<boolean>(false);

  // Computed CSS classes
  readonly badgeClasses = computed(() => {
    const classes = ['badge'];
    
    classes.push(`badge--${this.variant()}`);
    classes.push(`badge--${this.size()}`);
    
    if (this.pulse()) {
      classes.push('badge--pulse');
    }
    
    if (this.dot()) {
      classes.push('badge--dot');
    }
    
    return classes.join(' ');
  });
}