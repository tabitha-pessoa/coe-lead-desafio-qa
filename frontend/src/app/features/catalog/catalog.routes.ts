import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalog-lookup/catalog-lookup.page').then((m) => m.CatalogLookupPage),
  },
];
