import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { CatalogApiService } from '../../../../core/api/catalog-api.service';
import { OrderApiService } from '../../../../core/api/order-api.service';
import { CreateOrderRequest } from '../../../../core/models/order.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/** Limites de UX espelhados do backend — a validação final é sempre do backend. */
const MAX_ITEMS = 100;
const MAX_QUANTITY = 999;

interface ItemForm {
  productId: FormControl<string>;
  productName: FormControl<string>;
  unitPrice: FormControl<number>;
  quantity: FormControl<number>;
}

/**
 * Criação de pedido. O frontend NÃO calcula desconto/total (regra configurável
 * do backend — ADR-005): exibe apenas preço unitário do catálogo e subtotal
 * informativo (aritmética de exibição). Os valores autoritativos são exibidos
 * no detalhe do pedido após a resposta 201.
 */
@Component({
  selector: 'app-order-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, AppCurrencyPipe],
  templateUrl: './order-form.page.html',
})
export class OrderFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly orderApi = inject(OrderApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly notification = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly orderForm = this.fb.group({
    client: this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      document: ['', [Validators.required, Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    }),
    items: new FormArray<FormGroup<ItemForm>>([]),
  });

  protected readonly addProductForm = this.fb.group({
    productId: ['', [Validators.required, Validators.maxLength(50)]],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(MAX_QUANTITY)]],
  });

  protected readonly submitting = signal(false);
  protected readonly addingProduct = signal(false);

  /** Versão do array de itens — alimenta o subtotal reativo em add/remove. */
  private readonly itemsLength = signal(0);
  private readonly itemsValueChanges = toSignal(this.orderForm.controls.items.valueChanges, {
    initialValue: null,
  });

  protected readonly subtotal = computed(() => {
    this.itemsLength();
    this.itemsValueChanges();
    return this.orderForm.controls.items
      .getRawValue()
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  });

  protected get itemsControls(): FormGroup<ItemForm>[] {
    return this.orderForm.controls.items.controls;
  }

  protected get clientControls() {
    return this.orderForm.controls.client.controls;
  }

  /** Subtotal da linha — aritmética de exibição; o backend recalcula na criação. */
  protected lineTotal(item: FormGroup<ItemForm>): number {
    const { unitPrice, quantity } = item.getRawValue();
    return unitPrice * quantity;
  }

  protected fieldErrorKey(control: AbstractControl): string | null {
    if (control.valid || !control.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'form.required';
    }
    if (control.hasError('email')) {
      return 'form.email';
    }
    if (control.hasError('maxlength')) {
      return 'form.maxlength';
    }
    if (control.hasError('min') || control.hasError('max')) {
      return 'orders.form.invalidQuantity';
    }
    return null;
  }

  /**
   * Adiciona um item validando o produto no catálogo (uma chamada em lote).
   * Produto inexistente, inativo ou sem preço vigente é recusado com aviso —
   * o backend revalida tudo na criação do pedido.
   */
  protected addProduct(): void {
    this.addProductForm.markAllAsTouched();
    if (this.addProductForm.invalid || this.addingProduct()) {
      return;
    }
    const { quantity } = this.addProductForm.getRawValue();
    const productId = this.addProductForm.getRawValue().productId.trim();
    if (!productId) {
      return;
    }
    if (this.itemsControls.length >= MAX_ITEMS) {
      this.notification.warning('orders.form.maxItems');
      return;
    }
    if (this.hasProduct(productId)) {
      this.notification.warning('orders.form.productDuplicated', { id: productId });
      return;
    }

    this.addingProduct.set(true);
    this.catalogApi.getProductsPrices([productId]).subscribe({
      next: (response) => {
        const price = response.prices.find((candidate) => candidate.productId === productId);
        if (!price) {
          this.notification.warning('orders.form.productNotFound', { id: productId });
        } else if (price.status === 'INATIVO') {
          this.notification.warning('orders.form.productInactive', { id: productId });
        } else if (!price.currentPrice) {
          this.notification.warning('orders.form.productNoPrice', { id: productId });
        } else {
          this.orderForm.controls.items.push(
            this.createItemGroup(productId, price.name, price.currentPrice.value, quantity),
          );
          this.itemsLength.set(this.itemsControls.length);
          this.addProductForm.reset({ productId: '', quantity: 1 });
        }
      },
      error: (error: unknown) => this.notification.apiError(error),
      complete: () => this.addingProduct.set(false),
    });
  }

  protected removeItem(index: number): void {
    this.orderForm.controls.items.removeAt(index);
    this.itemsLength.set(this.itemsControls.length);
  }

  protected submit(): void {
    this.orderForm.markAllAsTouched();
    if (this.orderForm.invalid || this.itemsControls.length === 0) {
      this.notification.warning('orders.form.invalidForm');
      return;
    }
    if (this.submitting()) {
      return; // evita múltiplos submits
    }
    this.submitting.set(true);

    const raw = this.orderForm.getRawValue();
    const request: CreateOrderRequest = {
      client: raw.client,
      items: raw.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    };

    this.orderApi.createOrder(request).subscribe({
      next: (order) => {
        this.notification.success('orders.form.createSuccess');
        this.router.navigate(['/orders', order.id]);
      },
      error: (error: unknown) => {
        this.notification.apiError(error);
        this.submitting.set(false);
      },
    });
  }

  protected async cancel(): Promise<void> {
    const hasUnsavedData = this.orderForm.dirty || this.itemsControls.length > 0;
    if (hasUnsavedData) {
      const confirmed = await this.confirmDialog.open({
        titleKey: 'orders.form.discardTitle',
        messageKey: 'orders.form.discardMessage',
        confirmKey: 'orders.form.discardConfirm',
        danger: true,
      });
      if (!confirmed) {
        return;
      }
    }
    this.router.navigate(['/orders']);
  }

  private hasProduct(productId: string): boolean {
    return this.orderForm.controls.items.getRawValue().some((item) => item.productId === productId);
  }

  private createItemGroup(
    productId: string,
    productName: string,
    unitPrice: number,
    quantity: number,
  ): FormGroup<ItemForm> {
    return this.fb.group<ItemForm>({
      productId: this.fb.control({ value: productId, disabled: true }),
      productName: this.fb.control({ value: productName, disabled: true }),
      unitPrice: this.fb.control({ value: unitPrice, disabled: true }),
      quantity: this.fb.control(quantity, [
        Validators.required,
        Validators.min(1),
        Validators.max(MAX_QUANTITY),
      ]),
    });
  }
}
