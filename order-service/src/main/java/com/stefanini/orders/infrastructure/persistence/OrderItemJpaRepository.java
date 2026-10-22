package com.stefanini.orders.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface OrderItemJpaRepository extends JpaRepository<OrderItemJpaEntity, Long> {

    List<OrderItemJpaEntity> findByOrderIdIn(Collection<UUID> orderIds);
}
