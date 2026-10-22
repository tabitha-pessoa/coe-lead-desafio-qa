package com.stefanini.orders.presentation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stefanini.orders.infrastructure.persistence.OrderJpaRepository;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.QueueDispatcher;
import okhttp3.mockwebserver.SocketPolicy;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@Execution(ExecutionMode.SAME_THREAD)
class OrderApiIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    static final MockWebServer catalogServer = new MockWebServer();

    static {
        try {
            catalogServer.start();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @BeforeEach
    void resetCatalogResponses() {
        catalogServer.setDispatcher(new QueueDispatcher());
    }

    @DynamicPropertySource
    static void catalogProperties(DynamicPropertyRegistry registry) {
        registry.add("catalog.base-url", () -> catalogServer.url("/").toString());
        registry.add("catalog.read-timeout-ms", () -> "300");
    }

    @AfterAll
    static void tearDown() throws IOException {
        catalogServer.shutdown();
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private OrderJpaRepository orderJpaRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createOrderReturns201WithComputedTotalsAndSingleCatalogCall() throws IOException {
        consumeCatalogCalls();
        enqueueCatalogResponse("""
                {"prices":[
                  {"productId":"PROD-001","name":"Notebook Dell Inspiron 15","status":"ATIVO","currentPrice":{"value":3500.00,"currency":"BRL","validFrom":"2025-01-01T00:00:00Z","validTo":null}},
                  {"productId":"PROD-002","name":"Mouse Logitech MX Master 3S","status":"ATIVO","currentPrice":{"value":499.90,"currency":"BRL","validFrom":"2025-01-01T00:00:00Z","validTo":null}}
                ],"notFound":[]}
                """);
        long ordersBefore = orderJpaRepository.count();

        var response = postOrder("""
                {"client":{"name":"Maria Silva","document":"12345678901","email":"maria@example.com"},
                 "items":[{"productId":"PROD-001","quantity":2},{"productId":"PROD-002","quantity":1}]}
                """);

        assertEquals(201, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals(0, amount(body.get("subtotal")).compareTo(new BigDecimal("7499.90")));
        assertEquals(0, amount(body.get("discount")).compareTo(new BigDecimal("749.99")));
        assertEquals(0, amount(body.get("total")).compareTo(new BigDecimal("6749.91")));
        assertEquals("CRIADO", body.get("status").asText());
        assertEquals("Notebook Dell Inspiron 15", body.get("items").get(0).get("productName").asText());
        assertEquals(0, amount(body.get("items").get(0).get("unitPrice")).compareTo(new BigDecimal("3500.00")));
        assertEquals(ordersBefore + 1, orderJpaRepository.count());
        assertEquals(1, consumeCatalogCalls());
        assertNotNull(response.getHeaders().getFirst("X-Request-Id"));

        var fetched = rest.getForEntity("/api/v1/orders/" + body.get("id").asText(), String.class);
        assertEquals(200, fetched.getStatusCode().value());
        assertEquals(0, amount(objectMapper.readTree(fetched.getBody()).get("total")).compareTo(new BigDecimal("6749.91")));
    }

    @Test
    void productNotFoundReturns422AndPersistsNothing() throws IOException {
        consumeCatalogCalls();
        enqueueCatalogResponse("""
                {"prices":[
                  {"productId":"PROD-001","name":"Notebook Dell Inspiron 15","status":"ATIVO","currentPrice":{"value":3500.00,"currency":"BRL","validFrom":"2025-01-01T00:00:00Z","validTo":null}}
                ],"notFound":["PROD-999"]}
                """);
        long ordersBefore = orderJpaRepository.count();

        var response = postOrder("""
                {"client":{"name":"Maria Silva","document":"12345678901","email":"maria@example.com"},
                 "items":[{"productId":"PROD-001","quantity":1},{"productId":"PROD-999","quantity":1}]}
                """);

        assertEquals(422, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals("PRODUCT_NOT_FOUND", body.get("error").get("code").asText());
        assertTrue(body.get("error").get("details").toString().contains("PROD-999"));
        assertEquals(ordersBefore, orderJpaRepository.count());
    }

    @Test
    void invalidQuantityReturns400WithoutCallingCatalog() throws IOException {
        consumeCatalogCalls();
        long ordersBefore = orderJpaRepository.count();

        var response = postOrder("""
                {"client":{"name":"Maria Silva","document":"12345678901","email":"maria@example.com"},
                 "items":[{"productId":"PROD-001","quantity":0}]}
                """);

        assertEquals(400, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals("VALIDATION_ERROR", body.get("error").get("code").asText());
        assertEquals(ordersBefore, orderJpaRepository.count());
        assertEquals(0, consumeCatalogCalls());
    }

    @Test
    void catalogUnavailableReturns503() throws IOException {
        consumeCatalogCalls();
        catalogServer.enqueue(new MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AT_START));
        catalogServer.enqueue(new MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AT_START));
        long ordersBefore = orderJpaRepository.count();

        var response = postOrder("""
                {"client":{"name":"Maria Silva","document":"12345678901","email":"maria@example.com"},
                 "items":[{"productId":"PROD-001","quantity":1}]}
                """);

        assertEquals(503, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals("CATALOG_UNAVAILABLE", body.get("error").get("code").asText());
        assertEquals(ordersBefore, orderJpaRepository.count());
    }

    @Test
    void catalogTimeoutReturns504() throws IOException {
        consumeCatalogCalls();
        String payload = """
                {"prices":[{"productId":"PROD-001","name":"Notebook","status":"ATIVO","currentPrice":{"value":3500.00,"currency":"BRL","validFrom":"2025-01-01T00:00:00Z","validTo":null}}],"notFound":[]}
                """;
        catalogServer.enqueue(new MockResponse().setBody(payload).setBodyDelay(2, TimeUnit.SECONDS));
        catalogServer.enqueue(new MockResponse().setBody(payload).setBodyDelay(2, TimeUnit.SECONDS));

        var response = postOrder("""
                {"client":{"name":"Maria Silva","document":"12345678901","email":"maria@example.com"},
                 "items":[{"productId":"PROD-001","quantity":1}]}
                """);

        assertEquals(504, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals("CATALOG_TIMEOUT", body.get("error").get("code").asText());
    }

    @Test
    void getOrderReturns404ForUnknownId() throws IOException {
        var response = rest.getForEntity("/api/v1/orders/" + UUID.randomUUID(), String.class);

        assertEquals(404, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals("ORDER_NOT_FOUND", body.get("error").get("code").asText());
        assertTrue(body.hasNonNull("requestId"));
    }

    @Test
    void listOrdersPaginatesResults() throws IOException {
        for (int i = 0; i < 3; i++) {
            enqueueCatalogResponse("""
                    {"prices":[{"productId":"PROD-001","name":"Notebook Dell Inspiron 15","status":"ATIVO","currentPrice":{"value":3500.00,"currency":"BRL","validFrom":"2025-01-01T00:00:00Z","validTo":null}}],"notFound":[]}
                    """);
            postOrder("""
                    {"client":{"name":"Client %s","document":"12345678901","email":"client@example.com"},
                     "items":[{"productId":"PROD-001","quantity":1}]}
                    """.formatted(i));
        }

        var response = rest.getForEntity("/api/v1/orders?size=2", String.class);

        assertEquals(200, response.getStatusCode().value());
        JsonNode body = objectMapper.readTree(response.getBody());
        assertEquals(2, body.get("content").size());
        assertTrue(body.get("totalElements").asLong() >= 3);
        assertTrue(body.get("totalPages").asInt() >= 2);
    }

    private org.springframework.http.ResponseEntity<String> postOrder(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.postForEntity("/api/v1/orders", new HttpEntity<>(body, headers), String.class);
    }

    private void enqueueCatalogResponse(String body) {
        catalogServer.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(body));
    }

    private int consumeCatalogCalls() throws IOException {
        int calls = 0;
        try {
            while (catalogServer.takeRequest(50, TimeUnit.MILLISECONDS) != null) {
                calls++;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted while draining catalog mock requests", e);
        }
        return calls;
    }

    private BigDecimal amount(JsonNode node) {
        return node.isBigDecimal() ? node.decimalValue() : new BigDecimal(node.asText());
    }
}
