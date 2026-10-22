# SDD de Qualidade — Jornadas de Painel, Catálogo e Pedidos

**Versão:** 1.0  
**Status:** critérios definidos; testes automatizados associados em `qa-tests/tests`

Esta especificação precede a implementação dos novos testes. Requisitos são verificados contra UI/API e dados seedados. Valores negativos são enviados em testes isolados; a API é a autoridade para rejeitá-los. Testes de formulário confirmam feedback/bloqueio da UI e não substituem validação de servidor.

## Critérios de aceite

| ID      | Dado / Quando / Então                                                                                                                                                                                                  | Cobertura planejada                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| DASH-01 | Dada uma resposta paginada conhecida, quando o Painel carregar, então total de pedidos, contagem carregada, valor agregado e atalhos correspondem aos dados/respostas disponíveis.                                     | API: contrato de listagem. UI: resposta determinística interceptada, cálculo de indicadores e navegação dos atalhos.                            |
| CAT-01  | Dado um ID válido consultado individualmente, então nome, preço vigente, moeda e situação estão presentes e coerentes.                                                                                                 | API GET individual; UI consulta com um único ID e valida as colunas.                                                                            |
| CAT-02  | Dados vários IDs, quando consultados em lote, então cada produto encontrado exibe nome/preço/moeda/situação e IDs inválidos ficam identificados como não encontrados.                                                  | API lote misto e UI lote misto.                                                                                                                 |
| CAT-03  | Dados campo vazio, espaços, ID desconhecido, lista inválida ou quantidade de IDs acima do limite, então UI/API dão feedback e não retornam sucesso enganoso.                                                           | UI vazio/whitespace; API payload vazio, blank e >50 IDs; GET de produto desconhecido.                                                           |
| ORD-01  | Dados cliente e item válidos, quando pedido criado, então API devolve valores monetários corretos, status, data e snapshot de produto; UI mostra unitário, total da linha e subtotal e navega ao detalhe autoritativo. | API criação + detalhe; UI pedido criado com item válido.                                                                                        |
| ORD-02  | Dado qualquer campo de cliente obrigatório ausente, inválido ou acima do limite, então API rejeita com 400; UI marca campos inválidos e não navega/cria pedido.                                                        | Tabela de casos para nome, documento e e-mail, ausente/vazio/inválido/tamanho.                                                                  |
| ORD-03  | Dado produto/quantidade ausente ou inválido, desconhecido, inativo ou sem preço vigente, então UI/API impedem inclusão/criação e comunicam o problema.                                                                 | API quantidade 0/1000 e produtos desconhecido/inativo/sem preço; UI ID vazio/desconhecido/inativo/sem preço e quantidade inválida.              |
| ORD-04  | Dados itens válidos, quando exibidos no formulário, então unitário, total da linha e subtotal correspondem à multiplicação; desconto/total definitivos são calculados pelo backend após criação.                       | UI checks de cálculo preliminar e detalhe; API confere subtotal/desconto/total e timestamp.                                                     |
| ORD-05  | Dado pedido criado, quando aparece na lista e no detalhe, então subtotal, desconto, total, situação e data de criação são consistentes e o detalhe inclui cliente e itens corretos; a paginação troca de página.       | API POST → GET detalhe/listagem; UI fluxo POST → detalhe/listagem com valores e data, mais navegação entre páginas com resposta determinística. |
| LANG-01 | Dado cada idioma disponível (pt-BR, en, es), quando selecionado, então painel, catálogo e pedidos apresentam títulos traduzidos e o atributo `lang` reflete a seleção.                                                 | UI smoke dos três idiomas em todas as rotas principais.                                                                                         |

## Decisões e limites

- Para CAT-01 a UI usa GET individual; para CAT-02 usa POST em lote. A API não expõe filtros de campos independentes: a consulta usa IDs separados por vírgula, ponto e vírgula ou espaço.
- “ID inválido” distingue formato de ID inexistente. Como o domínio aceita strings arbitrárias como identificadores, valores desconhecidos devem resultar em 404/notFound, não em uma regra de formato inventada.
- Documento de cliente é obrigatório e limitado a 20 caracteres, mas a especificação do servidor não valida CPF/CNPJ. Não testar dígitos verificadores como se fossem requisito.
- A data é comparada como instante ISO da resposta da API e como valor renderizado no detalhe, sem assumir fuso horário de máquina.
- A moeda configurada nos dados seed é BRL. Verificar seu código no contrato da API e valor monetário formatado na UI.
- A regra de desconto do ambiente é subtotal mínimo de R$ 1.000,00 e 10%; asserções são calculadas com os preços seed e explicitadas por caso.
