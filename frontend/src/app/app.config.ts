import { registerLocaleData } from '@angular/common';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localePt from '@angular/common/locales/pt';

import { environment } from '../environments/environment';
import { API_CONFIG } from './core/config/api-config';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { requestIdInterceptor } from './core/interceptors/request-id.interceptor';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCALES,
  LocaleService,
  resolveInitialLanguage,
} from './core/services/locale.service';

import { routes } from './app.routes';

// Registra os locales usados pelos pipes nativos (CurrencyPipe/DatePipe).
// 'pt' cobre 'pt-BR', 'en' cobre 'en-US' e 'es' cobre 'es-ES' por fallback.
registerLocaleData(localePt);
registerLocaleData(localeEn);
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([requestIdInterceptor, apiErrorInterceptor])),
    // ngx-translate v18: providers funcionais (sem NgModule).
    provideTranslateService({ fallbackLang: DEFAULT_LANGUAGE }),
    // Traduções em public/assets/i18n (servidas em /assets/i18n).
    provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    { provide: API_CONFIG, useValue: environment.api },
    // Locale inicial para pipes nativos sem locale explícito (a troca de
    // idioma em runtime é reativa via LocaleService nos pipes customizados).
    { provide: LOCALE_ID, useFactory: () => LANGUAGE_LOCALES[resolveInitialLanguage()] },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (localeService: LocaleService) => () => localeService.initialize(),
      deps: [LocaleService],
    },
  ],
};
