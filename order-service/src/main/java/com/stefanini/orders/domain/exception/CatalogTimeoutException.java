package com.stefanini.orders.domain.exception;

import java.util.List;

public final class CatalogTimeoutException extends DomainException {

    public CatalogTimeoutException(String message) {
        super("CATALOG_TIMEOUT", message, List.of());
    }
}
