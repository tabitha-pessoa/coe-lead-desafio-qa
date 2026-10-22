package com.stefanini.orders.domain.port;

import com.stefanini.orders.domain.model.DiscountRule;

import java.util.Optional;

public interface DiscountRuleRepository {

    Optional<DiscountRule> findActive();
}
