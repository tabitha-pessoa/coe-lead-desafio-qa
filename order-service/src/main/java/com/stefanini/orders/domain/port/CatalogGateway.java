package com.stefanini.orders.domain.port;

import java.util.Collection;

public interface CatalogGateway {

    CatalogPrices fetchPrices(Collection<String> productIds);
}
