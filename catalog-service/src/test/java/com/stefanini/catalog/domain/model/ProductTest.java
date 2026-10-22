package com.stefanini.catalog.domain.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductTest {

    private final Instant now = Instant.parse("2025-09-01T00:00:00Z");

    @Test
    void currentPriceAtPicksLatestValidFromAmongCurrentWindows() {
        PriceEntry older = new PriceEntry(new BigDecimal("700.00"), "BRL",
                Instant.parse("2025-01-01T00:00:00Z"), null);
        PriceEntry newer = new PriceEntry(new BigDecimal("649.90"), "BRL",
                Instant.parse("2025-06-01T00:00:00Z"), null);
        Product product = new Product("PROD-001", "Teclado", "desc", ProductStatus.ATIVO, List.of(older, newer));

        Optional<PriceEntry> current = product.currentPriceAt(now);

        assertTrue(current.isPresent());
        assertEquals(0, current.get().value().compareTo(new BigDecimal("649.90")));
    }

    @Test
    void currentPriceAtIsEmptyWhenAllWindowsExpired() {
        PriceEntry expired = new PriceEntry(new BigDecimal("799.00"), "BRL",
                Instant.parse("2025-01-01T00:00:00Z"), Instant.parse("2025-03-01T00:00:00Z"));
        Product product = new Product("PROD-002", "Headset", "desc", ProductStatus.ATIVO, List.of(expired));

        assertTrue(product.currentPriceAt(now).isEmpty());
    }

    @Test
    void currentPriceAtIsEmptyWhenWindowIsFuture() {
        PriceEntry future = new PriceEntry(new BigDecimal("599.00"), "BRL",
                Instant.parse("2030-01-01T00:00:00Z"), null);
        Product product = new Product("PROD-003", "Webcam", "desc", ProductStatus.ATIVO, List.of(future));

        assertTrue(product.currentPriceAt(now).isEmpty());
    }
}
