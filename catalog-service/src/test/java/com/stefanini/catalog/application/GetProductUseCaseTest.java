package com.stefanini.catalog.application;

import com.stefanini.catalog.domain.exception.ProductNotFoundException;
import com.stefanini.catalog.domain.model.PriceEntry;
import com.stefanini.catalog.domain.model.Product;
import com.stefanini.catalog.domain.model.ProductStatus;
import com.stefanini.catalog.domain.port.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetProductUseCaseTest {

    @Mock
    private ProductRepository productRepository;

    private GetProductUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GetProductUseCase(productRepository);
    }

    @Test
    void returnsProductWhenItExists() {
        Product product = new Product("PROD-001", "Notebook", "desc", ProductStatus.ATIVO, List.of(
                new PriceEntry(new BigDecimal("3500.00"), "BRL", Instant.parse("2025-01-01T00:00:00Z"), null)));
        when(productRepository.findById("PROD-001")).thenReturn(Optional.of(product));

        assertEquals(product, useCase.execute("PROD-001"));
    }

    @Test
    void throwsProductNotFoundWhenMissing() {
        when(productRepository.findById("PROD-999")).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class, () -> useCase.execute("PROD-999"));
    }
}
