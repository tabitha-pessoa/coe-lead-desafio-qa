# ADR-005: Regra de desconto configurável em tabela

**Status:** Aceita

## Contexto

O desafio exige regra de desconto **não fixa em código**. O enunciado original menciona apenas "desconto aplicado" sem especificar valores — a regra concreta (mínimo e percentual) é uma decisão técnica adicionada ao requisito.

## Decisão

Tabela `discount_rule` (minimum_amount, percentage, active) com a regra ativa definida por `findFirstByActiveTrueOrderByCreatedAtAsc`. Semeador Flyway V2: subtotal >= R$ 1.000,00 -> 10%. Cálculo: `subtotal x percentage / 100`, HALF_UP, 2 casas; desconto zero abaixo do mínimo ou sem regra ativa. Regra inválida (percentual fora de 0-100) levanta `INVALID_BUSINESS_RULE` (500) — erro de configuração, não do cliente.

## Consequências

- **Positivas:** alterar a política de desconto não exige deploy (UPDATE na tabela); histórico de regras preservado; validação de domínio impede regras absurdas.
- **Negativas:** apenas uma regra ativa por vez (suficiente para o escopo; múltiplas regras por faixa seriam evolução natural); administração por SQL no contexto do desafio.
