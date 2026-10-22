package com.stefanini.orders.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, UUID> {

    @Query("select distinct o from OrderJpaEntity o join fetch o.items where o.id = :id")
    Optional<OrderJpaEntity> findWithItemsById(@Param("id") UUID id);

    Page<OrderJpaEntity> findByStatus(String status, Pageable pageable);
}
