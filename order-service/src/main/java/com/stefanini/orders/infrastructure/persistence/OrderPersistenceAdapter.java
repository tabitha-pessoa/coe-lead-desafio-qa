package com.stefanini.orders.infrastructure.persistence;

import com.stefanini.orders.domain.model.Client;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.model.OrderItem;
import com.stefanini.orders.domain.model.OrderStatus;
import com.stefanini.orders.domain.port.OrderPage;
import com.stefanini.orders.domain.port.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class OrderPersistenceAdapter implements OrderRepository {

    private final OrderJpaRepository orderJpaRepository;
    private final OrderItemJpaRepository orderItemJpaRepository;

    public OrderPersistenceAdapter(OrderJpaRepository orderJpaRepository, OrderItemJpaRepository orderItemJpaRepository) {
        this.orderJpaRepository = orderJpaRepository;
        this.orderItemJpaRepository = orderItemJpaRepository;
    }

    @Override
    @Transactional
    public Order save(Order order) {
        orderJpaRepository.save(toEntity(order));
        return order;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Order> findById(UUID id) {
        return orderJpaRepository.findWithItemsById(id).map(entity -> toDomain(entity, entity.getItems()));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderPage findAll(int page, int size, OrderStatus status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderJpaEntity> result = status == null
                ? orderJpaRepository.findAll(pageable)
                : orderJpaRepository.findByStatus(status.name(), pageable);
        List<Order> content;
        if (result.isEmpty()) {
            content = List.of();
        } else {
            List<UUID> orderIds = result.getContent().stream().map(OrderJpaEntity::getId).toList();
            Map<UUID, List<OrderItemJpaEntity>> itemsByOrder = orderItemJpaRepository.findByOrderIdIn(orderIds)
                    .stream()
                    .collect(Collectors.groupingBy(OrderItemJpaEntity::getOrderId));
            content = result.getContent().stream()
                    .map(entity -> toDomain(entity, itemsByOrder.getOrDefault(entity.getId(), List.of())))
                    .toList();
        }
        return new OrderPage(content, page, size, result.getTotalElements());
    }

    private OrderJpaEntity toEntity(Order order) {
        OrderJpaEntity entity = new OrderJpaEntity();
        entity.setId(order.id());
        entity.setClientName(order.client().name());
        entity.setClientDocument(order.client().document());
        entity.setClientEmail(order.client().email());
        entity.setSubtotal(order.subtotal());
        entity.setDiscount(order.discount());
        entity.setTotal(order.total());
        entity.setStatus(order.status().name());
        entity.setCreatedAt(order.createdAt());
        for (OrderItem item : order.items()) {
            OrderItemJpaEntity itemEntity = new OrderItemJpaEntity();
            itemEntity.setProductId(item.productId());
            itemEntity.setProductName(item.productName());
            itemEntity.setUnitPrice(item.unitPrice());
            itemEntity.setQuantity(item.quantity());
            itemEntity.setLineTotal(item.lineTotal());
            entity.getItems().add(itemEntity);
        }
        return entity;
    }

    private Order toDomain(OrderJpaEntity entity, List<OrderItemJpaEntity> itemEntities) {
        List<OrderItem> items = itemEntities.stream()
                .map(item -> new OrderItem(
                        item.getProductId(),
                        item.getProductName(),
                        item.getUnitPrice(),
                        item.getQuantity(),
                        item.getLineTotal()))
                .toList();
        return new Order(
                entity.getId(),
                new Client(entity.getClientName(), entity.getClientDocument(), entity.getClientEmail()),
                items,
                entity.getSubtotal(),
                entity.getDiscount(),
                entity.getTotal(),
                OrderStatus.valueOf(entity.getStatus()),
                entity.getCreatedAt());
    }
}
