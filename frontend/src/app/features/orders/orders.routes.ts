import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/order-list/order-list.page').then((m) => m.OrderListPage),
  },
  {
    // Precisa vir antes de :id para não ser capturado como parâmetro.
    path: 'new',
    loadComponent: () => import('./pages/order-form/order-form.page').then((m) => m.OrderFormPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.page').then((m) => m.OrderDetailPage),
  },
];
