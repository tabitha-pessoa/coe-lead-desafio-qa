# Dimensionamento Técnico da Proposta

Cenário hipotético: entrega das Partes 1 e 2 do desafio (API de Pedidos + Serviço de Catálogo, integrados) em **3 semanas**, com equipe de **1 desenvolvedor sênior + 1 desenvolvedor pleno**.

## Premissas

- Escopo idêntico ao implementado: dois serviços com Clean Architecture, integração em lote, regra de desconto configurável, testes, Docker e CI/CD. Diferenciais (governança, dimensionamento, evidências de IA) incluídos como artefatos de liderança do sênior.
- Sem integrações externas além das duas APIs; sem autenticação no MVP (documentada como decisão).
- Ferramenta de IA disponível para ambos os desenvolvedores (impacto positivo já descontado na estimativa).
- Time dedicado (não compartilhado com sustentação), 8h/dia úteis, sem feriados no período.
- Reuniões de alinhamento limitadas a 30 min/dia (cerimônias lean).

## Composição e papéis

| Papel | Atribuições |
|---|---|
| Sênior | Arquitetura, contratos de API, integração entre serviços, code review de todo PR, artefatos de governança, gates de qualidade |
| Pleno | Implementação de endpoints e persistência, testes unitários e de integração, Docker/CI sob revisão do sênior |

## Plano por semana

### Semana 1 — Fundações (estimativa: 80 h)

| Atividade | Responsável | Esforço |
|---|---|---|
| Levantamento de requisitos e especificação (SDD) | Sênior + pleno | 8 h |
| Decisões de arquitetura e ADRs | Sênior | 8 h |
| Setup dos projetos, Docker Compose, esteira CI | Pleno (review sênior) | 12 h |
| Catalog Service: modelo com vigência de preços, endpoints | Pleno | 20 h |
| Catalog Service: testes unitários + IT | Pleno | 12 h |
| Especificação dos contratos e envelope de erros | Sênior | 8 h |
| Buffer de contingência (15%) | — | 12 h |

### Semana 2 — Núcleo de pedidos (estimativa: 80 h)

| Atividade | Responsável | Esforço |
|---|---|---|
| Schema PostgreSQL + migrações Flyway | Pleno | 8 h |
| Domínio de pedidos (cálculo, desconto, validações) | Sênior | 12 h |
| Use cases + persistência (anti-N+1) | Pleno | 16 h |
| Integração Pedidos -> Catálogo (lote, retry, timeout) | Sênior | 12 h |
| Testes unitários de domínio/use cases | Pleno | 12 h |
| ITs de API e persistência (Testcontainers, MockWebServer) | Sênior + pleno | 12 h |
| Buffer de contingência (10%) | — | 8 h |

### Semana 3 — Endurecimento e entrega (estimativa: 80 h)

| Atividade | Responsável | Esforço |
|---|---|---|
| Correções de review, hardening (limites de payload, paginação) | Pleno | 12 h |
| Observabilidade (requestId, logs JSON, health) | Pleno | 8 h |
| OWASP dependency-check e ajustes de vulnerabilidade | Pleno | 6 h |
| Documentação (README, API, banco, arquitetura) | Sênior + pleno | 10 h |
| Guia de code review + dimensionamento (artefatos de liderança) | Sênior | 8 h |
| Evidências de uso de IA (prompts, validações, link do chat) | Sênior | 6 h |
| Homologação ponta a ponta em Docker Compose | Sênior + pleno | 8 h |
| Buffer de contingência (22%) | — | 22 h |

**Total estimado: 240 h (3 semanas x 2 pessoas x 40 h)**, com ~16% de buffer embutido — dentro da capacidade nominal do time, sem hora extra.

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Integração entre serviços mais complexa que o previsto | Média | Alto | Contratos congelados na semana 1; MockWebServer permite desenvolver em paralelo |
| Ambiente de execução (Docker/Testcontainers) indisponível em alguma máquina | Média | Médio | CI como ambiente de verdade desde o dia 1; unit tests rodam sem Docker |
| Escopo crescente (status de pedido, autenticação, frontend) | Alta | Alto | Escopo do MVP documentado em requisitos; mudanças passam por estimativa de impacto |
| Dependência externa (ex.: licença de ferramenta de IA) | Baixa | Médio | Alternativas equivalentes mapeadas |

## Comunicação com stakeholders

Relatório semanal de 1 página: entregas concluídas, próximos passos, riscos e decisões tomadas (com link para os ADRs). Linguagem orientada a resultado de negócio ("pedidos podem ser criados e consultados; integração com catálogo validada"), deixando o detalhe técnico nos documentos de arquitetura.
