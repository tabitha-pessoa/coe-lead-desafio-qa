# Uso responsável de IA no ciclo de qualidade

## Ferramentas e motivo da escolha

Foram utilizadas **ChatGPT (GPT)** e **GitHub Copilot** como ferramentas de apoio ao desafio. O **SAI App 3.0 não foi utilizado** porque, no ambiente da candidata, exigia uma conta Microsoft corporativa ou de estudante, que ela não possui. O desafio permite ferramentas de IA equivalentes; ChatGPT e Copilot foram escolhidos por estarem disponíveis para apoiar análise, documentação e automação no fluxo de trabalho.

- **ChatGPT/GPT:** apoio à interpretação dos requisitos, estratégia e especificação SDD, derivação/revisão de testes, leitura de resultados e defeitos, recomendações de performance/segurança e documentação de governança, dimensionamento e CI/CD.
- **GitHub Copilot:** assistência no fluxo de desenvolvimento no editor, incluindo sugestões e refinamentos de código/documentação. A candidata informa que utilizou Copilot; não foi fornecido um histórico exportado de prompts/sugestões, portanto não se atribuem ao Copilot alterações específicas nem prompts literais.

**Link compartilhável da conversa ChatGPT:** [Planejar desafio técnico QA](https://chatgpt.com/share/6ad936ce-c350-83e9-b576-dbf894a10eeb).

**Registro JSON incluído:** [chatgpt-share-evidence.json](./chatgpt-share-evidence.json). O JSON registra o link e os metadados públicos observados, mas não é um export integral do transcript. Na validação deste workspace, a página exibiu o título, mas as chamadas necessárias para carregar o conteúdo retornaram HTTP 401. Para anexar o transcript completo, exporte-o pela interface autorizada do ChatGPT e substitua/complemente o arquivo com o export original, sem alterar mensagens.

## Uso ao longo do ciclo de QA

Os prompts abaixo são exemplos representativos dos objetivos de trabalho, não transcrições literais da conversa compartilhada. O histórico de prompts/sugestões do Copilot não foi exportado; seu uso é descrito no nível de atividade para não inventar prompts.

| Etapa | Apoio de IA | Decisão e validação humana |
|---|---|---|
| Estratégia e riscos | GPT apoiou a análise do desafio, identificação de riscos, prioridades e critérios de entrada/saída. | Conferir requisitos contra PDF, `docs/requirements.md`, `docs/api.md` e ADRs; marcar ambiguidades em vez de assumir comportamento. |
| Especificação/SDD | GPT ajudou a estruturar critérios Given/When/Then e a rastreabilidade requisito → teste → evidência. | A especificação oficial e os contratos prevalecem; a rastreabilidade retrospectiva não prova que todo teste existente nasceu de SDD. |
| Automação de API e UI | GPT apoiou a derivação e revisão de cenários Playwright/TypeScript; Copilot foi usado como assistência no editor para código e documentação, conforme informado pela candidata. | Verificar endpoint, schema, seletores, resultados esperados e dados sintéticos; executar a suíte e preservar falhas reais. |
| Performance | GPT apoiou a modelagem de fluxos e revisão do k6 para smoke, load, stress e soak. | Validar cada fluxo contra API real; execução smoke documentada é local; thresholds são provisórios, e load/stress/soak não foram calibrados. |
| Execução e análise de defeitos | GPT apoiou a organização de evidências, reprodução, impacto e separação entre fato, hipótese e alerta heurístico. | Confirmar status, envelope, `X-Request-Id`, saída de testes e resposta HTTP; findings npm/ZAP não são declarados automaticamente como vulnerabilidades exploráveis. |
| Segurança e CI/CD | GPT apoiou a documentação dos gates npm, Dependency-Check e ZAP baseline, além da revisão da estrutura do workflow. | Inspecionar a saída das ferramentas, manter o sistema sob teste inalterado e não considerar GitHub Actions aprovado antes de execução real. |
| Governança e dimensionamento | GPT apoiou a estrutura do guia de qualidade e WBS de três semanas. | Manter premissas, riscos, contingência e fórmula comercial explícitos; não inventar tarifas ou SLAs. |

### Prompts representativos de GPT

1. **Estratégia:** “Com base exclusivamente no desafio e nos contratos, derive riscos, níveis de teste, critérios de entrada/saída e cenários positivos e negativos. Marque hipóteses e não invente endpoints.”
2. **API/UI:** “Proponha testes Playwright em TypeScript para as regras e jornadas documentadas. Valide status, schema, cálculos, mensagens e ausência de persistência após rejeições. Não altere o código de produção.”
3. **Performance:** “Derive cenários k6 conservadores para listagem, Catálogo individual/lote e criação somente em ambiente descartável. Separe perfis e não apresente thresholds sem SLO como metas aprovadas.”
4. **Triagem:** “Separe comportamento reproduzido de hipótese e alerta automatizado; descreva passos, resultado esperado/atual, impacto e evidência sem afirmar explorabilidade não comprovada.”
5. **Governança/comercial:** “Redija gates de PR e dimensionamento de três semanas com QA Sênior e Pleno, explicitando premissas, exclusões, contingência, fórmula de preço e riscos.”

## Revisão humana e uso responsável

- Requisitos e contratos foram conferidos contra a documentação do sistema e a massa seed.
- Saídas de código/automação foram verificadas por execução ou validação estática; nesta entrega, `npm run typecheck` passou, 73 testes Playwright foram enumerados e a execução funcional registrada teve falhas documentadas.
- Resultados financeiros, de carga, de auditoria e de segurança foram registrados conforme as evidências disponíveis; não foram convertidos em afirmações de aprovação sem suporte.
- Foram utilizados dados sintéticos; não inserir credenciais, segredos, dados pessoais reais ou código confidencial em ferramentas não aprovadas.
- O usuário/candidato continua responsável por revisar artefatos, validar execuções e decidir sobre mudanças.

## Limitações e rastreabilidade

O SAI App 3.0 não estava acessível devido à exigência de conta Microsoft corporativa/de estudante. O link compartilhável foi fornecido pela candidata; o conteúdo integral não pôde ser recuperado automaticamente nesta sessão. O arquivo JSON incluído é um registro de referência, não uma transcrição integral. Antes da submissão, se o desafio exigir o transcript como arquivo, exporte a conversa pela interface autorizada e preserve o conteúdo original. Não afirmar que Copilot gerou um trecho específico sem histórico que o comprove.
