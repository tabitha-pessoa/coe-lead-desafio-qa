package com.stefanini.orders.infrastructure.http;

import java.util.List;

public record CatalogPricesRequest(List<String> productIds) {
}
