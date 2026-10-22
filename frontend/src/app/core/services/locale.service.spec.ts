import { TestBed } from '@angular/core/testing';
import {
  TranslationObject,
  TranslateLoader,
  TranslateService,
  provideTranslateService,
} from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, LocaleService } from './locale.service';
import { TRANSLATIONS, initI18nForTest, provideTestingI18n } from '../../../testing/i18n-testing';

describe('LocaleService', () => {
  afterEach(() => localStorage.clear());

  it('inicializa com o idioma persistido no localStorage', async () => {
    TestBed.configureTestingModule({ providers: [...provideTestingI18n()] });
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');

    const service = TestBed.inject(LocaleService);
    await service.initialize();

    expect(service.language()).toBe('es');
    expect(document.documentElement.getAttribute('lang')).toBe('es');
  });

  it('troca o idioma em runtime, persiste e atualiza o documento (cenário 9)', async () => {
    TestBed.configureTestingModule({ providers: [...provideTestingI18n()] });
    await initI18nForTest('pt-BR');

    const service = TestBed.inject(LocaleService);
    service.setLanguage('en');

    expect(service.language()).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(document.title).toBe('Orders & Catalog — COE Lead Challenge');
  });

  it('aplica o fallback pt-BR quando a chave não existe no idioma ativo (cenário 10)', async () => {
    // Loader com 'en' incompleto: app.title existe apenas no fallback pt-BR.
    class PartialEnLoader extends TranslateLoader {
      override getTranslation(lang: string): Observable<TranslationObject> {
        if (lang === 'en') {
          return of({ status: { CRIADO: 'Created' } });
        }
        return of(TRANSLATIONS[lang] ?? {});
      }
    }

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({ fallbackLang: DEFAULT_LANGUAGE, loader: PartialEnLoader }),
      ],
    });
    await initI18nForTest('en');

    const translate = TestBed.inject(TranslateService);
    expect(translate.instant('app.title')).toBe('Pedidos & Catálogo — Desafio COE Lead');
    expect(translate.instant('status.CRIADO')).toBe('Created');
  });

  it('exibe a chave bruta quando a tradução não existe em nenhum idioma', async () => {
    TestBed.configureTestingModule({ providers: [...provideTestingI18n()] });
    await initI18nForTest();

    expect(TestBed.inject(TranslateService).instant('chave.inexistente')).toBe('chave.inexistente');
  });
});
