import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { initI18nForTest, provideTestingI18n } from '../testing/i18n-testing';

describe('App', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), ...provideTestingI18n()],
    });
    await initI18nForTest();
  });

  it('cria a raiz renderizando o shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-shell')).not.toBeNull();
  });
});
