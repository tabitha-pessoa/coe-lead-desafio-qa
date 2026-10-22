import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG, ApiConfig } from '../config/api-config';
import { CreateOrderRequest, Order, OrderPageResponse } from '../models/order.models';
import { OrderApiService } from './order-api.service';

const TEST_API_CONFIG: ApiConfig = {
  orders: '/api/orders',
  catalog: '/api/catalog',
};

describe('OrderApiService', () => {
  let service: OrderApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: TEST_API_CONFIG },
      ],
    });
    service = TestBed.inject(OrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista pedidos com paginação padrão (page=0, size=20)', () => {
    const body: OrderPageResponse = {
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    };
    let actual: OrderPageResponse | undefined;
    service.getOrders().subscribe((response) => (actual = response));

    const req = httpMock.expectOne('/api/orders?page=0&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(body);

    expect(actual).toEqual(body);
  });

  it('lista pedidos com página, tamanho e status informados', () => {
    service.getOrders({ page: 2, size: 5, status: 'CRIADO' }).subscribe(() => undefined);

    const req = httpMock.expectOne('/api/orders?page=2&size=5&status=CRIADO');
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], page: 2, size: 5, totalElements: 0, totalPages: 0 });
  });

  it('carrega pedido por ID', () => {
    const order = makeOrder();
    let actual: Order | undefined;
    service.getOrderById('ORD-1').subscribe((response) => (actual = response));

    const req = httpMock.expectOne('/api/orders/ORD-1');
    expect(req.request.method).toBe('GET');
    req.flush(order);

    expect(actual).toEqual(order);
  });

  it('cria pedido enviando apenas productId e quantity por item', () => {
    const request: CreateOrderRequest = {
      client: { name: 'Ana Souza', document: '123.456.789-00', email: 'ana@exemplo.com' },
      items: [{ productId: 'PROD-1', quantity: 2 }],
    };
    const order = makeOrder();
    let actual: Order | undefined;
    service.createOrder(request).subscribe((response) => (actual = response));

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(order);

    expect(actual).toEqual(order);
  });
});

function makeOrder(): Order {
  return {
    id: 'ORD-1',
    client: { name: 'Ana Souza', document: '123.456.789-00', email: 'ana@exemplo.com' },
    items: [
      {
        productId: 'PROD-1',
        productName: 'Produto Um',
        unitPrice: 50,
        quantity: 2,
        lineTotal: 100,
      },
    ],
    subtotal: 100,
    discount: 0,
    total: 100,
    status: 'CRIADO',
    createdAt: '2026-09-25T12:00:00Z',
  };
}
