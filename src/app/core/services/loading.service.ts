import { Injectable, signal } from '@angular/core';

/**
 * Loading Service
 * Manages global loading state using Angular signals
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly _isLoading = signal(false);
  private readonly _loadingCount = signal(0);
  private readonly _loadingMessage = signal<string | null>(null);

  // Public readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadingMessage = this._loadingMessage.asReadonly();

  /**
   * Show loading indicator
   */
  show(message?: string): void {
    this._loadingCount.update(count => count + 1);
    this._isLoading.set(true);
    
    if (message) {
      this._loadingMessage.set(message);
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    this._loadingCount.update(count => {
      const newCount = Math.max(0, count - 1);
      
      if (newCount === 0) {
        this._isLoading.set(false);
        this._loadingMessage.set(null);
      }
      
      return newCount;
    });
  }

  /**
   * Force hide loading indicator (resets count to 0)
   */
  forceHide(): void {
    this._loadingCount.set(0);
    this._isLoading.set(false);
    this._loadingMessage.set(null);
  }

  /**
   * Set loading message without affecting loading state
   */
  setMessage(message: string | null): void {
    this._loadingMessage.set(message);
  }
}