# Levantamento de Requisitos

Fonte: `coe-leader-desenvolvimento-candidatura-desafio-tecnico.md` (desafio oficial da candidatura COE Leader — Desenvolvimento, Stefanini Group).

## Parte 1 — API RESTful de Pedidos (banco relacional)

### Requisitos funcionais

| ID | Requisito | Implementação |
|---|---|---|
| RF-01 | Criar pedido com cliente, itens, quantidades, subtotal, desconto aplicado, total e status | `POST /api/v1/orders` (order-service) |
| RF-02 | Listar pedidos | `GET /api/v1/orders?page&size&status` com paginação |
| RF-03 | Consultar pedido por identificador | `GET /api/v1/orders/{id}` |
| RF-04 | Regra de desconto configurável (não fixa em código) | Tabela `discount_rule` (Flyway V2 semeia: subtotal ≥ R$ 1.000,00 → 10%) |
| RF-05 | Validar item e preço no momento da criação, consumindo o Catálogo | Chamada em lote a `POST /api/v1/products/prices` |

### Requisitos não funcionais

| ID | Requisito | Implementação |
|---|---|---|
| RNF-01 | Stack justificada | Java 17 + Spring Boot 3 (ADR-001) |
| RNF-02 | Clean Code e Clean Architecture | Camadas domain/application/infrastructure/presentation (ADR-003) |
| RNF-03 | Banco relacional | PostgreSQL 16 (ADR-002) |
| RNF-04 | Consultas parametrizadas, sem concatenação de strings | Spring Data JPA (JPQL/derived queries) — sem SQL dinâmico concatenado |
| RNF-05 | Testes automatizados cobrindo a criação de pedido | 25 unitários + `OrderApiIT` (caminho feliz, validações, resiliência) + `OrderPersistenceIT` |
| RNF-06 | Git + GitFlow com histórico organizado | Branches `main`/`develop`/`feature/*`, commits convencionais |

### Regras de negócio detalhadas

- Pedido rejeitado se qualquer produto não existir, estiver inativo ou não tiver preço vigente (validação all-or-nothing: nada é persistido).
- Itens duplicados no payload são rejeitados (`VALIDATION_ERROR`).
- Quantidade por item: 1 a 999; máximo de 100 itens por pedido; corpo da requisição limitado a 1 MB.
- Preço e nome do produto são persistidos no item do pedido (snapshot — ADR-006).
- Desconto: `subtotal × percentage / 100`, arredondado `HALF_UP` com 2 casas; zero quando abaixo do mínimo ou sem regra ativa.
- Status inicial: `CRIADO` (ADR-012).

## Parte 2 — Serviço de Catálogo (banco não relacional)

| ID | Requisito | Implementação |
|---|---|---|
| RF-06 | Endpoint de consulta de produtos com preço vigente | `GET /api/v1/products/{id}` |
| RF-07 | API REST consumida pelo serviço de Pedidos para validar item e preço | `POST /api/v1/products/prices` (lote, máx. 50 IDs) |
| RNF-07 | Banco não relacional | MongoDB 7 (ADR-002) |
| RNF-08 | Sem consultas ineficientes (ex.: uma consulta por item em laço) | Uma query `findByIdIn` por requisição em lote; o order-service faz 1 chamada HTTP por pedido (ADR-010) |

### Modelo de preço

Cada produto possui um histórico de janelas de preço com `validFrom`/`validTo` (ADR-007). O preço vigente é a janela cujo intervalo contém o instante da consulta. O seed (`docker/mongo-init.js`) cobre: preço vigente, janela expirada, janela futura, produto inativo e produto sem janela vigente.

## Diferenciais implementados

| Diferencial | Implementação |
|---|---|
| IA para sugerir/revisar validações e mensagens de erro | [docs/ai-development.md](ai-development.md) |
| IA aplicada às atividades de QA com prompts e validação humana documentados | [docs/qa/05-ai-usage.md](qa/05-ai-usage.md); ChatGPT documentado como alternativa ao SAI App 3.0 indisponível neste ambiente |
| Esteira CI/CD com testes como gate obrigatório | `.github/workflows/ci.yml`: Spotless → `mvn verify` (unit + IT) → OWASP Dependency-Check/npm audit → frontend → Playwright API/UI → k6 → ZAP baseline → build de imagens; push para `main` publica imagens versionadas no GHCR após todos os gates |
| Testes automatizados de segurança | Dependency-Check Maven, npm audit e OWASP ZAP passive baseline na CI; execução ZAP semanal/manual e resultados reportados em `docs/qa/security-findings.md` |
| Governança de QA para squads | `docs/qa/03-governance-standard.md`, com padrões de automação e bloqueios de PR |
| Dimensionamento hipotético de três semanas | `docs/qa/04-commercial-estimation.md`, com um QA Sênior e um QA Pleno, premissas e modelo de precificação |
| Guia de code review multi-stack | [docs/code-review-guide.md](code-review-guide.md) |
| Dimensionamento técnico da proposta | [docs/technical-estimation.md](technical-estimation.md) |
| Governança com ADRs | [docs/adr/](adr/) (15 decisões) |

## Fora do escopo (documentado)

- Autenticação/autorização (ADR-013) — os endpoints são abertos no contexto do desafio.
- Frontend Angular (ADR-014) — o plano de 14 fases da proposta não inclui fase de frontend; a stack Angular permanece como direção para evolução.
- Cancelamento/atualização de status de pedidos — apenas criação e consulta são exigidos.
