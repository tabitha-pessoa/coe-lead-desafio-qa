package com.stefanini.catalog.presentation;

import com.stefanini.catalog.application.GetProductPricesUseCase;
import com.stefanini.catalog.application.GetProductUseCase;
import com.stefanini.catalog.application.dto.BatchPricesResult;
import com.stefanini.catalog.domain.model.Product;
import com.stefanini.catalog.presentation.dto.BatchPricesRequest;
import com.stefanini.catalog.presentation.dto.BatchPricesResponse;
import com.stefanini.catalog.presentation.dto.ProductResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final GetProductUseCase getProductUseCase;
    private final GetProductPricesUseCase getProductPricesUseCase;

    public ProductController(GetProductUseCase getProductUseCase, GetProductPricesUseCase getProductPricesUseCase) {
        this.getProductUseCase = getProductUseCase;
        this.getProductPricesUseCase = getProductPricesUseCase;
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable String id) {
        Product product = getProductUseCase.execute(id);
        return ProductResponse.from(product, product.currentPriceAt(Instant.now()).orElse(null));
    }

    @PostMapping("/prices")
    public BatchPricesResponse getPrices(@Valid @RequestBody BatchPricesRequest request) {
        BatchPricesResult result = getProductPricesUseCase.execute(request.productIds());
        return BatchPricesResponse.from(result);
    }
}
