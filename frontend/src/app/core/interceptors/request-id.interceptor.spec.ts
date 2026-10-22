import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { requestIdInterceptor } from './request-id.interceptor';

describe('requestIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([requestIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adiciona X-Request-Id (UUID) em cada request', () => {
    http.get('/api/orders').subscribe(() => undefined);

    const req = httpMock.expectOne('/api/orders');
    const requestId = req.request.headers.get('X-Request-Id');
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    req.flush([]);
  });

  it('gera um novo ID por request (correlação individual)', () => {
    http.get('/api/orders').subscribe(() => undefined);
    http.get('/api/orders').subscribe(() => undefined);

    const requests = httpMock.match('/api/orders');
    expect(requests.length).toBe(2);
    const [first, second] = requests;
    expect(first?.request.headers.get('X-Request-Id')).not.toBe(
      second?.request.headers.get('X-Request-Id'),
    );
    for (const req of requests) {
      req.flush([]);
    }
  });
});
