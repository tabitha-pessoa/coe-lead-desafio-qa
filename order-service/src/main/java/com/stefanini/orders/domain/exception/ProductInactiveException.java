package com.stefanini.orders.domain.exception;

import java.util.List;

public final class ProductInactiveException extends DomainException {

    public ProductInactiveException(List<String> productIds) {
        super("PRODUCT_INACTIVE", messageFor(productIds), productIds);
    }

    private static String messageFor(List<String> ids) {
        return ids.size() == 1
                ? "Product " + ids.get(0) + " is inactive"
                : "Products are inactive: " + String.join(", ", ids);
    }
}
