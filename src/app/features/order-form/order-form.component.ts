import { Component, signal, inject, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ToggleComponent, ToggleOption } from '../../shared/components/toggle/toggle.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

import { OrderTypeSelectorComponent } from './components/order-type-selector.component';
import { SymbolSelectorComponent } from './components/symbol-selector.component';
import { RiskManagementSectionComponent } from './components/risk-management-section.component';

import { OrderFormService } from './services/order-form.service';
import { OrderType, OrderSide, TradingSymbol, OrderFormData } from '../../core/models/trade-order.interface';
import { getTradingErrorMessage } from './validators/trading-validators';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule,
    FormFieldComponent,
    InputComponent,
    ToggleComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    OrderTypeSelectorComponent,
    SymbolSelectorComponent,
    RiskManagementSectionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="order-form">
      <header class="order-form-header">
        <div class="header-with-back">
          <button 
            class="back-button"
            [routerLink]="['/trades']"
            type="button"
            aria-label="Go back to dashboard">
            <span class="back-icon">←</span>
          </button>
          <div class="header-content">
            <h1 class="heading-2">New Trade Order</h1>
            <p class="body-small text-secondary">Create a new trading position</p>
          </div>
        </div>
      </header>
      
      <!-- Quick Trade Mode Toggle -->
      <div class="mode-toggle">
        <button
          type="button"
          [class]="getModeToggleClasses(true)"
          (click)="setQuickMode(true)"
        >
          Quick Trade
        </button>
        <button
          type="button"
          [class]="getModeToggleClasses(false)"
          (click)="setQuickMode(false)"
        >
          Advanced
        </button>
      </div>

      @if (isQuickMode()) {
        <!-- Quick Trade Interface -->
        <div class="quick-trade-mode">
          <div class="quick-trade-header">
            <h2>Make a Quick Trade</h2>
            <p>Buy or sell crypto in seconds</p>
          </div>

          <!-- Symbol Selection (Simplified) -->
          <div class="quick-symbol-selector">
            <h3>What do you want to trade?</h3>
            <div class="quick-symbols">
              @for (symbol of getQuickSymbols(); track symbol.value) {
                <button
                  type="button"
                  [class]="getQuickSymbolClasses(symbol.value)"
                  (click)="selectQuickSymbol(symbol.value)"
                >
                  <div class="symbol-info">
                    <span class="symbol-name">{{ symbol.label }}</span>
                    <span class="symbol-price">{{ formatPrice(symbol.price, symbol.value) }}</span>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- Buy/Sell Action -->
          <div class="quick-action-section">
            <h3>What do you want to do?</h3>
            <div class="quick-actions">
              <button
                type="button"
                class="quick-action-btn quick-action-btn--buy"
                [class.quick-action-btn--selected]="sideControl().value === 'buy'"
                (click)="setQuickSide('buy')"
              >
                <div class="action-icon">📈</div>
                <div class="action-text">
                  <div class="action-label">BUY</div>
                  <div class="action-description">I think the price will go up</div>
                </div>
              </button>
              <button
                type="button"
                class="quick-action-btn quick-action-btn--sell"
                [class.quick-action-btn--selected]="sideControl().value === 'sell'"
                (click)="setQuickSide('sell')"
              >
                <div class="action-icon">📉</div>
                <div class="action-text">
                  <div class="action-label">SELL</div>
                  <div class="action-description">I think the price will go down</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Amount Selection -->
          <div class="quick-amount-section">
            <h3>How much money do you want to {{ sideControl().value || 'trade' }}?</h3>
            <div class="amount-chips">
              @for (amount of getAmountChips(); track amount) {
                <button
                  type="button"
                  class="amount-chip"
                  [class.amount-chip--selected]="getDollarAmount() === amount"
                  (click)="setDollarAmount(amount)"
                >
                  {{ '$' + amount }}
                </button>
              }
            </div>
            <div class="custom-amount">
              <label for="custom-amount">Or enter a custom amount:</label>
              <input
                id="custom-amount"
                type="number"
                [value]="getDollarAmount()"
                (input)="setDollarAmount(+$event.target.value)"
                placeholder="Enter amount"
                min="10"
                step="10"
              />
            </div>
          </div>

          <!-- Quick Order Summary -->
          @if (getQuickOrderSummary(); as summary) {
            <div class="quick-summary">
              <h3>Order Summary</h3>
              <div class="summary-details">
                <div class="summary-row">
                  <span>You're {{ sideControl().value }}ing:</span>
                  <span class="summary-value">{{ summary.symbolLabel }}</span>
                </div>
                <div class="summary-row">
                  <span>Amount:</span>
                  <span class="summary-value">{{ '$' + getDollarAmount() }}</span>
                </div>
                <div class="summary-row">
                  <span>Current price:</span>
                  <span class="summary-value">{{ summary.currentPrice }}</span>
                </div>
                <div class="summary-row">
                  <span>You'll get approximately:</span>
                  <span class="summary-value">{{ summary.estimatedQuantity }} {{ summary.symbol }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Quick Submit Button -->
          <div class="quick-submit-section">
            @if (submitSuccess()) {
              <div class="quick-success">
                <div class="success-icon">✅</div>
                <div class="success-message">{{ getSuccessMessage() }}</div>
                <button 
                  type="button" 
                  class="success-dismiss"
                  (click)="clearSubmitSuccess()"
                  aria-label="Dismiss success message"
                >
                  ×
                </button>
              </div>
            }
            @if (submitError()) {
              <div class="quick-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">{{ submitError() }}</div>
                <button 
                  type="button" 
                  class="error-dismiss"
                  (click)="clearSubmitError()"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            }
            <button
              type="button"
              [disabled]="!canSubmitQuick()"
              [class]="getQuickSubmitClasses()"
              (click)="onQuickSubmit()"
            >
              @if (isSubmitting()) {
                <span class="loading-spinner"></span>
                Processing...
              } @else {
                {{ getQuickSubmitText() }}
              }
            </button>
            <p class="quick-disclaimer">
              This will execute at the current market price. No fees for this demo.
            </p>
          </div>
        </div>
      } @else {
        <!-- Advanced Mode (Original Form) -->
        <form [formGroup]="orderForm()" (ngSubmit)="onSubmit()" class="order-form-content">
        <!-- Symbol Selection -->
        <div class="form-section">
          <app-symbol-selector
            [control]="symbolControl()"
            (selectionChange)="onSymbolChange($event)"
          />
        </div>

        <!-- Order Type Selection -->
        <div class="form-section">
          <app-order-type-selector
            [control]="orderTypeControl()"
            (selectionChange)="onOrderTypeChange($event)"
          />
        </div>

        <!-- Buy/Sell Toggle -->
        <div class="form-section">
          <app-form-field
            label="Order Side"
            inputId="order-side"
            [required]="true"
            [errorMessage]="getSideError()"
            helpText="Choose buy or sell"
          >
            <app-toggle
              [formControl]="sideControl()"
              [options]="buySellOptions()"
              variant="trading"
              inputId="order-side"
              (selectionChange)="onSideChange($event)"
            />
          </app-form-field>
        </div>

        <!-- Quantity Input -->
        <div class="form-section">
          <app-form-field
            label="Quantity"
            inputId="quantity"
            [required]="true"
            [errorMessage]="getQuantityError()"
            helpText="Amount to trade"
          >
            <app-input
              inputId="quantity"
              type="number"
              placeholder="Enter quantity"
              step="0.01"
              min="0.01"
              [formControl]="quantityControl()"
              [prefixIcon]="quantityIcon"
              [variant]="getQuantityError() ? 'error' : 'default'"
            />
          </app-form-field>
        </div>

        <!-- Price Input (conditional) -->
        @if (showPriceField()) {
          <div class="form-section">
            <app-form-field
              label="Price"
              inputId="price"
              [required]="true"
              [errorMessage]="getPriceError()"
              [helpText]="getPriceHelpText()"
            >
              <app-input
                inputId="price"
                type="number"
                placeholder="Enter price"
                step="0.0001"
                [formControl]="priceControl()"
                [prefixIcon]="priceIcon"
                [variant]="getPriceError() ? 'error' : 'default'"
              />
            </app-form-field>
          </div>
        }

        <!-- Risk Management Section -->
        <div class="form-section">
          <app-risk-management-section
            [form]="orderForm()"
          />
        </div>

        <!-- Order Summary -->
        @if (orderSummary(); as summary) {
          <div class="form-section">
            <div class="order-summary">
              <div class="summary-header">
                <div class="summary-icon" [innerHTML]="summaryIcon"></div>
                <h3>Order Summary</h3>
              </div>
              
              <div class="summary-content">
                <div class="summary-row">
                  <span class="summary-label">Estimated Cost:</span>
                  <span class="summary-value">{{ formatCurrency(summary.estimatedCost) }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Margin Required:</span>
                  <span class="summary-value">{{ formatCurrency(summary.marginRequired) }}</span>
                </div>
                @if (summary.potentialProfit) {
                  <div class="summary-row">
                    <span class="summary-label">Potential Profit:</span>
                    <span class="summary-value summary-value--profit">
                      {{ formatCurrency(summary.potentialProfit) }}
                    </span>
                  </div>
                }
                @if (summary.potentialLoss) {
                  <div class="summary-row">
                    <span class="summary-label">Potential Loss:</span>
                    <span class="summary-value summary-value--loss">
                      {{ formatCurrency(summary.potentialLoss) }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Submit Button -->
        <div class="form-section">
          <div class="submit-section">
            @if (submitSuccess()) {
              <div class="submit-success" role="alert">
                <div class="success-icon" [innerHTML]="successIcon"></div>
                <div class="success-message">{{ getSuccessMessage() }}</div>
                <button 
                  type="button" 
                  class="success-dismiss"
                  (click)="clearSubmitSuccess()"
                  aria-label="Dismiss success message"
                >
                  <span [innerHTML]="closeIcon"></span>
                </button>
              </div>
            }
            @if (submitError()) {
              <div class="submit-error" role="alert">
                <div class="error-icon" [innerHTML]="errorIcon"></div>
                <div class="error-message">{{ submitError() }}</div>
                <button 
                  type="button" 
                  class="error-dismiss"
                  (click)="clearSubmitError()"
                  aria-label="Dismiss error"
                >
                  <span [innerHTML]="closeIcon"></span>
                </button>
              </div>
            }

            <app-button
              type="submit"
              [disabled]="!canSubmit() || submitSuccess()"
              [loading]="isSubmitting()"
              [variant]="getSubmitButtonVariant()"
              size="lg"
              class="submit-button"
            >
              @if (isSubmitting()) {
                Placing Order...
              } @else if (submitSuccess()) {
                Order Placed Successfully!
              } @else {
                {{ getSubmitButtonText() }}
              }
            </app-button>

            <button
              type="button"
              class="reset-button"
              [disabled]="isSubmitting()"
              (click)="resetForm()"
            >
              Reset Form
            </button>
          </div>
        </div>
      </form>
      }
    </div>
  `,
  styles: [`
    .order-form {
      padding: var(--spacing-component-md);
      min-height: 100vh;
      background-color: var(--bg-primary);
      max-width: 800px;
      margin: 0 auto;
    }
    
    .order-form-header {
      margin-bottom: var(--spacing-component-xl);
    }
    
    .header-with-back {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }
    
    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--touch-target-comfortable, 44px);
      height: var(--touch-target-comfortable, 44px);
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: var(--bg-tertiary);
        border-color: var(--border-secondary);
      }
      
      &:active {
        transform: translateY(1px);
      }
      
      &:focus-visible {
        outline: 2px solid var(--primary-blue);
        outline-offset: 2px;
      }
    }
    
    .back-icon {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
    }
    
    .header-content {
      flex: 1;
    }
    
    .header-content h1 {
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }
    
    .header-content p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }
    
    .order-form-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-component-lg);
    }
    
    .form-section {
      width: 100%;
    }
    
    .order-summary {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      padding: var(--spacing-component-md);
    }
    
    .summary-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--spacing-component-md);
    }
    
    .summary-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-secondary);
      
      svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
      }
    }
    
    .summary-header h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0;
    }
    
    .summary-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--border-primary);
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .summary-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      font-weight: var(--font-medium);
    }
    
    .summary-value {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      font-family: var(--font-mono);
      color: var(--text-primary);
    }
    
    .summary-value--profit {
      color: var(--profit-green);
    }
    
    .summary-value--loss {
      color: var(--loss-red);
    }
    
    .submit-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      align-items: stretch;
    }
    
    .submit-error {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--spacing-component-sm);
      background: rgba(var(--loss-red-rgb, 239, 68, 68), 0.1);
      border: 1px solid rgba(var(--loss-red-rgb, 239, 68, 68), 0.2);
      border-radius: var(--radius-lg);
      color: var(--loss-red);
    }

    .submit-success {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--spacing-component-sm);
      background: rgba(var(--profit-green-rgb, 16, 185, 129), 0.1);
      border: 1px solid rgba(var(--profit-green-rgb, 16, 185, 129), 0.2);
      border-radius: var(--radius-lg);
      color: var(--profit-green);
    }
    
    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      
      svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
      }
    }

    .success-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      
      svg {
        width: 16px;
        height: 16px;
        stroke: currentColor;
      }
    }
    
    .error-message {
      flex: 1;
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
    }

    .success-message {
      flex: 1;
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
    }
    
    .error-dismiss {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      color: currentColor;
      cursor: pointer;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
      }
    }

    .success-dismiss {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      color: currentColor;
      cursor: pointer;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
      }
    }
    
    .submit-button {
      width: 100%;
    }
    
    .reset-button {
      align-self: center;
      padding: var(--space-2) var(--space-4);
      background: transparent;
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        border-color: var(--border-secondary);
        color: var(--text-primary);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &:focus-visible {
        outline: 2px solid var(--primary-blue);
        outline-offset: 2px;
      }
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .order-form {
        padding: var(--spacing-component-sm);
      }
      
      .header-with-back {
        gap: var(--space-3);
      }
      
      .order-form-content {
        gap: var(--spacing-component-md);
      }
      
      .order-summary {
        padding: var(--spacing-component-sm);
      }
      
      .summary-content {
        gap: var(--space-2);
      }
      
      .summary-row {
        padding: var(--space-2) 0;
      }
    }
    
    /* Animation for form sections */
    .form-section {
      animation: section-appear 0.3s ease;
    }
    
    @keyframes section-appear {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .form-section {
        animation: none;
      }
    }

    /* Quick Trade Mode Styles */
    .mode-toggle {
      display: flex;
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      padding: var(--space-1);
      margin-bottom: var(--spacing-component-lg);
      border: 1px solid var(--border-primary);
    }

    .mode-toggle-btn {
      flex: 1;
      padding: var(--space-3) var(--space-6);
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mode-toggle-btn--active {
      background: var(--primary-blue);
      color: white;
    }

    .quick-trade-mode {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-component-lg);
    }

    .quick-trade-header {
      text-align: center;
      margin-bottom: var(--spacing-component-md);
    }

    .quick-trade-header h2 {
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .quick-trade-header p {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0;
    }

    .quick-symbol-selector h3,
    .quick-action-section h3,
    .quick-amount-section h3,
    .quick-summary h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--space-4) 0;
    }

    .quick-symbols {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3);
    }

    .quick-symbol-btn {
      padding: var(--space-4);
      background: var(--bg-secondary);
      border: 2px solid var(--border-primary);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: var(--touch-target-comfortable);
    }

    .quick-symbol-btn--selected {
      border-color: var(--primary-blue);
      background: var(--primary-blue);
      color: white;
    }

    .quick-symbol-btn:hover:not(.quick-symbol-btn--selected) {
      border-color: var(--border-secondary);
      background: var(--bg-tertiary);
    }

    .symbol-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .symbol-name {
      font-weight: var(--font-semibold);
      font-size: var(--text-base);
    }

    .symbol-price {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      opacity: 0.8;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-6);
      background: var(--bg-secondary);
      border: 2px solid var(--border-primary);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 80px;
    }

    .quick-action-btn--buy {
      border-color: var(--profit-green);
    }

    .quick-action-btn--buy.quick-action-btn--selected {
      background: var(--profit-green);
      color: white;
    }

    .quick-action-btn--sell {
      border-color: var(--loss-red);
    }

    .quick-action-btn--sell.quick-action-btn--selected {
      background: var(--loss-red);
      color: white;
    }

    .action-icon {
      font-size: var(--text-2xl);
    }

    .action-text {
      flex: 1;
    }

    .action-label {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      margin-bottom: var(--space-1);
    }

    .action-description {
      font-size: var(--text-sm);
      opacity: 0.8;
    }

    .amount-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
    }

    .amount-chip {
      padding: var(--space-3) var(--space-6);
      background: var(--bg-secondary);
      border: 2px solid var(--border-primary);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: var(--font-semibold);
      min-height: var(--touch-target-comfortable);
    }

    .amount-chip--selected {
      background: var(--primary-blue);
      border-color: var(--primary-blue);
      color: white;
    }

    .amount-chip:hover:not(.amount-chip--selected) {
      border-color: var(--border-secondary);
      background: var(--bg-tertiary);
    }

    .custom-amount {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .custom-amount label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
    }

    .custom-amount input {
      padding: var(--space-3) var(--space-4);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-size: var(--text-base);
      min-height: var(--touch-target-comfortable);
    }

    .custom-amount input:focus {
      outline: 2px solid var(--primary-blue);
      outline-offset: 2px;
      border-color: var(--primary-blue);
    }

    .quick-summary {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-component-md);
    }

    .summary-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--border-primary);
    }

    .summary-row:last-child {
      border-bottom: none;
      font-weight: var(--font-semibold);
    }

    .summary-value {
      font-family: var(--font-mono);
      font-weight: var(--font-semibold);
    }

    .quick-submit-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      align-items: center;
    }

    .quick-error {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: rgba(var(--loss-red-rgb), 0.1);
      border: 1px solid rgba(var(--loss-red-rgb), 0.2);
      border-radius: var(--radius-md);
      color: var(--loss-red);
      width: 100%;
    }

    .quick-success {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: rgba(var(--profit-green-rgb), 0.1);
      border: 1px solid rgba(var(--profit-green-rgb), 0.2);
      border-radius: var(--radius-md);
      color: var(--profit-green);
      width: 100%;
    }

    .quick-error .error-message,
    .quick-success .success-message {
      flex: 1;
    }

    .quick-error .error-dismiss,
    .quick-success .success-dismiss {
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      color: currentColor;
      cursor: pointer;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 1;
    }

    .quick-error .error-dismiss:hover,
    .quick-success .success-dismiss:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .quick-submit-btn {
      width: 100%;
      max-width: 400px;
      padding: var(--space-4) var(--space-6);
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: var(--touch-target-large);
    }

    .quick-submit-btn--buy {
      background: var(--profit-green);
      color: white;
    }

    .quick-submit-btn--buy:hover:not(:disabled) {
      background: var(--profit-green-light);
      transform: translateY(-1px);
    }

    .quick-submit-btn--sell {
      background: var(--loss-red);
      color: white;
    }

    .quick-submit-btn--sell:hover:not(:disabled) {
      background: var(--loss-red-light);
      transform: translateY(-1px);
    }

    .quick-submit-btn--disabled {
      background: var(--bg-tertiary) !important;
      color: var(--text-tertiary) !important;
      cursor: not-allowed !important;
      transform: none !important;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: var(--space-2);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .quick-disclaimer {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      text-align: center;
      margin: 0;
      max-width: 400px;
    }

    /* Mobile optimizations for Quick Trade */
    @media (max-width: 768px) {
      .quick-symbols {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        grid-template-columns: 1fr;
      }

      .amount-chips {
        justify-content: center;
      }

      .quick-action-btn {
        min-height: 60px;
      }
    }
  `]
})
export class OrderFormComponent implements OnInit, OnDestroy {
  private readonly orderFormService = inject(OrderFormService);
  private readonly router = inject(Router);
  private subscriptions = new Subscription();

  // Quick Trade mode for simplified user experience
  private readonly _isQuickMode = signal<boolean>(true);
  readonly isQuickMode = this._isQuickMode.asReadonly();
  private readonly _dollarAmount = signal<number>(100);

  // Form and state
  readonly orderForm = signal<FormGroup>(this.orderFormService.createOrderForm());
  readonly isSubmitting = computed(() => this.orderFormService.isSubmitting());
  readonly submitError = computed(() => this.orderFormService.submitError());
  readonly submitSuccess = computed(() => this.orderFormService.submitSuccess());
  readonly lastCreatedOrder = computed(() => this.orderFormService.lastCreatedOrder());
  readonly marketPrices = computed(() => this.orderFormService.marketPrices());

  // Form controls (computed for reactivity)
  readonly symbolControl = computed(() => this.orderForm().get('symbol') as FormControl<TradingSymbol>);
  readonly orderTypeControl = computed(() => this.orderForm().get('type') as FormControl<OrderType>);
  readonly sideControl = computed(() => this.orderForm().get('side') as FormControl<OrderSide>);
  readonly quantityControl = computed(() => this.orderForm().get('quantity') as FormControl<number>);
  readonly priceControl = computed(() => this.orderForm().get('price') as FormControl<number | null>);

  // Computed values
  readonly showPriceField = computed(() => {
    const orderType = this.orderTypeControl().value as OrderType;
    return orderType !== OrderType.MARKET;
  });

  readonly buySellOptions = computed<ToggleOption[]>(() => [
    {
      value: OrderSide.BUY,
      label: 'BUY',
      color: 'buy',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 17L17 7"/>
        <path d="M7 7h10v10"/>
      </svg>`
    },
    {
      value: OrderSide.SELL,
      label: 'SELL',
      color: 'sell',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 7L7 17"/>
        <path d="M17 17H7V7"/>
      </svg>`
    }
  ]);

  readonly orderSummary = computed(() => {
    const formValue = this.orderForm().value;
    if (!formValue.symbol || !formValue.side || !formValue.quantity) {
      return null;
    }
    return this.orderFormService.calculateOrderSummary(formValue);
  });

  readonly canSubmit = computed(() => this.orderFormService.canSubmit(this.orderForm()));

  // Icons
  readonly quantityIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>`;

  readonly priceIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>`;

  readonly summaryIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>`;

  readonly errorIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>`;

  readonly closeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`;

  readonly successIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>`;

  ngOnInit(): void {
    // Set up form value change subscriptions for smart defaults
    this.subscriptions.add(
      this.orderTypeControl().valueChanges.subscribe((orderType: OrderType) => {
        this.orderFormService.setOrderTypeDefaults(this.orderForm(), orderType);
      })
    );

    this.subscriptions.add(
      this.symbolControl().valueChanges.subscribe((symbol: TradingSymbol) => {
        this.orderFormService.setSymbolDefaults(this.orderForm(), symbol);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Event handlers
  onSymbolChange(symbol: TradingSymbol): void {
    this.orderFormService.setSymbolDefaults(this.orderForm(), symbol);
  }

  onOrderTypeChange(orderType: OrderType): void {
    this.orderFormService.setOrderTypeDefaults(this.orderForm(), orderType);
  }

  onSideChange(option: ToggleOption): void {
    const side = option.value as OrderSide;
    // Trigger validation updates for stop loss/take profit
    const form = this.orderForm();
    form.get('stopLoss')?.updateValueAndValidity();
    form.get('takeProfit')?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    const formValue = this.orderForm().value as OrderFormData;
    const success = await this.orderFormService.submitOrder(formValue);
    
    if (success) {
      // Show success message briefly, then redirect
      setTimeout(() => {
        this.router.navigate(['/trades']);
      }, 2000);
    }
  }

  resetForm(): void {
    this.orderFormService.resetForm(this.orderForm());
  }

  clearSubmitError(): void {
    this.orderFormService.clearSubmitError();
  }

  clearSubmitSuccess(): void {
    this.orderFormService.clearSubmitSuccess();
  }

  getSuccessMessage(): string {
    return this.orderFormService.getLastCreatedOrderSummary() || 'Order created successfully!';
  }

  // Helper methods for error messages
  getSideError(): string {
    const control = this.sideControl();
    return control.errors ? getTradingErrorMessage(control.errors, 'Order Side') : '';
  }

  getQuantityError(): string {
    const control = this.quantityControl();
    return control.errors ? getTradingErrorMessage(control.errors, 'Quantity') : '';
  }

  getPriceError(): string {
    const control = this.priceControl();
    return control.errors ? getTradingErrorMessage(control.errors, 'Price') : '';
  }

  getPriceHelpText(): string {
    const orderType = this.orderTypeControl().value as OrderType;
    const symbol = this.symbolControl().value as TradingSymbol;
    const marketPrice = this.orderFormService.getMarketPrice(symbol);
    
    switch (orderType) {
      case OrderType.LIMIT:
        return `Market price: ${this.formatPrice(marketPrice, symbol)}`;
      case OrderType.STOP:
        return `Stop price (market order triggered at this level)`;
      case OrderType.STOP_LIMIT:
        return `Stop price (limit order triggered at this level)`;
      default:
        return '';
    }
  }

  getSubmitButtonText(): string {
    const side = this.sideControl().value as OrderSide;
    const orderType = this.orderTypeControl().value as OrderType;
    
    if (side === OrderSide.BUY) {
      return `Place Buy ${orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order`;
    } else {
      return `Place Sell ${orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order`;
    }
  }

  getSubmitButtonVariant(): 'buy' | 'sell' | 'primary' {
    const side = this.sideControl().value as OrderSide;
    return side === OrderSide.BUY ? 'buy' : 'sell';
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

  formatPrice(price: number, symbol: TradingSymbol): string {
    if (symbol === 'BTCUSD' || symbol === 'ETHUSD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    } else {
      return price.toFixed(4);
    }
  }

  // Quick Trade Mode Methods
  setQuickMode(isQuick: boolean): void {
    this._isQuickMode.set(isQuick);
    if (isQuick) {
      // Set smart defaults for quick trade
      this.orderTypeControl().setValue(OrderType.MARKET);
      this.symbolControl().setValue('BTCUSD');
    }
  }

  getModeToggleClasses(isQuick: boolean): string {
    const classes = ['mode-toggle-btn'];
    if ((isQuick && this.isQuickMode()) || (!isQuick && !this.isQuickMode())) {
      classes.push('mode-toggle-btn--active');
    }
    return classes.join(' ');
  }

  getQuickSymbols() {
    const prices = this.marketPrices();
    return [
      { value: 'BTCUSD' as TradingSymbol, label: 'Bitcoin', price: prices.BTCUSD },
      { value: 'ETHUSD' as TradingSymbol, label: 'Ethereum', price: prices.ETHUSD },
      { value: 'EURUSD' as TradingSymbol, label: 'Euro/USD', price: prices.EURUSD }
    ];
  }

  selectQuickSymbol(symbol: TradingSymbol): void {
    this.symbolControl().setValue(symbol);
  }

  getQuickSymbolClasses(symbol: TradingSymbol): string {
    const classes = ['quick-symbol-btn'];
    if (this.symbolControl().value === symbol) {
      classes.push('quick-symbol-btn--selected');
    }
    return classes.join(' ');
  }

  setQuickSide(side: 'buy' | 'sell'): void {
    this.sideControl().setValue(side as OrderSide);
  }

  getAmountChips(): number[] {
    return [50, 100, 250, 500, 1000];
  }

  getDollarAmount(): number {
    return this._dollarAmount();
  }

  setDollarAmount(amount: number): void {
    this._dollarAmount.set(amount);
    // Convert dollar amount to quantity based on current price
    const symbol = this.symbolControl().value;
    const marketPrice = this.orderFormService.getMarketPrice(symbol);
    const quantity = amount / marketPrice;
    this.quantityControl().setValue(Number(quantity.toFixed(8)));
  }

  getQuickOrderSummary() {
    const symbol = this.symbolControl().value;
    const side = this.sideControl().value;
    const dollarAmount = this.getDollarAmount();
    
    if (!symbol || !side || !dollarAmount) return null;

    const marketPrice = this.orderFormService.getMarketPrice(symbol);
    const estimatedQuantity = dollarAmount / marketPrice;

    return {
      symbol,
      symbolLabel: this.getSymbolLabel(symbol),
      currentPrice: this.formatPrice(marketPrice, symbol),
      estimatedQuantity: this.formatQuantity(estimatedQuantity, symbol)
    };
  }

  private getSymbolLabel(symbol: TradingSymbol): string {
    switch (symbol) {
      case 'BTCUSD': return 'Bitcoin';
      case 'ETHUSD': return 'Ethereum';
      case 'EURUSD': return 'Euro/USD';
      default: return symbol;
    }
  }

  private formatQuantity(quantity: number, symbol: TradingSymbol): string {
    if (symbol === 'BTCUSD') {
      return quantity.toFixed(6);
    } else if (symbol === 'ETHUSD') {
      return quantity.toFixed(4);
    } else {
      return quantity.toFixed(2);
    }
  }

  canSubmitQuick(): boolean {
    const symbol = this.symbolControl().value;
    const side = this.sideControl().value;
    const dollarAmount = this.getDollarAmount();
    
    return !!(symbol && side && dollarAmount >= 10 && !this.isSubmitting());
  }

  getQuickSubmitClasses(): string {
    const classes = ['quick-submit-btn'];
    const side = this.sideControl().value;
    
    if (side === 'buy') {
      classes.push('quick-submit-btn--buy');
    } else if (side === 'sell') {
      classes.push('quick-submit-btn--sell');
    }
    
    if (!this.canSubmitQuick()) {
      classes.push('quick-submit-btn--disabled');
    }
    
    return classes.join(' ');
  }

  getQuickSubmitText(): string {
    const side = this.sideControl().value;
    const dollarAmount = this.getDollarAmount();
    const symbol = this.getSymbolLabel(this.symbolControl().value);
    
    if (!side || !symbol) {
      return 'Complete Your Selection';
    }
    
    const action = side === 'buy' ? 'Buy' : 'Sell';
    return `${action} $${dollarAmount} of ${symbol}`;
  }

  async onQuickSubmit(): Promise<void> {
    if (!this.canSubmitQuick()) return;
    
    // The quantity is already set by setDollarAmount
    await this.onSubmit();
  }
}