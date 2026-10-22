import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { TranslatePipe } from '../../pipes/translate.pipe';

export interface ConfirmDialogData {
  titleKey: string;
  messageKey: string;
  confirmKey?: string;
  cancelKey?: string;
  danger?: boolean;
}

/** Conteúdo do modal de confirmação (aberto via ConfirmDialogService). */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ data().titleKey | t }}</h5>
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="modal"
        [attr.aria-label]="'common.close' | t"
        (click)="dismiss()"
      ></button>
    </div>
    <div class="modal-body">
      <p class="mb-0">{{ data().messageKey | t }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" (click)="dismiss()">
        {{ data().cancelKey ?? 'common.cancel' | t }}
      </button>
      <button
        type="button"
        class="btn"
        [class.btn-danger]="data().danger"
        [class.btn-primary]="!data().danger"
        (click)="confirm()"
      >
        {{ data().confirmKey ?? 'common.confirm' | t }}
      </button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly data = input.required<ConfirmDialogData>();
  private readonly activeModal = inject(NgbActiveModal);

  dismiss(): void {
    this.activeModal.dismiss();
  }

  confirm(): void {
    this.activeModal.close();
  }
}
