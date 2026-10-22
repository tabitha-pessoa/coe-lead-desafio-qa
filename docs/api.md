# Contratos de API

Todas as respostas de erro seguem o envelope único (ADR-008):

```json
{
  "error": {"code": "ORDER_NOT_FOUND", "message": "Order 550e... was not found", "details": []},
  "requestId": "3f2c1b8e-2f2a-4c1e-9a1b-111111111111"
}
```

O `requestId` é gerado pelo servidor (ou aceito do header `X-Request-Id` do cliente) e ecoado na resposta.

## order-service (porta 8080)

### POST /api/v1/orders

Cria um pedido validando itens e preços no catálogo em uma única chamada em lote.

Request:

```json
{
  "client": {
    "name": "Maria Silva",
    "document": "12345678901",
    "email": "maria@example.com"
  },
  "items": [
    {"productId": "PROD-001", "quantity": 2},
    {"productId": "PROD-002", "quantity": 1}
  ]
}
```

Validações: `name`/`document`/`email` obrigatórios (email com formato válido); 1 a 100 itens; `productId` obrigatório (max 50 chars); `quantity` entre 1 e 999; produtos duplicados rejeitados; corpo limitado a 1 MB.

Response `201 Created` (header `Location: /api/v1/orders/{id}`):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "client": {"name": "Maria Silva", "document": "12345678901", "email": "maria@example.com"},
  "items": [
    {"productId": "PROD-001", "productName": "Notebook Dell Inspiron 15", "unitPrice": 3500.00, "quantity": 2, "lineTotal": 7000.00},
    {"productId": "PROD-002", "productName": "Mouse Logitech MX Master 3S", "unitPrice": 499.90, "quantity": 1, "lineTotal": 499.90}
  ],
  "subtotal": 7499.90,
  "discount": 749.99,
  "total": 6749.91,
  "status": "CRIADO",
  "createdAt": "2026-09-25T17:00:00Z"
}
```

Erros: `400 VALIDATION_ERROR`, `422 PRODUCT_NOT_FOUND | PRODUCT_INACTIVE | NO_CURRENT_PRICE`, `503 CATALOG_UNAVAILABLE`, `504 CATALOG_TIMEOUT`, `413 PAYLOAD_TOO_LARGE`, `500 DATABASE_ERROR | INTERNAL_ERROR`.

### GET /api/v1/orders

Lista pedidos paginados, do mais recente para o mais antigo.

Query params: `page` (default 0), `size` (default 20, max 100), `status` (opcional; valores válidos: `CRIADO`).

Response `200 OK`:

```json
{
  "content": [ {"id": "...", "client": {...}, "items": [...], "subtotal": 7499.90, "discount": 749.99, "total": 6749.91, "status": "CRIADO", "createdAt": "..."} ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

Erros: `400 VALIDATION_ERROR` (status inválido).

### GET /api/v1/orders/{id}

Retorna o detalhe do pedido. Erros: `404 ORDER_NOT_FOUND`.

## catalog-service (porta 8081)

### GET /api/v1/products/{id}

Retorna o produto com o preço vigente no instante da consulta (janela `validFrom <= agora < validTo`).

Response `200 OK`:

```json
{
  "id": "PROD-001",
  "name": "Notebook Dell Inspiron 15",
  "description": "Notebook 15,6 polegadas, 16 GB RAM, SSD 512 GB",
  "status": "ATIVO",
  "currentPrice": {"value": 3500.00, "currency": "BRL", "validFrom": "2026-01-01T00:00:00Z", "validTo": null}
}
```

`currentPrice` é `null` quando não há janela vigente (ex.: produto com preço expirado ou futuro). Erros: `404 PRODUCT_NOT_FOUND`.

### POST /api/v1/products/prices

Consulta em lote para validação na criação de pedidos — uma única query ao MongoDB (`findByIdIn`), sem consulta por item em laço (ADR-010).

Request (max 50 IDs, sem duplicatas):

```json
{"productIds": ["PROD-001", "PROD-002"]}
```

Response `200 OK`:

```json
{
  "prices": [
    {"productId": "PROD-001", "name": "Notebook Dell Inspiron 15", "status": "ATIVO",
     "currentPrice": {"value": 3500.00, "currency": "BRL", "validFrom": "2026-01-01T00:00:00Z", "validTo": null}},
    {"productId": "PROD-002", "name": "Mouse Logitech MX Master 3S", "status": "ATIVO",
     "currentPrice": {"value": 499.90, "currency": "BRL", "validFrom": "2026-01-01T00:00:00Z", "validTo": null}}
  ],
  "notFound": []
}
```

IDs inexistentes são devolvidos em `notFound` (o consumidor decide a política de erro). Erros: `400 VALIDATION_ERROR`.

## OpenAPI

Contratos gerados por springdoc-openapi: `http://localhost:8080/v3/api-docs` e `http://localhost:8081/v3/api-docs`; Swagger UI em `/swagger-ui.html` em ambos os serviços.
