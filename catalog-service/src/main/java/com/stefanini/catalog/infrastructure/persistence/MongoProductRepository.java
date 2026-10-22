package com.stefanini.catalog.infrastructure.persistence;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface MongoProductRepository extends MongoRepository<MongoProductDocument, String> {

    List<MongoProductDocument> findByIdIn(Collection<String> ids);
}
