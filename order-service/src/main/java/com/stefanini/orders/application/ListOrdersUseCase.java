package com.stefanini.orders.application;

import com.stefanini.orders.domain.model.OrderStatus;
import com.stefanini.orders.domain.port.OrderPage;
import com.stefanini.orders.domain.port.OrderRepository;
import org.springframework.stereotype.Component;

@Component
public class ListOrdersUseCase {

    private static final int MAX_PAGE_SIZE = 100;

    private final OrderRepository orderRepository;

    public ListOrdersUseCase(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public OrderPage execute(int page, int size, OrderStatus status) {
        int effectivePage = Math.max(page, 0);
        int effectiveSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return orderRepository.findAll(effectivePage, effectiveSize, status);
    }
}
