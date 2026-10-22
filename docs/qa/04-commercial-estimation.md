# Dimensionamento técnico e proposta comercial — 3 semanas

## Resumo executivo

Estimativa inicial para concluir as Partes 1–5 do desafio (estratégia, automação API, UI, performance, quality gates e relatório) com **1 QA Sênior/COE e 1 QA Pleno**, em 15 dias úteis. Estimativa de planejamento: **240 horas de capacidade bruta** (2 pessoas × 8 h × 15 dias). O escopo precisa ser fatiado por risco; integração de serviços e automação de UI são dependentes do ambiente e podem consumir contingência.

## Premissas e exclusões

- Sistema, documentação, seed e Docker Compose entregues funcionais e acessíveis no primeiro dia.
- 8 h/dia por profissional, sem feriados, sem alocação parcial e com acesso ao repositório GitHub.
- Sem mudança no código de produção; problemas de ambiente ou divergências são registrados, não corrigidos pela equipe de QA.
- k6 e GitHub Actions sem custo de licença; execução de carga limitada a ambiente local/temporário autorizado.
- SAI App 3.0 indisponível por exigência de conta corporativa/estudante; ChatGPT é utilizado para apoio, com prompts e validação documentados.
- Estimativa não inclui homologação de cliente real, certificação formal de segurança, teste de carga em produção, suporte contínuo nem custos de infraestrutura/licenças eventualmente necessários.

## WBS e esforço

| Entrega | QA Sênior | QA Pleno | Total |
|---|---:|---:|---:|
| Kickoff, leitura de docs, SDD, riscos e estratégia/plano/casos | 12 h | 8 h | 20 h |
| Setup ambiente, smoke, fixtures e contratos de API | 6 h | 10 h | 16 h |
| Automação API Catálogo e Pedidos, negativos e integração | 18 h | 30 h | 48 h |
| Automação UI E2E Catálogo/Pedidos/i18n | 10 h | 22 h | 32 h |
| Performance k6, baseline e análise de resultados | 8 h | 8 h | 16 h |
| Pipeline CI/CD, gates Java/frontend/API/UI/performance/segurança, artifacts e publicação de imagens GHCR | 12 h | 12 h | 24 h |
| Execução regressiva, triagem e issues com evidências | 10 h | 14 h | 24 h |
| Governança COE, IA responsável e documentação | 12 h | 4 h | 16 h |
| Baseline passivo ZAP, auditoria de dependências e triagem inicial/configuração | 6 h | 6 h | 12 h |
| Gestão, alinhamento, demo e handover | 6 h | 6 h | 12 h |
| Contingência controlada | 20 h | 0 h | 20 h |
| **Total** | **120 h** | **120 h** | **240 h** |

A contingência está contida nas 240 horas totais e será consumida apenas mediante risco identificado; não representa trabalho adicional automático. O Senior dedica-se a arquitetura de testes, risco, gates, revisão e comunicação; o Pleno implementa automação e execução sob revisão e pareamento.

## Plano por semana

**Semana 1 — Descoberta e base (80 h):** setup, confirmação de contratos/seed, estratégia e matriz de rastreabilidade, testes API do Catálogo e casos positivos/negativos prioritários de Pedidos, primeira pipeline.

**Semana 2 — Cobertura de fluxos (80 h):** ampliar API e integração, UI E2E para catálogo/criação/listagem/detalhe, validação i18n, k6 inicial e estabilização dos testes.

**Semana 3 — Qualificação e entrega (80 h):** quality gates finais, segurança básica, execução regressiva, triagem de issues, relatório de qualidade, governança COE, prompts/validação de IA, demo e handover.

## Modelo de precificação

Como não foi fornecida tabela interna de custos, a proposta deve usar as taxas comerciais aprovadas pela empresa, sem inventar preço de mercado. Fórmula:

- **Custo interno** = (120 h × custo-hora carregado Sênior) + (120 h × custo-hora carregado Pleno) + despesas diretas.
- **Preço de venda** = custo total ÷ (1 − margem bruta alvo). Ex.: margem de 30% significa dividir por 0,70, não multiplicar por 1,30.
- **Preço por perfil** = horas vendáveis por perfil × taxa-hora aprovada, somadas a custos/licenças/infra aprovados.
- Informar validade da proposta, impostos, moeda, condições de pagamento, critérios de aceite, gestão de mudança e tratamento de dependências externas.

## Riscos comerciais e mitigação

| Risco | Impacto | Resposta |
|---|---|---|
| Ambiente instável / seed inconsistente | consumo de horas sem cobertura adicional | smoke no dia 1; registrar bloqueio e acionar sponsor |
| Mudanças de escopo | atraso e margem reduzida | baseline e change request com impacto em prazo/preço |
| SLO não definido | critérios subjetivos de performance | acordar metas antes de executar carga formal |
| Dependência de conta SAI | ferramenta indisponível | ferramenta IA alternativa permitida pelo enunciado; documentar motivo |
| Testes instáveis / dados compartilhados | falsa falha e retrabalho | isolamento, retries limitados e análise de flaky rate |

## Critérios de aceite

Entrega versionada no GitHub; README reproduzível; relatórios reais anexados; testes e gates demonstráveis; issues confirmadas com evidência; limitações e riscos residuais aprovados pelo responsável de produto/cliente. A estimativa deve ser recalibrada após o smoke inicial e validada pelo Client Face antes de assumir compromisso comercial.
