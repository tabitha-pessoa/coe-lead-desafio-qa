package com.stefanini.catalog.infrastructure.persistence;

import com.stefanini.catalog.domain.model.PriceEntry;
import com.stefanini.catalog.domain.model.Product;
import com.stefanini.catalog.domain.model.ProductStatus;
import com.stefanini.catalog.domain.port.ProductRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductPersistenceAdapter implements ProductRepository {

    private final MongoProductRepository repository;

    public ProductPersistenceAdapter(MongoProductRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Product> findById(String id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Product> findByIdIn(Collection<String> ids) {
        return repository.findByIdIn(ids).stream().map(this::toDomain).toList();
    }

    private Product toDomain(MongoProductDocument document) {
        List<PriceEntry> prices = document.getPrices().stream()
                .map(price -> new PriceEntry(price.getValue(), price.getCurrency(), price.getValidFrom(), price.getValidTo()))
                .toList();
        return new Product(
                document.getId(),
                document.getName(),
                document.getDescription(),
                ProductStatus.from(document.getStatus()),
                prices);
    }
}
