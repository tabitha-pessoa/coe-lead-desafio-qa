import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/** Barra superior: marca, hamburger (mobile) e seletor de idioma. */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LanguageSelectorComponent, TranslatePipe],
  template: `
    <header class="app-header navbar sticky-top">
      <div class="container-fluid">
        <button
          type="button"
          class="btn btn-outline-light d-lg-none me-2"
          (click)="menuToggle.emit()"
          [attr.aria-expanded]="menuExpanded()"
          aria-controls="app-sidebar"
          [attr.aria-label]="'nav.menu' | t"
        >
          <svg class="bi" width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2.5 12a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11Zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11Zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <a routerLink="/" class="navbar-brand mb-0 h1 fw-semibold text-truncate">{{
          'app.name' | t
        }}</a>
        <div class="ms-auto d-flex align-items-center gap-2">
          <app-language-selector />
        </div>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
      height: var(--app-header-height);
    }

    .app-header {
      height: 100%;
      background: var(--brand-900);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }

    .navbar-brand {
      color: #fff;
      max-width: 60vw;
    }

    // O seletor de idioma reaproveita .btn-outline-secondary; sobre o fundo
    // escuro do header, ele precisa de um contraste claro.
    .app-header ::ng-deep .btn-outline-secondary {
      --bs-btn-color: #fff;
      --bs-btn-border-color: rgba(255, 255, 255, 0.5);
      --bs-btn-hover-color: var(--brand-900);
      --bs-btn-hover-bg: #fff;
      --bs-btn-hover-border-color: #fff;
      --bs-btn-active-color: var(--brand-900);
      --bs-btn-active-bg: #fff;
      --bs-btn-active-border-color: #fff;
    }
  `,
})
export class HeaderComponent {
  readonly menuExpanded = input(false);
  readonly menuToggle = output<void>();
}
