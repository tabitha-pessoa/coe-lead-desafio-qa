# Especificação de Qualidade — Gestão de Pedidos e Catálogo

**Versão:** 1.0  
**Abordagem:** Spec-Driven Development (SDD) aplicado ao trabalho de QA  
**Status:** rastreabilidade retrospectiva da automação existente e especificação normativa para as próximas alterações; escopo e lacunas abaixo

## 1. Objetivo e fontes

Esta especificação transforma os requisitos do desafio em critérios verificáveis antes de alterar ou ampliar a automação. Ela complementa [a estratégia e o plano de testes](./01-test-strategy-and-plan.md): este documento registra a relação requisito → critério de aceite → teste → evidência e explicita o que ainda não está coberto.

Para os testes já existentes, a relação abaixo foi montada retrospectivamente; ela não comprova que toda a automação original foi criada test-first. O fluxo SDD passa a ser obrigatório para novas coberturas e mudanças de qualidade descritas nesta entrega.

Fontes de requisito: enunciado do desafio, [contratos de API](../api.md), [requisitos do sistema](../requirements.md), seed de produtos e comportamento observável da aplicação. Em caso de conflito, o requisito explícito do desafio prevalece; ambiguidades devem ser registradas como hipótese, não resolvidas por suposição silenciosa.

## 2. Fluxo SDD para mudanças de qualidade

1. Registrar requisito e risco com identificador estável.
2. Escrever o resultado observável (Given/When/Then) e os dados necessários.
3. Definir a camada de teste adequada e o teste executável que comprova o critério.
4. Implementar/atualizar automação e pipeline sem relaxar a expectativa para fazer o teste passar.
5. Executar a suíte, registrar resultado e evidência no relatório de qualidade.
6. Se requisito, contrato ou comportamento mudar, atualizar esta especificação e os testes na mesma mudança.

Uma linha sem teste é uma lacuna explícita; uma linha com teste não é considerada aprovada até haver resultado de execução associado.

## 3. Critérios de aceite rastreados

| ID | Given / When / Then | Automação e evidência | Situação |
|---|---|---|---|
| CFG-API / CFG-UI | Dada a escolha de stack, quando a suíte é configurada e executada contra o sistema local, então a escolha, pré-requisitos e comandos são reproduzíveis. | Playwright + TypeScript para API e browser, com justificativa de experiência e compartilhamento de fixtures/tipos/relatórios em [estratégia](./01-test-strategy-and-plan.md); setup e comandos em [README da suíte](../../qa-tests/README.md). Compose iniciou e os 73 testes Playwright foram executados localmente. `npm run typecheck` também passa e está no gate CI. | Coberto com falhas funcionais registradas; a última execução CI remota ainda está pendente |
| CAT-001 / CAT-002 | Dado ID ou lote válido, quando consultado, então a API retorna os dados de produto, preço corrente, moeda e IDs não encontrados. | Playwright API `catalog.spec.ts`: consulta individual e em lote. | Coberto; execução atual passa nos casos, exceto divergência de serialização abaixo |
| CAT-003 / CAT-005 / CAT-006 | Dado ID inexistente ou produto sem preço vigente, quando consultado, então a API retorna o erro ou `currentPrice: null` conforme o contrato. | Playwright API `catalog.spec.ts`, com produtos seed inexistente, futuro e expirado. | Parcial: `currentPrice`/`validTo` nulos são omitidos (QA-ISSUE-002); faltam bordas exatas de vigência |
| ORD-001 a ORD-009 | Dado pedido válido ou entrada inválida, quando enviado, então valida cliente/itens, consulta preço autoritativo, grava snapshot, calcula desconto e evita persistência parcial em rejeições. | `orders.spec.ts` e `order-business-rules.spec.ts`: criação, campos, preço/totais adulterados, quantidades 1/999 e inválidas, duplicidade, produto inexistente/inativo/sem preço, all-or-nothing, desconto, snapshot, status `CRIADO` e paginação. | Coberto; 100 itens é divergente em execução (QA-ISSUE-001); gaps de fronteira e configuração estão na seção 5 |
| ORD-010 | Dado Catálogo indisponível ou lento, quando a criação depende dele, então responde 503 ou 504, respectivamente. | `OrderApiIT.catalogUnavailableReturns503` e `catalogTimeoutReturns504` na suíte Java de integração. | Coberto no código de teste, mas não reexecutado após restaurar a cópia original; resultado pós-restauração pendente |
| ORD-011 / ERR-RULE | Dado payload acima do limite ou erro de API, quando processado, então retorna status/envelope/código e `X-Request-Id` coerentes. | Playwright API `order-business-rules.spec.ts`: >1 MiB, exatamente 1 MiB, ID fornecido/gerado e erros de validação/negócio. | Parcial: falta validar payload válido de 1 MiB menos um byte e consistência do envelope/correlação em todos os endpoints |
| ORD-012 / ORD-013 | Dada consulta de detalhe ou listagem, quando executada, então retorna detalhe e página ordenada do mais recente ao mais antigo, com filtro por situação e limite documentado. | Playwright API `orders.spec.ts` e `order-business-rules.spec.ts`: criação/detalhe/listagem, filtro, ordenação e `size=100`. | Parcial: falta comprovar a política para `size > 100` e valores de paginação inválidos |
| INT-001 | Dado pedido com produtos, quando criado, então Pedidos consulta Catálogo por HTTP e persiste o snapshot retornado; falhas não persistem parcialmente. | Pedidos e Catálogo reais em Compose na suíte Playwright; testes Java incluem assertiva de chamada em lote e falhas controladas. | Coberto para fluxo feliz/domínio; resiliência 503/504 carece reexecução pós-restauração |
| UI-001 / UI-002 | Dada consulta individual/em lote ou entrada vazia, quando usada a tela Catálogo, então apresenta produto e campos ou feedback de validação sem chamada indevida. | Playwright UI `catalog.spec.ts`. | Parcial: consulta e dados cobertos; busca que resulta em zero IDs não exibe feedback (QA-ISSUE-004) |
| UI-003 / UI-004 | Dado cliente e itens, quando cria pedido, lista ou abre detalhe, então os dados, totais e navegação são coerentes e entradas inválidas são impedidas com feedback. | Playwright UI `orders.spec.ts` e `order-business-rules.spec.ts`. | Parcial: jornadas e validações são exercitadas; espaços não são validados adequadamente (QA-ISSUE-004) e `1e2` é aceito (QA-ISSUE-003) |
| UI-005 | Dada a troca de idioma, quando se navega pelas telas principais, então interface e mensagens aparecem em português, inglês e espanhol. | Playwright UI `languages.spec.ts`; testes de Painel em `dashboard.spec.ts`. | Coberto pela suíte |
| NFR-001 | Dado tráfego smoke de chegada baixa, quando exercitados Pedidos e Catálogo, então os contratos básicos passam e erros/latência atendem aos thresholds provisórios. | k6 perfis de listagem size 20/100, Catálogo individual/batch de 50 IDs e pedido opcional em ambiente descartável; execução local registrada no [relatório](./02-quality-summary-template.md). | Smoke atual executado: 524 requisições e 1.257 checks aprovados. Não prova capacidade/SLO. |
| SEC-001 | Dadas as dependências Node e Maven, quando a pipeline roda, então audita advisories com limiar alto/crítico e publica evidência. | `npm audit --audit-level=high` para os dois lockfiles e OWASP Dependency-Check Maven em CI. | Parcial/falhou: frontend reportou 2 críticas, 6 altas e 3 moderadas; automação QA sem advisories. Maven check não reexecutado localmente. |
| SEC-002 | Dada a aplicação local descartável, quando executado o baseline DAST passivo, então os relatórios dos três serviços ficam disponíveis para triagem. | Job `security-baseline` no CI e workflow semanal/manual OWASP ZAP. | Executado localmente nos três serviços: 10 alertas não informativos e 4 informativos. Frontend: headers ausentes/divulgação da versão do nginx; APIs: 500 em rotas não mapeadas, registrado em QA-ISSUE-005. Sem stack trace observado. Execução GitHub Actions pendente; scanner passivo, não pentest. |
| AI-001 | Dada uma atividade de QA apoiada por IA, quando os casos/scripts são utilizados, então prompts/objetivos e validação humana são documentados sem inventar resultados. | [Registro de uso de IA em QA](./05-ai-usage.md), link compartilhável e [referência JSON](./chatgpt-share-evidence.json). | Parcial: link real e ferramentas estão documentados; o JSON é referência, não transcript integral, e o histórico de prompts/sugestões do Copilot não foi exportado. |
| GOV-001 | Dado trabalho de uma squad, quando se avalia um PR, então padrões mínimos e bloqueios por risco são explícitos. | [Padrão de governança](./03-governance-standard.md) e [template de defeito](../../.github/ISSUE_TEMPLATE/quality-defect.md). | Coberto documentalmente. |
| EST-001 | Dado cenário hipotético de três semanas, quando estimado, então esforço, senioridade, composição e premissas ficam claros sem inventar tarifas. | [Dimensionamento técnico-comercial](./04-commercial-estimation.md): QA Sênior + QA Pleno, 240h e fórmula de preço. | Coberto documentalmente; preço final requer taxas aprovadas. |

## 4. Quality gates e evidências

- `.github/workflows/ci.yml`: Spotless, `mvn verify` (unitários e integração/Testcontainers), análise Maven/npm, lint/testes/build de frontend, type-check da automação TypeScript, jobs independentes de Playwright API/UI, k6 e ZAP, build de imagens e publicação condicionada ao sucesso em `main`.
- O workflow publica relatórios Java, dependências, Playwright/JUnit, resumo k6, metadados do runner e amostras de recursos como artifacts; imagem só é publicada no GHCR depois de todos os gates.
- A reexecução Playwright pós-restauração executou 73 cenários: 65 aprovados e 8 falhos (API 43/46; UI 22/27), agrupados nos quatro defeitos registrados em [issues.md](./issues.md).
- Os resultados Java (55/55), Maven e k6 registrados no relatório são de execução anterior, não reexecutados após restauração. A existência do workflow não comprova que o GitHub Actions passou.
- Para bloquear merge de fato, ainda é preciso configurar o check da ação/regras de proteção de branch no GitHub. Publicar no GHCR não configura deploy automático em infraestrutura.

## 5. Cobertura fora do aceite atual

Os requisitos 2.4 e 2.5 têm configuração e automação implementadas, mas não estão integralmente aprovados. Além dos defeitos reproduzidos, faltam: bordas temporais exatas de `validFrom`/`validTo`; política de paginação para `size > 100` e parâmetros inválidos; payload JSON válido de 1 MiB menos um byte; execução pós-restauração dos testes Java de 503/504; calibração dos perfis de carga; primeira execução GitHub do ZAP/Dependency-Check; triagem e remediação/aceite formal dos advisories npm. Os erros de validação visual detectados contam como cobertura com resultado falho, não como requisito aprovado.

### Avaliação da cobertura de performance

O script k6 cobre listagem de pedidos nos tamanhos 20 e 100, consulta individual e lote de 50 IDs do Catálogo e, quando habilitada explicitamente, criação de pedidos. Há perfis `smoke`, `load`, `stress` e `soak`, checks de contrato básico por fluxo, métricas de erro por endpoint, thresholds de erro/latência e `dropped_iterations`. O workflow recria a stack e os volumes antes de medir, executa o perfil smoke com criação habilitada apenas nesse ambiente descartável e publica o resumo, versão do k6, configuração do runner e amostras de `docker stats`.

Essa automação é uma melhoria sobre o cenário inicial, mas continua sendo baseline, não aprovação de capacidade: os thresholds de 1% e p95 de 800 ms continuam provisórios, a carga combinada do smoke é baixa, e não há SLO/perfil de tráfego acordado. Os perfis `load`, `stress` e `soak` existem para execução manual aprovada, mas não rodam no PR e não foram calibrados nem executados. Ainda faltam filtros/cardinalidades representativas e métricas específicas de banco. A amostragem `docker stats` cobre containers, mas não substitui telemetria de aplicação/banco. A criação de pedidos precisa ser executada apenas em stack descartável, pois os registros gerados permanecem no banco até a limpeza do ambiente.

## 6. IA, revisão e rastreabilidade

IA pode apoiar derivação de cenários, dados e automação, mas a especificação é a fonte de verdade. Saídas devem ser revisadas contra os requisitos, executadas e vinculadas aos IDs acima; não aceitar cobertura ou resultado inventado pela ferramenta.

Os registros de IA no [desenvolvimento](../ai-development.md) e em [QA](./05-ai-usage.md) foram reconciliados para GPT e GitHub Copilot, e o link de compartilhamento foi incluído. O JSON disponível é um registro de referência, não uma exportação integral; se o avaliador exigir o transcript como arquivo, exportá-lo pelo ChatGPT e preservar o conteúdo original.
