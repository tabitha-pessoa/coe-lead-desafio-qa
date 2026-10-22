# ADR-004: Integração síncrona em lote com fail-fast

**Status:** Aceita

## Contexto

O order-service precisa validar itens e preços no catálogo no momento da criação do pedido. Opções: chamada por item, chamada em lote síncrona, ou desacoplamento por eventos/mensageria.

## Decisão

Uma única chamada HTTP síncrona em lote (`POST /api/v1/products/prices`) por criação de pedido, com validação fail-fast: qualquer produto inexistente, inativo ou sem preço vigente aborta a criação inteira (nada é persistido). Resiliência: 2 tentativas em erro de conexão, timeouts classificados (504 para timeout, 503 para indisponibilidade).

Mensageria foi descartada: a validação precisa do resultado **no mesmo request** para aceitar ou rejeitar o pedido; eventos não entregam essa semântica sem complexidade adicional desproporcional ao escopo.

## Consequências

- **Positivas:** 1 chamada HTTP e 1 query no catálogo por pedido (anti-N+1); sem infraestrutura de broker; semântica transacional simples (all-or-nothing).
- **Negativas:** o catálogo indisponível bloqueia criação de pedidos (comportamento desejado: não criar pedido com preço não validado); latência da criação inclui a chamada ao catálogo (mitigada por timeout curto e retry).
