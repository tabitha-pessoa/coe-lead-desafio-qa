package com.stefanini.catalog.presentation.error;

public record ErrorEnvelope(ApiError error, String requestId) {
}
