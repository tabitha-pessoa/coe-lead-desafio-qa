package com.stefanini.orders.domain.exception;

import java.util.List;

public final class InvalidDiscountRuleException extends DomainException {

    public InvalidDiscountRuleException(String message) {
        super("INVALID_BUSINESS_RULE", message, List.of());
    }
}
