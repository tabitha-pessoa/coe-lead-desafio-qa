# Frontend — Orders & Catalog

SPA Angular 21 (standalone, zoneless) consumindo order-service (8080) e
catalog-service (8081). Documentação de arquitetura em `docs/frontend-architecture.md`,
integração com as APIs em `docs/frontend-api-integration.md` e i18n em `docs/i18n.md`.

## Requisitos

- Node.js 22+
- Backends rodando localmente (8080/8081) — ex.: `docker compose up postgres mongo catalog-service order-service`
  na raiz do repositório

## Desenvolvimento

```bash
npm ci
npm start          # http://localhost:4200 — proxy /api/orders e /api/catalog (proxy.conf.json)
```

## Scripts

| Comando                | O que faz                                         |
| ---------------------- | ------------------------------------------------- |
| `npm start`            | Dev server com proxy para os backends             |
| `npm test`             | Vitest (jsdom), single run — 53 testes / 13 specs |
| `npm run lint`         | ESLint                                            |
| `npm run format:check` | Prettier (`--check .`)                            |
| `npm run build:prod`   | Build de produção em `dist/frontend/browser/`     |
| `npm run verify`       | lint + test + build:prod (o mesmo pipeline do CI) |

## Testes

Specs ao lado do código (`*.spec.ts`) + helper `src/testing/i18n-testing.ts`
(loader de traduções síncrono com os JSONs reais). Padrão de providers por spec:
`provideHttpClient(withInterceptors([...]))` + `provideHttpClientTesting()` +
`API_CONFIG` de teste + `provideTestingI18n()`.

## Docker

```bash
docker build -t frontend:local .
docker run -p 4200:80 \
  -e ORDER_SERVICE_URL=http://localhost:8080 \
  -e CATALOG_SERVICE_URL=http://localhost:8081 \
  frontend:local
```

Ou via compose (raiz do repositório): `docker compose up frontend` — serve em
http://localhost:4200 com proxy para os serviços internos.

A imagem é multi-stage (`node:22-alpine` → `nginx:1.27-alpine`); o nginx aplica
`nginx.conf.template` com envsubst no start (`docker-entrypoint.sh`), mapeando
`/api/orders` → `${ORDER_SERVICE_URL}/api/v1/orders` e
`/api/catalog` → `${CATALOG_SERVICE_URL}/api/v1/products`, além do fallback SPA
(`try_files ... /index.html`).
