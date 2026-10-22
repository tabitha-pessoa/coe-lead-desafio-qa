# Autoavaliação dos critérios — desafio COE Leader QA/Testes

**Data da avaliação:** 21/10/2026  
**Escopo:** artefatos, automações e evidências encontrados neste workspace. Esta avaliação não substitui a execução do workflow remoto nem comprova histórico Git que não está disponível localmente.

## Resultado executivo

| # | Critério | Avaliação | Evidência principal / pendência |
|---|---|---|---|
| 1 | Estratégia e planejamento de testes | **Atendido, com ressalva SDD** | Estratégia, riscos, prioridades e rastreabilidade em [01-test-strategy-and-plan.md](./01-test-strategy-and-plan.md) e [00-quality-specification.md](./00-quality-specification.md). A rastreabilidade dos testes existentes foi feita retrospectivamente; não prova que todo o trabalho original começou por SDD. |
| 2 | Qualidade do código de automação | **Atendido no gate estático; melhoria aplicada** | Playwright/TypeScript, execução serial e evidência em falha. Foi corrigido o desalinhamento entre `package.json` e lockfile, adicionado `npm run typecheck` e o job CI correspondente. `tsc --noEmit` passou localmente. |
| 3 | Eficácia dos testes | **Automação eficaz; sistema não aprovado** | 73 cenários são descobertos atualmente; execução local documentada: 65 aprovados e 8 falhos, agrupados em defeitos reproduzidos. O k6 smoke cobre Pedidos e Catálogo; load/stress/soak não foram calibrados nem executados. |
| 4 | Confiabilidade da execução | **Parcial** | Playwright usa um worker, sem paralelismo, e preserva trace/screenshot em falha; o CI tem retry limitado e ambiente Compose descartável. Não há execução de GitHub Actions registrada; portanto, reprodutibilidade remota ainda não foi demonstrada. |
| 5 | Reporte e comunicação | **Atendido documentalmente, com limitação de artifacts** | [issues.md](./issues.md) e [security-findings.md](./security-findings.md) seguem o template de defeito; [02-quality-summary-template.md](./02-quality-summary-template.md) distingue evidência, riscos e parecer. Alguns reports/JSON de scanner foram temporários e não permanecem anexados ao workspace. |
| 6 | Documentação | **Parcial** | README, estratégia, comandos de setup/execução, performance e uso de IA estão documentados. O link compartilhável real está registrado; o JSON presente é referência, não transcript integral. O workflow GitHub também precisa de execução real. |
| 7 | Uso eficaz de Git e GitHub / GitFlow | **Parcial; remoto pendente** | Foi inicializado Git localmente e criada a branch solicitada `feature/COE-Leader`, com commit local do projeto. Não há remote/repositório GitHub conectado nem PR/checks remotos; o histórico remoto e o GitFlow ainda não podem ser avaliados. |
| 8 | Implementação dos diferenciais | **Atendido documentalmente; execução remota pendente** | [03-governance-standard.md](./03-governance-standard.md), [04-commercial-estimation.md](./04-commercial-estimation.md), documentação de IA, auditoria npm e ZAP local. As taxas comerciais dependem de tabela interna aprovada; a publicação/artifacts CI não foram observados. |
| 9 | Uso eficaz de IA no ciclo de testes | **Parcial** | [05-ai-usage.md](./05-ai-usage.md) registra o uso declarado de GPT e GitHub Copilot, prompts representativos para o ciclo e validação humana. O link real está incluído; o transcript JSON completo e o histórico de prompts do Copilot não foram disponibilizados. |
| 10 | Liderança técnica evidenciada | **Atendido nos artefatos** | Estratégia baseada em risco, bloqueios de PR, desenvolvimento de pessoas, premissas comerciais, contingência, fórmula de preço, riscos e critérios de aceite estão documentados. O preço final exige taxas aprovadas e não foram fabricados valores. |

## Entregáveis exigidos para submissão

| Entregável | Situação neste workspace | Próxima ação |
|---|---|---|
| Código das suítes back-end, front-end e performance; workflow CI/CD | Presente em `qa-tests/`, `performance/` e `.github/workflows/`; setup, comandos e pré-requisitos estão no [README](../../README.md). O type-check da automação passou localmente. | Publicar o workspace no repositório GitHub real e validar a execução dos workflows. |
| Artefatos das Partes 1 e 5 anexos ao repositório | Presentes em `docs/qa/`: estratégia/SDD, relatório de qualidade e defeitos reproduzidos. | Incluir no repositório remoto junto do código. |
| Defeitos registrados como GitHub Issues | **Pendente**. Os sete relatos estão em [issues.md](./issues.md), preenchidos conforme o template, mas não são Issues remotas e não têm URLs. | Criar uma Issue por relato no GitHub com o template, registrar número/URL e vinculá-las ao relatório. |
| Documento de ferramenta IA, motivo e processo ao longo do ciclo | Documento presente em [05-ai-usage.md](./05-ai-usage.md); ferramenta, motivo, etapas, link e referência JSON estão registrados. | Se o desafio exige o transcript como arquivo, exportar a conversa original no ChatGPT e atualizar o JSON de referência; manter as mensagens inalteradas. |
| Artefatos diferenciais | Governança, dimensionamento, IA e segurança estão documentados; workflows de auditoria/ZAP estão configurados. | Anexar ao repositório remoto e registrar resultados reais do CI; preço final depende das taxas comerciais aprovadas. |

## Validações feitas nesta avaliação

- `cd qa-tests && npm ci`: concluído; 6 pacotes adicionados e auditoria do lockfile QA reportou zero vulnerabilidades.
- `npm run typecheck`: concluído com `tsc --noEmit`, sem erros.
- `npm test -- --list`: Playwright enumerou 73 testes em 8 arquivos, sem executar os casos contra a aplicação.
- `docker compose ps`: nenhum serviço da aplicação estava ativo nesta avaliação; não houve reexecução funcional nesta rodada.
- A execução funcional anteriormente registrada continua sendo 65/73, com falhas documentadas. O arquivo `qa-tests/test-results/.last-run.json` marca a execução disponível como `failed`; não havia `junit.xml` disponível para esta avaliação.
- O workflow GitHub Actions não foi executado; a existência/configuração dos YAMLs não equivale a um check remoto aprovado.
- Git local foi inicializado nesta rodada na branch `feature/COE-Leader`; commit local registrado. A criação/publicação de repositório remoto não foi possível nesta sessão porque a página GitHub pede autenticação e não há remote nem integração autenticada de criação de repositórios. Não há dados para confirmar PRs ou checks remotos.

## GitFlow recomendado para adoção no repositório remoto

Este fluxo é uma proposta operacional. A branch local `feature/COE-Leader` foi criada conforme solicitado; ainda falta criar o repositório remoto e configurar `main`/proteção de branches.

1. `main` contém releases aprovadas; `develop` recebe integração contínua.
2. Criar branches curtas `feature/<id>-<resumo>` e `bugfix/<id>-<resumo>` a partir de `develop`; abrir PR para `develop`. A branch atual é `feature/COE-Leader`.
3. Criar `release/<versao>` de `develop` para estabilização; após aprovação, integrar em `main` e sincronizar de volta com `develop`.
4. Criar `hotfix/<id>-<resumo>` a partir de `main`; após validação, integrar em `main` e `develop`.
5. Cada PR deve apontar para issue/requisito, conter evidência de testes, revisão independente e checks obrigatórios verdes. Proteger `main` e `develop`; não publicar GHCR antes dos gates.
6. Usar commits pequenos e descritivos, por exemplo `test(orders): cover catalog batch limit`, e não reescrever histórico compartilhado.

## Ações ainda necessárias antes da submissão

1. **Candidata:** se necessário para submissão, exportar o transcript integral pelo ChatGPT e substituir/complementar `docs/qa/chatgpt-share-evidence.json`; confirmar que o link compartilhado permanece acessível ao avaliador.
2. **Responsável pelo repositório/GitHub:** criar `tabithapessoa/coe-lead-desafio-qa` como público, configurar o remote local, publicar `feature/COE-Leader` e a branch base, adotar o fluxo acima, abrir PRs reais, exigir checks e registrar os resultados. A sessão atual abriu GitHub sem autenticação, então não foi possível criar/publicar remotamente.
3. **Responsável pelo CI:** executar a pipeline no GitHub e anexar/consultar artifacts; o resultado esperado pode ser bloqueante devido aos defeitos e advisories já reportados, e isso deve ser apresentado com transparência.
4. **Engenharia/segurança:** triagem dos advisories do frontend, decidir política para headers ZAP e corrigir/aceitar formalmente findings; não tratar alertas heurísticos como vulnerabilidades confirmadas.
5. **Produto/Client Face:** aprovar perfil/SLO de performance e fornecer taxas comerciais para fechar o preço da proposta.
6. **QA/engenharia:** corrigir no sistema os defeitos QA-ISSUE-001 a 007 ou documentar aceite de risco; manter o código sob teste sem alterações não autorizadas.
7. **Candidata/repositório remoto:** publicar os sete relatos de `issues.md` como Issues reais, usando `.github/ISSUE_TEMPLATE/quality-defect.md`, e substituir cada referência local pelo link/ID correspondente.
