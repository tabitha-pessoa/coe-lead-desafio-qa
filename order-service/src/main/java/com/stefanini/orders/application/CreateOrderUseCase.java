package com.stefanini.orders.application;

import com.stefanini.orders.application.dto.CreateOrderCommand;
import com.stefanini.orders.application.dto.CreateOrderCommand.ItemData;
import com.stefanini.orders.domain.exception.CatalogUnavailableException;
import com.stefanini.orders.domain.exception.InvalidOrderRequestException;
import com.stefanini.orders.domain.exception.NoCurrentPriceException;
import com.stefanini.orders.domain.exception.ProductInactiveException;
import com.stefanini.orders.domain.exception.ProductNotFoundException;
import com.stefanini.orders.domain.model.Client;
import com.stefanini.orders.domain.model.DiscountRule;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.model.OrderCalculator;
import com.stefanini.orders.domain.model.OrderItem;
import com.stefanini.orders.domain.model.OrderStatus;
import com.stefanini.orders.domain.port.CatalogGateway;
import com.stefanini.orders.domain.port.CatalogPrice;
import com.stefanini.orders.domain.port.CatalogPrices;
import com.stefanini.orders.domain.port.CatalogProductStatus;
import com.stefanini.orders.domain.port.DiscountRuleRepository;
import com.stefanini.orders.domain.port.OrderRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class CreateOrderUseCase {

    private final CatalogGateway catalogGateway;
    private final DiscountRuleRepository discountRuleRepository;
    private final OrderRepository orderRepository;

    public CreateOrderUseCase(CatalogGateway catalogGateway, DiscountRuleRepository discountRuleRepository,
            OrderRepository orderRepository) {
        this.catalogGateway = catalogGateway;
        this.discountRuleRepository = discountRuleRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Order execute(CreateOrderCommand command) {
        validate(command);
        List<String> productIds = command.items().stream().map(ItemData::productId).distinct().toList();
        CatalogPrices catalogPrices = catalogGateway.fetchPrices(productIds);
        validateProducts(catalogPrices);
        Map<String, CatalogPrice> pricesByProduct = catalogPrices.found().stream()
                .collect(Collectors.toMap(CatalogPrice::productId, Function.identity()));
        List<OrderItem> items = command.items().stream()
                .map(item -> toOrderItem(item, pricesByProduct.get(item.productId())))
                .toList();
        BigDecimal subtotal = OrderCalculator.subtotal(items);
        DiscountRule discountRule = discountRuleRepository.findActive().orElse(null);
        BigDecimal discount = OrderCalculator.discount(subtotal, discountRule);
        BigDecimal total = OrderCalculator.total(subtotal, discount);
        Order order = new Order(
                UUID.randomUUID(),
                new Client(command.client().name(), command.client().document(), command.client().email()),
                items,
                subtotal,
                discount,
                total,
                OrderStatus.CRIADO,
                Instant.now());
        return orderRepository.save(order);
    }

    private void validate(CreateOrderCommand command) {
        List<String> problems = new ArrayList<>();
        if (command.items() == null || command.items().isEmpty()) {
            problems.add("items: must contain at least one item");
        } else {
            Set<String> seenProductIds = new HashSet<>();
            for (ItemData item : command.items()) {
                if (item.quantity() < 1 || item.quantity() > 999) {
                    problems.add("quantity: must be between 1 and 999 for product " + item.productId());
                }
                if (!seenProductIds.add(item.productId())) {
                    problems.add("productId: duplicate product " + item.productId());
                }
            }
        }
        if (!problems.isEmpty()) {
            throw new InvalidOrderRequestException("Invalid order request", problems);
        }
    }

    private void validateProducts(CatalogPrices catalogPrices) {
        if (!catalogPrices.notFound().isEmpty()) {
            throw new ProductNotFoundException(catalogPrices.notFound());
        }
        List<String> inactiveProducts = catalogPrices.found().stream()
                .filter(price -> price.status() != CatalogProductStatus.ATIVO)
                .map(CatalogPrice::productId)
                .toList();
        if (!inactiveProducts.isEmpty()) {
            throw new ProductInactiveException(inactiveProducts);
        }
        List<String> productsWithoutPrice = catalogPrices.found().stream()
                .filter(price -> price.currentPrice() == null)
                .map(CatalogPrice::productId)
                .toList();
        if (!productsWithoutPrice.isEmpty()) {
            throw new NoCurrentPriceException(productsWithoutPrice);
        }
    }

    private OrderItem toOrderItem(ItemData item, CatalogPrice catalogPrice) {
        if (catalogPrice == null) {
            throw new CatalogUnavailableException("Catalog response is missing product " + item.productId(), null);
        }
        BigDecimal lineTotal = OrderCalculator.lineTotal(catalogPrice.currentPrice(), item.quantity());
        return new OrderItem(
                catalogPrice.productId(),
                catalogPrice.name(),
                catalogPrice.currentPrice(),
                item.quantity(),
                lineTotal);
    }
}
