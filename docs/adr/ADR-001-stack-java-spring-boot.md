# ADR-001: Stack Java 25 + Spring Boot 3

**Status:** Aceita

## Contexto

O desafio permite qualquer stack justificada. O candidato possui vivência multi-stack e a vaga cita Java entre as stacks desejadas; o briefing final do candidato definiu "Backend Java + Spring Boot" como direção.

## Decisão

Java 25 (LTS) com Spring Boot 3.5.16 para ambos os serviços: maturidade de ecossistema (Spring Data, Testcontainers, Flyway), tipagem forte para regras monetárias e alinhamento com o contexto da vaga.

## Consequências

- **Positivas:** ecossistema maduro para persistência e testes; modelos ricos com records e sealed patterns; mercado/contratação alinhado à vaga.
- **Negativas:** mais verboso que Node/TypeScript para CRUDs simples; build mais lento (mitigado por cache de dependências no CI).
