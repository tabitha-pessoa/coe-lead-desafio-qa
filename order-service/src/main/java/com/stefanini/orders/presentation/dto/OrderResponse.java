package com.stefanini.orders.presentation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        ClientResponse client,
        List<OrderItemResponse> items,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal total,
        String status,
        Instant createdAt) {

    public static OrderResponse from(com.stefanini.orders.domain.model.Order order) {
        return new OrderResponse(
                order.id(),
                ClientResponse.from(order.client()),
                order.items().stream().map(OrderItemResponse::from).toList(),
                order.subtotal(),
                order.discount(),
                order.total(),
                order.status().name(),
                order.createdAt());
    }
}
