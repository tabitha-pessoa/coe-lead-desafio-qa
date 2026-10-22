/** Contratos do catalog-service (porta 8081). Fonte: docs/api.md + DTOs Java. */

export type ProductStatus = 'ATIVO' | 'INATIVO';

/** Janela de vigência de preço (ADR-007). `validTo` null = vigente indefinidamente. */
export interface PriceWindow {
  value: number;
  currency: string;
  validFrom: string;
  validTo: string | null;
}

/** Resposta de GET /api/v1/products/{id}. `currentPrice` null quando não há janela vigente. */
export interface Product {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  currentPrice: PriceWindow | null;
}

/** Item de POST /api/v1/products/prices (resposta em lote). */
export interface CatalogItemPrice {
  productId: string;
  name: string;
  status: ProductStatus;
  currentPrice: PriceWindow | null;
}

export interface BatchPricesResponse {
  prices: CatalogItemPrice[];
  notFound: string[];
}
