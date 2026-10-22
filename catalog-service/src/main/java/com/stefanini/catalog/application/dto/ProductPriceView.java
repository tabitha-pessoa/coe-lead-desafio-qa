package com.stefanini.catalog.application.dto;

import com.stefanini.catalog.domain.model.PriceEntry;
import com.stefanini.catalog.domain.model.ProductStatus;

public record ProductPriceView(String productId, String name, ProductStatus status, PriceEntry currentPrice) {
}
