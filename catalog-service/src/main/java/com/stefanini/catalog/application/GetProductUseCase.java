package com.stefanini.catalog.application;

import com.stefanini.catalog.domain.exception.ProductNotFoundException;
import com.stefanini.catalog.domain.model.Product;
import com.stefanini.catalog.domain.port.ProductRepository;
import org.springframework.stereotype.Component;

@Component
public class GetProductUseCase {

    private final ProductRepository productRepository;

    public GetProductUseCase(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product execute(String id) {
        return productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
    }
}
