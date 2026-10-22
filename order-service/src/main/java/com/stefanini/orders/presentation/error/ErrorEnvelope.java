package com.stefanini.orders.presentation.error;

public record ErrorEnvelope(ApiError error, String requestId) {
}
