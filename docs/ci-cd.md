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

## Evidências

Artifacts do workflow incluem relatórios Surefire/Failsafe, Playwright HTML/JUnit, resumo JSON do k6, ambiente/versionamento da execução e amostras periódicas de CPU/memória dos containers. Thresholds k6 são metas provisórias, não SLOs acordados.

O workflow `.github/workflows/security-baseline.yml` também executa ZAP semanalmente (segunda-feira, 04:17 UTC) ou sob despacho manual. Ele usa apenas o baseline passivo contra o stack local e publica relatórios sem abrir issues automaticamente.

### Primeira execução do GitHub Actions

A execução [CI #1](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632), no PR #1 e commit `f56e0128fd19d374f1af7c13f7db1fb06dec849c`, concluiu com falha. `performance-qa` e `security-baseline` passaram; `catalog-service`, `order-service`, `frontend`, `functional-qa` e `node-security` falharam. `docker-build` e `publish-images` foram ignorados por dependerem dos gates aprovados. A triagem está em [issues.md](qa/issues.md) e [security-findings.md](qa/security-findings.md); o artifact de auditoria npm está [neste run](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/artifacts/12394855315).

A reexecução [CI #2](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840), após as correções da suíte, também concluiu com falha: `frontend`, `performance-qa` e `security-baseline` passaram; `catalog-service`, `order-service`, `functional-qa` e `node-security` continuaram falhando. As falhas da expectativa SQL e do mock compartilhado foram eliminadas; restaram a resposta nula do Catálogo, o timeout HTTP 500, os defeitos Playwright já reportados e as vulnerabilidades do frontend. Os jobs Docker permaneceram ignorados.
