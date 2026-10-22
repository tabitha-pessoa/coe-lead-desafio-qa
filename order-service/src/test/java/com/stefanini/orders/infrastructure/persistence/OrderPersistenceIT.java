package com.stefanini.orders.infrastructure.persistence;

import com.stefanini.orders.application.OrderTestSupport;
import com.stefanini.orders.domain.model.Order;
import com.stefanini.orders.domain.port.OrderPage;
import com.stefanini.orders.domain.port.OrderRepository;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import jakarta.persistence.EntityManagerFactory;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Testcontainers
class OrderPersistenceIT {

    private static final int EXPECTED_STATEMENTS_FOR_PAGED_LIST = 3;

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.jpa.properties.hibernate.generate_statistics", () -> "true");
    }

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderJpaRepository orderJpaRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void savesAndFindsOrderWithItemSnapshot() {
        Order order = OrderTestSupport.sampleOrder();

        orderRepository.save(order);
        Optional<Order> found = orderRepository.findById(order.id());

        assertTrue(found.isPresent());
        assertEquals(2, found.get().items().size());
        assertEquals("Notebook Dell Inspiron 15", found.get().items().get(0).productName());
        assertEquals(0, found.get().items().get(0).unitPrice().compareTo(new java.math.BigDecimal("3500.00")));
        assertEquals(0, found.get().total().compareTo(new java.math.BigDecimal("6749.91")));
    }

    @Test
    void findAllRunsExactlyThreeStatementsAvoidingNPlusOne() {
        orderRepository.save(OrderTestSupport.sampleOrder());
        orderRepository.save(OrderTestSupport.sampleOrder());
        orderRepository.save(OrderTestSupport.sampleOrder());

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        OrderPage page = orderRepository.findAll(0, 10, null);

        assertEquals(3, page.content().size());
        assertEquals(EXPECTED_STATEMENTS_FOR_PAGED_LIST, statistics.getPrepareStatementCount());
    }

    @Test
    void rollsBackTransactionOnFailure() {
        Order order = OrderTestSupport.sampleOrder();
        TransactionTemplate template = new TransactionTemplate(transactionManager);

        assertThrows(RuntimeException.class, () -> template.execute(status -> {
            orderRepository.save(order);
            throw new IllegalStateException("simulated failure after save");
        }));

        assertTrue(orderRepository.findById(order.id()).isEmpty());
    }
}
