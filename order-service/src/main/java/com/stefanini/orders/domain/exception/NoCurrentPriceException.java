package com.stefanini.orders.domain.exception;

import java.util.List;

public final class NoCurrentPriceException extends DomainException {

    public NoCurrentPriceException(List<String> productIds) {
        super("NO_CURRENT_PRICE", messageFor(productIds), productIds);
    }

    private static String messageFor(List<String> ids) {
        return ids.size() == 1
                ? "Product " + ids.get(0) + " has no current price"
                : "Products have no current price: " + String.join(", ", ids);
    }
}
