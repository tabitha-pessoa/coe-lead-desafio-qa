package com.stefanini.orders.presentation;

import com.stefanini.orders.application.CreateOrderUseCase;
import com.stefanini.orders.application.GetOrderUseCase;
import com.stefanini.orders.application.ListOrdersUseCase;
import com.stefanini.orders.application.dto.CreateOrderCommand;
import com.stefanini.orders.domain.exception.InvalidOrderRequestException;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.model.OrderStatus;
import com.stefanini.orders.domain.port.OrderPage;
import com.stefanini.orders.presentation.dto.CreateOrderRequest;
import com.stefanini.orders.presentation.dto.OrderResponse;
import com.stefanini.orders.presentation.dto.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final ListOrdersUseCase listOrdersUseCase;
    private final GetOrderUseCase getOrderUseCase;

    public OrderController(CreateOrderUseCase createOrderUseCase, ListOrdersUseCase listOrdersUseCase,
            GetOrderUseCase getOrderUseCase) {
        this.createOrderUseCase = createOrderUseCase;
        this.listOrdersUseCase = listOrdersUseCase;
        this.getOrderUseCase = getOrderUseCase;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        Order order = createOrderUseCase.execute(toCommand(request));
        return ResponseEntity
                .created(URI.create("/api/v1/orders/" + order.id()))
                .body(OrderResponse.from(order));
    }

    @GetMapping
    public PageResponse<OrderResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        OrderPage result = listOrdersUseCase.execute(page, size, parseStatus(status));
        List<OrderResponse> content = result.content().stream().map(OrderResponse::from).toList();
        return PageResponse.from(content, result);
    }

    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable UUID id) {
        return OrderResponse.from(getOrderUseCase.execute(id));
    }

    private CreateOrderCommand toCommand(CreateOrderRequest request) {
        return new CreateOrderCommand(
                new CreateOrderCommand.ClientData(
                        request.client().name(),
                        request.client().document(),
                        request.client().email()),
                request.items().stream()
                        .map(item -> new CreateOrderCommand.ItemData(item.productId(), item.quantity()))
                        .toList());
    }

    private OrderStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new InvalidOrderRequestException("Invalid status filter",
                    List.of("status: must be one of " + List.of(OrderStatus.values())));
        }
    }
}
