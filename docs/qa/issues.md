# Issues encontrados — validação dos contratos oficiais

Os relatos abaixo seguem o template [Quality defect](../../.github/ISSUE_TEMPLATE/quality-defect.md). Foram reproduzidos contra o ambiente local iniciado pelo Docker Compose; o código do sistema sob teste não foi alterado. Severidades são avaliações iniciais de QA, não substituem a classificação do responsável pelo produto/segurança.

## QA-ISSUE-001 — Pedidos com 51–100 itens falham na integração com o Catálogo

## Summary

`POST /api/v1/orders` retorna `503 CATALOG_UNAVAILABLE` quando um pedido válido contém mais de 50 e até 100 itens distintos.

## Environment and commit

- Ambiente: aplicação local via Docker Compose, serviços de Pedidos e Catálogo.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- `ORD-001` / `INT-001`; requisitos: pedido com 1 a 100 itens e integração HTTP com o Catálogo.
- Referência: `docs/requirements.md` e `docs/api.md`.

## Preconditions and synthetic data

- Ambiente Compose iniciado e endpoints disponíveis.
- Cliente sintético válido; IDs de produto distintos `UNKNOWN-0` a `UNKNOWN-99`, quantidade `1`.

## Steps to reproduce

1. Inicie `docker compose up --build -d`.
2. Envie `POST http://localhost:8080/api/v1/orders` com cliente válido e 100 itens distintos (`UNKNOWN-0` a `UNKNOWN-99`), cada um com quantidade `1`.
3. Inspecione status e corpo da resposta.

## Expected result

O serviço deve processar pedidos dentro do limite contratual de 100 itens. Para IDs inexistentes, deve retornar erro de negócio apropriado, como `422 PRODUCT_NOT_FOUND`, sem classificar o limite do lote como indisponibilidade.

## Actual result

HTTP `503` / `CATALOG_UNAVAILABLE`. A consulta em lote do Catálogo aceita no máximo 50 IDs e esse limite é tratado pelo serviço de Pedidos como indisponibilidade da dependência.

## Evidence

- HTTP status / sanitized payload: `503`, código `CATALOG_UNAVAILABLE`.
- X-Request-Id / trace: não preservado no registro de execução disponível.
- Screenshot / Playwright trace / logs: cenário Playwright de pedido com 100 itens; a suíte funcional completa registrou falha correspondente.
- Scanner / advisory / artifact link (for security findings): não aplicável.

## Impact and severity (S1-S4)

S2 — provisório: pedidos válidos no limite superior documentado podem ser rejeitados.

## Security classification (if applicable)

- CVE / GHSA / CWE: não aplicável.
- Exploitability and affected component (confirmed or still under triage): defeito funcional confirmado; sem classificação de vulnerabilidade.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: manter pedidos abaixo de 51 itens, se aceitável para o negócio.
- Hipótese: incompatibilidade entre o limite de 100 itens do pedido e o limite de 50 IDs da consulta em lote do Catálogo.

## QA-ISSUE-002 — Campos nulos obrigatórios são omitidos na resposta do Catálogo

## Summary

As respostas do Catálogo omitem `currentPrice` ou `validTo` quando seus valores devem ser `null`.

## Environment and commit

- Ambiente: aplicação local via Docker Compose e GitHub Actions Linux (Testcontainers MongoDB).
- Commits verificados: `f56e0128fd19d374f1af7c13f7db1fb06dec849c` e `6676d3bdf39e7918512a777420f27a1092c5913d`, branch `feature/COE-Leader`.

## Requirement / test case

- `CAT-003` / `CAT-005` / `CAT-006`; serialização conforme contrato e ADR-007.
- Referência: `docs/api.md` e `docs/architecture.md` (ADR-007).

## Preconditions and synthetic data

- Ambiente Compose iniciado e seed do Catálogo carregado.
- Produtos sintéticos preexistentes no seed: `PROD-003`, `PROD-005` e `PROD-006`.

## Steps to reproduce

1. Envie `GET http://localhost:8081/api/v1/products/PROD-003`.
2. Envie `GET http://localhost:8081/api/v1/products/PROD-005` e `GET http://localhost:8081/api/v1/products/PROD-006`.
3. Inspecione os campos `currentPrice` e `validTo` nas respostas JSON.

## Expected result

Serializar explicitamente `validTo: null` para janela sem data final e `currentPrice: null` quando não existir janela de preço vigente.

## Actual result

Para `PROD-003`, `validTo` é omitido. Para `PROD-005` e `PROD-006`, `currentPrice` é omitido em vez de ser serializado como `null`.

## Evidence

- HTTP status / sanitized payload: consultas individuais retornam resposta de sucesso, mas faltam as propriedades nulas especificadas.
- X-Request-Id / trace: não preservado no registro de execução disponível.
- Screenshot / Playwright trace / logs: cenário da API em `catalog.spec.ts`; divergência reportada após comparar a resposta ao contrato.
- Evidência adicional: GitHub Actions CI #1, job `catalog-service`, commit `f56e0128fd19d374f1af7c13f7db1fb06dec849c`; `CatalogApiIT.batchPricesReturnsNullCurrentPriceForProductWithoutValidWindow` falhou na asserção da linha 105. [Logs do job](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/job/119583273820).
- Confirmação: o mesmo teste falhou na CI #2 após estabilização dos fixtures, descartando uma data de preço vencida como causa. [Logs do job](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840/job/119591457166).
- Confirmação adicional: a execução anexada de `mvn -B -f catalog-service/pom.xml verify` reproduziu a falha em `CatalogApiIT.batchPricesReturnsNullCurrentPriceForProductWithoutValidWindow` (linha 105); 5 dos 6 testes de integração passaram. [Log detalhado da CI #3](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39708641019).
- Scanner / advisory / artifact link (for security findings): não aplicável.

## Impact and severity (S1-S4)

S3 — provisório: consumidores que distinguem campo ausente de `null` recebem resposta incompatível com o contrato.

## Security classification (if applicable)

- CVE / GHSA / CWE: não aplicável.
- Exploitability and affected component (confirmed or still under triage): defeito de contrato confirmado; sem classificação de vulnerabilidade.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: consumidores poderiam tratar campo ausente e `null` como equivalentes, se isso for compatível com o contrato do cliente.
- Hipótese: configuração de serialização exclui propriedades cujo valor é nulo.

## QA-ISSUE-003 — Campo de quantidade aceita notação exponencial na interface

## Summary

A interface aceita `1e2` como quantidade válida e adiciona o item com quantidade 100.

## Environment and commit

- Ambiente: frontend local via Docker Compose.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- `UI-003` / requisito de quantidade inteira decimal no intervalo 1–999; caracteres especiais devem ser rejeitados.
- Referência: regras de negócio em `docs/requirements.md`.

## Preconditions and synthetic data

- Ambiente Compose iniciado; tela de novo pedido acessível.
- ID de produto válido do seed; valor de quantidade sintético `1e2`.

## Steps to reproduce

1. Acesse `http://localhost:4200/orders/new`.
2. Informe `1e2` no campo Quantidade e um ID de produto válido.
3. Clique em **Adicionar produto** e observe o item incluído.

## Expected result

Rejeitar notação exponencial e caracteres não numéricos; aceitar somente uma representação inteira decimal entre 1 e 999.

## Actual result

O formulário aceita `1e2` e inclui o item com quantidade numérica 100.

## Evidence

- HTTP status / sanitized payload: não aplicável; a falha ocorre na validação da interface antes do envio.
- X-Request-Id / trace: não aplicável.
- Screenshot / Playwright trace / logs: cenário de validação UI registrado em `order-business-rules.spec.ts`; falha reproduzida na suíte Playwright.
- Scanner / advisory / artifact link (for security findings): não aplicável.

## Impact and severity (S1-S4)

S3 — provisório: a UI aceita uma representação numérica não permitida pelo requisito, embora o valor convertido permaneça dentro do limite.

## Security classification (if applicable)

- CVE / GHSA / CWE: não aplicável.
- Exploitability and affected component (confirmed or still under triage): defeito funcional confirmado; sem classificação de vulnerabilidade.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: informar quantidade em algarismos decimais, sem notação exponencial.
- Hipótese: o campo usa conversão numérica que interpreta `1e2` como número válido sem validar a representação original.

## QA-ISSUE-004 — Campos compostos por espaços não recebem validação útil na interface

## Summary

Campos de cliente compostos por espaços passam pela validação visual; IDs vazios após normalização não geram feedback ao adicionar produto ou consultar o Catálogo.

## Environment and commit

- Ambiente: frontend local via Docker Compose.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- `UI-001` / `UI-002` / `UI-003` / `UI-004`; campos obrigatórios e feedback de validação na interface.
- Referência: regras e jornadas de Catálogo e Pedidos em `docs/requirements.md`.

## Preconditions and synthetic data

- Ambiente Compose iniciado.
- Entradas sintéticas compostas por três espaços, e busca de Catálogo contendo apenas separadores/espaços (`, ;`).

## Steps to reproduce

1. Acesse `http://localhost:4200/orders/new`.
2. Preencha nome ou documento com três espaços, informe e-mail válido e adicione um produto válido.
3. Clique em **Criar pedido**; observe que os campos com espaços não são marcados inválidos e a interface tenta enviar.
4. No mesmo formulário, informe três espaços no ID do produto e clique em **Adicionar produto**; observe a ausência de mensagem.
5. Acesse `http://localhost:4200/catalog`, informe somente separadores/espaços (`, ;`) e envie a consulta; observe a ausência de feedback.

## Expected result

Tratar texto formado somente por espaços como vazio e apresentar feedback explícito antes de permitir envio, inclusão de produto ou consulta sem IDs.

## Actual result

A validação `required` considera espaços como valor preenchido; o ID do produto aparado para vazio retorna sem aviso; a consulta do Catálogo com zero IDs após parsing também termina sem feedback.

## Evidence

- HTTP status / sanitized payload: a API rejeita o pedido com campos inválidos quando o formulário tenta enviar; as ações de ID vazio não geram consulta válida.
- X-Request-Id / trace: não preservado no registro de execução disponível.
- Screenshot / Playwright trace / logs: cenários de validação UI de Catálogo e Pedidos; falhas reproduzidas na suíte Playwright.
- Scanner / advisory / artifact link (for security findings): não aplicável.

## Impact and severity (S1-S4)

S3 — provisório: feedback de validação insuficiente e tentativas de envio inválidas prejudicam a usabilidade e podem gerar chamadas desnecessárias.

## Security classification (if applicable)

- CVE / GHSA / CWE: não aplicável.
- Exploitability and affected component (confirmed or still under triage): defeito funcional confirmado; sem classificação de vulnerabilidade.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: informar valores não vazios e IDs válidos após aparar espaços.
- Hipótese: validações obrigatórias não normalizam espaços antes de verificar o valor e os handlers retornam silenciosamente para entradas vazias.

## QA-ISSUE-005 — Rotas não mapeadas das APIs retornam HTTP 500

## Summary

Requisições GET para rotas não documentadas dos serviços retornam `500 INTERNAL_ERROR` em vez de `404`.

## Environment and commit

- Ambiente: Docker Compose local; Orders API em `localhost:8080`, Catalog API em `localhost:8081`.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- Contrato de erros consistente e status apropriado para recurso/rota não encontrada; cenário identificado durante DAST passivo.
- Referência: envelope de erro em `docs/api.md`; evidência adicional em [security-findings.md](./security-findings.md).

## Preconditions and synthetic data

- Stack descartável Compose iniciada e endpoints disponíveis.
- Requisições GET sem payload a rotas que não possuem endpoint documentado.

## Steps to reproduce

1. Inicie `docker compose up --build -d`.
2. Envie `GET http://localhost:8080/`, `GET http://localhost:8080/robots.txt` e `GET http://localhost:8080/sitemap.xml`.
3. Envie `GET http://localhost:8081/` e `GET http://localhost:8081/sitemap.xml`.
4. Inspecione status, corpo e cabeçalho `X-Request-Id`.

## Expected result

Rotas sem mapeamento devem retornar HTTP `404` com o envelope padronizado e identificador de requisição, sem serem tratadas como erro interno.

## Actual result

As rotas observadas retornam HTTP `500` com envelope `INTERNAL_ERROR`. A verificação manual confirmou `X-Request-Id` no cabeçalho e `requestId` no corpo; não foi observado stack trace no corpo. O ZAP sinalizou `Application Error Disclosure` com baixa confiança por causa dos status 500.

## Evidence

- HTTP status / sanitized payload: `500`; corpo genérico `{"error":{"code":"INTERNAL_ERROR","message":"Unexpected internal error","details":[]},"requestId":"<uuid>"}`.
- X-Request-Id / trace: presente no cabeçalho e no campo `requestId` do corpo, com valor UUID.
- Screenshot / Playwright trace / logs: execução ZAP passiva local de 21/10/2026 e confirmação HTTP manual; relatórios foram removidos após registrar o resultado.
- Scanner / advisory / artifact link (for security findings): alerta ZAP `Application Error Disclosure` nas APIs; triagem em [security-findings.md](./security-findings.md).

## Impact and severity (S1-S4)

S3 — provisório: rotas inválidas são classificadas como falha interna, gerando status e sinal operacional incorretos. Não foi observada divulgação de stack trace.

## Security classification (if applicable)

- CVE / GHSA / CWE: não confirmado; o alerta heurístico de disclosure não demonstra exposição de informação.
- Exploitability and affected component (confirmed or still under triage): comportamento HTTP 500 confirmado; impacto de segurança permanece sob triagem e não foi confirmado.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: consumidores devem chamar somente rotas documentadas.
- Hipótese: exceções de roteamento sem handler específico estão sendo convertidas pelo handler global em `INTERNAL_ERROR`.

## QA-ISSUE-006 — Dependências do frontend apresentam advisories críticos e altos

## Summary

`npm audit --audit-level=high` reportou 11 pacotes vulneráveis no lockfile do frontend, incluindo 2 críticos, 6 altos e 3 moderados, e o gate bloqueia o build/publicação.

## Environment and commit

- Ambiente: GitHub Actions, job `node-security`, execução CI #1 em 22/10/2026.
- Commit: `f56e0128fd19d374f1af7c13f7db1fb06dec849c`, branch `feature/COE-Leader`.

## Requirement / test case

- `SEC-001`; auditar dependências e bloquear findings críticos/altos até triagem e correção ou aceite formal.
- Referência: [security-findings.md](./security-findings.md), pipeline `node-security` em `.github/workflows/ci.yml`.

## Preconditions and synthetic data

- Dependências instaladas conforme `frontend/package-lock.json`.
- Auditoria de metadados de dependências; sem dados de clientes ou payloads da aplicação.

## Steps to reproduce

1. No diretório `frontend`, execute `npm ci`.
2. Execute `npm audit --audit-level=high`.
3. Inspecione o resumo e os caminhos de dependência no JSON detalhado do npm audit.

## Expected result

Nenhuma dependência crítica/alta sem triagem, mitigação ou aceite formal conforme política de segurança. A auditoria deve deixar evidência utilizável para identificar advisory, versão afetada e caminho de dependência.

## Actual result

Foram reportados 11 pacotes vulneráveis: 2 críticos, 6 altos e 3 moderados. Pacotes afetados, identificadores GHSA e limitações da análise constam em [security-findings.md](./security-findings.md). O npm indicou correções disponíveis. O lockfile da automação QA reportou zero vulnerabilidades na mesma execução.

## Evidence

- HTTP status / sanitized payload: não aplicável; resultado de auditoria de dependências.
- X-Request-Id / trace: não aplicável.
- Screenshot / Playwright trace / logs: job `node-security` da CI #1; frontend falhou no nível `high`, QA passou com zero vulnerabilidades.
- Scanner / advisory / artifact link (for security findings): [artifact npm-audit-reports da CI #1](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/artifacts/12394855315); GHSA IDs em [security-findings.md](./security-findings.md).

## Impact and severity (S1-S4)

S2 — provisório, devido aos advisories classificados como críticos/altos e ao gate bloqueante. A aplicabilidade e explorabilidade para este produto ainda não foram confirmadas; não significa que a aplicação seja explorável.

## Security classification (if applicable)

- CVE / GHSA / CWE: GHSA IDs listados em [security-findings.md](./security-findings.md); CVE/CWE não inferidos.
- Exploitability and affected component (confirmed or still under triage): findings de dependência confirmados pelo npm audit; exposição e aplicabilidade no produto ainda sob triagem.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: manter build/publicação bloqueados até remediação ou aceite formal; não há workaround que elimine o risco.
- Hipótese: versões travadas no lockfile incluem versões afetadas por advisories publicados. Confirmar caminhos, ambientes de execução e upgrades seguros com engenharia/segurança.

## QA-ISSUE-007 — Headers de segurança recomendados estão ausentes no frontend

## Summary

O baseline ZAP do frontend sinalizou headers de segurança ausentes ou insuficientes e divulgação da versão do servidor HTTP.

## Environment and commit

- Ambiente: frontend servido em `http://frontend:80` dentro da stack descartável Docker Compose; OWASP ZAP baseline passivo em 21/10/2026.
- Commit: indisponível; o workspace não possui metadados Git.

## Requirement / test case

- `SEC-002` / `SEC-07`; revisar headers da aplicação e registrar achados do baseline para triagem.
- Referência: [security-findings.md](./security-findings.md) e [checklist de segurança](./06-security-checklist.md).

## Preconditions and synthetic data

- Stack descartável com frontend iniciado.
- Requisição GET à página inicial; somente resposta HTTP, sem autenticação ou dados pessoais.

## Steps to reproduce

1. Inicie o ambiente local descartável com Docker Compose.
2. Execute OWASP ZAP baseline passivo contra `http://frontend:80`.
3. Inspecione os alertas e os headers da resposta inicial.

## Expected result

Os responsáveis por arquitetura/segurança devem definir uma política de headers compatível com a aplicação e com seu modelo de implantação; headers aplicáveis devem estar configurados e a versão do servidor minimizada quando possível.

## Actual result

O ZAP reportou 8 alertas não informativos: CSP ausente, header anti-clickjacking ausente, `X-Content-Type-Options` ausente, Permissions Policy ausente, COEP/COOP/CORP ausentes ou inválidos e versão `nginx/1.27.5` exposta no header `Server`. Reportou ainda 2 achados informativos: aplicação web moderna e conteúdo não armazenável. Não foi demonstrada exploração; a adequação de cada header depende de triagem de arquitetura.

## Evidence

- HTTP status / sanitized payload: página inicial respondeu `200`; alertas relacionados a headers da resposta.
- X-Request-Id / trace: não aplicável.
- Screenshot / Playwright trace / logs: relatório ZAP local gerado com sucesso, mas os arquivos temporários foram removidos após registrar nomes e contagens dos alertas.
- Scanner / advisory / artifact link (for security findings): OWASP ZAP baseline passivo; detalhes e limites em [security-findings.md](./security-findings.md).

## Impact and severity (S1-S4)

S3 — provisório, aguardando decisão de arquitetura/segurança. A ausência de headers não prova vulnerabilidade explorável; CSP, COEP/COOP/CORP e Permissions Policy podem exigir configuração específica para não interromper funcionalidades.

## Security classification (if applicable)

- CVE / GHSA / CWE: não atribuído; alertas de configuração do ZAP, sem CVE/GHSA confirmado.
- Exploitability and affected component (confirmed or still under triage): presença/ausência dos headers e divulgação da versão observadas; impacto de segurança ainda sob triagem.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: nenhum aprovado; encaminhar ao responsável por frontend/infra para definir política compatível.
- Hipótese: a configuração de entrega do frontend não define esses headers e mantém o header de versão padrão do servidor.

## Pontos verificados sem divergência

- API aceita quantidades 1 e 999 e rejeita 0, 1000, texto e caracteres especiais; a UI aceita os limites 1/999 e rejeita 0/1000. Notação exponencial está registrada em QA-ISSUE-003.
- UI impede duplicar o mesmo produto; API responde 400 `VALIDATION_ERROR` e não persiste pedido.
- APIs rejeitam produto inexistente, inativo ou sem preço vigente com os códigos documentados e sem persistência parcial.
- O desconto seed de 10% aplica-se em R$ 1.000,00, não se aplica a R$ 999,99, arredonda HALF_UP (R$ 1.000,05 → R$ 100,01) e é zero quando não há regra ativa.
- O preço obtido do Catálogo é armazenado como snapshot no pedido; a listagem suporta filtro `CRIADO`, ordenação mais recente primeiro e página de tamanho 100.
- Erros de validação, negócio e payload seguem o envelope documentado e devolvem `X-Request-Id`; payload acima de 1 MiB retorna 413 `PAYLOAD_TOO_LARGE`.
- A consulta do produto PROD-003 seleciona o preço da janela vigente; produtos seed com preço futuro/expirado retornam `currentPrice: null`.
- O servidor ignora nome/preço/totais adulterados no payload do item e usa os dados autoritativos do Catálogo; pedido termina com situação `CRIADO`.
- Listagem `CRIADO` com `size=100`, ordenação mais recente primeiro, filtro inválido, geração automática de `X-Request-Id` e payload exatamente 1 MiB foram verificados sem divergência.

## Reexecução e análise da cobertura — 21/10/2026

- Reexecutada a suíte completa Playwright (testes API e UI antigos e novos): **73 cenários, 65 aprovados e 8 falhos**. Os oito casos falhos estão agrupados em quatro defeitos funcionais (QA-ISSUE-001 a 004), não são oito defeitos independentes. O baseline ZAP local posterior originou a verificação QA-ISSUE-005 e registrou os achados de segurança QA-ISSUE-006 e QA-ISSUE-007.
- A nova cobertura passou em preço/totais adulterados pelo cliente, status inválido, request ID gerado e fornecido, tamanho de corpo exatamente 1 MiB, criação sequencial de pedido, 100 itens na UI e 101 rejeitados.
- Depois de restaurar o sistema original, o Angular passou lint, 53 testes unitários e build de produção. Naquela execução, `mvn` não estava no PATH e os testes Java/Testcontainers não foram reexecutados. O smoke k6 atualizado foi executado via container oficial em projeto Compose descartável (524 requisições, 1.257 checks aprovados), incluindo criação; os dados e volumes temporários foram removidos. O workflow CI ainda não havia sido executado naquele momento; os resultados das execuções posteriores estão registrados abaixo.
- Para as lacunas e melhorias recomendadas (bordas temporais exatas de `validFrom`/`validTo`, normalização de `size > 100`, payload 1 MiB - 1 byte e resiliência pós-restauração), consultar a seção de revisão de cobertura em [09-sdd-business-rules.md](./09-sdd-business-rules.md).

## Evidência complementar — CI GitHub Actions #1 (22/10/2026)

Na execução do PR #1, oito testes Playwright falharam em quatro grupos já descritos em QA-ISSUE-001 a 004. Consulte o [job functional-qa](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/job/119583274178) e seu artifact para os cenários e traces. A integração Java também reforçou QA-ISSUE-002 e revelou a divergência de timeout registrada em QA-ISSUE-008. As alterações posteriores nos testes/configuração ainda precisam de uma nova execução para confirmar a resolução dos problemas de suíte.

## Reexecução GitHub Actions #2 (22/10/2026)

A correção de fixture eliminou as falhas espúrias de criação/indisponibilidade e a expectativa SQL rígida; `OrderPersistenceIT` passou (3/3), e `order-service` ficou com apenas `catalogTimeoutReturns504` falhando (500 em vez de 504). O Catálogo manteve uma falha (campo nulo omitido). A suíte Playwright ainda reportou oito falhas nos quatro grupos QA-ISSUE-001 a 004. Evidências: [order-service](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840/job/119591457029), [catalog-service](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840/job/119591457166) e [functional-qa](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840/job/119591457269).

## Falha de build anexada — Catalog Service

O log anexado executa somente `mvn -B -f catalog-service/pom.xml verify`. Build, compilação, Spotless, 14 testes unitários e inicialização do MongoDB/Testcontainers foram concluídos; 5/6 testes de integração passaram. O build falha exclusivamente porque a resposta de lote não contém a propriedade JSON `currentPrice` quando não há preço vigente, embora o contrato em `docs/api.md` exija `"currentPrice": null`. A mensagem HTTP 401 para metadados de um repositório Maven foi um aviso não bloqueante: as dependências foram obtidas do Maven Central e o Failsafe chegou a executar asserções. O defeito já está descrito acima em QA-ISSUE-002 e foi aberto no GitHub como #2.

Nenhuma falha de `order-service` consta no texto anexado, que não executa seu build. Não inferir aprovação nem falha de pedidos a partir deste log; a CI separada de Orders permanece evidência distinta.

## QA-ISSUE-008 — Timeout de leitura do Catálogo retorna HTTP 500 em vez de 504

## Summary

Quando a resposta do Catálogo excede o timeout de leitura configurado, `POST /api/v1/orders` retorna `500 INTERNAL_ERROR` em vez de `504 CATALOG_TIMEOUT`.

## Environment and commit

- Ambiente: GitHub Actions em Linux, job `order-service`, com PostgreSQL/Testcontainers e Catálogo simulado por MockWebServer.
- Branch/commit: `feature/COE-Leader`, `f56e0128fd19d374f1af7c13f7db1fb06dec849c`.

## Requirement / test case

- Catálogo sem resposta dentro do limite deve resultar em HTTP `504 CATALOG_TIMEOUT`.
- Referência: `docs/api.md` e `OrderApiIT.catalogTimeoutReturns504`.

## Preconditions and synthetic data

- MockWebServer responde com atraso superior ao timeout de leitura de 300 ms.
- Pedido sintético válido com um item; nenhuma informação real de cliente é usada.

## Steps to reproduce

1. Execute o job `order-service` do workflow CI.
2. Envie um pedido válido enquanto o Catálogo simulado retarda a resposta por 2 segundos.
3. Inspecione o status e o código de erro devolvidos pelo serviço de Pedidos.

## Expected result

HTTP `504` com código `CATALOG_TIMEOUT`, envelope de erro padrão e nenhum pedido persistido.

## Actual result

O job CI registrou HTTP `500` no teste `catalogTimeoutReturns504`, apesar de a exceção de rede incluir `java.net.SocketTimeoutException: Read timed out`. A causa provável está no reconhecimento/mapeamento da exceção de timeout; precisa ser confirmada pelo responsável pelo serviço.

## Evidence

- HTTP status / sanitized payload: status observado `500`; CI #1 e CI #2 reportaram falha da asserção `expected: <504> but was: <500>`.
- X-Request-Id / trace: disponível no log do serviço durante a execução; consultar os logs do job.
- Screenshot / Playwright trace / logs: [job `order-service`, CI #2](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39707684840/job/119591457029); a falha também estava presente na [CI #1](https://github.com/tabitha-pessoa/coe-lead-desafio-qa/actions/runs/39705130632/job/119583274202).
- Scanner / advisory / artifact link (for security findings): não aplicável.

## Impact and severity (S1-S4)

S2 — provisório: falha na classificação de timeout degrada observabilidade e comportamento de retry dos consumidores, além de divergir do contrato.

## Security classification (if applicable)

- CVE / GHSA / CWE: não aplicável.
- Exploitability and affected component (confirmed or still under triage): divergência funcional confirmada; sem alegação de explorabilidade.

## Workaround and suspected cause (clearly label hypotheses)

- Workaround: nenhum aprovado; consumidores não devem tratar um `500` como timeout de dependência.
- Hipótese: a exceção de socket pode estar encapsulada de forma diferente da verificação usada pelo gateway; revisar a cadeia de causas e o mapeamento de domínio sem expor detalhes internos na resposta.
