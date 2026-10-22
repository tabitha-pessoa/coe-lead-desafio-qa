# ADR-012: Status inicial CRIADO e ciclo de vida mínimo

**Status:** Aceita

## Contexto

O desafio exige campo `status` no pedido, mas apenas criação e consulta — sem transição de estado (pagamento, envio, cancelamento).

## Decisão

`OrderStatus` é um enum com o valor `CRIADO`, atribuído na criação. Não se modelam estados que não existem no escopo: um enum com PAGO/ENVIADO/CANCELADO sem use cases que transicionem seria código morto com falso ciclo de vida.

## Consequências

- **Positivas:** schema pronto para evolução (VARCHAR(20) + índice em status); sem comportamento não especificado; filtro por status já útil para clientes.
- **Negativas:** evolução exigirá novos use cases e tratamento de transições inválidas (caminho natural de evolução do domínio).
