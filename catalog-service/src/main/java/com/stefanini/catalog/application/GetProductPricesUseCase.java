package com.stefanini.catalog.application;

import com.stefanini.catalog.application.dto.BatchPricesResult;
import com.stefanini.catalog.application.dto.ProductPriceView;
import com.stefanini.catalog.domain.model.PriceEntry;
import com.stefanini.catalog.domain.model.Product;
import com.stefanini.catalog.domain.port.ProductRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class GetProductPricesUseCase {

    private final ProductRepository productRepository;

    public GetProductPricesUseCase(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public BatchPricesResult execute(List<String> productIds) {
        List<String> distinctIds = productIds.stream().distinct().toList();
        Map<String, Product> productsById = productRepository.findByIdIn(distinctIds).stream()
                .collect(Collectors.toMap(Product::id, Function.identity()));
        Instant now = Instant.now();
        List<ProductPriceView> views = new ArrayList<>();
        List<String> notFound = new ArrayList<>();
        for (String id : distinctIds) {
            Product product = productsById.get(id);
            if (product == null) {
                notFound.add(id);
                continue;
            }
            PriceEntry currentPrice = product.currentPriceAt(now).orElse(null);
            views.add(new ProductPriceView(product.id(), product.name(), product.status(), currentPrice));
        }
        return new BatchPricesResult(List.copyOf(views), List.copyOf(notFound));
    }
}
