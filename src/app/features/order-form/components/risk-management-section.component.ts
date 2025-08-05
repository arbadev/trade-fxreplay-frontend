import { Component, input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { OrderSide, TradingSymbol } from '../../../core/models/trade-order.interface';
import { getTradingErrorMessage } from '../validators/trading-validators';

@Component({
  selector: 'app-risk-management-section',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormFieldComponent, 
    InputComponent,
    ToggleComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="risk-management-section">
      <div class="section-header">
        <div class="section-title">
          <div class="title-icon" [innerHTML]="shieldIcon"></div>
          <h3>Risk Management</h3>
        </div>
        <button
          type="button"
          [class]="getToggleClasses()"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="sectionId()"
          (click)="toggleExpanded()"
        >
          <span>{{ isExpanded() ? 'Hide' : 'Show' }} Options</span>
          <div class="toggle-icon" [innerHTML]="getToggleIcon()"></div>
        </button>
      </div>

      @if (isExpanded()) {
        <div [id]="sectionId()" class="section-content" role="region" aria-label="Risk management options">
          <div class="risk-inputs">
            <div class="input-group">
              <app-form-field
                label="Stop Loss"
                [inputId]="stopLossId()"
                [errorMessage]="getStopLossError()"
                helpText="Limit your potential loss"
              >
                <app-input
                  [inputId]="stopLossId()"
                  type="number"
                  placeholder="Enter stop loss price"
                  step="0.0001"
                  [formControl]="stopLossControl()"
                  [prefixIcon]="getPriceIcon()"
                  [variant]="getStopLossError() ? 'error' : 'default'"
                />
              </app-form-field>
            </div>

            <div class="input-group">
              <app-form-field
                label="Take Profit"
                [inputId]="takeProfitId()"
                [errorMessage]="getTakeProfitError()"
                helpText="Lock in your potential profit"
              >
                <app-input
                  [inputId]="takeProfitId()"
                  type="number"
                  placeholder="Enter take profit price"
                  step="0.0001"
                  [formControl]="takeProfitControl()"
                  [prefixIcon]="getPriceIcon()"
                  [variant]="getTakeProfitError() ? 'error' : 'default'"
                />
              </app-form-field>
            </div>
          </div>

          @if (riskRewardSummary(); as summary) {
            <div class="risk-summary">
              <div class="summary-header">
                <div class="summary-icon" [innerHTML]="calculatorIcon"></div>
                <h4>Risk/Reward Analysis</h4>
              </div>
              
              <div class="summary-grid">
                @if (summary.potentialLoss !== undefined) {
                  <div class="summary-item summary-item--loss">
                    <div class="summary-label">Potential Loss</div>
                    <div class="summary-value">{{ formatCurrency(summary.potentialLoss) }}</div>
                  </div>
                }
                
                @if (summary.potentialProfit !== undefined) {
                  <div class="summary-item summary-item--profit">
                    <div class="summary-label">Potential Profit</div>
                    <div class="summary-value">{{ formatCurrency(summary.potentialProfit) }}</div>
                  </div>
                }
                
                @if (summary.riskRewardRatio !== undefined) {
                  <div class="summary-item" [class]="getRiskRewardClasses(summary.riskRewardRatio)">
                    <div class="summary-label">Risk/Reward Ratio</div>
                    <div class="summary-value">{{ summary.riskRewardRatio.toFixed(2) }}:1</div>
                  </div>
                }
              </div>
              
              @if (summary.riskRewardRatio !== undefined && summary.riskRewardRatio > 3) {
                <div class="risk-warning">
                  <div class="warning-icon" [innerHTML]="warningIcon"></div>
                  <div class="warning-text">
                    High risk/reward ratio. Consider adjusting your stop loss or take profit levels.
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .risk-management-section {
      width: 100%;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    .title-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      
      svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
      }
    }
    
    .section-title h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0;
    }
    
    .section-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: transparent;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--bg-secondary);
        border-color: var(--border-secondary);
        color: var(--text-primary);
      }
      
      &:focus-visible {
        outline: 2px solid var(--primary-blue);
        outline-offset: 2px;
      }
    }
    
    .section-toggle--expanded {
      background: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
      
      &:hover {
        background: var(--primary-blue-light);
        border-color: var(--primary-blue-light);
      }
    }
    
    .toggle-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
      
      svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
      }
    }
    
    .section-toggle--expanded .toggle-icon {
      transform: rotate(180deg);
    }
    
    .section-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-4);
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      animation: section-expand 0.3s ease;
    }
    
    @keyframes section-expand {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .risk-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-4);
    }
    
    .input-group {
      display: flex;
      flex-direction: column;
    }
    
    .risk-summary {
      padding: var(--space-4);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
    }
    
    .summary-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    
    .summary-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      
      svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        fill: none;
      }
    }
    
    .summary-header h4 {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-3);
    }
    
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-3);
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
    }
    
    .summary-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      font-weight: var(--font-medium);
    }
    
    .summary-value {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      font-family: var(--font-mono);
      color: var(--text-primary);
    }
    
    .summary-item--profit .summary-value {
      color: var(--profit-green);
    }
    
    .summary-item--loss .summary-value {
      color: var(--loss-red);
    }
    
    .summary-item--risk-good .summary-value {
      color: var(--profit-green);
    }
    
    .summary-item--risk-warning .summary-value {
      color: var(--pending-yellow);
    }
    
    .summary-item--risk-bad .summary-value {
      color: var(--loss-red);
    }
    
    .risk-warning {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: rgba(var(--pending-yellow-rgb), 0.1);
      border: 1px solid rgba(var(--pending-yellow-rgb), 0.2);
      border-radius: var(--radius-md);
    }
    
    .warning-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--pending-yellow);
      flex-shrink: 0;
      
      svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
        fill: none;
      }
    }
    
    .warning-text {
      font-size: var(--text-sm);
      color: var(--text-primary);
      line-height: var(--leading-normal);
    }
    
    /* Mobile optimization */
    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-3);
      }
      
      .risk-inputs {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }
      
      .summary-grid {
        grid-template-columns: 1fr;
        gap: var(--space-2);
      }
      
      .section-content {
        padding: var(--space-3);
        gap: var(--space-4);
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .section-content {
        animation: none;
      }
      
      .toggle-icon {
        transition: none;
      }
    }
  `]
})
export class RiskManagementSectionComponent {
  // Inputs
  readonly form = input.required<FormGroup>();
  readonly sectionId = input<string>(`risk-mgmt-${Math.random().toString(36).substr(2, 9)}`);

  // Internal state
  private readonly _isExpanded = signal<boolean>(false);
  readonly isExpanded = this._isExpanded.asReadonly();

  // Form control accessors
  readonly stopLossControl = computed(() => this.form().get('stopLoss') as FormControl<number | null>);
  readonly takeProfitControl = computed(() => this.form().get('takeProfit') as FormControl<number | null>);
  readonly priceControl = computed(() => this.form().get('price') as FormControl<number | null>);
  readonly sideControl = computed(() => this.form().get('side') as FormControl<OrderSide>);
  readonly symbolControl = computed(() => this.form().get('symbol') as FormControl<TradingSymbol>);
  readonly quantityControl = computed(() => this.form().get('quantity') as FormControl<number>);

  // Generated IDs
  readonly stopLossId = computed(() => `${this.sectionId()}-stop-loss`);
  readonly takeProfitId = computed(() => `${this.sectionId()}-take-profit`);

  // Risk calculation
  readonly riskRewardSummary = computed(() => {
    const price = this.priceControl().value;
    const stopLoss = this.stopLossControl().value;
    const takeProfit = this.takeProfitControl().value;
    const quantity = this.quantityControl().value;
    
    if (!price || !quantity) return null;
    
    const summary: {
      potentialLoss?: number;
      potentialProfit?: number;
      riskRewardRatio?: number;
    } = {};
    
    if (stopLoss) {
      const lossPips = Math.abs(price - stopLoss);
      summary.potentialLoss = lossPips * quantity;
    }
    
    if (takeProfit) {
      const profitPips = Math.abs(takeProfit - price);
      summary.potentialProfit = profitPips * quantity;
    }
    
    if (summary.potentialLoss && summary.potentialProfit) {
      summary.riskRewardRatio = summary.potentialLoss / summary.potentialProfit;
    }
    
    return Object.keys(summary).length > 0 ? summary : null;
  });

  // Icons
  readonly shieldIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`;

  readonly calculatorIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="12" y2="18"/>
    <line x1="16" y1="18" x2="16" y2="18"/>
  </svg>`;

  readonly warningIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`;

  // Methods
  toggleExpanded(): void {
    this._isExpanded.update(expanded => !expanded);
  }

  getToggleClasses(): string {
    const classes = ['section-toggle'];
    
    if (this.isExpanded()) {
      classes.push('section-toggle--expanded');
    }
    
    return classes.join(' ');
  }

  getToggleIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9l6 6 6-6"/>
    </svg>`;
  }

  getPriceIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`;
  }

  getStopLossError(): string {
    const control = this.stopLossControl();
    if (control.errors) {
      return getTradingErrorMessage(control.errors, 'Stop Loss');
    }
    return '';
  }

  getTakeProfitError(): string {
    const control = this.takeProfitControl();
    if (control.errors) {
      return getTradingErrorMessage(control.errors, 'Take Profit');
    }
    return '';
  }

  getRiskRewardClasses(ratio: number): string {
    const classes = ['summary-item'];
    
    if (ratio <= 1) {
      classes.push('summary-item--risk-good');
    } else if (ratio <= 3) {
      classes.push('summary-item--risk-warning');
    } else {
      classes.push('summary-item--risk-bad');
    }
    
    return classes.join(' ');
  }

  formatCurrency(amount: number): string {
    const symbol = this.symbolControl().value as TradingSymbol;
    
    if (symbol === 'BTCUSD' || symbol === 'ETHUSD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    } else {
      return amount.toFixed(4);
    }
  }
}