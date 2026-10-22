package com.stefanini.orders.domain.port;

import java.util.Locale;

public enum CatalogProductStatus {
    ATIVO,
    INATIVO;

    public static CatalogProductStatus from(String value) {
        if (value == null) {
            return INATIVO;
        }
        try {
            return CatalogProductStatus.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return INATIVO;
        }
    }
}
