# ADR-007: Janela de vigência de preço (validFrom/validTo)

**Status:** Aceita

## Contexto

"Preço vigente" precisa de definição operacional: o catálogo deve responder qual preço vale **agora**, com suporte a reajustes futuros e histórico.

## Decisão

Cada preço é uma janela com `validFrom` (inclusivo) e `validTo` (exclusivo, nullable = vigente indefinidamente). O preço vigente é a janela cujo intervalo contém o instante da consulta: `validFrom <= agora < validTo`. A seleção é feita em memória sobre o array embutido do documento (`PriceEntry.isCurrentAt`), sem query adicional.

## Consequências

- **Positivas:** reajustes futuros podem ser cadastrados com antecedência; histórico completo por produto; semântica explícita e testável (testes de borda: exatamente validFrom vigente, exatamente validTo expirado).
- **Negativas:** janelas sobrepostas não são impedidas pelo MongoDB (validação de aplicação seria evolução); custo de ler o array inteiro é desprezível para o volume do desafio.
