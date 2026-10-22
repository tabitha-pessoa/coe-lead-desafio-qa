import { TestBed } from '@angular/core/testing';

import { ApiException } from '../models/error.models';
import { ApiErrorMessagesService } from './api-error-messages.service';
import { initI18nForTest, provideTestingI18n } from '../../../testing/i18n-testing';

describe('ApiErrorMessagesService', () => {
  let service: ApiErrorMessagesService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [...provideTestingI18n()] });
    await initI18nForTest();
    service = TestBed.inject(ApiErrorMessagesService);
  });

  it('traduz código estável conhecido', () => {
    const error = new ApiException(404, 'ORDER_NOT_FOUND', 'mensagem do backend', []);
    expect(service.message(error)).toBe('Pedido não encontrado.');
  });

  it('usa fallback por status HTTP para código desconhecido', () => {
    const error = new ApiException(503, 'CODIGO_NOVO_DO_BACKEND', '', []);
    expect(service.message(error)).toBe('Serviço indisponível. Tente novamente em instantes.');
  });

  it('usa mensagem genérica para código e status desconhecidos', () => {
    const error = new ApiException(418, 'CODIGO_NOVO_DO_BACKEND', '', []);
    expect(service.message(error)).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});
