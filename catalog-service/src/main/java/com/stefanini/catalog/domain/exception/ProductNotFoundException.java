package com.stefanini.catalog.domain.exception;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(String id) {
        super("Product " + id + " was not found");
    }
}
