package com.stefanini.catalog.domain.port;

import com.stefanini.catalog.domain.model.Product;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductRepository {

    Optional<Product> findById(String id);

    List<Product> findByIdIn(Collection<String> ids);
}
