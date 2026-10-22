import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TranslatePipe } from '../../pipes/translate.pipe';

/** Estado vazio reutilizável com mensagem traduzida e ação opcional. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="text-center text-body-secondary p-5">
      <p class="mb-1">{{ messageKey() | t }}</p>
      @if (hintKey()) {
        <p class="small mb-3">{{ hintKey() | t }}</p>
      }
      @if (actionLabelKey()) {
        <button type="button" class="btn btn-primary" (click)="action.emit()">
          {{ actionLabelKey() | t }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly messageKey = input.required<string>();
  readonly hintKey = input<string | null>(null);
  readonly actionLabelKey = input<string | null>(null);
  readonly action = output<void>();
}
