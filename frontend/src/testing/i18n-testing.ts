import { registerLocaleData } from '@angular/common';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  TranslationObject,
  TranslateLoader,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localePt from '@angular/common/locales/pt';

import en from '../../public/assets/i18n/en.json';
import es from '../../public/assets/i18n/es.json';
import ptBR from '../../public/assets/i18n/pt-BR.json';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LocaleService,
} from '../app/core/services/locale.service';

// Mesmos locales do app.config.ts — CurrencyPipe/DatePipe precisam dos dados
// registrados ('pt' cobre 'pt-BR', 'en' cobre 'en-US', 'es' cobre 'es-ES').
registerLocaleData(localePt);
registerLocaleData(localeEn);
registerLocaleData(localeEs);

/** Traduções reais da aplicação — os specs exercitam as chaves de produção. */
export const TRANSLATIONS: Record<string, TranslationObject> = {
  'pt-BR': ptBR,
  en,
  es,
};

/** Loader síncrono com os JSONs reais — elimina HTTP e flakiness dos testes. */
export class TestingTranslateLoader extends TranslateLoader {
  override getTranslation(lang: string): Observable<TranslationObject> {
    return of(TRANSLATIONS[lang] ?? {});
  }
}

/** Providers de i18n para TestBed — mesmas chaves e fallback da aplicação. */
export function provideTestingI18n(): Provider[] {
  return provideTranslateService({
    fallbackLang: DEFAULT_LANGUAGE,
    loader: provideTranslateLoader(TestingTranslateLoader),
  });
}

/**
 * Inicializa o LocaleService de forma determinística: limpa o storage, fixa o
 * idioma e carrega as traduções (loader síncrono). Chamar no `beforeEach`
 * assíncrono, após `configureTestingModule`.
 */
export async function initI18nForTest(language: string = DEFAULT_LANGUAGE): Promise<void> {
  localStorage.clear();
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await TestBed.inject(LocaleService).initialize();
}

/** Intl usa NBSP (U+00A0) em moedas pt-BR — normaliza para asserts legíveis. */
export function normalizeText(text: string | null | undefined): string {
  return (text ?? '').replace(/\u00A0/g, ' ');
}
