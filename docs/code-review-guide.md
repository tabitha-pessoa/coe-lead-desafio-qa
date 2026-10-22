# Guia de Code Review — Squads Multi-Stack

Objetivo: padrão único de revisão para squads com stacks diferentes (Java/Spring, Node/TypeScript, Angular, .NET), com critérios objetivos. Um PR deve ser revisado em até 1 dia útil; mudanças críticas (hotfix) em até 2 horas.

## O que revisar (em ordem)

1. **Corretude e regra de negócio** — o código faz o que a tarefa pede? Cobre os casos de borda?
2. **Testes** — a mudança vem coberta por teste automatizado? Os testes falham sem a mudança?
3. **Design** — responsabilidade no lugar certo, sem duplicação, dependências apontando para dentro (domínio não conhece framework).
4. **Legibilidade** — nomes revelam intenção, funções curtas, sem comentários que explicam o que o código deveria explicar.
5. **Contratos e erros** — mudanças de API atualizam documentação/OpenAPI? Erros seguem o envelope padrão com código estável?
6. **Segurança e dados** — sem concatenação de SQL/consulta dinâmica; validação de entrada nos limites; sem segredos no código; dados sensíveis não logados.
7. **Desempenho** — sem N+1 (queries em laço, chamadas HTTP por item); paginação em toda listagem; índices coerentes com as queries.

## Critérios que BLOQUEIAM a aprovação

- Falta de teste automatizado para comportamento novo ou corrigido.
- Query construída por concatenação de strings (risco de injeção) — usar sempre consultas parametrizadas.
- Padrão N+1: uma consulta/chamada por item dentro de laço.
- Endpoint de listagem sem paginação ou sem limite máximo de tamanho.
- Valores monetários em ponto flutuante (`float`/`double`) ou sem política de arredondamento definida.
- Segredo (senha, chave, token) no código ou no histórico do commit.
- Ausência de tratamento de erro com contrato definido (erro vaza stack trace para o cliente).
- `catch` vazio ou que engole erro sem log com contexto (requestId/trace).
- Mudança de contrato de API sem atualização da documentação e sem verificação de compatibilidade com consumidores.
- Build, lint ou testes vermelhos no CI — merge só com esteira verde.
- Escopo não relacionado à descrição do PR (mudanças misturadas devem ser divididas).

## Convenções que NÃO bloqueiam (comentários)

- Nomes que poderiam ser melhores, extração de método, simplificação de condicionais.
- Falta de teste de caso de borda improvável (registrar dívida técnica no backlog).
- Estilo de formatação — o formatters/lint (Spotless, Prettier, etc.) é gate automatizado; revisor não gasta tempo nisso.

## Boas práticas do autor

- PRs pequenos (idealmente < 400 linhas alteradas), com descrição: o quê, por quê e como testar.
- Screenshots/curl da funcionalidade quando há mudança de API ou UI.
- Draft PR para trabalho em andamento; revisão formal só quando pronto.
- Responder comentários com código (commit) em vez de argumentação longa.

## Boas práticas do revisor

- Comentar o código, não o autor ("essa função faz duas coisas" em vez de "você fez errado").
- Distinguir bloqueio (`BLOCK:`) de sugestão (`NIT:`) explicitamente.
- Aprovar assim que os bloqueios forem resolvidos; não reabrir pontos já alinhados.
