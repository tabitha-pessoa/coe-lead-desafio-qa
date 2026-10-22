import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ApiException } from '../models/error.models';

/**
 * Converte ApiException em mensagem localizada, com cadeia de fallback:
 * 1. código estável (`errors.codes.PRODUCT_NOT_FOUND`);
 * 2. status HTTP (`errors.status.503`) — cobre 400/404/409/422/500/502/503/504/0;
 * 3. mensagem genérica (`errors.generic`).
 */
@Injectable({ providedIn: 'root' })
export class ApiErrorMessagesService {
  private readonly translate = inject(TranslateService);

  message(error: ApiException): string {
    const codeKey = `errors.codes.${error.code}`;
    const codeMessage = this.translate.instant(codeKey);
    if (codeMessage !== codeKey) {
      return codeMessage;
    }
    const statusKey = `errors.status.${error.status}`;
    const statusMessage = this.translate.instant(statusKey);
    if (statusMessage !== statusKey) {
      return statusMessage;
    }
    return this.translate.instant('errors.generic');
  }
}
