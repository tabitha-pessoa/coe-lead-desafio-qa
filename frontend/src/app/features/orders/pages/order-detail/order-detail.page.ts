import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OrderApiService } from '../../../../core/api/order-api.service';
import { ApiException } from '../../../../core/models/error.models';
import { Order } from '../../../../core/models/order.models';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../shared/pipes/app-date.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/** Detalhe do pedido: cliente, resumo (valores autoritativos do backend) e itens. */
@Component({
  selector: 'app-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslatePipe,
    AppCurrencyPipe,
    AppDatePipe,
    LoadingComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './order-detail.page.html',
})
export class OrderDetailPage {
  /** Route param via withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly orderApi = inject(OrderApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal<unknown>(null);
  protected readonly order = signal<Order | null>(null);

  constructor() {
    effect(() => {
      this.id();
      this.load();
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderApi.getOrderById(this.id()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (apiError: unknown) => {
        this.error.set(
          apiError instanceof ApiException
            ? apiError
            : new ApiException(500, 'UNKNOWN_ERROR', '', []),
        );
        this.loading.set(false);
      },
    });
  }
}
