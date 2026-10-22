package com.stefanini.catalog.domain.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PriceEntryTest {

    private final Instant from = Instant.parse("2025-01-01T00:00:00Z");
    private final Instant to = Instant.parse("2025-06-01T00:00:00Z");

    @Test
    void isCurrentAtReturnsTrueInsideWindow() {
        PriceEntry entry = new PriceEntry(new BigDecimal("100.00"), "BRL", from, to);
        assertTrue(entry.isCurrentAt(Instant.parse("2025-03-01T12:00:00Z")));
    }

    @Test
    void isCurrentAtAcceptsExactStartAndRejectsExactEnd() {
        PriceEntry entry = new PriceEntry(new BigDecimal("100.00"), "BRL", from, to);
        assertTrue(entry.isCurrentAt(from));
        assertFalse(entry.isCurrentAt(to));
    }

    @Test
    void isCurrentAtWithNullValidToCoversFuture() {
        PriceEntry entry = new PriceEntry(new BigDecimal("100.00"), "BRL", from, null);
        assertTrue(entry.isCurrentAt(Instant.parse("2030-01-01T00:00:00Z")));
    }

    @Test
    void rejectsNonPositiveValue() {
        assertThrows(IllegalArgumentException.class,
                () -> new PriceEntry(BigDecimal.ZERO, "BRL", from, null));
    }

    @Test
    void rejectsValidToBeforeValidFrom() {
        assertThrows(IllegalArgumentException.class,
                () -> new PriceEntry(new BigDecimal("100.00"), "BRL", to, from));
    }
}
