import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StatusLabelPipe } from '../../pipes/status-label.pipe';

/** Cores por status conhecido; status desconhecido → neutro (fallback seguro). */
const STATUS_COLORS: Record<string, string> = {
  CRIADO: 'text-bg-info',
  ATIVO: 'text-bg-success',
  INATIVO: 'text-bg-secondary',
};

/** Badge de status com tradução centralizada — o valor do backend não é alterado. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusLabelPipe],
  template: `
    <span class="badge rounded-pill" [class]="badgeClass()">{{ status() | statusLabel }}</span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly badgeClass = computed(() => STATUS_COLORS[this.status()] ?? 'text-bg-secondary');
}
