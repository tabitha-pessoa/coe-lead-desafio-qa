package com.stefanini.orders.domain.model;

import com.stefanini.orders.domain.exception.InvalidOrderRequestException;

import java.util.List;

public record Client(String name, String document, String email) {

    public Client {
        if (name == null || name.isBlank()) {
            throw new InvalidOrderRequestException("Invalid client data", List.of("client.name: must not be blank"));
        }
        if (document == null || document.isBlank()) {
            throw new InvalidOrderRequestException("Invalid client data", List.of("client.document: must not be blank"));
        }
        if (email == null || email.isBlank()) {
            throw new InvalidOrderRequestException("Invalid client data", List.of("client.email: must not be blank"));
        }
    }
}
