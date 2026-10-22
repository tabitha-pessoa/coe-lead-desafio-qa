# Uso de IA no Desenvolvimento

**Ferramentas utilizadas nesta entrega:** ChatGPT (GPT) e GitHub Copilot, conforme informado pela candidata. ChatGPT apoiou análise, planejamento, documentação e revisão; GitHub Copilot foi utilizado como assistência no editor. O SAI App 3.0 não foi utilizado porque exige conta Microsoft corporativa ou de estudante, indisponível para a candidata. Não atribuímos alterações individuais ao Copilot sem export de seu histórico.

**Motivo da escolha:** o desafio exige uso eficaz de IA ao longo do ciclo. GPT foi usado para apoiar tarefas com contexto amplo e análise/documentação; GitHub Copilot forneceu assistência integrada ao editor. As duas ferramentas foram usadas como apoio, com decisões de arquitetura, negócio e aceite mantidas sob revisão humana.

**Link da conversa ChatGPT:** [Planejar desafio técnico QA](https://chatgpt.com/share/6ad936ce-c350-83e9-b576-dbf894a10eeb). Um registro JSON de referência está em [docs/qa/chatgpt-share-evidence.json](qa/chatgpt-share-evidence.json); ele não é o transcript integral, pois a página compartilhada não disponibilizou o conteúdo durante a captura.

## Metodologia: Spec-Driven Development (SDD)

O desenvolvimento seguiu SDD: antes de qualquer código, a IA e o candidato produziram uma **especificação executável em 14 fases** (levantamento de requisitos, decisões de arquitetura, contratos de API, schema de dados, casos de teste e critérios de aceite), e a implementação foi conduzida fase a fase contra essa especificação. Cada fase só foi considerada concluída após validação objetiva (build + testes), e desvios da spec viraram ADRs.

## Log de utilização por etapa

| Etapa | Prompt (objetivo) | Decisão humana | Validação aplicada |
|---|---|---|---|
| 1. Levantamento de requisitos | "Analise o desafio e produza o levantamento com 21 seções" | Aprovação do escopo; definição da stack (Java + Spring Boot, Angular, PostgreSQL) sobrepõe o template Node do briefing | Revisão seção a seção contra o documento do desafio |
| 2. Arquitetura | Especificação da Clean Architecture, portas/adaptadores, integração em lote | Aceite do compromisso pragmático (@Transactional na aplicação) | ADRs 001-015 redigidos e revisados |
| 3. Contratos de API | Especificação dos endpoints, códigos de erro e envelope | Escolha do envelope `{error, requestId}` e semântica 422 para regras de negócio | Contratos conferidos na implementação e nos ITs |
| 4. Catalog Service | Implementação do serviço completo com testes | Revisão do modelo de vigência de preços | `mvn spotless:check test` — 14/14 testes verdes |
| 5. Order Service | Implementação do serviço completo com testes | Revisão da regra de desconto e do snapshot de preço | `mvn spotless:check test` — 25/25 testes verdes |
| 6. Depuração | Correção de erros de compilação/testes apontados pelo build (imports ausentes, stub de mock retornando null, API do Jackson) | Conferência de cada correção antes do próximo build | Builds reexecutados até BUILD SUCCESS |
| 7. Mensagens de erro | IA sugeriu códigos/mensagens e o mapeamento HTTP | Ajuste de semântica (404 x 422 x 5xx) e inclusão do `requestId` | Tabela de erros validada nos ITs de API |
| 8. Governança e dimensionamento | Redação do guia de code review e da estimativa | Revisão de realismo das premissas e dos critérios bloqueadores | Leitura crítica contra as práticas do desafio |

## Uso responsável e validação das saídas

- **Nada foi aceito sem validação executável:** todo código gerado por IA passou por compilação, testes automatizados e revisão humana; nenhum artefato foi mergeado "por confiança".
- **Erros da IA foram detectados pelo pipeline:** a IA cometeu erros típicos (imports ausentes, assinatura de API inexistente, mock não stubado) que foram capturados pelo build/testes e corrigidos no próprio ciclo — evidência de que o gate automatizado é indispensável quando IA participa do desenvolvimento.
- **Decisões de negócio permaneceram humanas:** stack, escopo, semântica de erros, regra de desconto e premissas da estimativa foram definidas/validadas pelo candidato.
- **Rastreabilidade:** cada decisão relevante virou um ADR; prompts e validações estão registrados na tabela acima.
