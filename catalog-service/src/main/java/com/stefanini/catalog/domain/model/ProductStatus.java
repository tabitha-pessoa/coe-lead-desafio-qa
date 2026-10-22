package com.stefanini.catalog.domain.model;

import java.util.Locale;

public enum ProductStatus {
    ATIVO,
    INATIVO;

    public static ProductStatus from(String value) {
        if (value == null) {
            return INATIVO;
        }
        try {
            return ProductStatus.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return INATIVO;
        }
    }
}
