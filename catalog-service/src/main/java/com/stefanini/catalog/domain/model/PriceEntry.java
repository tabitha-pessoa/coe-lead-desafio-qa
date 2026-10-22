package com.stefanini.catalog.domain.model;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceEntry(BigDecimal value, String currency, Instant validFrom, Instant validTo) {

    public PriceEntry {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException("price value must be positive");
        }
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("currency is required");
        }
        if (validFrom == null) {
            throw new IllegalArgumentException("validFrom is required");
        }
        if (validTo != null && validTo.isBefore(validFrom)) {
            throw new IllegalArgumentException("validTo must not be before validFrom");
        }
    }

    public boolean isCurrentAt(Instant at) {
        return !at.isBefore(validFrom) && (validTo == null || at.isBefore(validTo));
    }
}
