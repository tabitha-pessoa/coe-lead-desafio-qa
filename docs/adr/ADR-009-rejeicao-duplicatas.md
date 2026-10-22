# ADR-009: Rejeição de itens duplicados no payload

**Status:** Aceita

## Contexto

Um pedido pode receber o mesmo `productId` em dois itens (ex.: 1 unidade + 2 unidades). O comportamento é ambíguo: somar, rejeitar ou ignorar?

## Decisão

Rejeitar com `VALIDATION_ERROR` ("productId: duplicate product X"). A soma implícita escondida do cliente gera pedidos diferentes do esperado; a rejeição torna o contrato explícito — quem quer 3 unidades envia `quantity: 3`. Internamente o use case mantém deduplicação defensiva dos IDs antes de chamar o catálogo.

## Consequências

- **Positivas:** sem ambiguidade de negócio; validação falha cedo (antes de chamar o catálogo); contrato claro na documentação da API.
- **Negativas:** clientes que agregavam itens duplicados precisam ajustar o payload (comportamento documentado).
