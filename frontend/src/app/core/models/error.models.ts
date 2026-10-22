/**
 * Envelope de erro padronizado dos dois serviços (ADR-008):
 * `{ "error": { "code", "message", "details" }, "requestId": "..." }`
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  details: string[];
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
  requestId?: string;
}

/**
 * Erro normalizado produzido pelo apiErrorInterceptor. Componentes e services
 * programam contra códigos estáveis — nunca contra mensagens ou status HTTP.
 */
export class ApiException extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly backendMessage: string,
    readonly details: readonly string[],
    readonly requestId?: string,
  ) {
    super(backendMessage || `HTTP ${status}`);
    this.name = 'ApiException';
  }
}
