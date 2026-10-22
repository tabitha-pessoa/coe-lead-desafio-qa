package com.stefanini.orders.domain.exception;

import java.util.List;

public final class ProductNotFoundException extends DomainException {

    public ProductNotFoundException(List<String> productIds) {
        super("PRODUCT_NOT_FOUND", messageFor(productIds), productIds);
    }

    private static String messageFor(List<String> ids) {
        return ids.size() == 1
                ? "Product " + ids.get(0) + " was not found"
                : "Products not found: " + String.join(", ", ids);
    }
}
