import { Component, input, output, computed, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type FabSize = 'sm' | 'md' | 'lg';
export type FabPosition = 'bottom-right' | 'bottom-left' | 'bottom-center';
export type FabVariant = 'primary' | 'success' | 'error' | 'warning';

export interface FabAction {
  id: string;
  label: string;
  icon: string;
  variant?: FabVariant;
  disabled?: boolean;
}

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fab-container" [class]="containerClasses()">
      <!-- Speed Dial Actions (when expanded) -->
      @if (speedDial() && actions().length > 0 && isExpanded()) {
        <div class="fab-speed-dial" role="menu" [attr.aria-label]="speedDialAriaLabel()">
          @for (action of actions(); track action.id) {
            <button
              class="fab-speed-dial__action"
              [class]="getActionClasses(action)"
              [disabled]="action.disabled || disabled()"
              (click)="handleActionClick(action, $event)"
              [attr.aria-label]="action.label"
              role="menuitem"
              [attr.aria-disabled]="action.disabled || disabled()">
              
              <span class="fab-speed-dial__icon" [innerHTML]="getSafeHtml(action.icon)"></span>
              
              @if (showLabels()) {
                <span class="fab-speed-dial__label">{{ action.label }}</span>
              }
            </button>
          }
        </div>
      }
      
      <!-- Main FAB Button -->
      <button 
        class="fab"
        [class]="fabClasses()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || 'Floating action button'"
        [attr.aria-expanded]="speedDial() ? isExpanded() : undefined"
        [attr.aria-haspopup]="speedDial() ? 'menu' : undefined"
        (click)="handleMainClick($event)">
        
        @if (loading()) {
          <span class="fab__spinner" aria-hidden="true"></span>
        } @else {
          <span 
            class="fab__icon" 
            [class.fab__icon--rotated]="speedDial() && isExpanded()">
            @if (displayIcon(); as safeIconHtml) {
              <div [innerHTML]="safeIconHtml"></div>
            } @else {
              <!-- Default plus icon fallback -->
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            }
          </span>
        }
        
        @if (badge() && badge()! > 0) {
          <span class="fab__badge" [attr.aria-label]="'Badge count: ' + badge()">
            {{ badge()! > 99 ? '99+' : badge() }}
          </span>
        }
        
        @if (showLabel() && label()) {
          <span class="fab__label">{{ label() }}</span>
        }
      </button>
      
      <!-- Backdrop for Speed Dial -->
      @if (speedDial() && isExpanded() && backdrop()) {
        <div 
          class="fab-backdrop"
          (click)="collapseDialog()"
          [attr.aria-label]="'Close speed dial menu'">
        </div>
      }
    </div>
  `,
  styleUrl: './fab.component.scss'
})
export class FabComponent {
  private readonly sanitizer = inject(DomSanitizer);

  // Inputs
  readonly size = input<FabSize>('md');
  readonly position = input<FabPosition>('bottom-right');
  readonly variant = input<FabVariant>('primary');
  readonly icon = input<string>(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `);
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly badge = input<number | null>(null);
  readonly showLabel = input<boolean>(false);
  readonly speedDial = input<boolean>(false);
  readonly actions = input<FabAction[]>([]);
  readonly showLabels = input<boolean>(true);
  readonly backdrop = input<boolean>(true);
  readonly expandIcon = input<string>(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `);
  readonly collapseIcon = input<string>(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `);

  // Outputs
  readonly click = output<MouseEvent>();
  readonly actionClick = output<{ action: FabAction; event: MouseEvent }>();
  readonly expand = output<void>();
  readonly collapseEvent = output<void>();

  // Internal state
  private readonly expanded = signal<boolean>(false);

  // Computed properties
  readonly containerClasses = computed(() => {
    const classes = ['fab-container'];
    classes.push(`fab-container--${this.position()}`);
    
    if (this.speedDial() && this.isExpanded()) {
      classes.push('fab-container--expanded');
    }
    
    return classes.join(' ');
  });

  readonly fabClasses = computed(() => {
    const classes = ['fab'];
    
    classes.push(`fab--${this.size()}`);
    classes.push(`fab--${this.variant()}`);
    
    if (this.loading()) {
      classes.push('fab--loading');
    }
    
    if (this.showLabel() && this.label()) {
      classes.push('fab--with-label');
    }
    
    if (this.speedDial()) {
      classes.push('fab--speed-dial');
    }
    
    return classes.join(' ');
  });

  readonly displayIcon = computed((): SafeHtml | null => {
    let iconHtml: string;
    
    if (!this.speedDial()) {
      iconHtml = this.icon();
    } else {
      iconHtml = this.isExpanded() ? this.collapseIcon() : this.expandIcon();
    }
    
    // Sanitize the HTML content to make it safe for innerHTML binding
    return iconHtml ? this.sanitizer.bypassSecurityTrustHtml(iconHtml) : null;
  });

  readonly speedDialAriaLabel = computed(() => {
    return `Speed dial menu with ${this.actions().length} actions`;
  });

  protected isExpanded(): boolean {
    return this.expanded();
  }

  protected getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected handleMainClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      return;
    }

    if (this.speedDial() && this.actions().length > 0) {
      this.toggleExpanded();
    } else {
      this.click.emit(event);
    }
  }

  protected handleActionClick(action: FabAction, event: MouseEvent): void {
    if (action.disabled || this.disabled()) {
      return;
    }

    this.actionClick.emit({ action, event });
    
    // Auto-collapse after action
    if (this.speedDial()) {
      this.collapseDialog();
    }
  }

  protected getActionClasses(action: FabAction): string {
    const classes = ['fab-speed-dial__action'];
    
    if (action.variant) {
      classes.push(`fab-speed-dial__action--${action.variant}`);
    }
    
    if (action.disabled) {
      classes.push('fab-speed-dial__action--disabled');
    }
    
    return classes.join(' ');
  }

  private toggleExpanded(): void {
    if (this.isExpanded()) {
      this.collapseSpeedDial();
    } else {
      this.expandSpeedDial();
    }
  }

  private expandSpeedDial(): void {
    this.expanded.set(true);
    this.expand.emit();
  }

  private collapseSpeedDial(): void {
    this.expanded.set(false);
    this.collapseEvent.emit();
  }

  // Public methods for external control
  public expandDial(): void {
    if (this.speedDial()) {
      this.expandSpeedDial();
    }
  }

  public collapseDial(): void {
    if (this.speedDial()) {
      this.collapseSpeedDial();
    }
  }

  public collapseDialog(): void {
    this.collapseSpeedDial();
  }
}