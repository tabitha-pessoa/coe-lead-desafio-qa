import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { requestIdInterceptor } from '../../../../core/interceptors/request-id.interceptor';
import { CatalogItemPrice, Product } from '../../../../core/models/catalog.models';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  initI18nForTest,
  normalizeText,
  provideTestingI18n,
} from '../../../../../testing/i18n-testing';
import { CatalogLookupPage } from './catalog-lookup.page';

const TEST_API_CONFIG: ApiConfig = {
  orders: '/api/orders',
  catalog: '/api/catalog',
};

describe('CatalogLookupPage', () => {
  let fixture: ComponentFixture<CatalogLookupPage>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CatalogLookupPage],
      providers: [
        provideHttpClient(withInterceptors([requestIdInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: TEST_API_CONFIG },
        ...provideTestingI18n(),
      ],
    });
    await initI18nForTest();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fixture = TestBed.createComponent(CatalogLookupPage);
    el = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('consulta produto individual via GET e exibe o resultado', async () => {
    await searchIds('PROD-001');

    const req = httpMock.expectOne('/api/catalog/PROD-001');
    expect(req.request.method).toBe('GET');
    req.flush(makeProduct('PROD-001', 'Produto Um', 50));
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    const text = normalizeText(el.textContent);
    expect(text).toContain('Produto Um');
    expect(text).toContain('R$ 50,00');
    expect(text).toContain('Ativo');
  });

  it('consulta em lote via POST /prices e destaca IDs não encontrados', async () => {
    await searchIds('PROD-001, PROD-002, PROD-999');

    const req = httpMock.expectOne('/api/catalog/prices');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productIds: ['PROD-001', 'PROD-002', 'PROD-999'] });
    req.flush({
      prices: [makePrice('PROD-001', 'Produto Um', 50), makePrice('PROD-002', 'Produto Dois', 30)],
      notFound: ['PROD-999'],
    });
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(normalizeText(el.textContent)).toContain('IDs não encontrados: PROD-999');
  });

  it('exibe mensagem localizada quando o produto não existe (cenário 5)', async () => {
    await searchIds('PROD-999');

    httpMock.expectOne('/api/catalog/PROD-999').flush(
      {
        error: { code: 'PRODUCT_NOT_FOUND', message: 'not found', details: [] },
        requestId: 'req-5',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    expect(normalizeText(el.textContent)).toContain('Produto não encontrado.');
  });

  it('limita a consulta em lote a 50 IDs sem chamar a API', async () => {
    const ids = Array.from(
      { length: 51 },
      (_, index) => `PROD-${String(index).padStart(3, '0')}`,
    ).join(', ');
    await searchIds(ids);

    httpMock.expectNone('/api/catalog/prices');
    expect(toastMessages()).toContain('Consulte no máximo 50 IDs por vez.');
  });

  async function searchIds(raw: string): Promise<void> {
    const input = el.querySelector<HTMLInputElement>('#catalog-ids');
    if (!input) {
      throw new Error('campo de IDs não encontrado');
    }
    input.value = raw;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    el.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function toastMessages(): string[] {
    return TestBed.inject(NotificationService)
      .toasts()
      .map((toast) => toast.message);
  }
});

function makeProduct(id: string, name: string, value: number): Product {
  return {
    id,
    name,
    description: 'Descrição do produto',
    status: 'ATIVO',
    currentPrice: { value, currency: 'BRL', validFrom: '2026-01-01T00:00:00Z', validTo: null },
  };
}

function makePrice(productId: string, name: string, value: number): CatalogItemPrice {
  return {
    productId,
    name,
    status: 'ATIVO',
    currentPrice: { value, currency: 'BRL', validFrom: '2026-01-01T00:00:00Z', validTo: null },
  };
}
