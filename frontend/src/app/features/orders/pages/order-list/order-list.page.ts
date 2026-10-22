import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { OrderApiService } from '../../../../core/api/order-api.service';
import { ApiException } from '../../../../core/models/error.models';
import { OrderPageResponse } from '../../../../core/models/order.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { AppDatePipe } from '../../../../shared/pipes/app-date.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

const PAGE_SIZE = 20;

/** Listagem paginada de pedidos com estados de loading, erro, vazio e sucesso. */
@Component({
  selector: 'app-order-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgbPagination,
    NgbTooltip,
    TranslatePipe,
    AppCurrencyPipe,
    AppDatePipe,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './order-list.page.html',
})
export class OrderListPage {
  private readonly orderApi = inject(OrderApiService);
  private readonly router = inject(Router);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly loading = signal(true);
  protected readonly error = signal<unknown>(null);
  protected readonly result = signal<OrderPageResponse | null>(null);
  /** NgbPagination é 1-based; a API é 0-based. */
  protected readonly currentPage = signal(1);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderApi.getOrders({ page: this.currentPage() - 1, size: this.pageSize }).subscribe({
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

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  protected navigateToNew(): void {
    this.router.navigate(['/orders/new']);
  }

  /** Exibe UUID truncado com tooltip do valor completo. */
  protected shortId(id: string): string {
    return id.length > 13 ? `${id.slice(0, 13)}…` : id;
  }
}
