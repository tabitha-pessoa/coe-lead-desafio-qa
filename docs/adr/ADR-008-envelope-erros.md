# ADR-008: Envelope padronizado de erros com código estável e requestId

**Status:** Aceita

## Contexto

Dois serviços consumidos por clientes distintos precisam de contrato de erro previsível. Mensagens de erro humanas mudam; clientes precisam programar contra códigos estáveis.

## Decisão

Todo erro responde o envelope `{"error": {"code", "message", "details"}, "requestId"}`:

- `code` é estável e documentado (VALIDATION_ERROR, ORDER_NOT_FOUND, PRODUCT_NOT_FOUND, PRODUCT_INACTIVE, NO_CURRENT_PRICE, CATALOG_UNAVAILABLE, CATALOG_TIMEOUT, DATABASE_ERROR, INVALID_BUSINESS_RULE, INTERNAL_ERROR, PAYLOAD_TOO_LARGE).
- Semântica HTTP: 400 entrada inválida; 404 recurso inexistente; 422 regra de negócio violada (produto inativo/sem preço); 413 payload grande; 5xx falha infraestrutura (503/504 classificam a dependência).
- `details` carrega os campos/IDs problemáticos; `requestId` correlaciona com logs.
- Erros internos nunca vazam stack trace — mensagem genérica ao cliente, detalhe no log do servidor.

## Consequências

- **Positivas:** clientes tratam erros por código; suporte cruza requestId com logs JSON; semântica consistente entre os dois serviços.
- **Negativas:** contrato precisa ser mantido ao evoluir códigos (evolução aditiva: novos códigos, nunca reutilizar códigos com significado diferente).
