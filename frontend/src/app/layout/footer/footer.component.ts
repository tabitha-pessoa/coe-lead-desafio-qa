import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <footer class="app-footer small py-2 px-3">
      <span>{{ 'footer.text' | t }}</span>
    </footer>
  `,
  styles: `
    .app-footer {
      background: var(--brand-900);
      color: rgba(255, 255, 255, 0.75);
    }
  `,
})
export class FooterComponent {}
