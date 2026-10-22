import { TestBed } from '@angular/core/testing';

import { ApiException } from '../models/error.models';
import { NotificationService } from './notification.service';
import { initI18nForTest, provideTestingI18n } from '../../../testing/i18n-testing';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [...provideTestingI18n()] });
    await initI18nForTest();
    service = TestBed.inject(NotificationService);
    // O service loga erros no console por design — teste não deve poluir output.
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('resolve mensagem traduzida no toast de sucesso', () => {
    service.success('orders.form.createSuccess');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0]?.type).toBe('success');
    expect(toasts[0]?.message).toBe('Pedido criado com sucesso');
  });

  it('interpolá parâmetros na mensagem do toast', () => {
    service.warning('orders.form.productNotFound', { id: 'PROD-999' });
    expect(service.toasts()[0]?.message).toBe('Produto não encontrado: PROD-999');
  });

  it('notifica ApiException com mensagem localizada e requestId', () => {
    service.apiError(new ApiException(422, 'PRODUCT_INACTIVE', 'msg', [], 'req-9'));

    const toast = service.toasts()[0];
    expect(toast?.type).toBe('error');
    expect(toast?.message).toBe('Produto inativo no catálogo.');
    expect(toast?.requestId).toBe('req-9');
  });

  it('notifica erro desconhecido com mensagem genérica', () => {
    service.apiError(new Error('boom'));
    const toast = service.toasts()[0];
    expect(toast?.type).toBe('error');
    expect(toast?.message).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });

  it('mantém no máximo 3 toasts (mais recentes)', () => {
    for (let i = 0; i < 5; i++) {
      service.info('common.loading');
    }
    const toasts = service.toasts();
    expect(toasts.length).toBe(3);
  });

  it('descarta toast por id', () => {
    service.success('orders.form.createSuccess');
    const toast = service.toasts()[0];
    if (!toast) {
      throw new Error('toast esperado');
    }
    service.dismiss(toast.id);
    expect(service.toasts().length).toBe(0);
  });
});
