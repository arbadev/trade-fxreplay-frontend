import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/trades',
    pathMatch: 'full'
  },
  {
    path: 'trades',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Trade Dashboard | FX Replay'
  },
  {
    path: 'trades/new',
    loadComponent: () => import('./features/order-form/order-form.component')
      .then(m => m.OrderFormComponent),
    title: 'New Trade Order | FX Replay'
  },
  {
    path: 'trades/:id',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Trade Details | FX Replay'
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Analytics | FX Replay',
    data: { placeholder: 'Analytics page coming soon...' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Settings | FX Replay',
    data: { placeholder: 'Settings page coming soon...' }
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(m => m.NotFoundComponent),
    title: 'Page Not Found | FX Replay'
  }
];
