import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiErrorEnvelope, ApiException } from '../models/error.models';

/**
 * Normaliza qualquer falha HTTP em ApiException (código estável + status +
 * requestId), consumindo o envelope ADR-008 quando presente. Componentes
 * nunca parseiam HttpErrorResponse diretamente.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: unknown) => throwError(() => normalizeApiError(error))));

function normalizeApiError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }
  if (error.status === 0) {
    return new ApiException(0, 'NETWORK_ERROR', 'Network error', []);
  }
  const envelope = parseEnvelope(error.error);
  if (envelope) {
    return new ApiException(
      error.status,
      envelope.error.code,
      envelope.error.message ?? '',
      envelope.error.details ?? [],
      envelope.requestId,
    );
  }
  // Resposta sem envelope (ex.: HTML de um proxy/gateway) — erro genérico normalizado.
  return new ApiException(error.status, 'UNKNOWN_ERROR', error.message ?? '', []);
}

function parseEnvelope(body: unknown): ApiErrorEnvelope | null {
  if (body === null || typeof body !== 'object' || !('error' in body)) {
    return null;
  }
  const candidate = body as ApiErrorEnvelope;
  if (candidate.error && typeof candidate.error.code === 'string') {
    return candidate;
  }
  return null;
}
