package com.stefanini.catalog.presentation.dto;

import com.stefanini.catalog.application.dto.ProductPriceView;

public record ProductPriceResponse(String productId, String name, String status, PriceResponse currentPrice) {

    public static ProductPriceResponse from(ProductPriceView view) {
        return new ProductPriceResponse(
                view.productId(),
                view.name(),
                view.status().name(),
                PriceResponse.from(view.currentPrice()));
    }
}
