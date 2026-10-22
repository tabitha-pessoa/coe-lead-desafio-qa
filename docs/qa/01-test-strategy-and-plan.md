# Estratégia e plano de testes — Gestão de Pedidos e Catálogo

**Versão:** 1.0 · **Responsável:** QA/COE · **Status:** estratégia aplicada; execução e limitações registradas no [relatório de qualidade](./02-quality-summary-template.md).

Os critérios SDD, a rastreabilidade entre requisitos, testes e lacunas de cobertura estão na [Especificação de Qualidade](./00-quality-specification.md) e na [Especificação das Jornadas do Usuário](./08-sdd-user-journeys.md).

## 1. Objetivo e escopo

Verificar que o catálogo é a fonte de verdade de produtos e preços e que a criação de pedidos valida todos os itens, calcula valores conforme regra configurada, persiste snapshots e falha de forma íntegra quando qualquer dependência ou dado é inválido. Cobertura inclui APIs de Catálogo e Pedidos, integração HTTP entre serviços, SPA Angular, desempenho básico e controles de CI/CD.

**Dentro do escopo:** consulta individual e em lote do catálogo; criação, detalhe e listagem paginada de pedidos; validações; desconto; preços com vigência; envelope de erro e `X-Request-Id`; UI Catálogo/Pedidos; testes de carga da listagem; pipeline e critérios de bloqueio.

**Fora do escopo / dependências:** alteração do código de produção (proibida pelo desafio), cadastro de produtos (não há endpoint), autenticação/autorização (não implementada no contexto descrito), testes reais de carga em ambiente produtivo, teste de segurança intrusivo e avaliação de SLA não acordado. Não presumir defeito sem executar e capturar evidência.

## 2. Abordagem

- **Shift-left / SDD:** transformar requisitos e contratos em exemplos verificáveis antes da execução; revisar ambiguidades com responsáveis; vincular requisito → caso → automação → evidência.
- **Pirâmide:** unitários de domínio como feedback rápido (existentes no projeto), API/integração como núcleo de regressão e UI E2E para jornadas críticas; performance separada e controlada.
- **Risco primeiro:** integridade financeira, persistência parcial, preço histórico, indisponibilidade do Catálogo e regressões de integração são prioridade P0/P1.
- **Independência:** testes devem criar dados quando suportado; como o catálogo usa seed fixo, casos dependentes de PROD-001…PROD-006 são identificados explicitamente. Não executar em paralelo testes mutáveis que compartilhem banco sem isolamento.
- **Automação:** Playwright Test + TypeScript para API e browser, k6 para carga e GitHub Actions para quality gates. k6 foi escolhido por ser open source, executar cenários HTTP sem custo de navegador por usuário virtual, permitir thresholds como código e integrar-se diretamente ao CI. O smoke atual cobre listagens com páginas de 20/100 itens, Catálogo individual e lote de 50 IDs; criação de pedido é habilitada somente em ambiente descartável. Esses cenários fornecem um baseline leve, não comprovam capacidade nem representam aceite de SLO.
- **Oráculos:** status HTTP, contrato JSON, cálculo monetário com duas casas e half-up, ausência de persistência após rejeição, ordenação, snapshot e header de correlação.

## 3. Ambientes e dados

`docker compose up --build` inicia UI `http://localhost:4200`, Pedidos `:8080`, Catálogo `:8081`, PostgreSQL `:5432` e MongoDB `:27017`. Requer Docker Compose; testes automatizados exigem Node.js compatível com Playwright e navegadores instalados (`npx playwright install --with-deps chromium`). Seed do catálogo: PROD-001 e PROD-002 ativos com preço vigente; PROD-003 ativo com janela de preço atualizada; PROD-004 inativo; PROD-005 com preço futuro; PROD-006 com preço expirado. Confirmar a seed no `docker/mongo-init.js` antes de depender desses dados.

## 4. Estratégia por camada

| Camada | Foco | Entrada / saída | Evidência |
|---|---|---|---|
| Unitária | regras de domínio, arredondamento, vigência, validação | funções/use cases isolados | relatório Maven |
| API Catálogo | consulta individual, lote, inexistente, preço nulo | HTTP/JSON | Playwright HTML/JUnit |
| API Pedidos | criação, desconto, duplicata, inválidos, paginação, detalhe | HTTP/JSON + banco | Playwright HTML/JUnit |
| Integração | Pedidos → Catálogo, falha, timeout, all-or-nothing | serviço real + dependência controlada | logs, status, contagem antes/depois |
| UI E2E | pesquisa catálogo, validação formulário, pedido/listagem/detalhe | navegador Chromium | trace/screenshot em falha |
| Performance | rampa controlada para listagem de pedidos | k6 | resumo k6 e percentis |
| Segurança | dependências, headers, payload, exposição de erro, baseline DAST autorizado | pipeline/ambiente local | relatório de ferramenta; sem exploração destrutiva |

### Avaliação da automação de performance

O script `performance/k6-orders.js` cobre listagem de pedidos com `size=20` e `size=100`, consulta individual e em lote de 50 IDs no Catálogo e criação de pedidos quando habilitada explicitamente. Os perfis `smoke`, `load`, `stress` e `soak` usam cenários de taxa de chegada; os checks validam envelopes básicos, métricas de erro por fluxo, thresholds de duração e iterações descartadas. Criação só deve ser ligada em stack descartável porque persiste dados.

O smoke atual foi executado localmente nos cinco fluxos em ambiente descartável (524 requisições e 1.257 checks aprovados, segundo o relatório desta entrega). Isso não basta para declarar a performance do sistema aprovada: os limites são metas provisórias sem SLO acordado, a carga é baixa e curta, e os perfis `load`, `stress` e `soak` não foram calibrados nem executados. Resultados locais também dependem de hardware, containers, aquecimento, seed e carga concorrente.

No CI, o job de performance recria a stack e remove volumes ao final, com criação habilitada somente nesse ambiente. A pipeline ainda não foi executada no GitHub, portanto a reprodutibilidade do workflow e a publicação de artifacts permanecem sem evidência de execução.

Antes de ampliar os thresholds, produto/arquitetura devem acordar perfil de tráfego, concorrência ou taxa-alvo, percentis, taxa de erro e ambiente comparável ao uso esperado. Com esses critérios definidos, recomenda-se:

1. O smoke do CI executa cenários de leitura e escrita de baixa intensidade. A criação está habilitada somente depois de recriar o ambiente descartável no runner e os volumes são removidos ao final do workflow.
2. O script valida a estrutura básica da listagem com tamanhos 20/100, produto individual, consulta batch com 50 IDs e pedido criado; registra erros e latência por fluxo e falhas em atingir a taxa-alvo.
3. Perfis `load`, `stress` e `soak` foram adicionados para execução manual em ambiente autorizado; somente `smoke` está conectado ao gate de PR. Os perfis de maior duração/intensidade não foram calibrados nem executados.
4. Permanecem pendentes filtro em diferentes cardinalidades, coleta automatizada de CPU/memória e métricas dos bancos. Execuções não smoke devem ocorrer em ambiente acordado, com monitoramento e capacidade para diagnóstico.
5. O workflow registra versão do k6, informações do runner e amostragem de `docker stats`, além de publicar `k6-summary.json`; comparações de regressão ainda devem ser associadas ao commit e à configuração do runner.

## 5. Casos de teste priorizados

| ID | Prioridade | Cenário | Resultado esperado |
|---|---|---|---|
| CAT-001 | P1 | Consultar PROD-001 | 200; ATIVO; preço vigente 3500 BRL |
| CAT-002 | P1 | Consulta em lote com ID válido e inexistente | 200; válido em `prices`; desconhecido em `notFound` |
| CAT-003 | P1 | ID inexistente em consulta individual | 404 `PRODUCT_NOT_FOUND`; envelope e `X-Request-Id` |
| CAT-004 | P1 | PROD-004 inativo | status INATIVO; não deve ser aceito em pedido |
| CAT-005 | P1 | PROD-005 preço futuro | `currentPrice=null` até início da vigência |
| CAT-006 | P1 | PROD-006 preço expirado | `currentPrice=null` |
| ORD-001 | P0 | Criar pedido com produto ativo e quantidade válida | 201; CRIADO; nome/preço snapshot persistidos |
| ORD-002 | P0 | Subtotal ≥ R$ 1.000, regra ativa | desconto de 10%, HALF_UP em 2 casas, total correto |
| ORD-003 | P1 | Subtotal abaixo do mínimo / sem regra ativa | desconto zero |
| ORD-004 | P0 | Produto inexistente | 422 `PRODUCT_NOT_FOUND`; sem persistência parcial |
| ORD-005 | P0 | Produto inativo | 422 `PRODUCT_INACTIVE`; sem persistência |
| ORD-006 | P0 | Produto sem preço vigente | 422 `NO_CURRENT_PRICE`; sem persistência |
| ORD-007 | P0 | Repetir productId no mesmo pedido | 400 `VALIDATION_ERROR` |
| ORD-008 | P1 | Quantidade 0, 1000, lista vazia ou >100 itens | 400 `VALIDATION_ERROR` |
| ORD-009 | P1 | Cliente sem nome/documento/e-mail válido | 400; nenhum pedido criado |
| ORD-010 | P1 | Catálogo indisponível / timeout | 503 `CATALOG_UNAVAILABLE` / 504 `CATALOG_TIMEOUT` |
| ORD-011 | P1 | Corpo >1 MB | 413 `PAYLOAD_TOO_LARGE` |
| ORD-012 | P1 | GET detalhe de ID inexistente | 404 `ORDER_NOT_FOUND` |
| ORD-013 | P1 | Listar page=0,size=20,status=CRIADO | 200; paginação; mais recente primeiro |
| ORD-014 | P1 | size>100 e status inválido | comportamento conforme contrato; status inválido 400 |
| UI-001 | P1 | Pesquisar PROD-001 no catálogo | nome, preço, moeda e situação exibidos |
| UI-002 | P2 | Enviar pesquisa de catálogo vazia | validação visível; nenhuma chamada indevida |
| UI-003 | P1 | Criar pedido com cliente e produto válido | resumo coerente; pedido criado e acessível na listagem |
| UI-004 | P1 | Navegar para lista e detalhe do pedido | subtotal, desconto, total, situação e data exibidos |
| UI-005 | P2 | Alternar PT/EN/ES nas telas principais | labels e mensagens traduzidas sem quebrar fluxo |
| NFR-001 | P1 | Smoke de baixa intensidade para listagens, Catálogo individual/lote e criação opcional em ambiente descartável | erro <1%; p95 <800 ms como metas provisórias, sem SLO aprovado; não comprova capacidade |

## 6. Entrada, saída e severidade

**Entrada:** stack sobe saudável; seed confirmada; versões e variáveis documentadas; banco limpo ou baseline anotado; testes compilam. **Saída:** todas as suítes executadas; falhas triadas; P0/P1 resolvidos ou formalmente aceitos; evidências anexadas; relatório de risco publicado. Severidade: S1 bloqueio/perda de integridade ou cálculo incorreto; S2 fluxo principal indisponível; S3 função secundária degradada; S4 cosmético/documentação. Prioridade de correção é negociada com severidade, exposição e janela de release.

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Seed e estado compartilhado geram flakiness | seed verificada, limpeza/ambiente isolado, evitar paralelismo em casos mutáveis |
| UI muda idioma e quebra texto literal | preferir IDs, roles, labels e seletores estáveis; validar PT/EN/ES |
| Falha de serviço confundida com defeito funcional | health check, diagnóstico por logs e `X-Request-Id` |
| Meta de performance sem baseline | executar em ambiente controlado, registrar hardware/commit/carga; tratar thresholds como baseline inicial |
| Falso positivo de IA | validar cada caso contra requisito/contrato e evidência executável; revisão humana obrigatória |

## 8. Critérios de aprovação

- Build, lint e testes unitários/integrados aprovados.
- Testes críticos P0/P1 aprovados; falhas justificadas e aceitas explicitamente, nunca ocultadas.
- Quality gates de cobertura/segurança sem vulnerabilidade crítica/alta não tratada; não usar cobertura isolada como substituto de eficácia.
- UI E2E estável em navegador suportado; traces de falhas preservados.
- Performance dentro do SLO acordado após baseline; sem regressão material frente à versão anterior.
- Relatório e issues vinculados a evidências reproduzíveis.
