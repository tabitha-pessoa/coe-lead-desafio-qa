package com.stefanini.orders.presentation.dto;

public record ClientResponse(String name, String document, String email) {

    public static ClientResponse from(com.stefanini.orders.domain.model.Client client) {
        return new ClientResponse(client.name(), client.document(), client.email());
    }
}
