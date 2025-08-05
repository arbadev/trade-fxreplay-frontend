import { Injectable, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, of, BehaviorSubject, firstValueFrom, catchError, tap } from 'rxjs';

import { 
  OrderType, 
  OrderSide, 
  TradingSymbol, 
  CreateTradeOrderRequestDto,
  OrderFormData,
  LoadingState
} from '../../../core/models/trade-order.interface';
import { TradeOrderService } from '../../../core/services/trade-order.service';
import { TradingValidators } from '../validators/trading-validators';

/**
 * Service for managing order form state and business logic
 * Follows modern Angular patterns with signals and reactive forms
 */
@Injectable({
  providedIn: 'root'
})
export class OrderFormService {
  private readonly fb = inject(FormBuilder);
  private readonly tradeOrderService = inject(TradeOrderService);

  // Form state signals
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _submitError = signal<string | null>(null);
  private readonly _lastSubmittedOrder = signal<CreateTradeOrderRequestDto | null>(null);
  private readonly _lastCreatedOrder = signal<any | null>(null);
  private readonly _submitSuccess = signal<boolean>(false);

  // Market data (mock for now - could be replaced with real market data service)
  private readonly _marketPrices = signal<Record<TradingSymbol, number>>({
    BTCUSD: 100150.4,
    EURUSD: 1.035,
    ETHUSD: 3310
  });

  // Public readonly signals
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly submitError = this._submitError.asReadonly();
  readonly lastSubmittedOrder = this._lastSubmittedOrder.asReadonly();
  readonly lastCreatedOrder = this._lastCreatedOrder.asReadonly();
  readonly submitSuccess = this._submitSuccess.asReadonly();
  readonly marketPrices = this._marketPrices.asReadonly();

  // Form configuration
  private readonly defaultAccountId = 'acc-12345'; // TODO: Get from auth service
  private readonly defaultUserId = 'user-12345'; // TODO: Get from auth service

  /**
   * Creates a typed reactive form for trade orders
   */
  createOrderForm(): FormGroup<{
    symbol: FormControl<TradingSymbol>;
    type: FormControl<OrderType>;
    side: FormControl<OrderSide>;
    quantity: FormControl<number>;
    price: FormControl<number | null>;
    stopLoss: FormControl<number | null>;
    takeProfit: FormControl<number | null>;
  }> {
    const form = this.fb.nonNullable.group({
      symbol: this.fb.nonNullable.control<TradingSymbol>('BTCUSD', [Validators.required]),
      type: this.fb.nonNullable.control<OrderType>(OrderType.MARKET, [Validators.required]),
      side: this.fb.nonNullable.control<OrderSide>(OrderSide.BUY, [Validators.required]),
      quantity: this.fb.nonNullable.control<number>(1, [
        Validators.required,
        TradingValidators.quantity()
      ]),
      price: this.fb.control<number | null>(null),
      stopLoss: this.fb.control<number | null>(null),
      takeProfit: this.fb.control<number | null>(null)
    });

    // Set up cross-field validation
    this.setupCrossFieldValidation(form);

    return form;
  }

  /**
   * Sets up cross-field validation for the order form
   */
  private setupCrossFieldValidation(form: FormGroup): void {
    const typeControl = form.get('type')!;
    const sideControl = form.get('side')!;
    const priceControl = form.get('price')!;
    const stopLossControl = form.get('stopLoss')!;
    const takeProfitControl = form.get('takeProfit')!;

    // Price validation based on order type
    typeControl.valueChanges.subscribe(() => {
      priceControl.setValidators([
        TradingValidators.priceRequired(typeControl),
        TradingValidators.priceRange()
      ]);
      priceControl.updateValueAndValidity();
    });

    // Stop loss validation
    stopLossControl.setValidators([
      TradingValidators.stopLoss(priceControl, sideControl),
      TradingValidators.priceRange()
    ]);

    // Take profit validation
    takeProfitControl.setValidators([
      TradingValidators.takeProfit(priceControl, sideControl),
      TradingValidators.riskRewardRatio(priceControl, stopLossControl)
    ]);

    // Update validation when related fields change
    [sideControl, priceControl].forEach(control => {
      control.valueChanges.subscribe(() => {
        stopLossControl.updateValueAndValidity();
        takeProfitControl.updateValueAndValidity();
      });
    });

    // Add form-level validator
    form.setValidators([TradingValidators.logicalOrderValidator]);
  }

  /**
   * Gets the current market price for a symbol
   */
  getMarketPrice(symbol: TradingSymbol): number {
    return this.marketPrices()[symbol];
  }

  /**
   * Sets smart defaults based on order type selection
   */
  setOrderTypeDefaults(form: FormGroup, orderType: OrderType): void {
    const symbol = form.get('symbol')?.value as TradingSymbol;
    const marketPrice = this.getMarketPrice(symbol);
    
    switch (orderType) {
      case OrderType.MARKET:
        form.patchValue({ price: null });
        break;
        
      case OrderType.LIMIT:
        // Set limit price slightly away from market
        const side = form.get('side')?.value as OrderSide;
        const limitPrice = side === OrderSide.BUY 
          ? marketPrice * 0.98 // 2% below market for buy limit
          : marketPrice * 1.02; // 2% above market for sell limit
        form.patchValue({ price: Number(limitPrice.toFixed(symbol === 'BTCUSD' ? 0 : 4)) });
        break;
        
      case OrderType.STOP:
      case OrderType.STOP_LIMIT:
        // Set stop price away from market in the stop direction
        const stopSide = form.get('side')?.value as OrderSide;
        const stopPrice = stopSide === OrderSide.BUY 
          ? marketPrice * 1.02 // 2% above market for buy stop
          : marketPrice * 0.98; // 2% below market for sell stop
        form.patchValue({ price: Number(stopPrice.toFixed(symbol === 'BTCUSD' ? 0 : 4)) });
        break;
    }
  }

  /**
   * Sets smart defaults based on symbol selection
   */
  setSymbolDefaults(form: FormGroup, symbol: TradingSymbol): void {
    const marketPrice = this.getMarketPrice(symbol);
    const orderType = form.get('type')?.value as OrderType;
    
    // Update quantity based on symbol (smaller quantities for expensive assets)
    let defaultQuantity = 1;
    if (symbol === 'BTCUSD') {
      defaultQuantity = 0.1;
    } else if (symbol === 'ETHUSD') {
      defaultQuantity = 0.5;
    }
    
    form.patchValue({ quantity: defaultQuantity });
    
    // Update price if it's not a market order
    if (orderType !== OrderType.MARKET) {
      this.setOrderTypeDefaults(form, orderType);
    }
  }

  /**
   * Calculates order summary information
   */
  calculateOrderSummary(formValue: any): {
    estimatedCost: number;
    marginRequired: number;
    potentialProfit?: number;
    potentialLoss?: number;
    riskRewardRatio?: number;
  } {
    const { symbol, side, quantity, price, stopLoss, takeProfit } = formValue;
    const marketPrice = this.getMarketPrice(symbol as TradingSymbol);
    const orderPrice = price || marketPrice;
    
    const estimatedCost = orderPrice * quantity;
    const marginRequired = estimatedCost * 0.1; // Assume 10:1 leverage
    
    const summary: any = {
      estimatedCost,
      marginRequired
    };
    
    if (stopLoss) {
      const lossPips = Math.abs(orderPrice - stopLoss);
      summary.potentialLoss = lossPips * quantity;
    }
    
    if (takeProfit) {
      const profitPips = Math.abs(takeProfit - orderPrice);
      summary.potentialProfit = profitPips * quantity;
    }
    
    if (summary.potentialProfit && summary.potentialLoss) {
      summary.riskRewardRatio = summary.potentialLoss / summary.potentialProfit;
    }
    
    return summary;
  }

  /**
   * Submits the order form
   */
  async submitOrder(formValue: OrderFormData): Promise<boolean> {
    if (this._isSubmitting()) {
      return false;
    }

    this._isSubmitting.set(true);
    this._submitError.set(null);
    this._submitSuccess.set(false);

    try {
      const orderRequest: CreateTradeOrderRequestDto = {
        symbol: formValue.symbol,
        type: formValue.type,
        side: formValue.side,
        quantity: formValue.quantity,
        price: formValue.price || undefined,
        stopLoss: formValue.stopLoss || undefined,
        takeProfit: formValue.takeProfit || undefined,
        accountId: this.defaultAccountId,
        userId: this.defaultUserId
      };

      console.log('Submitting order:', orderRequest);

      // Use firstValueFrom instead of deprecated toPromise()
      const result = await firstValueFrom(
        this.tradeOrderService.createTradeOrder(orderRequest).pipe(
          tap(response => {
            console.log('Order created successfully:', response);
          }),
          catchError(error => {
            console.error('API Error:', error);
            // Re-throw to be caught by outer try-catch
            throw error;
          })
        )
      );
      
      if (result) {
        this._lastSubmittedOrder.set(orderRequest);
        this._lastCreatedOrder.set(result);
        this._submitSuccess.set(true);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Failed to submit order:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to submit order';
      
      if (error?.error?.message) {
        // API error response
        if (Array.isArray(error.error.message)) {
          errorMessage = error.error.message.join(', ');
        } else {
          errorMessage = error.error.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      this._submitError.set(errorMessage);
      return false;
    } finally {
      this._isSubmitting.set(false);
    }
  }

  /**
   * Resets the form state
   */
  resetForm(form: FormGroup): void {
    form.reset({
      symbol: 'BTCUSD',
      type: OrderType.MARKET,
      side: OrderSide.BUY,
      quantity: 1,
      price: null,
      stopLoss: null,
      takeProfit: null
    });
    
    this._submitError.set(null);
    this._submitSuccess.set(false);
    this._lastSubmittedOrder.set(null);
    this._lastCreatedOrder.set(null);
  }

  /**
   * Clears the submit error
   */
  clearSubmitError(): void {
    this._submitError.set(null);
  }

  /**
   * Clears the submit success state
   */
  clearSubmitSuccess(): void {
    this._submitSuccess.set(false);
  }

  /**
   * Gets the last created order details for success messaging
   */
  getLastCreatedOrderSummary(): string | null {
    const order = this._lastCreatedOrder();
    if (!order) return null;
    
    const action = order.side === 'buy' ? 'Buy' : 'Sell';
    const orderType = order.type.charAt(0).toUpperCase() + order.type.slice(1);
    
    return `${action} ${orderType} order for ${order.quantity} ${order.symbol} created successfully!`;
  }

  /**
   * Validates if the form is ready for submission
   */
  canSubmit(form: FormGroup): boolean {
    return form.valid && !this._isSubmitting();
  }

  /**
   * Gets available trading symbols
   */
  getAvailableSymbols(): TradingSymbol[] {
    return ['BTCUSD', 'EURUSD', 'ETHUSD'];
  }

  /**
   * Gets available order types
   */
  getAvailableOrderTypes(): OrderType[] {
    return [OrderType.MARKET, OrderType.LIMIT, OrderType.STOP, OrderType.STOP_LIMIT];
  }

  /**
   * Mock function to update market prices (in real app, this would come from WebSocket)
   */
  updateMarketPrice(symbol: TradingSymbol, price: number): void {
    this._marketPrices.update(prices => ({
      ...prices,
      [symbol]: price
    }));
  }
}