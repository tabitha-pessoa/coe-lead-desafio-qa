package com.stefanini.orders.application;

import com.stefanini.orders.domain.exception.OrderNotFoundException;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.port.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetOrderUseCaseTest {

    @Mock
    private OrderRepository orderRepository;

    private GetOrderUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GetOrderUseCase(orderRepository);
    }

    @Test
    void returnsOrderWhenItExists() {
        Order order = OrderTestSupport.sampleOrder();
        when(orderRepository.findById(order.id())).thenReturn(Optional.of(order));

        assertEquals(order, useCase.execute(order.id()));
    }

    @Test
    void throwsOrderNotFoundForUnknownId() {
        UUID id = UUID.randomUUID();
        when(orderRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class, () -> useCase.execute(id));
    }
}
