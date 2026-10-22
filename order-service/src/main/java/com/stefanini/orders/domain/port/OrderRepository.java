package com.stefanini.orders.domain.port;

import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.model.OrderStatus;

import java.util.Optional;
import java.util.UUID;

public interface OrderRepository {

    Order save(Order order);

    Optional<Order> findById(UUID id);

    OrderPage findAll(int page, int size, OrderStatus status);
}
