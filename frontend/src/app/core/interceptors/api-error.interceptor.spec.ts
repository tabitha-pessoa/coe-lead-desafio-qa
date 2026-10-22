import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiException } from '../models/error.models';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normaliza o envelope ADR-008 em ApiException com código e requestId', () => {
    let actual: unknown;
    http.get('/api/orders/ORD-X').subscribe({ error: (error: unknown) => (actual = error) });

    httpMock.expectOne('/api/orders/ORD-X').flush(
      {
        error: { code: 'ORDER_NOT_FOUND', message: 'Pedido não encontrado', details: [] },
        requestId: 'req-123',
      },
      { status: 404, statusText: 'Not Found' },
    );

    expect(actual).toBeInstanceOf(ApiException);
    const apiError = actual as ApiException;
    expect(apiError.status).toBe(404);
    expect(apiError.code).toBe('ORDER_NOT_FOUND');
    expect(apiError.backendMessage).toBe('Pedido não encontrado');
    expect(apiError.requestId).toBe('req-123');
  });

  it('normaliza falha de rede (status 0) em NETWORK_ERROR', () => {
    let actual: unknown;
    http.get('/api/orders').subscribe({ error: (error: unknown) => (actual = error) });

    httpMock.expectOne('/api/orders').flush(new ErrorEvent('network error'), {
      status: 0,
      statusText: 'Network Error',
    });

    expect(actual).toBeInstanceOf(ApiException);
    const apiError = actual as ApiException;
    expect(apiError.status).toBe(0);
    expect(apiError.code).toBe('NETWORK_ERROR');
  });

  it('normaliza resposta sem envelope em UNKNOWN_ERROR mantendo o status', () => {
    let actual: unknown;
    http.get('/api/orders').subscribe({ error: (error: unknown) => (actual = error) });

    httpMock.expectOne('/api/orders').flush('<html>Bad Gateway</html>', {
      status: 502,
      statusText: 'Bad Gateway',
    });

    expect(actual).toBeInstanceOf(ApiException);
    const apiError = actual as ApiException;
    expect(apiError.status).toBe(502);
    expect(apiError.code).toBe('UNKNOWN_ERROR');
  });
});
