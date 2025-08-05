import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found">
      <div class="not-found-content">
        <div class="not-found-icon">404</div>
        <h1 class="heading-2">Page Not Found</h1>
        <p class="body-base text-secondary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button 
          class="back-home-button"
          [routerLink]="['/trades']"
          type="button">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--container-padding);
      background-color: var(--bg-primary);
    }
    
    .not-found-content {
      text-align: center;
      max-width: 400px;
    }
    
    .not-found-icon {
      font-size: var(--text-4xl);
      font-weight: var(--font-bold);
      color: var(--text-tertiary);
      margin-bottom: var(--space-6);
    }
    
    .not-found h1 {
      margin-bottom: var(--space-4);
    }
    
    .not-found p {
      margin-bottom: var(--space-8);
      line-height: var(--leading-relaxed);
    }
    
    .back-home-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-3) var(--space-6);
      background-color: var(--primary-blue);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      min-height: var(--touch-target-comfortable);
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      
      &:hover {
        background-color: var(--primary-blue-light);
        transform: translateY(-1px);
      }
      
      &:active {
        background-color: var(--primary-blue-dark);
        transform: translateY(0);
      }
    }
  `]
})
export class NotFoundComponent {}