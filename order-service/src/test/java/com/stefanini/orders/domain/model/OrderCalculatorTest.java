package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidDiscountRuleException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderCalculatorTest {

    @Test
    void lineTotalMultipliesPriceByQuantity() {
        BigDecimal result = OrderCalculator.lineTotal(new BigDecimal("10.55"), 3);

        assertEquals(0, result.compareTo(new BigDecimal("31.65")));
        assertEquals(2, result.scale());
    }

    @Test
    void lineTotalRoundsHalfUp() {
        BigDecimal result = OrderCalculator.lineTotal(new BigDecimal("9.999"), 1);

        assertEquals(0, result.compareTo(new BigDecimal("10.00")));
    }

    @Test
    void subtotalSumsLineTotals() {
        List<OrderItem> items = List.of(
                item("50.00", 2),
                item("100.00", 1));

        BigDecimal subtotal = OrderCalculator.subtotal(items);

        assertEquals(0, subtotal.compareTo(new BigDecimal("200.00")));
    }

    @Test
    void discountAppliesPercentageWhenSubtotalReachesMinimum() {
        DiscountRule rule = new DiscountRule(new BigDecimal("1000.00"), new BigDecimal("10.00"));

        BigDecimal discount = OrderCalculator.discount(new BigDecimal("1000.00"), rule);

        assertEquals(0, discount.compareTo(new BigDecimal("100.00")));
    }

    @Test
    void discountReturnsZeroBelowMinimum() {
        DiscountRule rule = new DiscountRule(new BigDecimal("1000.00"), new BigDecimal("10.00"));

        BigDecimal discount = OrderCalculator.discount(new BigDecimal("999.99"), rule);

        assertEquals(0, discount.compareTo(BigDecimal.ZERO));
    }

    @Test
    void discountReturnsZeroWithNullRule() {
        BigDecimal discount = OrderCalculator.discount(new BigDecimal("5000.00"), null);

        assertEquals(0, discount.compareTo(BigDecimal.ZERO));
    }

    @Test
    void discountRoundsHalfUp() {
        DiscountRule rule = new DiscountRule(new BigDecimal("5.00"), new BigDecimal("10.00"));

        BigDecimal discount = OrderCalculator.discount(new BigDecimal("5.05"), rule);

        assertEquals(0, discount.compareTo(new BigDecimal("0.51")));
    }

    @Test
    void totalSubtractsDiscountFromSubtotal() {
        BigDecimal total = OrderCalculator.total(new BigDecimal("1000.00"), new BigDecimal("100.00"));

        assertEquals(0, total.compareTo(new BigDecimal("900.00")));
        assertEquals(2, total.scale());
    }

    @Test
    void totalRejectsDiscountAboveSubtotal() {
        assertThrows(InvalidDiscountRuleException.class,
                () -> OrderCalculator.total(new BigDecimal("100.00"), new BigDecimal("200.00")));
    }

    private OrderItem item(String unitPrice, int quantity) {
        BigDecimal price = new BigDecimal(unitPrice);
        BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(quantity)).setScale(2, java.math.RoundingMode.HALF_UP);
        return new OrderItem("PROD-001", "Product", price, quantity, lineTotal);
    }
}
