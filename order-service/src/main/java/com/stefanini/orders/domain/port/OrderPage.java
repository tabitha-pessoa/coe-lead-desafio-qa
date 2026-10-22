package com.stefanini.orders.domain.port;

import com.stefanini.orders.domain.model.Order;

import java.util.List;

public record OrderPage(List<Order> content, int page, int size, long totalElements) {

    public OrderPage {
        content = content == null ? List.of() : List.copyOf(content);
    }
}
