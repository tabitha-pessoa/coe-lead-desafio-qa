import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center text-center p-5">
      <p class="display-6 fw-semibold mb-2">404</p>
      <h1 class="h4 mb-2">{{ 'notFound.title' | t }}</h1>
      <p class="text-body-secondary mb-4">{{ 'notFound.message' | t }}</p>
      <a routerLink="/" class="btn btn-primary">{{ 'notFound.home' | t }}</a>
    </div>
  `,
})
export class NotFoundPage {}
