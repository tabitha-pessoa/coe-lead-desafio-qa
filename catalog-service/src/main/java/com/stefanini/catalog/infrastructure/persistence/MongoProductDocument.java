package com.stefanini.catalog.infrastructure.persistence;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "products")
public class MongoProductDocument {

    @Id
    private String id;

    private String name;

    private String description;

    private String status;

    private List<MongoPriceDocument> prices = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<MongoPriceDocument> getPrices() {
        return prices;
    }

    public void setPrices(List<MongoPriceDocument> prices) {
        this.prices = prices;
    }
}
