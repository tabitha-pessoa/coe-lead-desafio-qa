# Achados de segurança — auditoria de dependências e baseline DAST

## Escopo e interpretação

Esta verificação é defensiva e limitada à auditoria de dependências e ao baseline passivo OWASP ZAP em ambiente local descartável. Não é pentest nem certificação. Os relatos abaixo seguem os campos de [Quality defect](../../.github/ISSUE_TEMPLATE/quality-defect.md). Severidade é provisória e sujeita à avaliação da equipe de segurança. Alertas heurísticos não são tratados como vulnerabilidades confirmadas.

O código do sistema sob teste não foi alterado. O workflow GitHub Actions reteve o JSON do npm audit como artifact, permitindo registrar os identificadores observados abaixo. Os findings de dependência não comprovam que a aplicação seja explorável.

## QA-ISSUE-006 — Dependências do frontend apresentam advisories críticos e altos

## Summary

`npm audit --audit-level=high` reportou 11 pacotes vulneráveis no lockfile do frontend: 2 críticos, 6 altos e 3 moderados. A auditoria do lockfile da automação QA reportou zero vulnerabilidades.

## Environment and commit

- Ambiente: GitHub Actions, job `node-security`, execuções CI #1 e #2 em 22/10/2026.
- Commits: `f56e0128fd19d374f1af7c13f7db1fb06dec849c` e `6676d3bdf39e7918512a777420f27a1092c5913d`, branch `feature/COE-Leader`.

## Requirement / test case

- `SEC-001`; auditar dependências e bloquear advisories críticos/altos até triagem e correção ou aceite formal.
- Configuração: job `node-security` em `.github/workflows/ci.yml`.

## Preconditions and synthetic data

- Dependências resolvidas conforme os lockfiles versionados.
- Auditoria de metadados de dependência; sem payload da aplicação ou dados pessoais.

## Steps to reproduce

1. Execute `npm ci` no diretório `frontend`.
2. Execute `npm audit --audit-level=high`.
3. Inspecione o resumo e a árvore de dependências no relatório JSON completo.

## Expected result

Não devem permanecer advisories críticos/altos sem triagem, mitigação ou aceite formal conforme a política de segurança. O relatório completo deve permitir identificar advisory, versão afetada e caminho de dependência.

## Actual result

O job `node-security` falhou porque `npm audit --audit-level=high` encontrou 11 pacotes vulneráveis no frontend: 2 críticos, 6 altos e 3 moderados. Os pacotes reportados foram `@angular/build`, `@angular/cli`, `@angular/router`, `@modelcontextprotocol/sdk`, `@vitest/mocker`, `hono`, `http-cache-semantics`, `piscina`, `source-map-js`, `vite` e `vitest`. O relatório indicou atualizações disponíveis dentro das faixas declaradas. O lockfile da automação QA reportou zero vulnerabilidades. Os advisories incluem:

- `@angular/router`: GHSA-62vg-58rm-qff7, GHSA-57xq-rjx2-v5xh.
- `@modelcontextprotocol/sdk`: GHSA-6qxp-vccf-f47h, GHSA-22jm-h49p-29qw, GHSA-6prh-2h8m-c8cw, GHSA-46jr-4wx8-v453, GHSA-rvq5-wwqv-78pq.
- `@vitest/mocker`: GHSA-qxg6-89mg-rqv8, GHSA-xp26-3454-mjgp.
- `hono`: GHSA-5r4p-p66f-jhc7.
- `http-cache-semantics`: GHSA-ch52-4w7c-c8xp.
- `piscina`: GHSA-67c8-pqhq-4rmx.
- `source-map-js`: GHSA-68fv-2mgg-jv7q.
- `vite`: GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22.

O npm audita a árvore resolvida; findings transitivos podem aparecer associados a mais de um pacote direto. A presença de advisory no lockfile confirma exposição de dependência, mas não a explorabilidade da aplicação.

## Evidence

- HTTP status / sanitized payload: não aplicável.
- X-Request-Id / trace: não aplicável.
- Screenshot / Playwright trace / logs: jobs `node-security` das CI #1 e #2; frontend falhou no nível `high`, QA passou com zero vulnerabilidades.
- Scanner / advisory / artifact link (for security findings): [artifact npm-audit-reports da CI #1](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/artifacts/12394855315); [CI #2](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840).

## Impact and severity (S1-S4)

S2 — provisório, pelo número de advisories críticos/altos e pelo gate de build/publicação. Aplicabilidade, caminho de execução e exposição no produto ainda precisam de triagem; não se afirma que o sistema é explorável.

## Security classification (if applicable)

- CVE / GHSA / CWE: GHSA IDs listados em Actual result; CVE/CWE não inferidos.
- Exploitability and affected component (confirmed or still under triage): findings de dependência confirmados pelo npm audit; explorabilidade e componentes em runtime/build ainda sob triagem.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: manter o gate bloqueante para build/publicação enquanto os advisories críticos/altos não forem corrigidos ou formalmente aceitos. A cópia do sistema sob teste permanece inalterada; remediação de dependências deve ser aprovada e rastreada pelo responsável do produto.
- Hipótese: versões registradas no lockfile incluem versões afetadas por advisories publicados. Confirmar caminhos, ambientes de execução e upgrade seguro com engenharia/segurança.

## QA-ISSUE-007 — Headers de segurança recomendados estão ausentes no frontend

## Summary

O baseline passivo ZAP do frontend produziu 8 alertas não informativos relativos a headers e à divulgação da versão do servidor, além de 2 achados informativos.

## Environment and commit

- Ambiente: frontend da stack Compose descartável, `http://frontend:80`; scan local em 21/10/2026.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- `SEC-002` / `SEC-07`; executar baseline passivo e revisar headers no contexto da arquitetura.
- Workflow: `security-baseline` em `.github/workflows/ci.yml` e `.github/workflows/security-baseline.yml`.

## Preconditions and synthetic data

- Stack local descartável iniciada.
- Requisição GET à página inicial; sem autenticação, dados pessoais ou payloads de teste.

## Steps to reproduce

1. Inicie a aplicação local via Docker Compose.
2. Execute o baseline passivo OWASP ZAP contra `http://frontend:80`.
3. Inspecione alertas e headers da resposta.

## Expected result

Arquitetura/segurança deve definir headers compatíveis com o frontend e seu modelo de implantação; os headers aplicáveis devem ser configurados e a divulgação de versão minimizada quando possível.

## Actual result

O ZAP sinalizou:

| Alerta | Resultado observado | Risk / confidence do scanner |
|---|---|---|
| Content Security Policy (CSP) Header Not Set | CSP ausente | Medium (High) |
| Missing Anti-clickjacking Header | Header ausente | Medium (Medium) |
| X-Content-Type-Options Header Missing | Header ausente | Low (Medium) |
| Permissions Policy Header Not Set | Header ausente | Low (Medium) |
| Cross-Origin-Embedder-Policy Header Missing or Invalid | Ausente/inválido; 3 instâncias | Low (Medium) |
| Cross-Origin-Opener-Policy Header Missing or Invalid | Ausente/inválido | Low (Medium) |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Ausente/inválido | Low (Medium) |
| Server Leaks Version Information | `Server: nginx/1.27.5` | Low (High) |
| Modern Web Application | Detecção informativa | Informational (Medium) |
| Non-Storable Content | Detecção informativa; `no-store` observado | Informational (Medium) |

Os alertas de configuração precisam de revisão de arquitetura; o scan não demonstra, por si só, exploração ou impacto em usuário.

## Evidence

- HTTP status / sanitized payload: página inicial `200`; `Server: nginx/1.27.5`; sem payload sensível registrado.
- X-Request-Id / trace: não aplicável.
- Screenshot / Playwright trace / logs: execução local do `zap-baseline.py`; 8 alertas não informativos e 2 informativos. Relatórios temporários removidos após a análise.
- Scanner / advisory / artifact link (for security findings): OWASP ZAP baseline passivo; futura execução CI configura upload dos relatórios, mas ainda não foi executada no GitHub.

## Impact and severity (S1-S4)

S3 — provisório e sujeito à triagem. A ausência de headers não prova vulnerabilidade explorável; CSP/COEP/COOP/CORP e Permissions Policy exigem configuração compatível com o comportamento legítimo da aplicação.

## Security classification (if applicable)

- CVE / GHSA / CWE: nenhum CVE/GHSA atribuído pelos achados; alertas de configuração do scanner.
- Exploitability and affected component (confirmed or still under triage): presença/ausência dos headers e versão do servidor observadas; impacto e política aplicável ainda sob triagem.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: nenhum aplicado; encaminhar para decisão do responsável por frontend/infra.
- Hipótese: a configuração de entrega do frontend não define os headers recomendados e mantém o header de versão padrão do servidor.

## QA-ISSUE-005 — Rotas não mapeadas retornam HTTP 500 (alerta ZAP correlato)

## Summary

O ZAP sinalizou `Application Error Disclosure` nas APIs porque rotas não mapeadas retornaram HTTP 500. O comportamento é rastreado como defeito funcional QA-ISSUE-005 em [issues.md](./issues.md); não foi confirmado vazamento de detalhes internos.

## Environment and commit

- Ambiente: stack Docker Compose descartável; Orders API em `order-service:8080`, Catalog API em `catalog-service:8081`; scan em 21/10/2026.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- `SEC-03` / `SEC-06`; erros devem ser controlados, usar envelope padronizado e não expor stack trace.
- Contrato de erro: `docs/api.md`.

## Preconditions and synthetic data

- Aplicação local iniciada e acessível na rede Docker.
- Requisições GET às rotas `/`, `/robots.txt` e `/sitemap.xml`; sem autenticação ou dados pessoais.

## Steps to reproduce

1. Inicie a aplicação local por Docker Compose.
2. Execute baseline passivo ZAP contra `http://order-service:8080` e `http://catalog-service:8081`.
3. Reproduza manualmente `GET /` e rotas indicadas nos serviços.
4. Inspecione status, envelope de erro, corpo e `X-Request-Id`.

## Expected result

Rotas inexistentes devem responder `404` com envelope coerente e request ID. O corpo de erro não deve revelar stack trace ou informação interna.

## Actual result

O ZAP sinalizou `Application Error Disclosure` de baixa confiança: três respostas 500 na Orders API (`/`, `/robots.txt`, `/sitemap.xml`) e duas na Catalog API (`/`, `/sitemap.xml`). Verificação manual confirmou corpo genérico `INTERNAL_ERROR`, `requestId` no corpo e `X-Request-Id` no header; não foi observado stack trace no corpo. Portanto, o status 500 é confirmado, mas a divulgação de informação sensível não foi confirmada.

## Evidence

- HTTP status / sanitized payload: HTTP `500`; envelope genérico `INTERNAL_ERROR`, mensagem `Unexpected internal error`, detalhes vazios.
- X-Request-Id / trace: presente em header e corpo durante a verificação manual.
- Screenshot / Playwright trace / logs: ZAP local e verificação HTTP manual; arquivos de relatório temporários removidos depois de registrar os resultados.
- Scanner / advisory / artifact link (for security findings): OWASP ZAP `Application Error Disclosure`, confidence baixa; defeito correspondente em [QA-ISSUE-005](./issues.md).

## Impact and severity (S1-S4)

S3 — provisório para o status incorreto e o sinal operacional; sem evidência observada de divulgação de stack trace. Triagem de segurança não confirma vulnerabilidade explorável.

## Security classification (if applicable)

- CVE / GHSA / CWE: não atribuído; alerta heurístico sem vulnerabilidade confirmada.
- Exploitability and affected component (confirmed or still under triage): respostas HTTP 500 confirmadas; impacto de segurança permanece sob triagem.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: consumir somente os endpoints documentados.
- Hipótese: exceções de roteamento sem handler específico são convertidas pelo handler global em erro interno.

## Estado dos scanners e follow-up

- O baseline ZAP local foi executado nos três alvos e gerou JSON/HTML. Resumo: frontend com 8 alertas não informativos e 2 informativos; cada API com 1 alerta não informativo e 1 informativo.
- Os relatórios temporários foram removidos após a triagem. A execução local não valida a publicação de artifacts no GitHub Actions.
- OWASP Dependency-Check Maven está configurado no CI, mas os jobs Java falharam em `mvn verify` antes de chegar às etapas Dependency-Check.
- As execuções [CI #1](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632) e [CI #2](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840) confirmaram os resultados dos jobs; artifacts devem ser verificados individualmente antes de afirmar retenção de cada relatório.
- O gate `node-security` bloqueia build/publicação quando a auditoria frontend encontra advisories altos/críticos, até remediação ou aceite formal.
- Para correção/triagem de cada comportamento reproduzido, consultar [issues.md](./issues.md). A remediação de dependências requer aprovação do responsável pelo produto; o sistema sob teste foi preservado.
- Manter credenciais, segredos, dados pessoais reais e payloads sensíveis fora de issues e artifacts.

## Referências

- [Template de defeito de qualidade](../../.github/ISSUE_TEMPLATE/quality-defect.md)
- [Checklist de segurança](./06-security-checklist.md)
- [Especificação de qualidade](./00-quality-specification.md)
