import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

export interface TabItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-mobile-tab-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="tab-bar safe-area-bottom" role="tablist">
      @for (tab of tabs; track tab.path) {
        <a 
          [routerLink]="tab.path"
          [class]="getTabClasses(tab)"
          role="tab"
          [attr.aria-selected]="isActive(tab.path)"
          [attr.aria-label]="tab.label">
          
          <div class="tab-icon-container">
            <span class="tab-icon" [innerHTML]="tab.icon"></span>
            @if (tab.badge && tab.badge > 0) {
              <span class="tab-badge">{{ formatBadge(tab.badge) }}</span>
            }
          </div>
          
          <span class="tab-label">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .tab-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-primary);
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: var(--space-2) var(--space-4);
      z-index: 50;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    
    .tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: var(--space-2);
      color: var(--text-tertiary);
      text-decoration: none;
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      min-width: var(--touch-target-comfortable);
      min-height: var(--touch-target-comfortable);
      border-radius: var(--radius-lg);
      transition: all 0.2s ease;
      position: relative;
      
      &:hover {
        color: var(--text-secondary);
        background: var(--bg-tertiary);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
    
    .tab--active {
      color: var(--primary-blue);
      
      &:hover {
        color: var(--primary-blue-light);
      }
      
      .tab-icon-container::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: var(--primary-blue);
        border-radius: var(--radius-full);
      }
    }
    
    .tab-icon-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }
    
    .tab-icon {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
        stroke: currentColor;
      }
    }
    
    .tab-label {
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      text-align: center;
      white-space: nowrap;
    }
    
    .tab-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--loss-red);
      color: white;
      font-size: 10px;
      font-weight: var(--font-bold);
      line-height: 1;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      min-width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 2px var(--bg-secondary);
    }
    
    /* Desktop hiding */
    @media (min-width: 1024px) {
      .tab-bar {
        display: none;
      }
    }
    
    /* Animation for tab changes */
    .tab-bar {
      animation: slide-up 0.3s ease-out;
    }
    
    @keyframes slide-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
    
    /* Focus styles for accessibility */
    .tab:focus-visible {
      outline: 2px solid var(--primary-blue);
      outline-offset: 2px;
    }
  `]
})
export class MobileTabBarComponent {
  private readonly router = inject(Router);

  // Tab configuration
  protected readonly tabs: TabItem[] = [
    {
      path: '/trades',
      label: 'Dashboard',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>`
    },
    {
      path: '/trades/new',
      label: 'New Trade',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v12M6 12h12"/>
      </svg>`
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3v18h18"/>
        <path d="m19 9-5 5-4-4-3 3"/>
      </svg>`
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="m12 1 1.85 2.84L16 3.3 16.7 5.15 19 6l-.84 1.85L19 10l-2.84 1.85L16.7 14 15 14.7 14 17l-1.85-.84L10 17l-1.85-2.84L6 14.7 5.3 13 3 12l.84-1.85L3 8l2.84-1.85L5.3 4 7 3.3 8 1l1.85.84L12 1z"/>
      </svg>`
    }
  ];

  // Track current route
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url),
      startWith(this.router.url)
    )
  );

  protected isActive(path: string): boolean {
    const currentUrl = this.currentUrl();
    if (!currentUrl) return false;
    
    // Exact match for root paths
    if (path === '/trades' && currentUrl === '/') return true;
    if (path === currentUrl) return true;
    
    // Partial match for sub-routes (except new trade)
    if (path === '/trades' && currentUrl.startsWith('/trades') && !currentUrl.includes('/new')) {
      return true;
    }
    
    return false;
  }

  protected getTabClasses(tab: TabItem): string {
    const classes = ['tab'];
    
    if (this.isActive(tab.path)) {
      classes.push('tab--active');
    }
    
    return classes.join(' ');
  }

  protected formatBadge(count: number): string {
    if (count > 99) return '99+';
    return count.toString();
  }
}