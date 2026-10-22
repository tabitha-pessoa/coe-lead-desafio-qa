import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ApiException } from '../models/error.models';
import { ApiErrorMessagesService } from './api-error-messages.service';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  requestId?: string;
}

const MAX_TOASTS = 3;
const ERROR_DELAY_MS = 8000;

/**
 * Mecanismo reutilizável de notificações (toasts). As mensagens são chaves de
 * tradução resolvidas aqui — os componentes nunca montam texto de UI.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  private readonly toastsSignal = signal<AppNotification[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private readonly translate = inject(TranslateService);
  private readonly errorMessages = inject(ApiErrorMessagesService);

  success(key: string, params?: Record<string, unknown>): void {
    this.push('success', key, params);
  }

  info(key: string, params?: Record<string, unknown>): void {
    this.push('info', key, params);
  }

  warning(key: string, params?: Record<string, unknown>): void {
    this.push('warning', key, params);
  }

  /** Notifica um erro de API (ApiException) com mensagem localizada + requestId. */
  apiError(error: unknown): void {
    if (!(error instanceof ApiException)) {
      this.push('error', 'errors.generic');
      return;
    }
    const message = this.errorMessages.message(error);
    const notification: AppNotification = {
      id: this.nextId++,
      type: 'error',
      message,
      requestId: error.requestId,
    };
    this.addToasts(notification);
    // Erros também ficam no console para troubleshooting (sem stack de backend).
    console.warn(`[api-error] ${error.code} (${error.status})`, error.requestId ?? '');
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(type: NotificationType, key: string, params?: Record<string, unknown>): void {
    const message = this.translate.instant(key, params);
    this.addToasts({ id: this.nextId++, type, message });
  }

  private addToasts(notification: AppNotification): void {
    this.toastsSignal.update((toasts) => [...toasts, notification].slice(-MAX_TOASTS));
    if (notification.type !== 'error') {
      setTimeout(() => this.dismiss(notification.id), ERROR_DELAY_MS);
    }
  }
}
