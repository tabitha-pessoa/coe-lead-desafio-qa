package com.stefanini.orders.infrastructure.persistence;

import com.stefanini.orders.domain.model.DiscountRule;
import com.stefanini.orders.domain.port.DiscountRuleRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class DiscountRulePersistenceAdapter implements DiscountRuleRepository {

    private final DiscountRuleJpaRepository repository;

    public DiscountRulePersistenceAdapter(DiscountRuleJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<DiscountRule> findActive() {
        return repository.findFirstByActiveTrueOrderByCreatedAtAsc()
                .map(entity -> new DiscountRule(entity.getMinimumAmount(), entity.getPercentage()));
    }
}
