package com.stefanini.orders.presentation;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI orderOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Order Service API")
                .description("Order creation, listing and detail. Prices are validated against the Catalog Service")
                .version("1.0.0"));
    }
}
