import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
      
      <div class="order-form-content">
        <!-- Order form will go here -->
        <div class="order-form-placeholder">
          <p class="text-center text-muted">Order form coming soon...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-form {
      padding: var(--container-padding);
      min-height: 100vh;
      background-color: var(--bg-primary);
    }
    
    .order-form-header {
      margin-bottom: var(--space-8);
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
      width: var(--touch-target-comfortable);
      height: var(--touch-target-comfortable);
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
    }
    
    .back-icon {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
    }
    
    .header-content {
      flex: 1;
    }
    
    .order-form-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }
    
    .order-form-placeholder {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class OrderFormComponent {
  protected readonly title = signal('New Trade Order');
}