import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TranslatePipe } from '../../pipes/translate.pipe';

/** Feedback visual padrão para operações assíncronas (spinner + rótulo acessível). */
@Component({
  selector: 'app-loading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div
      class="d-flex align-items-center justify-content-center gap-2 p-4 text-body-secondary"
      role="status"
    >
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>{{ labelKey() | t }}</span>
    </div>
  `,
})
export class LoadingComponent {
  readonly labelKey = input('common.loading');
}
