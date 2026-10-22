import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';

import { LocaleService } from '../../core/services/locale.service';

/**
 * Formatação de datas locale-aware delegando ao DatePipe nativo do Angular.
 * Aceita ISO-8601 UTC (contrato do backend) e reage à troca de idioma.
 */
@Pipe({ name: 'appDate', standalone: true, pure: false })
export class AppDatePipe implements PipeTransform {
  private readonly localeService = inject(LocaleService);

  transform(value: string | Date | null | undefined, format = 'short'): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    this.localeService.language();
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new DatePipe(this.localeService.locale()).transform(date, format);
  }
}
