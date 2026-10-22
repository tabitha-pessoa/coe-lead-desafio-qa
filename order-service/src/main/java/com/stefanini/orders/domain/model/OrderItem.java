package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidOrderRequestException;

import java.math.BigDecimal;
import java.util.List;

public record OrderItem(String productId, String productName, BigDecimal unitPrice, int quantity, BigDecimal lineTotal) {

    public OrderItem {
        if (productId == null || productId.isBlank()) {
            throw new InvalidOrderRequestException("Invalid order item", List.of("productId: must not be blank"));
        }
        if (productName == null || productName.isBlank()) {
            throw new InvalidOrderRequestException("Invalid order item",
                    List.of("productName: must not be blank for product " + productId));
        }
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new InvalidOrderRequestException("Invalid order item",
                    List.of("unitPrice: must not be negative for product " + productId));
        }
        if (quantity < 1 || quantity > 999) {
            throw new InvalidOrderRequestException("Invalid order item",
                    List.of("quantity: must be between 1 and 999 for product " + productId));
        }
        if (lineTotal == null || lineTotal.signum() < 0) {
            throw new InvalidOrderRequestException("Invalid order item",
                    List.of("lineTotal: must not be negative for product " + productId));
        }
    }
}
