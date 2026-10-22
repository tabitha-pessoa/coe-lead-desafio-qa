# ADR-015: Dinheiro com BigDecimal, escala 2 e HALF_UP

**Status:** Aceita

## Contexto

Cálculos monetários com `float`/`double` geram erros de representação binária (ex.: 0.1 + 0.2 != 0.3). Pedidos envolvem multiplicação (preço x quantidade), percentual de desconto e persistência — a política de arredondamento precisa ser única e determinística.

## Decisão

- Todos os valores monetários como `BigDecimal`, persistidos em `NUMERIC(12,2)`.
- Arredondamento único: `HALF_UP` com escala 2, aplicado no cálculo de linha, subtotal, desconto e total (`OrderCalculator`).
- Moeda fixa `BRL` no contexto do desafio (sem conversão), registrada no preço do catálogo.

## Consequências

- **Positivas:** resultados reproduzíveis e auditáveis (ex.: 7499.90 x 10% = 749.99); invariantes reforçadas por CHECK no banco (discount <= subtotal, total >= 0).
- **Negativas:** `BigDecimal` é mais verboso que primitivos; multi-moeda exigiria política de conversão e arredondamento por moeda (evolução fora do escopo).
