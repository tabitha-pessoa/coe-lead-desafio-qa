package com.stefanini.catalog.presentation.dto;

import com.stefanini.catalog.application.dto.BatchPricesResult;

import java.util.List;

public record BatchPricesResponse(List<ProductPriceResponse> prices, List<String> notFound) {

    public static BatchPricesResponse from(BatchPricesResult result) {
        return new BatchPricesResponse(
                result.prices().stream().map(ProductPriceResponse::from).toList(),
                result.notFound());
    }
}
