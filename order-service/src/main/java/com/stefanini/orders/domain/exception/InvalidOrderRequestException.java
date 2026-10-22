package com.stefanini.orders.domain.exception;

import java.util.List;

public final class InvalidOrderRequestException extends DomainException {

    public InvalidOrderRequestException(String message, List<String> details) {
        super("VALIDATION_ERROR", message, details);
    }
}
