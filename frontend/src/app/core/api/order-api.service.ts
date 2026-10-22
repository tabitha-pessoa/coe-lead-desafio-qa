import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../config/api-config';
import {
  CreateOrderRequest,
  Order,
  OrderListParams,
  OrderPageResponse,
} from '../models/order.models';

/** Acesso exclusivo à API de pedidos (order-service). Componentes nunca usam HttpClient direto. */
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  getOrders(params: OrderListParams = {}): Observable<OrderPageResponse> {
    const { page = 0, size = 20, status } = params;
    let httpParams = new HttpParams({
      fromObject: { page: page.toString(), size: size.toString() },
    });
    if (status) {
      httpParams = httpParams.set('status', status);
    }
    return this.http.get<OrderPageResponse>(this.apiConfig.orders, { params: httpParams });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiConfig.orders}/${id}`);
  }

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiConfig.orders, request);
  }
}
