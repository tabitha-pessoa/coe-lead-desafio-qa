import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config';
import { BatchPricesResponse, Product } from '../models/catalog.models';

/** Acesso exclusivo à API de catálogo (catalog-service). */
@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiConfig.catalog}/${id}`);
  }

  /** Consulta em lote (máx. 50 IDs, sem duplicatas) — padrão anti-N+1 (ADR-010). */
  getProductsPrices(productIds: string[]): Observable<BatchPricesResponse> {
    return this.http.post<BatchPricesResponse>(`${this.apiConfig.catalog}/prices`, { productIds });
  }
}
