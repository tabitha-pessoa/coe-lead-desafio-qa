# ADR-002: PostgreSQL para pedidos e MongoDB para catálogo

**Status:** Aceita

## Contexto

O desafio exige banco relacional para pedidos e não relacional para o catálogo. PostgreSQL, MySQL e SQL Server são opções aceitas; MongoDB ou equivalente para o catálogo.

## Decisão

- **PostgreSQL 16** no order-service: transações ACID para a criação do pedido (pedido + itens + cálculo atômicos), constraints declarativas (CHECK de valores) e NUMERIC exato para dinheiro.
- **MongoDB 7** no catalog-service: documento de produto com array embutido de janelas de preço — o histórico pertence ao agregado do produto e é lido junto com ele.

## Consequências

- **Positivas:** cada banco resolve o problema para o qual é bom; o histórico de preços não exige joins; constraints no PostgreSQL protegem invariantes mesmo com bug de aplicação.
- **Negativas:** dois bancos para operar (mitigado pelo Docker Compose e CI com Testcontainers); sem transação distribuída entre serviços — aceitável pois a criação do pedido é a única escrita e o snapshot de preço elimina a necessidade de consistência contínua (ADR-006).
