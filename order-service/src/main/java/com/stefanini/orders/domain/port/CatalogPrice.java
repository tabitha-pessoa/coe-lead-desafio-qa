package com.stefanini.orders.domain.port;

import java.math.BigDecimal;

public record CatalogPrice(String productId, String name, CatalogProductStatus status, BigDecimal currentPrice) {
}
