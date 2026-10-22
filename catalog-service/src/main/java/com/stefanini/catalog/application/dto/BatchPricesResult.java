package com.stefanini.catalog.application.dto;

import java.util.List;

public record BatchPricesResult(List<ProductPriceView> prices, List<String> notFound) {
}
