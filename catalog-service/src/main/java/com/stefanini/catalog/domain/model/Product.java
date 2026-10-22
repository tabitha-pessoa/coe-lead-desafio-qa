package com.stefanini.catalog.domain.model;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public record Product(String id, String name, String description, ProductStatus status, List<PriceEntry> prices) {

    public Product {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("product id is required");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("product name is required");
        }
        prices = prices == null ? List.of() : List.copyOf(prices);
    }

    public Optional<PriceEntry> currentPriceAt(Instant at) {
        return prices.stream()
                .filter(price -> price.isCurrentAt(at))
                .max(Comparator.comparing(PriceEntry::validFrom));
    }
}
