import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { requestIdInterceptor } from '../../../../core/interceptors/request-id.interceptor';
import { Order } from '../../../../core/models/order.models';
import {
  initI18nForTest,
  normalizeText,
  provideTestingI18n,
} from '../../../../../testing/i18n-testing';
import { OrderDetailPage } from './order-detail.page';

const TEST_API_CONFIG: ApiConfig = {
  orders: '/api/orders',
  catalog: '/api/catalog',
};

describe('OrderDetailPage', () => {
  let fixture: ComponentFixture<OrderDetailPage>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [OrderDetailPage],
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
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('carrega pedido por ID e exibe cliente, resumo e itens (cenário 2)', () => {
    createFixtureWithId('ORD-42');

    const req = httpMock.expectOne('/api/orders/ORD-42');
    expect(req.request.method).toBe('GET');
    req.flush(makeOrder());
    fixture.detectChanges();

    const text = normalizeText(el.textContent);
    expect(text).toContain('Ana Souza');
    expect(text).toContain('123.456.789-00');
    expect(text).toContain('ana@exemplo.com');
    expect(text).toContain('Produto Um');
    expect(text).toContain('R$ 50,00');
    expect(text).toContain('R$ 100,00');
    expect(text).toContain('Criado');
  });

  it('exibe mensagem localizada para pedido inexistente (404)', () => {
    createFixtureWithId('ORD-X');

    httpMock.expectOne('/api/orders/ORD-X').flush(
      {
        error: { code: 'ORDER_NOT_FOUND', message: 'not found', details: [] },
        requestId: 'req-2',
      },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(normalizeText(el.textContent)).toContain('Pedido não encontrado.');
  });

  it('recarrega quando o ID da rota muda (input reativo)', () => {
    createFixtureWithId('ORD-1');
    httpMock.expectOne('/api/orders/ORD-1').flush(makeOrder());
    fixture.detectChanges();

    fixture.componentRef.setInput('id', 'ORD-2');
    fixture.detectChanges();
    httpMock.expectOne('/api/orders/ORD-2').flush(makeOrder());
    fixture.detectChanges();

    expect(httpMock.match({ method: 'GET' }).length).toBe(0);
  });

  function createFixtureWithId(id: string): void {
    fixture = TestBed.createComponent(OrderDetailPage);
    fixture.componentRef.setInput('id', id);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }
});

function makeOrder(): Order {
  return {
    id: 'ORD-42',
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
