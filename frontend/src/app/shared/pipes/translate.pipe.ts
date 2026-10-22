import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LocaleService } from '../../core/services/locale.service';

/**
 * Pipe de tradução reativo: lê o signal de idioma dentro do contexto do
 * template, garantindo re-render em trocas de idioma mesmo em zoneless.
 * Impuro por design (o argumento não muda quando o idioma muda).
 * Fallback: chave ausente → tradução do idioma padrão (pt-BR) → chave bruta.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly localeService = inject(LocaleService);

  transform(key: string | null | undefined, params?: Record<string, unknown> | null): string {
    if (!key) {
      return '';
    }
    this.localeService.language();
    return this.translate.instant(key, params ?? undefined) || key;
  }
}
