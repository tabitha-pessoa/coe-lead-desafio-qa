package com.stefanini.orders.domain.exception;

import java.util.List;
import java.util.UUID;

public final class OrderNotFoundException extends DomainException {

    public OrderNotFoundException(UUID id) {
        super("ORDER_NOT_FOUND", "Order " + id + " was not found", List.of());
    }
}
