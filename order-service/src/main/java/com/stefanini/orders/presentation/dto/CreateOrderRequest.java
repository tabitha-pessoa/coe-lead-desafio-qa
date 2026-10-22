package com.stefanini.orders.presentation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
        @Valid @NotNull(message = "client must not be null") ClientData client,
        @NotEmpty(message = "items must contain at least one item")
        @Size(max = 100, message = "at most 100 items are allowed per order")
        List<@Valid ItemData> items) {

    public record ClientData(
            @NotBlank(message = "must not be blank") @Size(max = 120) String name,
            @NotBlank(message = "must not be blank") @Size(max = 20) String document,
            @NotBlank(message = "must not be blank") @Email(message = "must be a valid email") @Size(max = 120) String email) {
    }

    public record ItemData(
            @NotBlank(message = "must not be blank") @Size(max = 50) String productId,
            @NotNull(message = "must not be null") @Min(value = 1, message = "must be at least 1")
            @Max(value = 999, message = "must be at most 999") Integer quantity) {
    }
}
