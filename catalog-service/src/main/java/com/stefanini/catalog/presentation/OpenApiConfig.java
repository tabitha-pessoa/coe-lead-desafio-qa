package com.stefanini.catalog.presentation;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI catalogOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Catalog Service API")
                .description("Products and current prices consumed by the Order Service")
                .version("1.0.0"));
    }
}
