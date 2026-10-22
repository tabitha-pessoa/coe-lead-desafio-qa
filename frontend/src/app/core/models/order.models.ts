/** Contratos do order-service (porta 8080). Fonte: docs/api.md + DTOs Java. */

/**
 * Único status existente no backend (ADR-012). O tipo é aberto (`string`) na
 * borda de apresentação para não quebrar a UI quando o backend evoluir — o
 * mecanismo de tradução de status faz fallback para o código bruto.
 */
export type OrderStatus = 'CRIADO';

export interface OrderClient {
  name: string;
  document: string;
  email: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  client: OrderClient;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

/** Envelope paginado de GET /api/v1/orders (ADR-011). */
export interface OrderPageResponse {
  content: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface OrderListParams {
  page?: number;
  size?: number;
  status?: string;
}

/** Payload de POST /api/v1/orders. Preços NÃO são enviados — o backend consulta o catálogo. */
export interface CreateOrderRequest {
  client: { name: string; document: string; email: string };
  items: { productId: string; quantity: number }[];
}
