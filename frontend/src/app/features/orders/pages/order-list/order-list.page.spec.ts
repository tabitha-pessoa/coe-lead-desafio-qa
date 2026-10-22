import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { requestIdInterceptor } from '../../../../core/interceptors/request-id.interceptor';
import { Order, OrderPageResponse } from '../../../../core/models/order.models';
import {
  initI18nForTest,
  normalizeText,
  provideTestingI18n,
} from '../../../../../testing/i18n-testing';
import { OrderListPage } from './order-list.page';

const TEST_API_CONFIG: ApiConfig = {
  orders: '/api/orders',
  catalog: '/api/catalog',
};

describe('OrderListPage', () => {
  let fixture: ComponentFixture<OrderListPage>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [OrderListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([requestIdInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: TEST_API_CONFIG },
        ...provideTestingI18n(),
      ],
    });
    await initI18nForTest();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(OrderListPage);
    el = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('carrega a primeira página de pedidos da API e exibe as linhas (cenário 1)', () => {
    const req = httpMock.expectOne('/api/orders?page=0&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(makeOrderPage({ totalElements: 2, totalPages: 1 }));

    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    const text = normalizeText(el.textContent);
    expect(text).toContain('Ana Souza');
    expect(text).toContain('Bruno Lima');
    expect(text).toContain('R$ 100,00');
    expect(text).toContain('R$ 250,00');
    expect(text).toContain('Criado');
  });

  it('exibe estado vazio quando não há pedidos', () => {
    httpMock.expectOne('/api/orders?page=0&size=20').flush(makeOrderPage({ content: [] }));
    fixture.detectChanges();

    expect(normalizeText(el.textContent)).toContain('Nenhum pedido encontrado');
  });

  it('exibe mensagem de erro localizada com requestId quando a API falha', () => {
    httpMock.expectOne('/api/orders?page=0&size=20').flush(
      {
        error: { code: 'DATABASE_ERROR', message: 'boom', details: [] },
        requestId: 'req-1',
      },
      { status: 500, statusText: 'Internal Server Error' },
    );
    fixture.detectChanges();

    const text = normalizeText(el.textContent);
    expect(text).toContain('Erro no banco de dados. Contate o suporte.');
    expect(text).toContain('requestId: req-1');
  });

  it('converte a página 1-based da paginação para 0-based da API', async () => {
    httpMock
      .expectOne('/api/orders?page=0&size=20')
      .flush(makeOrderPage({ totalElements: 21, totalPages: 2 }));
    fixture.detectChanges();

    const pageTwo = [...el.querySelectorAll<HTMLElement>('.page-link')].find(
      (link) => link.textContent?.trim() === '2',
    );
    if (!pageTwo) {
      throw new Error('link da página 2 não encontrado');
    }
    pageTwo.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const req = httpMock.expectOne('/api/orders?page=1&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(
      makeOrderPage({
        content: [makeOrder('ORD-21', 'Carla Mendes', 300)],
        page: 1,
        totalElements: 21,
        totalPages: 2,
      }),
    );
    await fixture.whenStable();

    const text = normalizeText(el.textContent);
    expect(text).toContain('Carla Mendes');
    expect(text).not.toContain('Ana Souza');
  });
});

function makeOrder(id: string, clientName: string, total: number): Order {
  return {
    id,
    client: { name: clientName, document: '123.456.789-00', email: 'cliente@exemplo.com' },
    items: [
      {
        productId: 'PROD-1',
        productName: 'Produto Um',
        unitPrice: total,
        quantity: 1,
        lineTotal: total,
      },
    ],
    subtotal: total,
    discount: 0,
    total,
    status: 'CRIADO',
    createdAt: '2026-09-25T12:00:00Z',
  };
}

function makeOrderPage(overrides: Partial<OrderPageResponse> = {}): OrderPageResponse {
  return {
    content: [makeOrder('ORD-1', 'Ana Souza', 100), makeOrder('ORD-2', 'Bruno Lima', 250)],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    ...overrides,
  };
}
