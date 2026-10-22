# ADR-006: Snapshot de preço e nome no item do pedido

**Status:** Aceita

## Contexto

O preço do produto pode mudar após a criação do pedido. Se o pedido referenciar apenas o `productId`, a consulta histórica mostraria preços que não foram os praticados na compra.

## Decisão

O item do pedido persiste `productId`, `productName` e `unitPrice` no momento da criação (snapshot). O catálogo é fonte da verdade para produtos **vigentes**; o pedido é fonte da verdade para o que foi **comprado**.

## Consequências

- **Positivas:** histórico imutável e auditável; consulta de pedidos não depende do catálogo (desacopla leitura entre serviços); renomeação/repreçamento de produto não corrompe pedidos antigos.
- **Negativas:** denormalização (nome/preço duplicados); pedidos não refletem retroativamente correções de preço (comportamento desejado em vendas).
