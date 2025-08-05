import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { OrderType, OrderSide } from '../../../core/models/trade-order.interface';

/**
 * Custom validators for trading order forms
 * Implements business logic validation for forex trading orders
 */
export class TradingValidators {
  
  /**
   * Validates that quantity meets minimum trading requirements
   * @param minQuantity Minimum allowed quantity (default: 0.01)
   */
  static quantity(minQuantity: number = 0.01): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (value === null || value === undefined || value === '') {
        return null; // Let required validator handle empty values
      }
      
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return { invalidNumber: { value } };
      }
      
      if (numValue <= 0) {
        return { quantityTooLow: { value, min: minQuantity } };
      }
      
      if (numValue < minQuantity) {
        return { quantityTooLow: { value, min: minQuantity } };
      }
      
      // Check for reasonable maximum (prevent accidental large orders)
      if (numValue > 1000) {
        return { quantityTooHigh: { value, max: 1000 } };
      }
      
      return null;
    };
  }

  /**
   * Validates that price is required for non-market orders
   * @param orderTypeControl The form control containing the order type
   */
  static priceRequired(orderTypeControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const orderType = orderTypeControl.value as OrderType;
      const price = control.value;
      
      // Market orders don't require a price
      if (orderType === OrderType.MARKET) {
        return null;
      }
      
      // All other order types require a price
      if (!price || price <= 0) {
        return { priceRequired: { orderType } };
      }
      
      return null;
    };
  }

  /**
   * Validates stop loss level relative to entry price
   * @param priceControl The form control containing the entry price
   * @param sideControl The form control containing the order side (buy/sell)
   */
  static stopLoss(priceControl: AbstractControl, sideControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const stopLoss = Number(control.value);
      const price = Number(priceControl.value);
      const side = sideControl.value as OrderSide;
      
      // Skip validation if any required values are missing
      if (!stopLoss || !price || !side) {
        return null;
      }
      
      if (side === OrderSide.BUY) {
        // For buy orders, stop loss must be below entry price
        if (stopLoss >= price) {
          return { 
            stopLossInvalid: { 
              value: stopLoss, 
              price, 
              side,
              message: 'Stop loss must be below entry price for buy orders'
            } 
          };
        }
      } else if (side === OrderSide.SELL) {
        // For sell orders, stop loss must be above entry price
        if (stopLoss <= price) {
          return { 
            stopLossInvalid: { 
              value: stopLoss, 
              price, 
              side,
              message: 'Stop loss must be above entry price for sell orders'
            } 
          };
        }
      }
      
      return null;
    };
  }

  /**
   * Validates take profit level relative to entry price
   * @param priceControl The form control containing the entry price
   * @param sideControl The form control containing the order side (buy/sell)
   */
  static takeProfit(priceControl: AbstractControl, sideControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const takeProfit = Number(control.value);
      const price = Number(priceControl.value);
      const side = sideControl.value as OrderSide;
      
      // Skip validation if any required values are missing
      if (!takeProfit || !price || !side) {
        return null;
      }
      
      if (side === OrderSide.BUY) {
        // For buy orders, take profit must be above entry price
        if (takeProfit <= price) {
          return { 
            takeProfitInvalid: { 
              value: takeProfit, 
              price, 
              side,
              message: 'Take profit must be above entry price for buy orders'
            } 
          };
        }
      } else if (side === OrderSide.SELL) {
        // For sell orders, take profit must be below entry price
        if (takeProfit >= price) {
          return { 
            takeProfitInvalid: { 
              value: takeProfit, 
              price, 
              side,
              message: 'Take profit must be below entry price for sell orders'
            } 
          };
        }
      }
      
      return null;
    };
  }

  /**
   * Validates that a price value is within reasonable bounds
   * @param minPrice Minimum allowed price
   * @param maxPrice Maximum allowed price
   */
  static priceRange(minPrice: number = 0.01, maxPrice: number = 100000): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Let required/priceRequired validators handle empty values
      }
      
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return { invalidNumber: { value } };
      }
      
      if (numValue < minPrice) {
        return { priceTooLow: { value, min: minPrice } };
      }
      
      if (numValue > maxPrice) {
        return { priceTooHigh: { value, max: maxPrice } };
      }
      
      return null;
    };
  }

  /**
   * Validates that the risk/reward ratio is reasonable
   * @param priceControl The form control containing the entry price
   * @param stopLossControl The form control containing the stop loss
   * @param maxRiskRewardRatio Maximum allowed risk/reward ratio (default: 10)
   */
  static riskRewardRatio(
    priceControl: AbstractControl, 
    stopLossControl: AbstractControl,
    maxRiskRewardRatio: number = 10
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const takeProfit = Number(control.value);
      const price = Number(priceControl.value);
      const stopLoss = Number(stopLossControl.value);
      
      // Skip validation if any values are missing
      if (!takeProfit || !price || !stopLoss) {
        return null;
      }
      
      const reward = Math.abs(takeProfit - price);
      const risk = Math.abs(price - stopLoss);
      
      // Avoid division by zero
      if (risk === 0) {
        return { riskZero: { message: 'Risk cannot be zero' } };
      }
      
      const ratio = risk / reward;
      
      // If risk is much higher than reward, warn the user
      if (ratio > maxRiskRewardRatio) {
        return { 
          riskRewardRatio: { 
            ratio: ratio.toFixed(2), 
            maxRatio: maxRiskRewardRatio,
            message: `Risk/reward ratio (${ratio.toFixed(2)}:1) is too high`
          } 
        };
      }
      
      return null;
    };
  }

  /**
   * Cross-field validator to ensure stop loss and take profit are logically consistent
   * @param formGroup The form group containing all order fields
   */
  static logicalOrderValidator(formGroup: AbstractControl): ValidationErrors | null {
    if (!formGroup || !formGroup.value) {
      return null;
    }
    
    const { price, side, stopLoss, takeProfit } = formGroup.value;
    
    // Skip if required values are missing
    if (!price || !side) {
      return null;
    }
    
    const errors: ValidationErrors = {};
    
    // Check stop loss logic
    if (stopLoss) {
      if (side === OrderSide.BUY && Number(stopLoss) >= Number(price)) {
        errors['stopLossLogic'] = 'Stop loss must be below entry price for buy orders';
      } else if (side === OrderSide.SELL && Number(stopLoss) <= Number(price)) {
        errors['stopLossLogic'] = 'Stop loss must be above entry price for sell orders';
      }
    }
    
    // Check take profit logic
    if (takeProfit) {
      if (side === OrderSide.BUY && Number(takeProfit) <= Number(price)) {
        errors['takeProfitLogic'] = 'Take profit must be above entry price for buy orders';
      } else if (side === OrderSide.SELL && Number(takeProfit) >= Number(price)) {
        errors['takeProfitLogic'] = 'Take profit must be below entry price for sell orders';
      }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }
}

/**
 * Helper function to get user-friendly error messages for trading validation errors
 * @param errors The validation errors object
 * @param fieldName The name of the field being validated
 */
export function getTradingErrorMessage(errors: ValidationErrors, fieldName: string): string {
  if (!errors) return '';
  
  // Quantity errors
  if (errors['quantityTooLow']) {
    return `Minimum quantity is ${errors['quantityTooLow'].min}`;
  }
  if (errors['quantityTooHigh']) {
    return `Maximum quantity is ${errors['quantityTooHigh'].max}`;
  }
  
  // Price errors
  if (errors['priceRequired']) {
    return 'Price is required for this order type';
  }
  if (errors['priceTooLow']) {
    return `Minimum price is ${errors['priceTooLow'].min}`;
  }
  if (errors['priceTooHigh']) {
    return `Maximum price is ${errors['priceTooHigh'].max}`;
  }
  
  // Stop loss errors
  if (errors['stopLossInvalid']) {
    return errors['stopLossInvalid'].message;
  }
  
  // Take profit errors
  if (errors['takeProfitInvalid']) {
    return errors['takeProfitInvalid'].message;
  }
  
  // Risk/reward errors
  if (errors['riskRewardRatio']) {
    return errors['riskRewardRatio'].message;
  }
  if (errors['riskZero']) {
    return errors['riskZero'].message;
  }
  
  // Generic errors
  if (errors['invalidNumber']) {
    return `${fieldName} must be a valid number`;
  }
  if (errors['required']) {
    return `${fieldName} is required`;
  }
  
  // Return first error message if no specific handler found
  const firstError = Object.keys(errors)[0];
  return errors[firstError]?.message || `Invalid ${fieldName.toLowerCase()}`;
}