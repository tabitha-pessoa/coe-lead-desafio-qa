# Desafio Técnico — COE Leader Desenvolvimento (Stefanini)

Repositório público: [tabitha-pessoa/coe-lead-desafio-qa](https://github.com/tabitha-pessoa/coe-lead-desafio-qa). A entrega desta rodada está na branch `feature/COE-Leader`; a branch base `main` contém o commit inicial.

Sistema composto por dois microsserviços Java/Spring Boot desenvolvidos com Clean Architecture, testes automatizados, Docker e CI/CD:

| Serviço | Porta | Banco | Responsabilidade |
|---|---|---|---|
| **order-service** | 8080 | PostgreSQL 16 | Criação, listagem e consulta de pedidos, com regra de desconto configurável |
| **catalog-service** | 8081 | MongoDB 7 | Catálogo de produtos com histórico de preços e consulta de preço vigente |

O order-service valida itens e preços no momento da criação do pedido por meio de **uma única chamada em lote** ao catalog-service (padrão anti-N+1), com retry, timeout classificado e snapshot de preço/nome persistido no pedido.

## Arquitetura

```
Client ──> order-service (8080) ──> PostgreSQL (orders, order_items, discount_rule)
                    │
                    └── 1 chamada em lote ──> catalog-service (8081) ──> MongoDB (products)
```

Ambos seguem Clean Architecture em pacotes `domain` / `application` / `infrastructure` / `presentation`. Detalhes em [docs/architecture.md](docs/architecture.md) e decisões registradas em [docs/adr/](docs/adr/).

## Requisitos

- Java 25 (LTS) e Maven 3.9 (para build local)
- Node.js conforme `.nvmrc` (para frontend, QA funcional e auditoria npm)
- Docker + Docker Compose (para execução integrada e testes de integração)

## Execução (Docker Compose)

```bash
docker compose up --build
```

Sobe PostgreSQL, MongoDB (com seed de produtos), catalog-service e order-service. O schema do PostgreSQL é criado pelo Flyway, incluindo a regra de desconto inicial (pedidos a partir de R$ 1.000,00 recebem 10%).

### Criar um pedido

```bash
curl -i -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "client": {"name": "Maria Silva", "document": "12345678901", "email": "maria@example.com"},
    "items": [
      {"productId": "PROD-001", "quantity": 2},
      {"productId": "PROD-002", "quantity": 1}
    ]
  }'
```

Resposta `201 Created` com `Location` do pedido criado:

```json
{
  "id": "…",
  "client": {"name": "Maria Silva", "document": "12345678901", "email": "maria@example.com"},
  "items": [
    {"productId": "PROD-001", "productName": "Notebook Dell Inspiron 15", "unitPrice": 3500.00, "quantity": 2, "lineTotal": 7000.00},
    {"productId": "PROD-002", "productName": "Mouse Logitech MX Master 3S", "unitPrice": 499.90, "quantity": 1, "lineTotal": 499.90}
  ],
  "subtotal": 7499.90,
  "discount": 749.99,
  "total": 6749.91,
  "status": "CRIADO",
  "createdAt": "2026-09-25T17:00:00Z"
}
```

### Listar e consultar pedidos

```bash
curl 'http://localhost:8080/api/v1/orders?page=0&size=20&status=CRIADO'
curl 'http://localhost:8080/api/v1/orders/{id}'
```

### Consultar o catálogo

```bash
curl http://localhost:8081/api/v1/products/PROD-001
curl -X POST http://localhost:8081/api/v1/products/prices \
  -H "Content-Type: application/json" \
  -d '{"productIds": ["PROD-001", "PROD-002"]}'
```

Swagger UI: `http://localhost:8080/swagger-ui.html` (orders) e `http://localhost:8081/swagger-ui.html` (catalog).

## Desenvolvimento local

Cada serviço é um Maven module independente:

```bash
# unit tests (sem Docker)
mvn test

# unit + integration tests (requer Docker para Testcontainers)
mvn verify

# formatação (Spotless roda check no phase validate)
mvn spotless:apply
```

Variáveis de ambiente suportadas pelo order-service: `POSTGRES_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `CATALOG_BASE_URL`, `CATALOG_CONNECT_TIMEOUT_MS`, `CATALOG_READ_TIMEOUT_MS`. Pelo catalog-service: `MONGODB_URI`.



## Testes

- **Unitários** (Surefire, `*Test`): regras de domínio, cálculo de desconto, use cases com mocks — 25 testes no order-service e 14 no catalog-service.
- **Integração** (Failsafe, `*IT`, executados localmente ou no CI com Docker/Testcontainers): API completa com MockWebServer simulando o catálogo (incluindo asserção de **uma única chamada HTTP por pedido**) e persistência real em PostgreSQL (incluindo asserção de **exatamente 3 prepared statements** na listagem paginada, comprovando a ausência de N+1).

## Documentação

- [Levantamento de requisitos](docs/requirements.md)
- [Arquitetura](docs/architecture.md)
- [Contratos de API](docs/api.md)
- [Modelagem de dados](docs/database.md)
- [Uso de IA no desenvolvimento](docs/ai-development.md)
- [Guia de code review](docs/code-review-guide.md)
- [Dimensionamento técnico da proposta](docs/technical-estimation.md)
- [Decisões de arquitetura (ADRs)](docs/adr/)

## Estrutura do repositório

```
catalog-service/     Serviço de catálogo (MongoDB)
order-service/       Serviço de pedidos (PostgreSQL)
docker/              Scripts de inicialização (seed do MongoDB)
.github/             CI/CD (GitHub Actions) e Dependabot
docs/                Documentação e ADRs
docker-compose.yml   Orquestração local
```

## QA COE — estratégia, automação e governança

A entrega de QA está organizada em `docs/qa/`, `qa-tests/` e `performance/`:

- `docs/qa/01-test-strategy-and-plan.md`: estratégia, riscos e casos priorizados;
- `docs/qa/00-quality-specification.md`: especificação SDD de qualidade com critérios rastreáveis, testes existentes e lacunas explícitas;
- `docs/qa/08-sdd-user-journeys.md`: critérios SDD para painel, catálogo, pedidos, indicadores, validações e idiomas, vinculados às suítes automatizadas;
- `qa-tests/`: testes de API e UI em Playwright + TypeScript;
- `performance/k6-orders.js`: cenários k6 de API com perfis smoke/load/stress/soak; instruções e limites em [performance/README.md](performance/README.md);
- `docs/qa/02-quality-summary-template.md`: relatório da execução local, com resultados reais e limitações observadas;
- `docs/qa/03-governance-standard.md`: governança de squads e critérios bloqueantes de PR;
- `docs/qa/04-commercial-estimation.md`: estimativa das Partes 1–5 em 3 semanas com QA Sênior + Pleno;
- `docs/qa/05-ai-usage.md`: ferramenta, prompts e validação humana;
- `docs/qa/chatgpt-share-evidence.json`: referência JSON da conversa compartilhada do ChatGPT e status da captura do transcript;
- `docs/qa/06-security-checklist.md`: plano defensivo de segurança;
- `docs/qa/security-findings.md`: resultado atual de auditoria de dependências e limites da evidência DAST;
- `docs/ci-cd.md`: configuração operacional da esteira, publicação GHCR e proteção de branches;
- `.github/workflows/ci.yml`: pipeline única para validação Java, frontend, API/UI, performance, build de imagens e publicação das imagens aprovadas no GHCR em push para `main`.
- `.github/workflows/security-baseline.yml`: execução semanal/manual do baseline passivo OWASP ZAP.
- [Avaliação dos critérios de entrega](docs/qa/10-evaluation-criteria.md): status, evidências e pendências que dependem do GitHub/da candidata.

Em pull requests e pushes para `develop`, as imagens são construídas para validação, mas não publicadas. Após todos os jobs de qualidade e o build passarem, push para `main` publica imagens imutáveis com tag `sha-<commit>` e também `latest`. A esteira entrega as imagens no GHCR; o deploy automático em infraestrutura não está configurado. Veja [docs/ci-cd.md](docs/ci-cd.md) para permissões, nomes das imagens e operação.

### Artefatos do desafio e status de publicação

- **Parte 1 — estratégia e planejamento:** [plano de testes](docs/qa/01-test-strategy-and-plan.md), [especificação SDD e rastreabilidade](docs/qa/00-quality-specification.md) e [jornadas SDD](docs/qa/08-sdd-user-journeys.md).
- **Partes 2–4 — automação:** código de API/UI em `qa-tests/`, performance em `performance/` e configuração CI/CD em `.github/workflows/`.
- **Parte 5 — execução e reporte:** [relatório de qualidade](docs/qa/02-quality-summary-template.md) e [defeitos detalhados](docs/qa/issues.md).
- **Diferenciais:** [governança](docs/qa/03-governance-standard.md), [dimensionamento comercial](docs/qa/04-commercial-estimation.md), [uso de IA](docs/qa/05-ai-usage.md), [checklist de segurança](docs/qa/06-security-checklist.md) e [achados de segurança](docs/qa/security-findings.md).
- **Issues/PR pendentes:** `docs/qa/issues.md` contém sete relatos formatados conforme `.github/ISSUE_TEMPLATE/quality-defect.md`, mas eles ainda precisam ser criados como Issues do GitHub e vinculados aqui. Os commits locais foram enviados ao repositório público na branch `feature/COE-Leader`; ainda não foi aberto PR nem executado o workflow remoto. O link compartilhável do ChatGPT está em `docs/qa/05-ai-usage.md`; o JSON é um registro de referência, não um export integral do transcript, que precisa ser exportado pela interface autorizada do ChatGPT se exigido.

### Executar os testes de QA localmente

Pré-requisitos: Docker Compose, Node.js 22+ e npm. Em um terminal, na raiz:

```bash
docker compose up --build -d
```

Em outro terminal:

```bash
cd qa-tests
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

Para executar apenas API ou UI: `npm run test:api` ou `npm run test:ui`. O relatório HTML fica em `qa-tests/playwright-report/`; resultados JUnit em `qa-tests/test-results/`.

Para performance, instale k6 e execute, com o sistema local ativo:

```bash
k6 run performance/k6-orders.js
```

Os thresholds de k6 são metas iniciais de smoke/carga, não SLAs contratados. Calibre-os com baseline repetível e ambiente documentado. A execução local desta entrega está registrada em `docs/qa/02-quality-summary-template.md`; a pipeline publica os relatórios Playwright/JUnit e o resumo k6 como artefatos. Não declare aprovação sem evidência da execução correspondente.
