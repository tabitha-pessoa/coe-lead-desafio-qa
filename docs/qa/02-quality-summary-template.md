# Relatório de execução e resumo de qualidade

## Identificação da execução

- Data: 21/10/2026
- Commit / branch: indisponível; este workspace não contém metadados Git.
- Ambiente: Windows 11; Docker Desktop Engine 29.6.2; Java Temurin 17.0.20.1; Maven 3.9.16; Node.js 24.19.0; npm 11.17.0; k6 2.3.0 no container oficial para a execução atual (2.2.0 na medição histórica); Playwright 1.64.1 com Chromium, instalado via `npm ci` a partir do lockfile.
- Stack: `docker compose up --build -d` construiu as imagens e iniciou os cinco serviços. PostgreSQL e MongoDB ficaram saudáveis; os endpoints do pedido, catálogo e frontend responderam HTTP 200.
- Dados: seed MongoDB de `docker/mongo-init.js` e migrations Flyway. A suíte de API criou pedidos de teste; o volume local foi mantido.

## Resultado por suíte

| Suíte | Executados | Aprovados | Falhos / bloqueados | Ignorados | Evidência |
|---|---:|---:|---:|---:|---|
| Testes Java (unitários + integração) | 55 | 55 | 0 | 0 | Surefire e Failsafe em `catalog-service/target/*-reports` e `order-service/target/*-reports` |
| Build Maven Java | 2 serviços | 2 | 0 | 0 | `mvn --batch-mode --define spotless.check.skip=true clean verify` em cada serviço |
| API Playwright | 46 | 43 | 3 | 0 | Contratos SDD anteriores e regras de negócio; divergências documentadas em `issues.md` |
| UI Playwright | 27 | 22 | 5 | 0 | Painel, Catálogo, pedidos, idiomas e regras da quantidade; divergências documentadas em `issues.md` |
| TypeScript da automação QA | 1 type-check; 73 testes descobertos em 8 arquivos | 1 | 0 erros de tipo | — | Validação desta avaliação: `npm ci` e `npm run typecheck`; a descoberta enumerou os testes, mas não os executou contra a aplicação. |
| k6 — listagem de pedidos (versão anterior do script) | 659 requisições; 1.318 checks | 100% dos checks e thresholds aprovados | 0 | — | Execução histórica: 2 min, até 10 VUs; p95 10,43 ms, máximo 27,83 ms, taxa HTTP de erro 0%. Não valida a versão atual, que inclui outros fluxos. |
| k6 — smoke atual (inclui criação em stack descartável) | 524 requisições; 1.257 checks | 100% dos checks e thresholds aprovados | 0 | — | 21/10/2026, k6 2.3.0 no container oficial; 2 min, 5 cenários, taxa de chegada de 1 iteração/s por cenário, 0 iterações descartadas. p95: listagem size 20 = 59,35 ms; size 100 = 59,36 ms; Catálogo individual = 39,30 ms; batch 50 IDs = 47,02 ms; criação = 76,03 ms. Erros HTTP: 0%; máximo geral: 585,34 ms. |
| Auditoria de dependências Node | Frontend: 11 advisories (2 críticas, 6 altas, 3 moderadas); automação QA: 0 | Gate não aprovado no frontend | — | — | `npm audit --audit-level=high` em 21/10/2026; detalhamento e ressalvas em [achados de segurança](./security-findings.md). |
| OWASP ZAP baseline local | 3 targets: frontend, Orders API e Catalog API | 10 alertas de risco (8 frontend, 1 por API) e 4 informativos | 0 falhas ZAP | — | 21/10/2026, baseline passivo; relatórios gerados nos três targets. Alertas de headers no frontend aguardam triagem; APIs retornaram 500 em rotas não mapeadas, registrado como QA-ISSUE-005. Respostas verificadas não expuseram stack trace. |

Os dois `clean verify` locais passaram com todos os testes unitários e de integração. O check Spotless foi ignorado somente nesta execução local por diferenças de finais de linha no Windows. A construção das imagens Docker dos serviços passou no ambiente Linux do Docker Desktop com o check padrão. Nenhuma conversão em massa de finais de linha foi aplicada ao código.

## Defeitos e riscos

- Após restaurar os arquivos do sistema fornecidos como originais, a execução completa em 21/10/2026 reproduziu quatro grupos de defeitos, documentados passo a passo em [issues.md](./issues.md). Oito casos Playwright falharam, mantendo as asserções como evidência em vez de enfraquecê-las.
- A integração Java identificou e permitiu corrigir o mapeamento de timeout na leitura da resposta do catálogo: a exceção de socket vinha encapsulada pelo cliente HTTP e podia resultar em HTTP 500 em vez de 504. O cenário de timeout agora passa; a indisponibilidade também é simulada com desconexão após o recebimento da requisição.
- O Docker Desktop deste Windows exige compatibilidade com Docker API 1.44. A atualização do Testcontainers e a configuração da API permitiram a detecção do endpoint Named Pipe; os testes de integração do catálogo e pedidos passaram com containers reais.
- **Segurança:** a auditoria npm atual encontrou advisories no lockfile do frontend (incluindo 2 críticos e 6 altos); o lockfile de QA não reportou vulnerabilidades. O job `node-security` bloqueia build/publicação enquanto vulnerabilidades alta/crítica não forem corrigidas ou aceitas formalmente. Maven Dependency-Check está configurado, mas não foi reexecutado localmente nesta rodada. O ZAP baseline local gerou relatórios para os três serviços: alertas de headers no frontend e respostas 500 em rotas não mapeadas das APIs; o último cenário está registrado como QA-ISSUE-005. Os alertas não equivalem a vulnerabilidades confirmadas; a execução no GitHub Actions continua pendente.
- Os thresholds de k6 são metas iniciais do script, não SLAs acordados. A medição foi feita localmente e não deve ser tratada como baseline de produção.
- A execução k6 atual validou os cinco cenários, incluindo criação, em um projeto Compose separado (`qa-perf`) com volumes descartáveis; após a execução, containers e volumes desse projeto foram removidos. O workflow GitHub Actions ainda não foi executado nesta alteração.

## Parecer de release

- [ ] Aprovado
- [ ] Aprovado com riscos formalmente aceitos
- [ ] Reprovado

**Parecer técnico:** após restaurar o sistema original, a reexecução da suíte Playwright executou 73 casos: 65 aprovados e 8 falhos (API 43/46; UI 22/27), correspondendo a quatro grupos de defeitos em [issues.md](./issues.md). Testes Java (55/55) e builds Maven são resultados históricos; `mvn` não está disponível para reexecução nesta sessão. O script k6 atual foi executado localmente em perfil smoke nos cinco cenários, incluindo escrita em ambiente descartável (524 requisições; 1.257/1.257 checks; thresholds aprovados); o workflow CI não foi executado. `npm audit` encontrou 11 advisories (2 críticas, 6 altas e 3 moderadas) no frontend e nenhum na automação QA. O ZAP baseline passivo local gerou relatórios nos três serviços e identificou alertas para triagem, incluindo 500 em rotas não mapeadas (QA-ISSUE-005); a execução CI ainda está pendente. Maven Dependency-Check não foi reexecutado nesta rodada. **Não recomendo considerar o sistema aprovado em relação aos defeitos e riscos registrados.** A aprovação formal de release cabe aos responsáveis pelo produto; thresholds k6 são metas iniciais locais, não SLAs de produção.

**Adendo — 21/10/2026:** a comparação com a cópia original fornecida encontrou nove arquivos do sistema divergentes. Foram restaurados dos originais os POMs, os DTOs de resposta do Catálogo, o gateway HTTP, dois testes de integração Java e as páginas Angular de Catálogo e formulário de pedido. Após rebuild, comparação SHA-256 confirmou zero diferenças nos arquivos de código/configuração do sistema nas pastas `catalog-service`, `order-service`, `frontend`, `docker` e `docker-compose.yml` (artefatos `target`, `dist` e dependências excluídos). A suíte completa atual passou 65/73; as falhas estão nos quatro grupos de defeitos listados em [issues.md](./issues.md). O teste de desconto restaurou a massa seed no `finally`.

Após a restauração, `frontend/npm run verify` passou: ESLint, 53 testes unitários e build de produção. Não foi possível reexecutar `mvn verify` nesta sessão porque o executável `mvn` não está disponível no PATH. O k6 atual foi executado por meio da imagem Docker oficial em um projeto descartável; os resultados completos estão na tabela acima e os dados criados foram removidos junto com os volumes temporários.
