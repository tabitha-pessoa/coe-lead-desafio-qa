package com.stefanini.catalog.application;

import com.stefanini.catalog.application.dto.BatchPricesResult;
import com.stefanini.catalog.domain.model.PriceEntry;
import com.stefanini.catalog.domain.model.Product;
import com.stefanini.catalog.domain.model.ProductStatus;
import com.stefanini.catalog.domain.port.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetProductPricesUseCaseTest {

    @Mock
    private ProductRepository productRepository;

    private GetProductPricesUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GetProductPricesUseCase(productRepository);
    }

    @Test
    void fetchesAllProductsInSingleBatchQuery() {
        when(productRepository.findByIdIn(anyCollection())).thenReturn(List.of(
                product("PROD-001", ProductStatus.ATIVO, currentPrice("3500.00")),
                product("PROD-002", ProductStatus.ATIVO, currentPrice("499.90"))));

        BatchPricesResult result = useCase.execute(List.of("PROD-001", "PROD-002", "PROD-001"));

        ArgumentCaptor<Collection<String>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(productRepository, times(1)).findByIdIn(captor.capture());
        assertEquals(List.of("PROD-001", "PROD-002"), List.copyOf(captor.getValue()));
        assertEquals(2, result.prices().size());
        assertTrue(result.notFound().isEmpty());
    }

    @Test
    void reportsMissingProductsInNotFoundList() {
        when(productRepository.findByIdIn(anyCollection())).thenReturn(List.of());

        BatchPricesResult result = useCase.execute(List.of("PROD-999"));

        assertTrue(result.prices().isEmpty());
        assertEquals(List.of("PROD-999"), result.notFound());
    }

    @Test
    void returnsNullCurrentPriceForProductWithoutValidWindow() {
        PriceEntry future = new PriceEntry(new BigDecimal("599.00"), "BRL",
                Instant.parse("2030-01-01T00:00:00Z"), null);
        Product product = new Product("PROD-005", "Webcam", "desc", ProductStatus.ATIVO, List.of(future));
        when(productRepository.findByIdIn(anyCollection())).thenReturn(List.of(product));

        BatchPricesResult result = useCase.execute(List.of("PROD-005"));

        assertNull(result.prices().get(0).currentPrice());
    }

    @Test
    void includesInactiveProductWithItsStatus() {
        Product inactive = product("PROD-004", ProductStatus.INATIVO, currentPrice("1200.00"));
        when(productRepository.findByIdIn(anyCollection())).thenReturn(List.of(inactive));

        BatchPricesResult result = useCase.execute(List.of("PROD-004"));

        assertEquals(ProductStatus.INATIVO, result.prices().get(0).status());
    }

    private Product product(String id, ProductStatus status, PriceEntry price) {
        return new Product(id, "Product " + id, "desc", status, List.of(price));
    }

    private PriceEntry currentPrice(String value) {
        return new PriceEntry(new BigDecimal(value), "BRL", Instant.parse("2025-01-01T00:00:00Z"), null);
    }
}
