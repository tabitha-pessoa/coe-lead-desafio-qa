import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';

import { LocaleService } from '../../core/services/locale.service';

/**
 * Formatação monetária locale-aware delegando ao CurrencyPipe nativo do
 * Angular (sem formatação manual). Reage à troca de idioma via signal.
 * Premissa documentada: valores de pedido sem moeda explícita são BRL.
 */
@Pipe({ name: 'appCurrency', standalone: true, pure: false })
export class AppCurrencyPipe implements PipeTransform {
  private readonly localeService = inject(LocaleService);

  transform(value: number | null | undefined, currencyCode = 'BRL'): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    this.localeService.language();
    return new CurrencyPipe(this.localeService.locale()).transform(
      value,
      currencyCode,
      'symbol',
      '1.2-2',
    );
  }
}
