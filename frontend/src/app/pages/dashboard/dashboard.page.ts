import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OrderApiService } from '../../core/api/order-api.service';
import { ApiException } from '../../core/models/error.models';
import { OrderPageResponse } from '../../core/models/order.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/** Página carregada por chamada — limite máximo do backend (ADR-011). */
const DASHBOARD_PAGE_SIZE = 100;

interface StatusCount {
  status: string;
  count: number;
}

/**
 * Dashboard com métricas derivadas EXCLUSIVAMENTE dos dados carregados.
 * Indicadores adicionais são documentados como gap de integração — nenhuma
 * métrica é inventada.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslatePipe,
    AppCurrencyPipe,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private readonly orderApi = inject(OrderApiService);

  protected readonly loading = signal(true);
  protected readonly error = signal<unknown>(null);
  protected readonly result = signal<OrderPageResponse | null>(null);

  protected readonly ordersTotal = computed(() => this.result()?.totalElements ?? 0);
  protected readonly ordersLoaded = computed(() => this.result()?.content.length ?? 0);
  protected readonly valueLoaded = computed(() =>
    (this.result()?.content ?? []).reduce((sum, order) => sum + order.total, 0),
  );
  protected readonly statusCounts = computed<StatusCount[]>(() => {
    const byStatus = new Map<string, number>();
    for (const order of this.result()?.content ?? []) {
      byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    }
    return [...byStatus.entries()].map(([status, count]) => ({ status, count }));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderApi.getOrders({ page: 0, size: DASHBOARD_PAGE_SIZE }).subscribe({
      next: (response) => {
        this.result.set(response);
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
