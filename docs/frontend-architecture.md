# Arquitetura do Frontend

SPA Angular standalone que consome exclusivamente os contratos publicados pelos dois
microsserviços (ver `docs/api.md`). Nenhuma regra de negócio é duplicada no cliente —
o frontend orquestra, apresenta e localiza.

## Stack

| Concern   | Escolha                                   | Observação                                           |
| --------- | ----------------------------------------- | ---------------------------------------------------- |
| Framework | Angular 21 (standalone, **zoneless**)     | `provideZonelessChangeDetection` via `App` bootstrap |
| UI        | Bootstrap 5.3 (CSS) + ng-bootstrap 20     | CSS global; componentes acessíveis do ng-bootstrap   |
| Estado    | **Signals** (`signal`, `computed`)        | Sem NgRx/Ngxs — estado local por página              |
| i18n      | ngx-translate 18 + http-loader            | Ver `docs/i18n.md`                                   |
| HTTP      | `HttpClient` + interceptadores funcionais | Ver `docs/frontend-api-integration.md`               |
| Testes    | Vitest 4 (`@angular/build:unit-test`)     | jsdom; 53 testes em 13 specs                         |
| Build     | `@angular/build:application` (esbuild)    | Budgets: 900kB warning / 1.5MB error                 |

## Estrutura de pastas

```
src/app/
  app.ts / app.config.ts / app.routes.ts   # bootstrap, providers, rotas lazy
  core/          # infraestrutura da aplicação (sem UI)
    api/         # OrderApiService, CatalogApiService (única fronteira HTTP)
    config/      # API_CONFIG (InjectionToken) — URLs por ambiente
    interceptors/# requestIdInterceptor, apiErrorInterceptor
    models/      # tipos dos contratos (order, catalog, error)
    services/    # LocaleService, NotificationService, ApiErrorMessagesService
  shared/        # UI reutilizável sem conhecimento de domínio
    components/  # error-state, empty-state, loading, toasts-container, ...
    pipes/       # translate ('| t'), status-label, app-currency
    services/    # ConfirmDialogService
  layout/        # shell (header + sidebar + footer + toasts + router-outlet)
  features/      # páginas por domínio, carregadas sob demanda
    orders/      # list, detail, form (+ routes)
    catalog/     # lookup (+ routes)
  pages/         # dashboard e 404 (fora de domínio)
src/testing/     # helpers de teste (i18n-testing.ts)
public/assets/i18n/  # pt-BR.json, en.json, es.json
```

Regras de dependência (verificadas em code review):

- `features/**` e `pages/**` → podem importar `core/**` e `shared/**`.
- `shared/**` → pode importar `core/**` (ex.: pipes usam `LocaleService`).
- `core/**` → não importa `shared/**` nem `features/**`.
- Nenhuma camada importa de `features/**`/`pages/**`.

## Padrões

- **Standalone + OnPush em todos os componentes.** Sem `NgModule`.
- **Páginas inteligentes, componentes burros.** As páginas injetam services e
  concentram o estado (signals); os componentes de `shared/` recebem inputs e
  emitem outputs.
- **Zoneless.** Mudanças de estado chegam ao template via signals; a CD é
  agendada pelo scheduler do Angular. `fixture.whenStable()` nos testes.
- **Rotas lazy por feature** (`loadChildren`/`loadComponent`) — chunks separados
  por página no bundle de produção.
- **`withComponentInputBinding()`** — parâmetros de rota (ex.: `:id` do pedido)
  chegam como `input()` na página.
- **DI por token** — URLs das APIs só existem em `API_CONFIG` (fornecido por
  `environment`); nenhum service hardcode caminho.
- **Reatividade de locale** — `LocaleService` expõe o locale atual como signal;
  os pipes customizados (`app-currency`, datas) reagem à troca de idioma em
  runtime sem recarregar a página.

## Fluxo de dados (exemplo: lista de pedidos)

```
OrderListPage (signal result/loading/error)
  └─ OrderApiService.getOrders({page, size, status})
       └─ HttpClient.get(`${API_CONFIG.orders}`, {params})
            ├─ requestIdInterceptor  → header X-Request-Id (UUID)
            └─ apiErrorInterceptor   → envelope ADR-008 → ApiException
```

Erros convergem em `ApiException` (código, mensagem, detalhes, requestId) e são
traduzidos por `ApiErrorMessagesService` (`errors.codes.<code>` →
`errors.status.<n>` → `errors.generic`). Notificações transitam por
`NotificationService` (máx. 3 toasts, dismiss manual).

## Testes

- Runner: Vitest via `@angular/build:unit-test` (jsdom), configurado em
  `angular.json` (`tsconfig.spec.json` inclui `src/testing/`).
- `src/testing/i18n-testing.ts` fornece `provideTestingI18n()` (loader síncrono
  com os JSONs reais de `public/assets/i18n/`), `initI18nForTest()` (reseta
  storage, aplica idioma e aguarda `LocaleService.initialize()`) e
  `normalizeText()` (NBSP → espaço para asserts de moeda pt-BR).
- Padrão por spec: `provideHttpClient(withInterceptors(...))` +
  `provideHttpClientTesting()` + `API_CONFIG` de teste + `provideRouter([])`.
- Particularidades cobertas: `pageChange` do NgbPagination é `EventEmitter`
  assíncrono (exige flush de macrotask no teste de paginação); polyfill
  `@angular/localize/init` é herdado do build target (necessário para os
  templates i18n do ng-bootstrap).

## Build e entrega

- `npm run build:prod` → `dist/frontend/browser/` (hashing, budgets, lazy chunks).
- Docker multi-stage (`frontend/Dockerfile`): `node:22-alpine` (npm ci + build)
  → `nginx:1.27-alpine` servindo estáticos + reverse proxy (template
  `nginx.conf.template` com `ORDER_SERVICE_URL`/`CATALOG_SERVICE_URL` via
  envsubst no `docker-entrypoint.sh`).
- CI (`.github/workflows/ci.yml`, job `frontend`): npm ci → lint → format check
  → testes → build; a imagem é construída no job `docker-build`.
