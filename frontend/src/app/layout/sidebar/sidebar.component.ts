import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/** Navegação lateral: fixa no desktop, overlay controlado por signal no mobile. */
@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  host: { '[class.app-sidebar--open]': 'open()' },
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  /** Aberto no mobile — controlado pelo shell (hamburger do header). */
  readonly open = input(false);
  /** Emitido ao navegar por um link — fecha o menu no mobile. */
  readonly navigated = output<void>();
}
