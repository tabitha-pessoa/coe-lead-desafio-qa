package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidOrderRequestException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Order(UUID id, Client client, List<OrderItem> items, BigDecimal subtotal, BigDecimal discount,
        BigDecimal total, OrderStatus status, Instant createdAt) {

    public Order {
        if (id == null) {
            throw new InvalidOrderRequestException("Invalid order", List.of("id: must not be null"));
        }
        if (client == null) {
            throw new InvalidOrderRequestException("Invalid order", List.of("client: must not be null"));
        }
        if (items == null || items.isEmpty()) {
            throw new InvalidOrderRequestException("Invalid order", List.of("items: must contain at least one item"));
        }
        items = List.copyOf(items);
        if (subtotal == null || discount == null || total == null) {
            throw new InvalidOrderRequestException("Invalid order",
                    List.of("subtotal, discount and total: must not be null"));
        }
        if (status == null) {
            throw new InvalidOrderRequestException("Invalid order", List.of("status: must not be null"));
        }
        if (createdAt == null) {
            throw new InvalidOrderRequestException("Invalid order", List.of("createdAt: must not be null"));
        }
    }
}
