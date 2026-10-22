package com.stefanini.catalog.presentation;

import com.stefanini.catalog.infrastructure.persistence.MongoPriceDocument;
import com.stefanini.catalog.infrastructure.persistence.MongoProductDocument;
import com.stefanini.catalog.infrastructure.persistence.MongoProductRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class CatalogApiIT {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7");

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private MongoProductRepository repository;

    @BeforeAll
    static void checkContainer() {
        assertTrue(mongo.isRunning());
    }

    @AfterAll
    static void cleanup() {
        if (mongo.isRunning()) {
            mongo.stop();
        }
    }

    @Test
    void getByIdReturnsProductWithCurrentPrice() {
        seedProduct("PROD-003", "ATIVO",
                price("700.00", Instant.parse("2025-01-01T00:00:00Z"), Instant.parse("2025-06-01T00:00:00Z")),
                price("649.90", Instant.parse("2025-06-01T00:00:00Z"), null));

        var response = rest.getForEntity("/api/v1/products/PROD-003", String.class);

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().contains("649.90"));
        assertTrue(response.getBody().contains("PROD-003"));
    }

    @Test
    void getByIdReturnsStandardErrorEnvelopeForMissingProduct() {
        var response = rest.getForEntity("/api/v1/products/PROD-999", String.class);

        assertEquals(404, response.getStatusCode().value());
        assertTrue(response.getBody().contains("PRODUCT_NOT_FOUND"));
        assertTrue(response.getBody().contains("requestId"));
    }

    @Test
    void batchPricesReturnsFoundAndNotFoundProducts() {
        seedProduct("PROD-001", "ATIVO", price("3500.00", Instant.parse("2025-01-01T00:00:00Z"), null));
        seedProduct("PROD-004", "INATIVO", price("1200.00", Instant.parse("2025-01-01T00:00:00Z"), null));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"productIds\":[\"PROD-001\",\"PROD-004\",\"PROD-999\"]}";

        var response = rest.postForEntity("/api/v1/products/prices", new HttpEntity<>(body, headers), String.class);

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().contains("PROD-001"));
        assertTrue(response.getBody().contains("INATIVO"));
        assertTrue(response.getBody().contains("PROD-999"));
    }

    @Test
    void batchPricesReturnsNullCurrentPriceForProductWithoutValidWindow() {
        seedProduct("PROD-005", "ATIVO", price("599.00", Instant.now().plusSeconds(86_400), null));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"productIds\":[\"PROD-005\"]}";

        var response = rest.postForEntity("/api/v1/products/prices", new HttpEntity<>(body, headers), String.class);

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().contains("PROD-005"));
        assertTrue(response.getBody().contains("\"currentPrice\":null"));
    }

    @Test
    void batchPricesRejectsEmptyProductIds() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        var response = rest.postForEntity(
                "/api/v1/products/prices", new HttpEntity<>("{\"productIds\":[]}", headers), String.class);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().contains("VALIDATION_ERROR"));
    }

    @Test
    void healthEndpointIsAvailable() {
        var response = rest.getForEntity("/actuator/health", String.class);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
    }

    private void seedProduct(String id, String status, MongoPriceDocument... prices) {
        MongoProductDocument document = new MongoProductDocument();
        document.setId(id);
        document.setName("Product " + id);
        document.setDescription("Seeded product");
        document.setStatus(status);
        document.setPrices(List.of(prices));
        repository.save(document);
    }

    private MongoPriceDocument price(String value, Instant validFrom, Instant validTo) {
        MongoPriceDocument price = new MongoPriceDocument();
        price.setValue(new BigDecimal(value));
        price.setCurrency("BRL");
        price.setValidFrom(validFrom);
        price.setValidTo(validTo);
        return price;
    }
}
