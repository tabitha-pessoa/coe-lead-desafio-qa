# CI/CD — GitHub Actions e GHCR

## Fluxo

O workflow único `.github/workflows/ci.yml` é executado em pull requests, pushes para `main` e `develop`, e despacho manual:

1. Jobs paralelos validam os serviços Java (Spotless, unitários, integração/Testcontainers e OWASP Dependency-Check), o frontend (lint, formatação, Vitest e build), dependências Node (`npm audit`), os testes funcionais (type-check TypeScript e Playwright API/UI), performance (k6 smoke em stack descartável) e baseline OWASP ZAP passivo.
2. Relatórios Java, Playwright, k6 e ZAP são armazenados como artifacts, inclusive em falha. Os jobs funcional, performance, segurança e auditoria Node são independentes, então uma falha não impede coletar evidência dos outros.
3. O job de build Docker depende de todos os gates anteriores e constrói as três imagens.
4. Somente um push para `main` após sucesso de todos os jobs publica no GitHub Container Registry. Pull requests, `develop` e execuções manuais não publicam imagens.

O check Prettier preserva sem alterações de whitespace o template `frontend/src/app/layout/sidebar/sidebar.component.html`, fornecido como parte do sistema sob teste; todos os demais arquivos continuam sujeitos ao check. A exceção evita uma alteração cosmética no código original do desafio.

O job de publicação aplica as tags `sha-<commit>` (imutável por revisão) e `latest`:

- `ghcr.io/<owner>/<repository>-catalog-service`
- `ghcr.io/<owner>/<repository>-order-service`
- `ghcr.io/<owner>/<repository>-frontend`

O nome de owner/repository é convertido para minúsculas automaticamente. O `GITHUB_TOKEN` do job recebe apenas `packages: write`; não é necessário adicionar um token PAT para publicar no repositório associado.

## Configuração no GitHub

1. Em **Settings → Actions → General**, permita que os workflows executem e usem `GITHUB_TOKEN` com as permissões declaradas.
2. Em **Settings → Actions → General → Workflow permissions**, mantenha o padrão de leitura; a permissão de escrita de pacotes é concedida somente ao job `publish-images`.
3. Adicione o secret `NVD_API_KEY` para evitar limites de requisição ao feed do National Vulnerability Database. Sem a chave, a análise ainda tenta consultar a fonte pública, mas pode ser mais lenta ou sofrer rate limit.
4. Configure proteção de branch para `main` e `develop`, exigindo os checks dos jobs `catalog-service`, `order-service`, `frontend`, `functional-qa`, `performance-qa`, `node-security`, `security-baseline` e `docker-build` antes do merge. Confirme os nomes exibidos no GitHub após a primeira execução.
5. A análise `npm audit --audit-level=high` atualmente encontra advisories críticos/altos no lockfile do frontend e intencionalmente bloqueia o build/publicação até triagem e correção/aceite formal; veja [achados de segurança](qa/security-findings.md).
6. Após o primeiro publish, ajuste visibilidade do pacote em **Packages → Package settings** se consumidores precisarem fazer pull sem autenticação. Pacotes privados requerem autenticação para pull.

## Limites do CD

O CD desta entrega publica imagens versionadas no GHCR; não implanta em host ou plataforma cloud. Um deploy automático exige definir destino, estratégia (por exemplo, Compose remoto ou Kubernetes), proteção de ambiente, secrets e rollback. Não coloque credenciais de deploy no workflow antes de definir e aprovar esses controles.

O pipeline é intencionalmente bloqueante: os testes atuais reproduzem defeitos documentados em `docs/qa/issues.md`. Até que os defeitos sejam corrigidos no sistema ou formalmente aceitos conforme política de release, os jobs `functional-qa`/`performance-qa` ou outros gates podem falhar e nenhuma imagem será publicada a partir de `main`.

## Reproduzir os gates localmente

Use Java 25, Maven 3.9 e a versão de Node indicada em `.nvmrc` (atualmente 24.19.0). Os comandos abaixo correspondem às verificações dos jobs; não desative falhas conhecidas para obter um resultado verde.

```powershell
mvn -B -f catalog-service/pom.xml spotless:check
mvn -B -f catalog-service/pom.xml verify
mvn -B -f order-service/pom.xml spotless:check
mvn -B -f order-service/pom.xml verify

Push-Location frontend
npm ci
npm run lint
npm run format:check
npm run test
npm run build:prod
Pop-Location

docker compose up --build -d

Push-Location qa-tests
npm ci
npm run typecheck
npx playwright install chromium
$env:CI = "true"
$env:ORDER_URL = "http://localhost:8080"
$env:CATALOG_URL = "http://localhost:8081"
$env:FRONTEND_URL = "http://localhost:4200"
npm test
$env:CI = $null
Pop-Location
docker compose down

npm --prefix frontend audit --audit-level=high
npm --prefix qa-tests audit --audit-level=high
```

Para o gate de performance, com a stack ainda ativa e o k6 instalado:

```powershell
$env:ORDER_URL = "http://localhost:8080"
$env:CATALOG_URL = "http://localhost:8081"
$env:K6_PROFILE = "smoke"
$env:PERF_ENABLE_ORDER_CREATION = "true"
k6 run --summary-export=k6-summary.json performance/k6-orders.js
```

Playwright usa um worker e zero retries tanto localmente quanto no CI; assim, uma tentativa com falha não é ocultada por retry. A auditoria npm e o k6 são gates separados, não testes funcionais, e podem falhar mesmo quando a suíte de aplicação apresenta os mesmos resultados. O job `performance-qa` também precisa construir as imagens antes de executar o k6.

## Evidências

Artifacts do workflow incluem relatórios Surefire/Failsafe, Playwright HTML/JUnit, resumo JSON do k6, ambiente/versionamento da execução e amostras periódicas de CPU/memória dos containers. Thresholds k6 são metas provisórias, não SLOs acordados.

O workflow `.github/workflows/security-baseline.yml` também executa ZAP semanalmente (segunda-feira, 04:17 UTC) ou sob despacho manual. Ele usa apenas o baseline passivo contra o stack local e publica relatórios sem abrir issues automaticamente.

### Execuções do GitHub Actions

A execução [CI #1](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632), no PR #1 e commit `f56e0128fd19d374f1af7c13f7db1fb06dec849c`, concluiu com falha. `performance-qa` e `security-baseline` passaram; `catalog-service`, `order-service`, `frontend`, `functional-qa` e `node-security` falharam. `docker-build` e `publish-images` foram ignorados por dependerem dos gates aprovados. A triagem está em [issues.md](qa/issues.md) e [security-findings.md](qa/security-findings.md); o artifact de auditoria npm está [neste run](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/artifacts/12394855315).

A reexecução [CI #2](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840), após as correções da suíte, também concluiu com falha: `frontend`, `performance-qa` e `security-baseline` passaram; `catalog-service`, `order-service`, `functional-qa` e `node-security` continuaram falhando. As falhas da expectativa SQL e do mock compartilhado foram eliminadas; restaram a resposta nula do Catálogo, o timeout HTTP 500, os defeitos Playwright já reportados e as vulnerabilidades do frontend. Os jobs Docker permaneceram ignorados.

A execução [CI #3](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39708641019), no commit `0720286443e3dac3b3e549fe6f36583d41aa94c8`, teve cinco jobs com falha: Catálogo (1 teste de integração), Pedidos (1 teste de integração), Playwright (8 falhas e 65 aprovações), `performance-qa` (falha ao resolver artefatos Maven durante `dependency:go-offline`, antes do k6) e `node-security` (11 advisories no frontend; zero na automação QA). A execução local com Node 24.19.0, `CI=true`, os mesmos endpoints e retries Playwright desativados reproduziu os mesmos oito casos Playwright com falha e 65 aprovações. A falha do build Maven foi removida dos Dockerfiles; as falhas de aplicação e os advisories permanecem gates reais, não devem ser ocultados. Não foi possível comparar localmente os testes de integração Java: Java e Maven não estão instalados neste ambiente, e a tentativa de executá-los via contêiner falhou porque o Testcontainers não conseguiu se conectar ao Ryuk. A CI #3 foi executada em um commit anterior às alterações atuais, portanto ainda não as valida. É necessário enviá-las à branch para que uma nova execução do GitHub Actions confirme o resultado.
