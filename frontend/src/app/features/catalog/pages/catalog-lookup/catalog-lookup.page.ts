import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { map } from 'rxjs';

import { CatalogApiService } from '../../../../core/api/catalog-api.service';
import { PriceWindow } from '../../../../core/models/catalog.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/** Limite do endpoint de lote (POST /api/v1/products/prices). */
const MAX_BATCH_IDS = 50;

export interface CatalogLookupRow {
  id: string;
  name: string;
  status: string;
  currentPrice: PriceWindow | null;
}

/**
 * Consulta de produtos adaptada à API existente: um ID → GET /products/{id};
 * vários IDs → POST /products/prices (lote). Não existe listagem completa no
 * backend — o gap é documentado na própria página.
 */
@Component({
  selector: 'app-catalog-lookup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslatePipe,
    AppCurrencyPipe,
    LoadingComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './catalog-lookup.page.html',
})
export class CatalogLookupPage {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly searchForm = this.fb.group({
    ids: ['', [Validators.required]],
  });

  protected readonly searching = signal(false);
  protected readonly error = signal<unknown>(null);
  protected readonly results = signal<CatalogLookupRow[] | null>(null);
  protected readonly notFoundIds = signal<string[]>([]);

  /** Sinaliza quando o formulário foi submetido ao menos uma vez (mensagens de validação). */
  protected readonly submitted = toSignal(this.searchForm.events.pipe(map(() => true)), {
    initialValue: false,
  });

  protected search(): void {
    this.searchForm.markAllAsTouched();
    if (this.searchForm.invalid || this.searching()) {
      return;
    }
    const ids = this.parseIds(this.searchForm.getRawValue().ids);
    if (ids.length === 0) {
      return;
    }
    if (ids.length > MAX_BATCH_IDS) {
      this.notification.warning('catalog.maxIds');
      return;
    }
    this.searching.set(true);
    this.error.set(null);
    this.notFoundIds.set([]);
    this.results.set(null);

    const request$ =
      ids.length === 1
        ? this.catalogApi.getProductById(ids[0] ?? '').pipe(
            map((product): { rows: CatalogLookupRow[]; notFound: string[] } => ({
              rows: [
                {
                  id: product.id,
                  name: product.name,
                  status: product.status,
                  currentPrice: product.currentPrice,
                },
              ],
              notFound: [],
            })),
          )
        : this.catalogApi.getProductsPrices(ids).pipe(
            map((response): { rows: CatalogLookupRow[]; notFound: string[] } => ({
              rows: response.prices.map((price) => ({
                id: price.productId,
                name: price.name,
                status: price.status,
                currentPrice: price.currentPrice,
              })),
              notFound: response.notFound,
            })),
          );

    request$.subscribe({
      next: ({ rows, notFound }) => {
        this.results.set(rows);
        this.notFoundIds.set(notFound);
        this.searching.set(false);
      },
      error: (apiError: unknown) => {
        this.error.set(apiError);
        this.searching.set(false);
      },
    });
  }

  /** Separa por vírgula/espaço, remove vazios e duplicatas (UX — o backend revalida). */
  private parseIds(raw: string): string[] {
    const ids = raw
      .split(/[,;\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    return [...new Set(ids)];
  }
}
