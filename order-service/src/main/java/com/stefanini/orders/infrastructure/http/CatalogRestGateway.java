package com.stefanini.orders.infrastructure.http;

import com.stefanini.orders.domain.exception.CatalogTimeoutException;
import com.stefanini.orders.domain.exception.CatalogUnavailableException;
import com.stefanini.orders.domain.port.CatalogGateway;
import com.stefanini.orders.domain.port.CatalogPrice;
import com.stefanini.orders.domain.port.CatalogPrices;
import com.stefanini.orders.domain.port.CatalogProductStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Component
public class CatalogRestGateway implements CatalogGateway {

    private static final Logger log = LoggerFactory.getLogger(CatalogRestGateway.class);
    private static final String PRICES_PATH = "/api/v1/products/prices";
    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final int MAX_ATTEMPTS = 2;

    private final RestClient restClient;

    public CatalogRestGateway(RestClient.Builder builder, CatalogProperties properties) {
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory(properties))
                .build();
    }

    @Override
    public CatalogPrices fetchPrices(Collection<String> productIds) {
        CatalogPricesResponse response = executeWithRetry(productIds);
        List<CatalogPrice> found = response.prices() == null
                ? List.of()
                : response.prices().stream().map(this::toPort).toList();
        List<String> notFound = response.notFound() == null ? List.of() : response.notFound();
        return new CatalogPrices(found, notFound);
    }

    private CatalogPricesResponse executeWithRetry(Collection<String> productIds) {
        ResourceAccessException lastException = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                CatalogPricesResponse response = restClient.post()
                        .uri(PRICES_PATH)
                        .header(REQUEST_ID_HEADER, currentRequestId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(new CatalogPricesRequest(List.copyOf(productIds)))
                        .retrieve()
                        .body(CatalogPricesResponse.class);
                return Objects.requireNonNullElseGet(response,
                        () -> {
                            throw new CatalogUnavailableException("Catalog service returned an empty response", null);
                        });
            } catch (ResourceAccessException e) {
                log.warn("catalog_call_failed attempt={} requestId={}", attempt, currentRequestId(), e);
                lastException = e;
            } catch (RestClientResponseException e) {
                throw new CatalogUnavailableException("Catalog service returned HTTP error", e);
            }
        }
        if (lastException != null && lastException.getCause() instanceof SocketTimeoutException) {
            throw new CatalogTimeoutException("Catalog service timed out");
        }
        throw new CatalogUnavailableException("Catalog service is unreachable", lastException);
    }

    private CatalogPrice toPort(CatalogPriceResponse price) {
        return new CatalogPrice(
                price.productId(),
                price.name(),
                CatalogProductStatus.from(price.status()),
                price.currentPrice() == null ? null : price.currentPrice().value());
    }

    private String currentRequestId() {
        String requestId = MDC.get("requestId");
        return requestId == null ? "unknown" : requestId;
    }

    private org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory(CatalogProperties properties) {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(properties.connectTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(properties.readTimeoutMs()));
        return factory;
    }
}
