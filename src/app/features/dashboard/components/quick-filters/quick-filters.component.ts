import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TradeOrderResponseDto } from '../../../../core/models/trade-order.interface';
// Badge component removed since we're not using it in the new design
import { TradeOrderService } from '../../../../core/services/trade-order.service';

export type FilterType = 'all' | 'active' | 'pending' | 'closed' | 'profitable' | 'today';

export interface ProfessionalFilter {
  id: FilterType;
  label: string;
  count: number;
  description: string;
  active: boolean;
  icon?: string;
}

export interface FilterOption {
  id: FilterType;
  label: string;
  count?: number;
  icon?: string;
  description?: string;
}

export interface FilterChangeEvent {
  filterId: FilterType;
  filter: FilterOption;
}

@Component({
  selector: 'app-quick-filters',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="professional-filters" role="group" [attr.aria-label]="'Professional trade filters'">
      <div class="professional-filters__header">
        <h3 class="professional-filters__title">Filters</h3>
        @if (hasActiveFilters()) {
          <button 
            class="professional-filters__clear"
            (click)="clearAllFilters()"
            [attr.aria-label]="'Clear active filter'">
            Show All
          </button>
        }
      </div>
      
      <div class="professional-filters__container">
        <div class="professional-filters__grid" [attr.aria-label]="'Filter options'">
          @for (filter of professionalFilters(); track filter.id) {
            <button
              class="professional-filter"
              [class.professional-filter--active]="filter.active"
              [class.professional-filter--profitable]="filter.id === 'profitable'"
              [disabled]="disabled()"
              (click)="selectFilter(filter)"
              [attr.aria-pressed]="filter.active"
              [attr.aria-label]="getFilterAriaLabel(filter)">
              
              @if (filter.icon) {
                <span class="professional-filter__icon" [innerHTML]="filter.icon"></span>
              }
              
              <div class="professional-filter__content">
                <span class="professional-filter__label">{{ filter.label }}</span>
                @if (showCounts()) {
                  <span class="professional-filter__count">
                    {{ filter.count }}
                  </span>
                }
              </div>
              
              @if (filter.active) {
                <span class="professional-filter__active-indicator" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </span>
              }
            </button>
          }
        </div>
        
        @if (showCustomFilter()) {
          <button 
            class="professional-filter professional-filter--custom"
            (click)="openCustomFilter()"
            [attr.aria-label]="'Open advanced filter options'">
            <span class="professional-filter__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </span>
            <div class="professional-filter__content">
              <span class="professional-filter__label">Advanced</span>
            </div>
          </button>
        }
      </div>
      
      <div class="professional-filters__summary" [attr.aria-live]="'polite'">
        <span class="summary-text">
          {{ getFilterSummary() }}
        </span>
        @if (hasActiveFilters()) {
          <span class="summary-count">
            {{ getActiveFilterCount() }} trades
          </span>
        }
      </div>
    </div>
  `,
  styleUrl: './quick-filters.component.scss'
})
export class QuickFiltersComponent {
  // Inputs
  readonly filters = input<FilterOption[]>([]);
  readonly activeFilter = input<FilterType>('all');
  readonly disabled = input<boolean>(false);
  readonly showCounts = input<boolean>(true);
  readonly showCustomFilter = input<boolean>(true);

  // Outputs
  readonly filterChange = output<FilterChangeEvent>();
  readonly customFilterClick = output<void>();
  readonly clearFilters = output<void>();

  // Inject services for real-time data
  private readonly tradeOrderService = inject(TradeOrderService);
  
  // Internal state - simplified to single active filter
  private readonly currentActiveFilter = signal<FilterType>('all');

  // Default filters are now computed in professionalFilters - removed static array

  // Computed properties with real-time counts using service signals
  readonly professionalFilters = computed(() => {
    const orders = this.tradeOrderService.orders();
    const activeFilter = this.currentActiveFilter();
    
    return [
      {
        id: 'all' as FilterType,
        label: 'All Trades',
        count: orders.length,
        description: 'Show all trading activity',
        active: activeFilter === 'all',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="10"></circle>
                 <path d="m9 12 2 2 4-4"></path>
               </svg>`
      },
      {
        id: 'active' as FilterType,
        label: 'Active Positions',
        count: this.tradeOrderService.activeOrders().length,
        description: 'Open trades and pending orders',
        active: activeFilter === 'active',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="10"></circle>
                 <polyline points="12,6 12,12 16,14"></polyline>
               </svg>`
      },
      {
        id: 'profitable' as FilterType,
        label: 'Profitable',
        count: this.tradeOrderService.profitableOrders().length,
        description: 'Trades in profit',
        active: activeFilter === 'profitable',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
               </svg>`
      },
      {
        id: 'today' as FilterType,
        label: 'Today\'s Trades',
        count: this.tradeOrderService.todayOrders().length,
        description: 'Today\'s trading activity',
        active: activeFilter === 'today',
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                 <line x1="16" y1="2" x2="16" y2="6"></line>
                 <line x1="8" y1="2" x2="8" y2="6"></line>
                 <line x1="3" y1="10" x2="21" y2="10"></line>
               </svg>`
      }
    ];
  });

  readonly availableFilters = computed(() => {
    const customFilters = this.filters();
    return customFilters.length > 0 ? customFilters : this.professionalFilters();
  });

  readonly hasActiveFilters = computed(() => {
    return this.currentActiveFilter() !== 'all';
  });

  readonly activeFiltersCount = computed(() => {
    return this.hasActiveFilters() ? 1 : 0;
  });

  constructor() {
    // Initialize with the active filter input and keep it synced
    effect(() => {
      const inputFilter = this.activeFilter();
      if (inputFilter !== this.currentActiveFilter()) {
        this.currentActiveFilter.set(inputFilter);
      }
    });
  }

  protected isActive(filterId: FilterType): boolean {
    return this.currentActiveFilter() === filterId;
  }

  protected toggleFilter(filter: FilterOption): void {
    if (this.disabled()) return;

    // Single-select logic - much simpler!
    this.currentActiveFilter.set(filter.id);

    // Emit the filter change event
    this.filterChange.emit({
      filterId: filter.id,
      filter: filter
    });
  }
  
  protected selectFilter(filter: ProfessionalFilter): void {
    if (this.disabled()) return;

    // Single-select logic for professional filters
    this.currentActiveFilter.set(filter.id);

    // Emit the filter change event
    this.filterChange.emit({
      filterId: filter.id,
      filter: {
        id: filter.id,
        label: filter.label,
        count: filter.count,
        description: filter.description
      }
    });
  }

  protected clearAllFilters(): void {
    this.currentActiveFilter.set('all');
    this.clearFilters.emit();
  }

  protected openCustomFilter(): void {
    this.customFilterClick.emit();
  }

  protected getBadgeVariant(filter: FilterOption): 'default' | 'success' | 'error' | 'warning' | 'info' {
    switch (filter.id) {
      case 'profitable':
        return 'success';
      case 'active':
      case 'pending':
        return 'warning';
      case 'closed':
        return 'info';
      default:
        return 'default';
    }
  }

  protected getFilterAriaLabel(filter: FilterOption | ProfessionalFilter): string {
    const isActiveText = this.isActive(filter.id) ? 'active' : 'inactive';
    const countText = filter.count !== undefined ? ` (${filter.count} trades)` : '';
    return `${filter.label} filter, ${isActiveText}${countText}. ${filter.description || ''}`;
  }

  protected getFilterSummary(): string {
    const activeFilter = this.currentActiveFilter();
    
    if (activeFilter === 'all') {
      return 'Showing all orders';
    }
    
    const filter = this.availableFilters().find(f => f.id === activeFilter);
    return `Showing ${filter?.label.toLowerCase() || 'filtered'} orders`;
  }
  
  // Removed getCachedOrders method - now using service signals directly
  
  private isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  protected getActiveFilterCount(): number {
    const activeFilter = this.professionalFilters().find(f => f.active);
    return activeFilter?.count || 0;
  }
}