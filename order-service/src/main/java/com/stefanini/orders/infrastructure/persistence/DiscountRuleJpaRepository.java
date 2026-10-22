package com.stefanini.orders.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscountRuleJpaRepository extends JpaRepository<DiscountRuleJpaEntity, Long> {

    Optional<DiscountRuleJpaEntity> findFirstByActiveTrueOrderByCreatedAtAsc();
}
