package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidDiscountRuleException;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record DiscountRule(BigDecimal minimumAmount, BigDecimal percentage) {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    public DiscountRule {
        if (minimumAmount == null || minimumAmount.signum() < 0) {
            throw new InvalidDiscountRuleException("minimumAmount must be greater than or equal to zero");
        }
        if (percentage == null || percentage.signum() <= 0 || percentage.compareTo(HUNDRED) > 0) {
            throw new InvalidDiscountRuleException("percentage must be between 0 (exclusive) and 100");
        }
        minimumAmount = minimumAmount.setScale(2, RoundingMode.HALF_UP);
        percentage = percentage.setScale(2, RoundingMode.HALF_UP);
    }
}
