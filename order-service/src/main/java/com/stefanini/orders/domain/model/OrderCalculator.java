package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidDiscountRuleException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

public final class OrderCalculator {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private OrderCalculator() {
    }

    public static BigDecimal lineTotal(BigDecimal unitPrice, int quantity) {
        Objects.requireNonNull(unitPrice, "unitPrice must not be null");
        return unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal subtotal(List<OrderItem> items) {
        Objects.requireNonNull(items, "items must not be null");
        return items.stream()
                .map(OrderItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal discount(BigDecimal subtotal, DiscountRule rule) {
        Objects.requireNonNull(subtotal, "subtotal must not be null");
        if (rule == null || subtotal.compareTo(rule.minimumAmount()) < 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return subtotal.multiply(rule.percentage()).divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal total(BigDecimal subtotal, BigDecimal discount) {
        Objects.requireNonNull(subtotal, "subtotal must not be null");
        Objects.requireNonNull(discount, "discount must not be null");
        BigDecimal value = subtotal.subtract(discount);
        if (value.signum() < 0) {
            throw new InvalidDiscountRuleException("discount cannot exceed subtotal");
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
