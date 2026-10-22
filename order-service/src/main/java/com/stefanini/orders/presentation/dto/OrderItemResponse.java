package com.stefanini.orders.presentation.dto;

import java.math.BigDecimal;

public record OrderItemResponse(String productId, String productName, BigDecimal unitPrice, int quantity,
        BigDecimal lineTotal) {

    public static OrderItemResponse from(com.stefanini.orders.domain.model.OrderItem item) {
        return new OrderItemResponse(
                item.productId(),
                item.productName(),
                item.unitPrice(),
                item.quantity(),
                item.lineTotal());
    }
}
