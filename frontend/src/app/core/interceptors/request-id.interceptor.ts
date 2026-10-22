import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Envia um X-Request-Id (UUID) por request. O backend ecoa o valor no envelope
 * de erro e nos logs (RequestIdFilter), permitindo correlação para troubleshooting.
 */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const requestId = crypto.randomUUID();
  return next(req.clone({ setHeaders: { 'X-Request-Id': requestId } }));
};
