import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

import {
  AppNotification,
  NotificationService,
  NotificationType,
} from '../../../core/services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

const TOAST_CLASSES: Record<NotificationType, string> = {
  success: 'text-bg-success',
  error: 'text-bg-danger',
  warning: 'text-bg-warning',
  info: 'text-bg-info',
};

/** Contêiner global de toasts (ng-bootstrap), renderizado no shell. */
@Component({
  selector: 'app-toasts-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgbToast, TranslatePipe],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1200">
      @for (toast of notificationService.toasts(); track toast.id) {
        <ngb-toast
          [class]="toastClass(toast.type)"
          [autohide]="toast.type !== 'error'"
          [delay]="6000"
          (hide)="notificationService.dismiss(toast.id)"
          role="alert"
          aria-atomic="true"
        >
          <div class="d-flex w-100 align-items-start justify-content-between gap-3">
            <span>{{ toast.message }}</span>
            <button
              type="button"
              class="btn-close btn-close-white btn-sm flex-shrink-0"
              [attr.aria-label]="'common.close' | t"
              (click)="notificationService.dismiss(toast.id); $event.stopPropagation()"
            ></button>
          </div>
          @if (toast.requestId) {
            <div class="small opacity-75 mt-1">
              {{ 'errors.requestId' | t: { id: toast.requestId } }}
            </div>
          }
        </ngb-toast>
      }
    </div>
  `,
})
export class ToastsContainerComponent {
  protected readonly notificationService = inject(NotificationService);

  toastClass(type: NotificationType): string {
    return TOAST_CLASSES[type];
  }

  dismiss(toast: AppNotification): void {
    this.notificationService.dismiss(toast.id);
  }
}
