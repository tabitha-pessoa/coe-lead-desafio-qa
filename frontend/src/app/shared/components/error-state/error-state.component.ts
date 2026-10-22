import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ApiException } from '../../../core/models/error.models';
import { ApiErrorMessagesService } from '../../../core/services/api-error-messages.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

/** Estado de erro reutilizável: mensagem amigável, requestId e ação de retry. */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="alert alert-danger" role="alert">
      <p class="mb-1">{{ message() }}</p>
      @if (requestId()) {
        <p class="small text-body-secondary mb-2">
          {{ 'errors.requestId' | t: { id: requestId() } }}
        </p>
      }
      <button type="button" class="btn btn-sm btn-outline-danger" (click)="retry.emit()">
        {{ 'common.retry' | t }}
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  /** ApiException ou qualquer erro — desconhecidos recebem mensagem genérica. */
  readonly error = input.required<unknown>();
  readonly retry = output<void>();

  private readonly errorMessages = inject(ApiErrorMessagesService);
  private readonly translate = inject(TranslateService);

  readonly message = computed(() => {
    const error = this.error();
    return error instanceof ApiException
      ? this.errorMessages.message(error)
      : this.translate.instant('errors.generic');
  });

  readonly requestId = computed(() => {
    const error = this.error();
    return error instanceof ApiException ? (error.requestId ?? null) : null;
  });
}
