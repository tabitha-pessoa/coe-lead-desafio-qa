package com.stefanini.orders.infrastructure.http;

public record CatalogPriceResponse(String productId, String name, String status, CatalogCurrentPriceResponse currentPrice) {
}
