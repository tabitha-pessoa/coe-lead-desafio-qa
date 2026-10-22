package com.stefanini.orders.infrastructure.http;

import java.math.BigDecimal;
import java.time.Instant;

public record CatalogCurrentPriceResponse(BigDecimal value, String currency, Instant validFrom, Instant validTo) {
}
