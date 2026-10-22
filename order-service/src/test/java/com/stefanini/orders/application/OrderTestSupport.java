package com.stefanini.orders.application;

import com.stefanini.orders.domain.model.Client;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.model.OrderItem;
import com.stefanini.orders.domain.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OrderTestSupport {

    private OrderTestSupport() {
    }

    public static Order sampleOrder() {
        return new Order(
                UUID.randomUUID(),
                new Client("Maria Silva", "12345678901", "maria@example.com"),
                List.of(
                        new OrderItem("PROD-001", "Notebook Dell Inspiron 15",
                                new BigDecimal("3500.00"), 2, new BigDecimal("7000.00")),
                        new OrderItem("PROD-002", "Mouse Logitech MX Master 3S",
                                new BigDecimal("499.90"), 1, new BigDecimal("499.90"))),
                new BigDecimal("7499.90"),
                new BigDecimal("749.99"),
                new BigDecimal("6749.91"),
                OrderStatus.CRIADO,
                Instant.now());
    }
}
