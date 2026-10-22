package com.stefanini.catalog.presentation.error;

import java.util.List;

public record ApiError(String code, String message, List<String> details) {
}
