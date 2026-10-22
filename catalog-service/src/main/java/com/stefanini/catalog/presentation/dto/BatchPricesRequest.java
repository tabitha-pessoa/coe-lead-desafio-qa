package com.stefanini.catalog.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BatchPricesRequest(
        @NotEmpty(message = "productIds must not be empty")
        @Size(max = 50, message = "at most 50 productIds are allowed per request")
        List<@NotBlank(message = "productId must not be blank") String> productIds) {
}
