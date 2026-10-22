package com.stefanini.catalog.presentation.dto;

import com.stefanini.catalog.domain.model.PriceEntry;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceResponse(BigDecimal value, String currency, Instant validFrom, Instant validTo) {

    public static PriceResponse from(PriceEntry entry) {
        if (entry == null) {
            return null;
        }
        return new PriceResponse(entry.value(), entry.currency(), entry.validFrom(), entry.validTo());
    }
}
