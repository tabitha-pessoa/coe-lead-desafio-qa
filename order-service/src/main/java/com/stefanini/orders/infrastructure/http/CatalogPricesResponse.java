package com.stefanini.orders.infrastructure.http;

import java.util.List;

public record CatalogPricesResponse(List<CatalogPriceResponse> prices, List<String> notFound) {
}
