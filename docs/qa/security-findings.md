# Achados de segurança — auditoria de dependências e baseline DAST

## Escopo e interpretação

Esta verificação é defensiva e limitada à auditoria de dependências e ao baseline passivo OWASP ZAP em ambiente local descartável. Não é pentest nem certificação. Os relatos abaixo seguem os campos de [Quality defect](../../.github/ISSUE_TEMPLATE/quality-defect.md). Severidade é provisória e sujeita à avaliação da equipe de segurança. Alertas heurísticos não são tratados como vulnerabilidades confirmadas.

O código do sistema sob teste não foi alterado. Os relatórios ZAP e o JSON completo do npm audit foram temporários e removidos; os resultados abaixo preservam os dados resumidos efetivamente observados. IDs de advisories individuais não foram preservados e não são inferidos.

## QA-ISSUE-006 — Dependências do frontend apresentam advisories críticos e altos

## Summary

`npm audit --audit-level=high` reportou 11 advisories no lockfile do frontend: 2 críticos, 6 altos e 3 moderados. A auditoria do lockfile da automação QA reportou zero advisories.

## Environment and commit

- Ambiente: auditoria local do diretório `frontend`, em 21/10/2026.
- Commit: indisponível; o workspace não possui metadados Git.

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

Foram reportados 11 advisories (2 críticos, 6 altos, 3 moderados). Pacotes diretos afetados incluem `@angular/build`, `@angular/cli` e `@angular/router`; a árvore também lista dependências transitivas como `piscina`, `vite`, `source-map-js`, `http-cache-semantics` e `@modelcontextprotocol/sdk`. O npm indicou correções disponíveis. A automação QA reportou zero advisories. Isso confirma findings na árvore de dependências, não a explorabilidade da aplicação.

## Evidence

- HTTP status / sanitized payload: não aplicável.
- X-Request-Id / trace: não aplicável.
- Screenshot / Playwright trace / logs: resumo da execução local de `npm audit` em 21/10/2026. O JSON original foi removido; os IDs CVE/GHSA individuais não estão disponíveis neste workspace.
- Scanner / advisory / artifact link (for security findings): npm audit; no GitHub Actions, os JSONs são publicados pelo job `node-security` quando a pipeline for executada.

## Impact and severity (S1-S4)

S2 — provisório, pelo número de advisories críticos/altos e pelo gate de build/publicação. Aplicabilidade, caminho de execução e exposição no produto ainda precisam de triagem; não se afirma que o sistema é explorável.

## Security classification (if applicable)

- CVE / GHSA / CWE: múltiplos advisories; IDs individuais não foram preservados e precisam ser recuperados em nova execução do relatório detalhado.
- Exploitability and affected component (confirmed or still under triage): findings de dependência confirmados pelo npm audit; explorabilidade e componentes em runtime/build ainda sob triagem.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: manter o gate bloqueante para build/publicação enquanto os advisories críticos/altos não forem corrigidos ou formalmente aceitos.
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
- OWASP Dependency-Check Maven está configurado no CI, mas não foi executado nesta rodada.
- GitHub Actions ainda precisa ser executado para confirmar os jobs, relatórios e artifacts.
- O gate `node-security` bloqueia build/publicação quando a auditoria frontend encontra advisories altos/críticos, até remediação ou aceite formal.
- Para correção/triagem de cada comportamento reproduzido, consultar [issues.md](./issues.md) e preencher os detalhes de advisory individuais após nova execução do npm audit.
- Manter credenciais, segredos, dados pessoais reais e payloads sensíveis fora de issues e artifacts.

## Referências

- [Template de defeito de qualidade](../../.github/ISSUE_TEMPLATE/quality-defect.md)
- [Checklist de segurança](./06-security-checklist.md)
- [Especificação de qualidade](./00-quality-specification.md)
