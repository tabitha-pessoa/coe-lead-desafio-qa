import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable } from 'rxjs';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR';
export const LANGUAGE_STORAGE_KEY = 'app-language';

/** Locale Angular usado por DatePipe/CurrencyPipe por idioma. */
export const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};

function isAppLanguage(value: string | null): value is AppLanguage {
  return value !== null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function resolveInitialLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isAppLanguage(stored)) {
    return stored;
  }
  const browserLanguage = navigator.language;
  if (browserLanguage?.startsWith('pt')) {
    return 'pt-BR';
  }
  if (browserLanguage?.startsWith('en')) {
    return 'en';
  }
  if (browserLanguage?.startsWith('es')) {
    return 'es';
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Idioma e locale da aplicação. O idioma escolhido persiste no localStorage
 * (dado não sensível) e o fallback é pt-BR. A troca atualiza um signal — os
 * pipes de tradução/formatação reagem em modo zoneless.
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);

  private readonly languageSignal = signal<AppLanguage>(DEFAULT_LANGUAGE);
  readonly language = this.languageSignal.asReadonly();
  readonly locale = computed(() => LANGUAGE_LOCALES[this.languageSignal()]);

  /** Carrega o fallback e as traduções do idioma inicial (APP_INITIALIZER). */
  async initialize(): Promise<void> {
    const language = resolveInitialLanguage();
    await this.loadBestEffort(this.translate.setFallbackLang(DEFAULT_LANGUAGE));
    await this.loadBestEffort(this.translate.use(language));
    this.applyLanguage(language);
  }

  /** Best-effort: em falha de carga exibe o fallback ou a chave bruta. */
  private async loadBestEffort(load: Observable<unknown>): Promise<void> {
    try {
      await firstValueFrom(load);
    } catch {
      // degradação deliberada e documentada — não bloqueia o bootstrap
    }
  }

  setLanguage(language: AppLanguage): void {
    if (language === this.languageSignal()) {
      return;
    }
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    // O signal só é atualizado após o carregamento — garante re-render com as
    // novas traduções mesmo em modo zoneless. Em falha, o fallback pt-BR exibe.
    this.translate.use(language).subscribe({
      next: () => this.applyLanguage(language),
      error: () => this.applyLanguage(language),
    });
  }

  private applyLanguage(language: AppLanguage): void {
    this.languageSignal.set(language);
    document.documentElement.setAttribute('lang', language);
    document.title = this.translate.instant('app.title');
  }
}
