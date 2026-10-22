package com.stefanini.orders.infrastructure.http;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "catalog")
public record CatalogProperties(
        @DefaultValue("http://localhost:8081") String baseUrl,
        @DefaultValue("2000") int connectTimeoutMs,
        @DefaultValue("3000") int readTimeoutMs) {
}
