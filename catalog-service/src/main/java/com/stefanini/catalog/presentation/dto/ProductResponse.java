package com.stefanini.catalog.presentation.dto;

import com.stefanini.catalog.domain.model.PriceEntry;
import com.stefanini.catalog.domain.model.Product;


public record ProductResponse(String id, String name, String description, String status, PriceResponse currentPrice) {

    public static ProductResponse from(Product product, PriceEntry currentPrice) {
        return new ProductResponse(
                product.id(),
                product.name(),
                product.description(),
                product.status().name(),
                PriceResponse.from(currentPrice));
    }
}
