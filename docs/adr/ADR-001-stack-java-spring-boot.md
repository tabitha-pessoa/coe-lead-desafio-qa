# ADR-001: Stack Java 17 + Spring Boot 3

**Status:** Aceita

## Contexto

O desafio permite qualquer stack justificada. O candidato possui vivência multi-stack e a vaga cita Java entre as stacks desejadas; o briefing final do candidato definiu "Backend Java + Spring Boot" como direção.

## Decisão

Java 17 (LTS) com Spring Boot 3.3 para ambos os serviços: maturidade de ecossistema (Spring Data, Testcontainers, Flyway), tipagem forte para regras monetárias e alinhamento com o contexto da vaga.

## Consequências

- **Positivas:** ecossistema maduro para persistência e testes; modelos ricos com records e sealed patterns; mercado/contratação alinhado à vaga.
- **Negativas:** mais verboso que Node/TypeScript para CRUDs simples; build mais lento (mitigado por cache de dependências no CI).
