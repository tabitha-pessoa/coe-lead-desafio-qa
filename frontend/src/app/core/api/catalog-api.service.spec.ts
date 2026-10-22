import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG, ApiConfig } from '../config/api-config';
import { BatchPricesResponse, CatalogItemPrice, Product } from '../models/catalog.models';
import { CatalogApiService } from './catalog-api.service';

const TEST_API_CONFIG: ApiConfig = {
  orders: '/api/orders',
  catalog: '/api/catalog',
};

describe('CatalogApiService', () => {
  let service: CatalogApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: TEST_API_CONFIG },
      ],
    });
    service = TestBed.inject(CatalogApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carrega produto por ID', () => {
    const product = makeProduct('PROD-1', 'Produto Um', 50);
    let actual: Product | undefined;
    service.getProductById('PROD-1').subscribe((response) => (actual = response));

    const req = httpMock.expectOne('/api/catalog/PROD-1');
    expect(req.request.method).toBe('GET');
    req.flush(product);

    expect(actual).toEqual(product);
  });

  it('consulta preços em lote enviando a lista de IDs (anti-N+1)', () => {
    const body: BatchPricesResponse = {
      prices: [makePrice('PROD-1', 'Produto Um', 50), makePrice('PROD-2', 'Produto Dois', 30)],
      notFound: ['PROD-999'],
    };
    let actual: BatchPricesResponse | undefined;
    service
      .getProductsPrices(['PROD-1', 'PROD-2', 'PROD-999'])
      .subscribe((response) => (actual = response));

    const req = httpMock.expectOne('/api/catalog/prices');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productIds: ['PROD-1', 'PROD-2', 'PROD-999'] });
    req.flush(body);

    expect(actual).toEqual(body);
  });
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
