import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1 class="heading-2">Trade Dashboard</h1>
        <p class="body-small text-secondary">Manage your trading positions</p>
      </header>
      
      <div class="dashboard-content">
        <!-- Portfolio Stats will go here -->
        <div class="portfolio-stats-placeholder">
          <p class="text-center text-muted">Portfolio stats coming soon...</p>
        </div>
        
        <!-- Trade List will go here -->
        <div class="trade-list-placeholder">
          <p class="text-center text-muted">Trade list coming soon...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: var(--container-padding);
      min-height: 100vh;
      background-color: var(--bg-primary);
    }
    
    .dashboard-header {
      margin-bottom: var(--space-8);
    }
    
    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }
    
    .portfolio-stats-placeholder,
    .trade-list-placeholder {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class DashboardComponent {
  protected readonly title = signal('Trade Dashboard');
}