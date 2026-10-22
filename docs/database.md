# Modelagem de Dados

## PostgreSQL (order-service)

Schema gerenciado por Flyway (`order-service/src/main/resources/db/migration/`), com `ddl-auto: validate` — o Hibernate apenas confere que as entidades correspondem ao schema versionado.

### orders (V1__create_schema.sql)

| Coluna | Tipo | Restrições |
|---|---|---|
| id | UUID | PK |
| client_name | VARCHAR(120) | NOT NULL |
| client_document | VARCHAR(20) | NOT NULL |
| client_email | VARCHAR(120) | NOT NULL |
| subtotal | NUMERIC(12,2) | NOT NULL |
| discount | NUMERIC(12,2) | NOT NULL |
| total | NUMERIC(12,2) | NOT NULL |
| status | VARCHAR(20) | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |

CHECK: `total >= 0 AND discount >= 0 AND discount <= subtotal` — invariantes de negócio garantidas no banco, além da validação de domínio.

Índices: `idx_orders_created_at` (DESC, ordenação da listagem), `idx_orders_status` (filtro).

### order_items

| Coluna | Tipo | Restrições |
|---|---|---|
| id | BIGSERIAL | PK |
| order_id | UUID | FK -> orders.id, NOT NULL |
| product_id | VARCHAR(50) | NOT NULL |
| product_name | VARCHAR(160) | NOT NULL (snapshot, ADR-006) |
| unit_price | NUMERIC(12,2) | NOT NULL (snapshot, ADR-006) |
| quantity | INTEGER | NOT NULL, CHECK quantity > 0 |
| line_total | NUMERIC(12,2) | NOT NULL |

Índice: `idx_order_items_order_id` (busca dos itens por página de pedidos).

### discount_rule (ADR-005)

| Coluna | Tipo | Restrições |
|---|---|---|
| id | BIGSERIAL | PK |
| minimum_amount | NUMERIC(12,2) | NOT NULL, CHECK >= 0 |
| percentage | NUMERIC(5,2) | NOT NULL, CHECK 0 < percentage <= 100 |
| active | BOOLEAN | NOT NULL DEFAULT FALSE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

A regra ativa é a mais antiga com `active = TRUE` (`findFirstByActiveTrueOrderByCreatedAtAsc`). A migração V2 semeia: `minimum_amount = 1000.00`, `percentage = 10.00`, `active = TRUE`.

### Padrões de acesso

- Consultas 100% parametrizadas via Spring Data JPA (JPQL e derived queries) — nenhuma concatenação de SQL.
- Detalhe do pedido: `join fetch` em uma query.
- Listagem paginada: 1 count + 1 select da página + 1 select de itens com `IN (order_ids)` — exatamente 3 statements, comprovado por asserção em `OrderPersistenceIT` (anti-N+1, ADR-010).

## MongoDB (catalog-service)

Coleção `products`, inicializada pelo seed `docker/mongo-init.js`:

```json
{
  "_id": "PROD-001",
  "name": "Notebook Dell Inspiron 15",
  "description": "Notebook 15,6 polegadas, 16 GB RAM, SSD 512 GB",
  "status": "ATIVO",
  "prices": [
    {"value": 3200.00, "currency": "BRL", "validFrom": "2025-01-01T00:00:00Z", "validTo": "2025-12-31T23:59:59Z"},
    {"value": 3500.00, "currency": "BRL", "validFrom": "2026-01-01T00:00:00Z", "validTo": null}
  ]
}
```

- Histórico de preços como array embutido de janelas com vigência (`validFrom`/`validTo`, ADR-007); o preço vigente é calculado em memória (`PriceEntry.isCurrentAt`), sem query por janela.
- Consulta por lote com `findByIdIn` — uma query por requisição, independentemente do número de itens (ADR-010).
- Seed cobre os cenários de teste: preço vigente, histórico com janelas, produto inativo (`PROD-004`), preço futuro (`PROD-005`) e preço expirado (`PROD-006`).

## Dinheiro (ADR-015)

Todos os valores monetários usam `BigDecimal` com escala 2 e arredondamento `HALF_UP`, persistidos como `NUMERIC(12,2)`. Moeda fixa `BRL` no contexto do desafio (sem conversão).
