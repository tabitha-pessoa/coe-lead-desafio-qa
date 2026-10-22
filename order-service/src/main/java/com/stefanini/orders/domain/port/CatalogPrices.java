package com.stefanini.orders.domain.port;

import java.util.List;

public record CatalogPrices(List<CatalogPrice> found, List<String> notFound) {

    public CatalogPrices {
        found = found == null ? List.of() : List.copyOf(found);
        notFound = notFound == null ? List.of() : List.copyOf(notFound);
    }
}
