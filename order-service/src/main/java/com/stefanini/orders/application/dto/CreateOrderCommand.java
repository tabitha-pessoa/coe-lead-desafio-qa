package com.stefanini.orders.application.dto;

import java.util.List;

public record CreateOrderCommand(ClientData client, List<ItemData> items) {

    public record ClientData(String name, String document, String email) {
    }

    public record ItemData(String productId, int quantity) {
    }
}
