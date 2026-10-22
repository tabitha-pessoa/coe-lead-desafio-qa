# Arquitetura

## Visão geral

Dois microsserviços independentes, comunicando-se por HTTP síncrono, cada um com seu banco de dados (padrão *database per service*):

```
Client
  |
  | HTTP
  v
+-----------------------------+
|        order-service        |
|           (8080)            |
|  presentation               |
|  application (use cases)    |
|  domain (regras + portas)   |
|  infrastructure             |
+------+---------------+------+
       |               |
  JPA/Flyway        RestClient (1 chamada em lote,
       |               |        retry 2x, timeout classificado)
       v               v
+--------------+  +-----------------------------+
|  PostgreSQL  |  |       catalog-service       |
|   orders     |  |           (8081)            |
| order_items  |  |  presentation               |
|discount_rule |  |  application (use cases)    |
+--------------+  |  domain (vigência de preço) |
                  |  infrastructure             |
                  +------+----------------------+
                         |  Spring Data MongoDB
                         v
                  +--------------+
                  |   MongoDB 7  |
                  |   products   |
                  +--------------+
```

## Clean Architecture (ADR-003)

Cada serviço organiza o código em quatro pacotes com dependências apontando para dentro:

| Pacote | Conteúdo | Depende de |
|---|---|---|
| `domain` | Entidades (records), exceções, calculadoras, portas (interfaces de repositório/gateway) | nada do framework |
| `application` | Use cases orquestrando portas (`CreateOrderUseCase`, `ListOrdersUseCase`, `GetOrderUseCase`, `GetProductUseCase`, `GetProductPricesUseCase`) | domain |
| `infrastructure` | Adaptadores: JPA + Flyway, Spring Data MongoDB, RestClient para o catálogo | domain (implementa portas) |
| `presentation` | Controllers REST, DTOs, filtros, handler de exceções, OpenAPI | application |

Compromisso pragmático documentado: use cases usam `@Component` e `@Transactional` (Spring) em vez de uma camada extra de composição — o ganho de simplicidade supera o acoplamento residual, e o domínio permanece livre de framework.

## Integração Pedidos -> Catálogo (ADR-004, ADR-010)

1. `CreateOrderUseCase` coleta os `productId` distintos do payload.
2. `CatalogRestGateway` faz uma única chamada `POST /api/v1/products/prices` com todos os IDs.
3. Resposta classificada em `found` / `notFound`; validação fail-fast: qualquer produto inexistente, inativo ou sem preço vigente aborta a criação (nada é persistido).
4. Resiliência: 2 tentativas em erros de conexão; `SocketTimeoutException` -> `CATALOG_TIMEOUT` (504); outros erros de IO/HTTP -> `CATALOG_UNAVAILABLE` (503).
5. O `X-Request-Id` corrente é propagado na chamada para rastreabilidade ponta a ponta.

## Tratamento de erros (ADR-008)

Envelope único em ambos os serviços:

```json
{
  "error": {"code": "PRODUCT_NOT_FOUND", "message": "Product PROD-999 was not found", "details": ["PROD-999"]},
  "requestId": "3f2c1b8e-..."
}
```

| Código | HTTP | Cenário |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Payload inválido (Bean Validation, duplicatas, filtro de status inválido, JSON malformado) |
| `ORDER_NOT_FOUND` | 404 | Pedido inexistente |
| `PRODUCT_NOT_FOUND` | 422 | Produto inexistente no catálogo |
| `PRODUCT_INACTIVE` | 422 | Produto com status INATIVO |
| `NO_CURRENT_PRICE` | 422 | Produto sem janela de preço vigente |
| `CATALOG_UNAVAILABLE` | 503 | Catálogo inacessível após as tentativas |
| `CATALOG_TIMEOUT` | 504 | Tempo esgotado na chamada ao catálogo |
| `DATABASE_ERROR` | 500 | Falha de persistência |
| `INVALID_BUSINESS_RULE` | 500 | Configuração de desconto inválida |
| `INTERNAL_ERROR` | 500 | Erro não previsto |
| `PAYLOAD_TOO_LARGE` | 413 | Corpo acima de 1 MB (rejeitado no filtro, antes da desserialização) |

## Observabilidade

- `RequestIdFilter`: gera (ou aceita) `X-Request-Id`, publica no MDC e ecoa na resposta.
- Log estruturado JSON (perfil `json`, Logstash encoder) com `requestId` em todos os eventos; log de acesso `http_request` com método, path, status e duração.
- Spring Boot Actuator com health probes (`/actuator/health`).

## Resiliência e limites

| Limite | Valor |
|---|---|
| Itens por pedido | 100 |
| Quantidade por item | 1-999 |
| Corpo da requisição | 1 MB (`order.max-payload-bytes`) |
| IDs por lote de preço | 50 |
| Tamanho de página | 1-100 (default 20) |
| Timeout do catálogo | connect 2 s / read 3 s (configurável) |
| Tentativas de chamada ao catálogo | 2 |

## CI/CD (`.github/workflows/ci.yml`)

O workflow executa em pull requests, pushes para `main`/`develop` e despacho manual. Os jobs Java, frontend e QA rodam em paralelo:

1. `spotless:check` e `mvn verify` — formatação, unitários (Surefire) e integração (Failsafe/Testcontainers).
2. OWASP dependency-check com limiar CVSS 7.
3. Frontend e dependências Node — `npm ci`, ESLint, Prettier, Vitest, build de produção e `npm audit`.
4. QA funcional, performance e segurança — jobs independentes sobem stacks descartáveis; Playwright testa APIs/UI, k6 smoke exercita Pedidos/Catálogo e ZAP executa baseline passivo contra UI/APIs. Cada job publica seus relatórios mesmo se a validação falhar.
5. Build das imagens de catálogo, pedidos e frontend, somente após todos os jobs de qualidade.
6. Publicação no GHCR apenas em push para `main` e somente após o build/gates passarem. Cada imagem recebe `sha-<commit>` e `latest`; pull requests e `develop` não publicam.

A pipeline entrega imagens de container, mas não faz deploy em servidor ou cloud porque não há destino/credenciais de infraestrutura definidos. O primeiro push requer que GitHub Actions tenha permissão para gravar pacotes; ver [guia operacional de CI/CD](ci-cd.md).

Dependabot monitora atualizações de dependências (mensal, Maven e GitHub Actions).

## Estratégia de testes

| Nível | Ferramenta | Exemplos |
|---|---|---|
| Unitário (domínio/use cases) | JUnit 5 + Mockito | `OrderCalculatorTest`, `CreateOrderUseCaseTest`, `PriceEntryTest` |
| Integração de API | SpringBootTest + Testcontainers + MockWebServer | `OrderApiIT` (asserts de 1 chamada HTTP por pedido, 503/504, paginação), `CatalogApiIT` |
| Integração de persistência | Testcontainers PostgreSQL/MongoDB | `OrderPersistenceIT` (assert de 3 prepared statements na listagem, rollback transacional) |
