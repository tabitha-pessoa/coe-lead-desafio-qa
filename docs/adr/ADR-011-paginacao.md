# ADR-011: Paginação com limite máximo de tamanho

**Status:** Aceita

## Contexto

Listagem de pedidos sem paginação degrada com volume; `size` ilimitado permite um cliente pedir a base inteira em um request (risco de memória e latência).

## Decisão

`GET /api/v1/orders` pagina com `page` (default 0) e `size` (default 20, máximo 100, valores fora da faixa normalizados). Ordenação fixa por `createdAt DESC` (pedidos mais recentes primeiro) — não exposta ao cliente no MVP. Filtro opcional por `status` validado contra o enum (valor inválido -> 400 com a lista de valores aceitos).

## Consequências

- **Positivas:** resposta com tamanho bornado; índice `idx_orders_created_at` suporta a ordenação; contrato simples.
- **Negativas:** ordenação/colunas de filtro fixas (suficiente para o escopo; generalização seria evolução com allowlist de campos).
