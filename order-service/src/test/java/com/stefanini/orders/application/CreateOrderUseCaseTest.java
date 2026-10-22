package com.stefanini.orders.application;

import com.stefanini.orders.application.dto.CreateOrderCommand;
import com.stefanini.orders.application.dto.CreateOrderCommand.ClientData;
import com.stefanini.orders.application.dto.CreateOrderCommand.ItemData;
import com.stefanini.orders.domain.exception.CatalogUnavailableException;
import com.stefanini.orders.domain.exception.InvalidOrderRequestException;
import com.stefanini.orders.domain.exception.NoCurrentPriceException;
import com.stefanini.orders.domain.exception.ProductInactiveException;
import com.stefanini.orders.domain.exception.ProductNotFoundException;
import com.stefanini.orders.domain.model.DiscountRule;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.model.OrderStatus;
import com.stefanini.orders.domain.port.CatalogGateway;
import com.stefanini.orders.domain.port.CatalogPrice;
import com.stefanini.orders.domain.port.CatalogPrices;
import com.stefanini.orders.domain.port.CatalogProductStatus;
import com.stefanini.orders.domain.port.DiscountRuleRepository;
import com.stefanini.orders.domain.port.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateOrderUseCaseTest {

    @Mock
    private CatalogGateway catalogGateway;

    @Mock
    private DiscountRuleRepository discountRuleRepository;

    @Mock
    private OrderRepository orderRepository;

    private CreateOrderUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new CreateOrderUseCase(catalogGateway, discountRuleRepository, orderRepository);
    }

    @Test
    void createsOrderWithComputedTotalsAndPriceSnapshot() {
        when(catalogGateway.fetchPrices(anyCollection())).thenReturn(catalogPrices(
                price("PROD-001", "Notebook Dell Inspiron 15", "3500.00"),
                price("PROD-002", "Mouse Logitech MX Master 3S", "499.90")));
        when(discountRuleRepository.findActive())
                .thenReturn(Optional.of(new DiscountRule(new BigDecimal("1000.00"), new BigDecimal("10.00"))));
        when(orderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Order order = useCase.execute(command(item("PROD-001", 2), item("PROD-002", 1)));

        assertEquals(0, order.subtotal().compareTo(new BigDecimal("7499.90")));
        assertEquals(0, order.discount().compareTo(new BigDecimal("749.99")));
        assertEquals(0, order.total().compareTo(new BigDecimal("6749.91")));
        assertEquals(OrderStatus.CRIADO, order.status());
        assertEquals(2, order.items().size());
        assertEquals("Notebook Dell Inspiron 15", order.items().get(0).productName());
        assertEquals(0, order.items().get(0).unitPrice().compareTo(new BigDecimal("3500.00")));
        verify(orderRepository).save(order);
    }

    @Test
    void queriesCatalogWithDistinctProductIds() {
        when(catalogGateway.fetchPrices(anyCollection())).thenReturn(catalogPrices(
                price("PROD-001", "Notebook", "3500.00"),
                price("PROD-002", "Mouse", "499.90")));
        when(discountRuleRepository.findActive()).thenReturn(Optional.empty());

        useCase.execute(command(item("PROD-001", 1), item("PROD-002", 1)));

        ArgumentCaptor<Collection<String>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(catalogGateway).fetchPrices(captor.capture());
        assertEquals(List.of("PROD-001", "PROD-002"), List.copyOf(captor.getValue()));
    }

    @Test
    void rejectsWhenProductIsNotFound() {
        when(catalogGateway.fetchPrices(anyCollection()))
                .thenReturn(new CatalogPrices(List.of(price("PROD-001", "Notebook", "3500.00")), List.of("PROD-999")));

        assertThrows(ProductNotFoundException.class,
                () -> useCase.execute(command(item("PROD-001", 1), item("PROD-999", 1))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void rejectsInactiveProduct() {
        when(catalogGateway.fetchPrices(anyCollection())).thenReturn(catalogPrices(
                inactivePrice("PROD-004", "Monitor LG UltraGear 24", "1200.00")));

        assertThrows(ProductInactiveException.class, () -> useCase.execute(command(item("PROD-004", 1))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void rejectsProductWithoutCurrentPrice() {
        when(catalogGateway.fetchPrices(anyCollection()))
                .thenReturn(catalogPrices(new CatalogPrice("PROD-005", "Webcam", CatalogProductStatus.ATIVO, null)));

        assertThrows(NoCurrentPriceException.class, () -> useCase.execute(command(item("PROD-005", 1))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void rejectsDuplicateProducts() {
        assertThrows(InvalidOrderRequestException.class,
                () -> useCase.execute(command(item("PROD-001", 1), item("PROD-001", 2))));
        verify(catalogGateway, never()).fetchPrices(anyCollection());
    }

    @Test
    void rejectsEmptyItems() {
        assertThrows(InvalidOrderRequestException.class, () -> useCase.execute(command()));
    }

    @Test
    void rejectsQuantityOutOfRange() {
        assertThrows(InvalidOrderRequestException.class, () -> useCase.execute(command(item("PROD-001", 0))));
        assertThrows(InvalidOrderRequestException.class, () -> useCase.execute(command(item("PROD-001", 1000))));
    }

    @Test
    void propagatesCatalogUnavailableWithoutSaving() {
        doThrow(new CatalogUnavailableException("Catalog service is unreachable", null))
                .when(catalogGateway).fetchPrices(anyCollection());

        assertThrows(CatalogUnavailableException.class, () -> useCase.execute(command(item("PROD-001", 1))));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void appliesZeroDiscountWhenNoActiveRuleExists() {
        when(catalogGateway.fetchPrices(anyCollection()))
                .thenReturn(catalogPrices(price("PROD-001", "Notebook", "3500.00")));
        when(discountRuleRepository.findActive()).thenReturn(Optional.empty());
        when(orderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Order order = useCase.execute(command(item("PROD-001", 1)));

        assertEquals(0, order.discount().compareTo(BigDecimal.ZERO));
        assertEquals(0, order.total().compareTo(new BigDecimal("3500.00")));
    }

    private CreateOrderCommand command(ItemData... items) {
        return new CreateOrderCommand(
                new ClientData("Maria Silva", "12345678901", "maria@example.com"),
                List.of(items));
    }

    private ItemData item(String productId, int quantity) {
        return new ItemData(productId, quantity);
    }

    private CatalogPrices catalogPrices(CatalogPrice... prices) {
        return new CatalogPrices(List.of(prices), List.of());
    }

    private CatalogPrice price(String productId, String name, String value) {
        return new CatalogPrice(productId, name, CatalogProductStatus.ATIVO, new BigDecimal(value));
    }

    private CatalogPrice inactivePrice(String productId, String name, String value) {
        return new CatalogPrice(productId, name, CatalogProductStatus.INATIVO, new BigDecimal(value));
    }
}
