package com.stefanini.orders.domain.exception;

import java.util.List;

public final class CatalogUnavailableException extends DomainException {

    public CatalogUnavailableException(String message, Throwable cause) {
        super("CATALOG_UNAVAILABLE", message, List.of(), cause);
    }
}
