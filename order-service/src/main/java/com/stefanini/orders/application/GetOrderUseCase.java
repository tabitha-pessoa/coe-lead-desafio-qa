package com.stefanini.orders.application;

import com.stefanini.orders.domain.exception.OrderNotFoundException;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.port.OrderRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class GetOrderUseCase {

    private final OrderRepository orderRepository;

    public GetOrderUseCase(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order execute(UUID id) {
        return orderRepository.findById(id).orElseThrow(() -> new OrderNotFoundException(id));
    }
}
