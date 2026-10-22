# SDD — Regras de negócio de pedidos, preços e erros

**Status:** automação implementada; resultados registrados na suíte Playwright e no arquivo de issues após execução.
**Fonte de verdade:** contratos e requisitos em `docs/api.md`, `docs/requirements.md`, `docs/database.md` e ADRs vinculados.
**Defeitos reproduzidos:** [issues.md](./issues.md).

## Critérios Given/When/Then

| ID | Dado / Quando / Então | Cobertura |
|---|---|---|
| ORD-RULE-01 | Dada uma quantidade entre 1 e 999 inclusive, quando incluir/criar o item, então é aceita; quantidade 0, acima de 999, texto e caracteres especiais são recusados. | API e UI, limites e entradas negativas |
| ORD-RULE-02 | Dado pedido com 1 a 100 itens, quando tentar incluir item 101, então a UI impede a inclusão; a API rejeita payload acima do máximo. | UI 100/101; API 101 |
| ORD-RULE-03 | Dado um produto já incluído, quando tentar adicioná-lo novamente, então UI/API rejeitam a duplicata sem persistência parcial. | UI e API |
| ORD-RULE-04 | Dado cliente obrigatório válido e apenas ID/quantidade no item, quando criar, então servidor obtém nome/preço atuais do catálogo, grava snapshot, calcula valores e define `CRIADO`. | API; resposta e detalhe |
| ORD-RULE-05 | Dado subtotal abaixo de R$ 1.000,00, quando criar pedido, então desconto é zero; no limiar ou acima, aplica-se percentual ativo com arredondamento HALF_UP em duas casas. | API com preparação isolada de dados de teste para os limites e arredondamento |
| CAT-RULE-01 | Dado histórico de janelas, quando consultar produto, então somente janela `validFrom <= instante < validTo` é vigente; janela futura/expirada não retorna preço corrente. | API de catálogo usando produtos seed |
| ORD-RULE-06 | Dado produto inexistente, inativo ou sem preço, quando criar pedido, então retorna 422 com código correspondente e mantém a contagem de pedidos. | API |
| ORD-RULE-07 | Dado Catálogo indisponível ou expirado o tempo limite, quando criar pedido, então retorna 503/504 respectivamente; corpo acima de 1 MiB retorna 413. | Integração API; indisponibilidade/timeout requer controle de dependência |
| ERR-RULE-01 | Dado erro de API, quando receber resposta, então status, envelope `error.code/message/details` e `X-Request-Id`/`requestId` são consistentes. | API para erros de validação, negócio e payload |
| ORD-RULE-08 | Dada listagem de pedidos, quando filtrar/paginar, então status é `CRIADO`, resultados vêm do mais recente ao mais antigo e o tamanho máximo é 100. | Cobertura API existente e cenários ampliados |

## Restrições e limites do ambiente

- A suíte não altera arquivos de implementação do sistema sob teste. Os dados seed do Catálogo são a fonte das consultas; não há endpoint de cadastro de produtos.
- O seed contém poucos produtos ativos, impedindo construir pela API pública um subtotal exato de R$ 999,99/R$ 1.000,00 ou um pedido com 100 produtos únicos válidos sem fixture isolada.
- O limite da API de lote do Catálogo é 50 IDs, enquanto a API de Pedidos documenta até 100 itens. O teste de 100 itens com IDs distintos verifica esse potencial conflito e pode expor divergência funcional.
- Testes de `CATALOG_UNAVAILABLE` e `CATALOG_TIMEOUT` exigem controlar a dependência durante a chamada; não devem ser simulados como se fossem o mesmo cenário.
- A suíte Java existente `OrderApiIT` exercita 503 `CATALOG_UNAVAILABLE` e 504 `CATALOG_TIMEOUT` com dependência controlada; a suíte Playwright ampliada valida erros de domínio e de payload contra os serviços em execução.

## Revisão de cobertura e melhorias recomendadas

### Lacunas existentes após a rodada atual

- **Janelas de preço nas bordas:** os dados seed verificam preço atual, futuro e expirado, mas não exatamente no instante `validFrom` (inclusivo) e `validTo` (exclusivo). Requer fixture controlável do relógio/relógio injetável ou teste unitário do domínio com instantes fixos.
- **Tamanho da página acima do máximo:** há verificação de `size=100`, mas falta especificar e testar formalmente `size=101` e valores inválidos/negativos conforme a normalização definida no ADR-011.
- **Tamanho de payload no limiar:** há casos >1 MiB e exatamente 1 MiB; falta 1 MiB menos um byte e confirmar o comportamento contratual do JSON válido no limite.
- **Resiliência em E2E:** 503 indisponibilidade e 504 timeout têm evidência somente nos testes Java com dependência controlada; não foram executados nesta sessão por Maven ausente.
- **UI para campos vazios:** os cenários de espaços revelaram feedback ausente na versão original; está reportado como QA-ISSUE-004. Após correção, substituir parte dos testes de estado interno (`is-invalid`) por assertivas de feedback acessível e ausência de chamadas à API.
- **Bordas de janela de preço:** PROD-003 prova a seleção da janela corrente, mas faltam testes exatamente em `validFrom` e `validTo`. O atual exemplo de `validTo: null` é também uma divergência de serialização registrada em QA-ISSUE-002.

### Melhorias aplicadas na suíte

- Validar que propriedades de preço e totais enviadas pelo cliente não substituem valores autoritativos do Catálogo/servidor.
- Cobrir ID de correlação fornecido e gerado, incluindo status, envelope completo e correspondência entre header e corpo.
- Cobrir status de listagem inválido, erro de negócio com produto válido seguido por inválido (all-or-nothing), corpo exatamente no limite de 1 MiB e ordenação com pedidos criados na mesma execução.
- Revalidar snapshot persistido depois de alterar temporariamente o preço seed e restaurar a fixture.
- Asserções de paginação com dois pedidos criados na mesma execução, ordenação e size=100, reduzindo dependência do conteúdo histórico do volume.

### Observações de robustez da automação

- Os testes API de desconto alteram temporariamente uma janela de preço seed e a regra no PostgreSQL via `docker compose exec`; são sequenciais e restauram fixtures em `finally`. Para CI mais isolada, prefira DB/schema exclusivo por execução e fixtures com cleanup garantido mesmo diante de interrupção abrupta do runner.
- Os testes de UI de catálogo/pedidos usam backend real em muitas jornadas e mocks pontuais noutras. Separar suites `contract` (dependências reais) e `component-flow` (respostas determinísticas mockadas) facilitaria diagnóstico e paralelização.
- `is-invalid` é detalhe de implementação Angular. Prefira roles, `aria-invalid`, mensagens de validação associadas e contagem de requests; quando usar classe CSS, trate-a como verificação suplementar.
- As afirmações de qualidade devem separar a suíte aprovada da suíte com defeitos intencionais ainda reproduzidos; nunca converter um teste vermelho em verde relaxando a expectativa que deriva do contrato.
