# ADR-003: Clean Architecture com empacotamento por camada

**Status:** Aceita

## Contexto

O desafio exige Clean Code e Clean Architecture. Duas organizações comuns: por camada (domain/application/infrastructure/presentation) ou por feature. A regra de dependência precisa ser explícita e verificável em review.

## Decisão

Empacotamento por camada dentro de cada serviço (`com.stefanini.{orders|catalog}.{domain|application|infrastructure|presentation}`):

- `domain`: records puros, exceções, cálculos e **portas** (interfaces `OrderRepository`, `CatalogGateway`, etc.) — zero dependência de framework.
- `application`: use cases orquestrando portas.
- `infrastructure`: adaptadores (JPA, Mongo, RestClient HTTP) implementando portas.
- `presentation`: controllers, DTOs, filtros e tratamento de erros.

Compromisso pragmático: use cases usam `@Component` e `@Transactional` do Spring. Uma camada extra de composição foi considerada e descartada — o acoplamento residual é pequeno e confinado à aplicação.

## Consequências

- **Positivas:** domínio testável sem Spring; troca de adaptadores (ex.: gateway HTTP por mensageria) sem tocar em regras; revisão consegue verificar a direção das dependências por inspeção de imports.
- **Negativas:** mais arquivos/indireção que um CRUD plano; anotações Spring na camada de aplicação (compromisso documentado).
