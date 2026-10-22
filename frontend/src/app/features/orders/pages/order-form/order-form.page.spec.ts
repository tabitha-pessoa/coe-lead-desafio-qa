import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { Mock } from 'vitest';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { apiErrorInterceptor } from '../../../../core/interceptors/api-error.interceptor';
import { requestIdInterceptor } from '../../../../core/interceptors/request-id.interceptor';
import { CatalogItemPrice } from '../../../../core/models/catalog.models';
import { Order } from '../../../../core/models/order.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import {
  initI18nForTest,
  normalizeText,
  provideTestingI18n,
} from '../../../../../testing/i18n-testing';
import { OrderFormPage } from './order-form.page';

const TEST_API_CONFIG: ApiConfig = {
  orders: '/api/orders',
  catalog: '/api/catalog',
};

describe('OrderFormPage', () => {
  let fixture: ComponentFixture<OrderFormPage>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  let navigateSpy: Mock;
  const confirmOpen = vi.fn<() => Promise<boolean>>();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [OrderFormPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([requestIdInterceptor, apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: TEST_API_CONFIG },
        { provide: ConfirmDialogService, useValue: { open: confirmOpen } },
        ...provideTestingI18n(),
      ],
    });
    await initI18nForTest();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    confirmOpen.mockReset().mockResolvedValue(false);
    fixture = TestBed.createComponent(OrderFormPage);
    el = fixture.nativeElement;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('adiciona item consultando o preço no catálogo (cenário 7)', async () => {
    await addItem('PROD-1', '2', makePrice('PROD-1', 'Produto Um', 50));

    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    const text = normalizeText(el.textContent);
    expect(text).toContain('Produto Um');
    expect(text).toContain('PROD-1');
    expect(text).toContain('R$ 100,00');
  });

  it('recusa produto inexistente no catálogo com aviso localizado (cenário 5)', async () => {
    await setInputValue('#item-product-id', 'PROD-999');
    await submitAddProductForm();
    httpMock.expectOne('/api/catalog/prices').flush({ prices: [], notFound: ['PROD-999'] });
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(0);
    expect(toastMessages()).toContain('Produto não encontrado: PROD-999');
  });

  it('recusa produto inativo com aviso localizado', async () => {
    await setInputValue('#item-product-id', 'PROD-4');
    await submitAddProductForm();
    httpMock
      .expectOne('/api/catalog/prices')
      .flush({ prices: [makePrice('PROD-4', 'Produto Quatro', 10, 'INATIVO')], notFound: [] });
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(0);
    expect(toastMessages()).toContain('Produto inativo no catálogo: PROD-4');
  });

  it('recusa produto sem preço vigente com aviso localizado', async () => {
    await setInputValue('#item-product-id', 'PROD-5');
    await submitAddProductForm();
    httpMock
      .expectOne('/api/catalog/prices')
      .flush({ prices: [makePrice('PROD-5', 'Produto Cinco', null)], notFound: [] });
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(0);
    expect(toastMessages()).toContain('Produto sem preço vigente: PROD-5');
  });

  it('recusa produto duplicado sem consultar a API novamente', async () => {
    await addItem('PROD-1', '2', makePrice('PROD-1', 'Produto Um', 50));

    await setInputValue('#item-product-id', 'PROD-1');
    await submitAddProductForm();

    httpMock.expectNone('/api/catalog/prices');
    expect(toastMessages()).toContain('Produto já adicionado: PROD-1');
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('bloqueia quantidade inválida sem chamar a API (cenário 6)', async () => {
    await setInputValue('#item-product-id', 'PROD-1');
    await setInputValue('#item-quantity', '0');
    await submitAddProductForm();

    httpMock.expectNone('/api/catalog/prices');
    expect(normalizeText(el.textContent)).toContain('Quantidade deve estar entre 1 e 999.');
  });

  it('valida a quantidade editada na linha do item', async () => {
    await addItem('PROD-1', '2', makePrice('PROD-1', 'Produto Um', 50));

    const rowInput = el.querySelector<HTMLInputElement>('tbody input[type="number"]');
    if (!rowInput) {
      throw new Error('input de quantidade da linha não encontrado');
    }
    rowInput.value = '0';
    rowInput.dispatchEvent(new Event('input'));
    rowInput.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(normalizeText(el.textContent)).toContain('Quantidade deve estar entre 1 e 999.');
  });

  it('remove item do pedido (cenário 8)', async () => {
    await addItem('PROD-1', '2', makePrice('PROD-1', 'Produto Um', 50));

    el.querySelector<HTMLButtonElement>('tbody .btn-outline-danger')?.click();
    await fixture.whenStable();

    expect(el.querySelectorAll('tbody tr').length).toBe(0);
    const text = normalizeText(el.textContent);
    expect(text).toContain('Nenhum item adicionado');
    expect(text).toContain('R$ 0,00');
  });

  it('cria pedido com sucesso e navega para o detalhe (cenário 3)', async () => {
    await fillValidOrder();

    clickCreateOrder();
    const req = httpMock.expectOne('/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      client: { name: 'Ana Souza', document: '123.456.789-00', email: 'ana@exemplo.com' },
      items: [{ productId: 'PROD-1', quantity: 2 }],
    });
    req.flush(makeOrder());
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/orders', 'ORD-1']);
    expect(toastMessages()).toContain('Pedido criado com sucesso');
  });

  it('exibe erro localizado quando a criação falha (cenário 4)', async () => {
    await fillValidOrder();

    clickCreateOrder();
    httpMock.expectOne('/api/orders').flush(
      {
        error: { code: 'VALIDATION_ERROR', message: 'invalid', details: ['items[0].quantity'] },
        requestId: 'req-4',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    const toast = TestBed.inject(NotificationService).toasts()[0];
    expect(toast?.type).toBe('error');
    expect(toast?.message).toBe('Dados inválidos. Verifique as informações informadas.');
    expect(toast?.requestId).toBe('req-4');
    expect(el.querySelector<HTMLButtonElement>('button.btn-primary')?.disabled).toBe(false);
  });

  it('não envia pedido com formulário inválido e avisa o usuário', async () => {
    clickCreateOrder();
    await fixture.whenStable();

    httpMock.expectNone('/api/orders');
    expect(toastMessages()).toContain('Verifique os campos destacados antes de continuar.');
    expect(normalizeText(el.textContent)).toContain('Campo obrigatório.');
  });

  it('pede confirmação para descartar dados não salvos ao cancelar', async () => {
    await setInputValue('#client-name', 'Ana Souza');

    el.querySelector<HTMLButtonElement>('button.btn-outline-secondary')?.click();
    await fixture.whenStable();

    expect(confirmOpen).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('cancela e volta para a lista quando o descarte é confirmado', async () => {
    confirmOpen.mockResolvedValue(true);
    await setInputValue('#client-name', 'Ana Souza');

    el.querySelector<HTMLButtonElement>('button.btn-outline-secondary')?.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/orders']);
  });

  async function setInputValue(selector: string, value: string): Promise<void> {
    const input = el.querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`Campo não encontrado: ${selector}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submitAddProductForm(): Promise<void> {
    el.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  async function addItem(
    productId: string,
    quantity: string,
    item: CatalogItemPrice,
  ): Promise<void> {
    await setInputValue('#item-product-id', productId);
    await setInputValue('#item-quantity', quantity);
    await submitAddProductForm();
    httpMock.expectOne('/api/catalog/prices').flush({ prices: [item], notFound: [] });
    await fixture.whenStable();
  }

  async function fillValidOrder(): Promise<void> {
    await setInputValue('#client-name', 'Ana Souza');
    await setInputValue('#client-document', '123.456.789-00');
    await setInputValue('#client-email', 'ana@exemplo.com');
    await addItem('PROD-1', '2', makePrice('PROD-1', 'Produto Um', 50));
  }

  function clickCreateOrder(): void {
    el.querySelector<HTMLButtonElement>('button.btn-primary')?.click();
  }

  function toastMessages(): string[] {
    return TestBed.inject(NotificationService)
      .toasts()
      .map((toast) => toast.message);
  }
});

function makePrice(
  productId: string,
  name: string,
  value: number | null,
  status: 'ATIVO' | 'INATIVO' = 'ATIVO',
): CatalogItemPrice {
  return {
    productId,
    name,
    status,
    currentPrice:
      value === null
        ? null
        : { value, currency: 'BRL', validFrom: '2026-01-01T00:00:00Z', validTo: null },
  };
}

function makeOrder(): Order {
  return {
    id: 'ORD-1',
    client: { name: 'Ana Souza', document: '123.456.789-00', email: 'ana@exemplo.com' },
    items: [
      {
        productId: 'PROD-1',
        productName: 'Produto Um',
        unitPrice: 50,
        quantity: 2,
        lineTotal: 100,
      },
    ],
    subtotal: 100,
    discount: 0,
    total: 100,
    status: 'CRIADO',
    createdAt: '2026-09-25T12:00:00Z',
  };
}
