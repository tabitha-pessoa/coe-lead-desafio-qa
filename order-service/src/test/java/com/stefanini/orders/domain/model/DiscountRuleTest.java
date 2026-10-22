package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidDiscountRuleException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DiscountRuleTest {

    @Test
    void acceptsValidRuleAndNormalizesScale() {
        DiscountRule rule = new DiscountRule(new BigDecimal("1000"), new BigDecimal("10"));

        assertEquals(2, rule.minimumAmount().scale());
        assertEquals(2, rule.percentage().scale());
        assertEquals(0, rule.percentage().compareTo(new BigDecimal("10.00")));
    }

    @Test
    void rejectsZeroPercentage() {
        assertThrows(InvalidDiscountRuleException.class,
                () -> new DiscountRule(new BigDecimal("1000.00"), BigDecimal.ZERO));
    }

    @Test
    void rejectsPercentageAboveOneHundred() {
        assertThrows(InvalidDiscountRuleException.class,
                () -> new DiscountRule(new BigDecimal("1000.00"), new BigDecimal("100.01")));
    }

    @Test
    void rejectsNegativeMinimumAmount() {
        assertThrows(InvalidDiscountRuleException.class,
                () -> new DiscountRule(new BigDecimal("-1.00"), new BigDecimal("10.00")));
    }
}
