import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/confirm-dialog/confirm-dialog.component';

/** Diálogo de confirmação reutilizável sobre o NgbModal. */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly modalService = inject(NgbModal);

  /** Resolve `true` quando confirmado, `false` quando cancelado/fechado. */
  open(data: ConfirmDialogData): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmDialogComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.data.set(data);
    return modalRef.result.then(
      () => true,
      () => false,
    );
  }
}
