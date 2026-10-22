import { TestBed } from '@angular/core/testing';

import { LocaleService } from '../../core/services/locale.service';
import { initI18nForTest, provideTestingI18n } from '../../../testing/i18n-testing';
import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  let pipe: StatusLabelPipe;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [StatusLabelPipe, ...provideTestingI18n()] });
    await initI18nForTest();
    pipe = TestBed.inject(StatusLabelPipe);
  });

  it('traduz status conhecido no idioma ativo', () => {
    expect(pipe.transform('CRIADO')).toBe('Criado');
    expect(pipe.transform('ATIVO')).toBe('Ativo');
    expect(pipe.transform('INATIVO')).toBe('Inativo');
  });

  it('retorna o código bruto para status desconhecido (fallback seguro)', () => {
    expect(pipe.transform('CANCELADO')).toBe('CANCELADO');
  });

  it('retorna vazio para status nulo ou indefinido', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('reage à troca de idioma (pipe impuro alimentado por signal)', () => {
    TestBed.inject(LocaleService).setLanguage('en');
    expect(pipe.transform('CRIADO')).toBe('Created');
  });
});
