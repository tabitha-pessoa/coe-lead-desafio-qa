# ADR-010: Estratégia anti-N+1 com asserções nos testes

**Status:** Aceita

## Contexto

O desafio proíbe explicitamente consultas ineficientes (ex.: uma consulta por item dentro de laço). O padrão N+1 aparece em dois pontos: integração HTTP (pedido com N itens -> N chamadas ao catálogo) e persistência (página com N pedidos -> N selects de itens).

## Decisão

- **Integração:** 1 chamada HTTP em lote por pedido; o catálogo resolve com 1 query `findByIdIn`.
- **Persistência:** detalhe com `join fetch`; listagem paginada com 1 count + 1 select da página + 1 select de itens com `IN (order_ids)`.
- **Prova por teste:** `OrderApiIT` assere exatamente **1 chamada HTTP** por criação (drenando o MockWebServer); `OrderPersistenceIT` assere exatamente **3 prepared statements** na listagem via `hibernate.generate_statistics`. A ausência de N+1 é requisito testado, não intenção declarada.

## Consequências

- **Positivas:** performance previsível e independente do número de itens; regressão de N+1 quebra o CI.
- **Negativas:** asserções de contagem são sensíveis a mudanças de implementação (aceitável: mudança de estratégia de query deve ser consciente e atualizar o teste).
