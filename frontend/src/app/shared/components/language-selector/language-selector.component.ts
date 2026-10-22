import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import {
  AppLanguage,
  LocaleService,
  SUPPORTED_LANGUAGES,
} from '../../../core/services/locale.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

/** Seletor de idioma do header (ng-bootstrap dropdown). Persiste a escolha. */
@Component({
  selector: 'app-language-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgbDropdownModule, TranslatePipe],
  template: `
    <div ngbDropdown display="dynamic" class="dropdown">
      <button
        type="button"
        class="btn btn-outline-secondary dropdown-toggle"
        ngbDropdownToggle
        [attr.aria-label]="'language.label' | t"
      >
        {{ 'language.' + localeService.language() | t }}
      </button>
      <div ngbDropdownMenu>
        @for (language of languages; track language) {
          <button
            type="button"
            ngbDropdownItem
            [class.active]="language === localeService.language()"
            (click)="select(language)"
          >
            {{ 'language.' + language | t }}
          </button>
        }
      </div>
    </div>
  `,
})
export class LanguageSelectorComponent {
  protected readonly localeService = inject(LocaleService);
  protected readonly languages: readonly AppLanguage[] = SUPPORTED_LANGUAGES;

  select(language: AppLanguage): void {
    this.localeService.setLanguage(language);
  }
}
