import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LocaleService } from '../../core/services/locale.service';

/**
 * Tradução centralizada de status (pedido e produto). O valor do backend NUNCA
 * é alterado — apenas apresentado. Status desconhecido (evolução futura do
 * backend) exibe o código bruto como fallback seguro.
 */
@Pipe({ name: 'statusLabel', standalone: true, pure: false })
export class StatusLabelPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly localeService = inject(LocaleService);

  transform(status: string | null | undefined): string {
    if (!status) {
      return '';
    }
    this.localeService.language();
    const key = `status.${status}`;
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }
}
