import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderStatus } from '../../../../core/models/trade-order.interface';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

export type FilterType = 'all' | 'active' | 'pending' | 'closed' | 'profitable' | 'today';

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
  imports: [CommonModule, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="quick-filters" role="group" [attr.aria-label]="'Trade filters'">
      <div class="quick-filters__header">
        <h3 class="quick-filters__title">Quick Filters</h3>
        @if (hasActiveFilters()) {
          <button 
            class="quick-filters__clear"
            (click)="clearAllFilters()"
            [attr.aria-label]="'Clear all active filters'">
            Clear All
          </button>
        }
      </div>
      
      <div class="quick-filters__container">
        <div class="quick-filters__scroll" [attr.aria-label]="'Scrollable filter options'">
          @for (filter of availableFilters(); track filter.id) {
            <button
              class="filter-pill"
              [class.filter-pill--active]="isActive(filter.id)"
              [class.filter-pill--profitable]="filter.id === 'profitable'"
              [disabled]="disabled()"
              (click)="toggleFilter(filter)"
              [attr.aria-pressed]="isActive(filter.id)"
              [attr.aria-label]="getFilterAriaLabel(filter)">
              
              @if (filter.icon) {
                <span class="filter-pill__icon" [innerHTML]="filter.icon"></span>
              }
              
              <span class="filter-pill__label">{{ filter.label }}</span>
              
              @if (filter.count !== undefined && showCounts()) {
                <app-badge 
                  [count]="filter.count"
                  [variant]="getBadgeVariant(filter)"
                  [size]="'sm'"
                  class="filter-pill__badge">
                </app-badge>
              }
              
              @if (isActive(filter.id)) {
                <span class="filter-pill__active-indicator" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </span>
              }
            </button>
          }
        </div>
        
        @if (showCustomFilter()) {
          <button 
            class="filter-pill filter-pill--custom"
            (click)="openCustomFilter()"
            [attr.aria-label]="'Open custom filter options'">
            <span class="filter-pill__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </span>
            <span class="filter-pill__label">Custom</span>
          </button>
        }
      </div>
      
      @if (activeFiltersCount() > 0) {
        <div class="quick-filters__summary" [attr.aria-live]="'polite'">
          <span class="summary-text">
            {{ getFilterSummary() }}
          </span>
        </div>
      }
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

  // Internal state
  private readonly activeFilters = signal<Set<FilterType>>(new Set(['all']));

  // Default filter options
  private readonly defaultFilters: FilterOption[] = [
    {
      id: 'all',
      label: 'All',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"></circle>
               <path d="m9 12 2 2 4-4"></path>
             </svg>`,
      description: 'Show all trade orders'
    },
    {
      id: 'active',
      label: 'Active',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"></circle>
               <polyline points="12,6 12,12 16,14"></polyline>
             </svg>`,
      description: 'Show active and pending orders'
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"></circle>
               <polyline points="12,6 12,12 16,14"></polyline>
             </svg>`,
      description: 'Show pending orders only'
    },
    {
      id: 'closed',
      label: 'Closed',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="m9 12 2 2 4-4"></path>
               <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path>
             </svg>`,
      description: 'Show completed orders'
    },
    {
      id: 'profitable',
      label: 'Profitable',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
             </svg>`,
      description: 'Show profitable trades only'
    },
    {
      id: 'today',
      label: 'Today',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
               <line x1="16" y1="2" x2="16" y2="6"></line>
               <line x1="8" y1="2" x2="8" y2="6"></line>
               <line x1="3" y1="10" x2="21" y2="10"></line>
             </svg>`,
      description: 'Show today\'s orders'
    }
  ];

  // Computed properties
  readonly availableFilters = computed(() => {
    const customFilters = this.filters();
    return customFilters.length > 0 ? customFilters : this.defaultFilters;
  });

  readonly hasActiveFilters = computed(() => {
    const active = this.activeFilters();
    return active.size > 1 || (active.size === 1 && !active.has('all'));
  });

  readonly activeFiltersCount = computed(() => {
    const active = this.activeFilters();
    return active.has('all') ? 0 : active.size;
  });

  constructor() {
    // Initialize with the active filter input
    const initialFilter = this.activeFilter();
    if (initialFilter && initialFilter !== 'all') {
      this.activeFilters.set(new Set([initialFilter]));
    }
  }

  protected isActive(filterId: FilterType): boolean {
    return this.activeFilters().has(filterId);
  }

  protected toggleFilter(filter: FilterOption): void {
    if (this.disabled()) return;

    const current = new Set(this.activeFilters());
    
    if (filter.id === 'all') {
      // Selecting 'all' clears other filters
      this.activeFilters.set(new Set(['all']));
    } else {
      // Remove 'all' if selecting a specific filter
      current.delete('all');
      
      if (current.has(filter.id)) {
        current.delete(filter.id);
        // If no filters remain, default to 'all'
        if (current.size === 0) {
          current.add('all');
        }
      } else {
        current.add(filter.id);
      }
      
      this.activeFilters.set(current);
    }

    // Emit the filter change event
    this.filterChange.emit({
      filterId: filter.id,
      filter: filter
    });
  }

  protected clearAllFilters(): void {
    this.activeFilters.set(new Set(['all']));
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

  protected getFilterAriaLabel(filter: FilterOption): string {
    const isActiveText = this.isActive(filter.id) ? 'active' : 'inactive';
    const countText = filter.count !== undefined ? ` (${filter.count} items)` : '';
    return `${filter.label} filter, ${isActiveText}${countText}. ${filter.description || ''}`;
  }

  protected getFilterSummary(): string {
    const active = this.activeFilters();
    const count = active.size;
    
    if (active.has('all')) {
      return 'Showing all orders';
    }
    
    if (count === 1) {
      const filterId = Array.from(active)[0];
      const filter = this.availableFilters().find(f => f.id === filterId);
      return `Showing ${filter?.label.toLowerCase()} orders`;
    }
    
    return `${count} filters active`;
  }
}