# Integração Frontend × APIs

Como o frontend consome o order-service e o catalog-service. Contratos completos
em `docs/api.md`; decisões de fundo nas ADRs citadas.

## Mapeamento de endpoints

| Service             | Frontend (`API_CONFIG`) | Backend (contrato real)            | Uso                       |
| ------------------- | ----------------------- | ---------------------------------- | ------------------------- |
| `OrderApiService`   | `/api/orders`           | `GET /api/v1/orders` (8080)        | lista paginada (filtros)  |
|                     |                         | `GET /api/v1/orders/{id}`          | detalhe                   |
|                     |                         | `POST /api/v1/orders`              | criação (cenário 3–8)     |
| `CatalogApiService` | `/api/catalog`          | `GET /api/v1/products/{id}` (8081) | consulta individual       |
|                     |                         | `POST /api/v1/products/prices`     | preços em lote (≤ 50 IDs) |

O frontend **nunca** chama `/api/v1/...` diretamente: usa os paths relativos de
`API_CONFIG` (fornecidos por `src/environments/environment*.ts`). O
mapeamento para os contratos reais é responsabilidade do proxy do ambiente:

- **Dev** — `proxy.conf.json` (webpack/vite dev-server):

  ```json
  "/api/orders": { "target": "http://localhost:8080",
                   "pathRewrite": { "^/api/orders": "/api/v1/orders" } }
  ```

  (idem `/api/catalog` → `http://localhost:8081` + rewrite para `/api/v1/products`).
  Evita CORS sem qualquer configuração no backend.

- **Prod** — nginx no container (`frontend/nginx.conf.template`):

  ```nginx
  location /api/orders  { proxy_pass ${ORDER_SERVICE_URL}/api/v1/orders;  }
  location /api/catalog { proxy_pass ${CATALOG_SERVICE_URL}/api/v1/products; }
  ```

  As variáveis são resolvidas pelo `docker-entrypoint.sh` (envsubst) **antes** de
  o nginx ler o config — o `proxy_pass` final é estático e a substituição de
  prefixo do `location` preserva o resto do path e a query string.

## Interceptadores (ordem de registro: requestId → apiError)

### `requestIdInterceptor`

Gera `X-Request-Id` (UUID via `crypto.randomUUID()`) em toda requisição. O
backend ecoa o header no envelope de erro (ADR-008), permitindo correlacionar a
falha mostrada na UI com os logs do serviço.

### `apiErrorInterceptor`

Converte qualquer falha HTTP em `ApiException` (único tipo de erro de API na
aplicação):

1. **status 0** → código `NETWORK_ERROR` (backend fora / rede).
2. **corpo com envelope ADR-008** → usa `error.code`, `error.message`,
   `error.details` e o `requestId` do corpo.
3. **qualquer outro corpo** → código `UNKNOWN_ERROR` (mensagem original preservada
   como `backendMessage`).

`ApiErrorMessagesService` traduz o código para o usuário com fallback em
cadeia: `errors.codes.<code>` → `errors.status.<status HTTP>` → `errors.generic`.
O `requestId` é exibido junto à mensagem (rastreabilidade na UI, não apenas no
console).

## Regras de negócio: onde moram

| Regra                                                         | Dono            | Frontend faz                                    |
| ------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| Validação de itens, preço e desconto (fail-fast, ADR-004)     | order-service   | envia e **apresenta** os erros                  |
| Desconto configurável (ADR-005) e snapshot de preço (ADR-006) | order-service   | exibe `subtotal/discount/total` retornados      |
| Vigência de preço (ADR-007)                                   | catalog-service | consulta; erros chegam via envelope             |
| Paginação 0-based (ADR-011)                                   | ambos           | UI é 1-based; a página converte no service call |
| Status apenas `CRIADO` (ADR-012)                              | order-service   | badge via `status-label` pipe                   |
| Moeda BRL presumida (ADR-015)                                 | —               | `AppCurrencyPipe` formata com locale pt-BR      |

O formulário de pedido faz validação **local apenas de UX** (campos obrigatórios,
quantidade 1–999, duplicatas na sessão) — as validações reais (produto inativo,
sem preço vigente, duplicado no backend, etc.) vêm do order-service como
`details` do envelope e são exibidas campo a campo.

## Gaps de integração (explícitos na UI)

- **Dashboard** — métricas derivadas apenas de `GET /api/v1/orders` (uma página,
  até 100 registros). Não existe endpoint de agregação; a própria página exibe
  um aviso (`dashboard.gapTitle/gapMessage`) de que indicadores adicionais
  exigiriam API dedicada. Nenhuma métrica é inventada.
- **Catálogo** — não existe endpoint de listagem/busca de produtos; a página de
  consulta opera por IDs (individual ou lote), com o aviso correspondente
  (`catalog.gapTitle/gapMessage`).

## Ambientes

| Ambiente | `orders`      | `catalog`      | Quem resolve                                       |
| -------- | ------------- | -------------- | -------------------------------------------------- |
| Dev      | `/api/orders` | `/api/catalog` | `proxy.conf.json` (dev-server)                     |
| Prod     | `/api/orders` | `/api/catalog` | nginx (`ORDER_SERVICE_URL`, `CATALOG_SERVICE_URL`) |

Para publicar atrás de um gateway externo, basta trocar os valores de
`environment.prod.ts` por URLs absolutas — nenhum service muda.
