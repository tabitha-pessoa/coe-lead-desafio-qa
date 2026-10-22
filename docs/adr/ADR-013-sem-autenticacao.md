# ADR-013: Sem autenticação no escopo do desafio

**Status:** Aceita

## Contexto

O desafio não menciona autenticação/autorização. Adicionar auth (OAuth2/JWT, IdP) consumiria esforço significativo sem ser avaliado, e escolher um IdP hipotético adicionaria acoplamento sem consumidor real.

## Decisão

Os endpoints ficam abertos no contexto do desafio, com a decisão explicitamente documentada. Limites de proteção operacional foram mantidos: validação de entrada, limite de payload (1 MB), limites de itens/quantidade, paginação bornada e nenhuma operação destrutiva exposta.

## Consequências

- **Positivas:** foco do esforço nos critérios avaliados (arquitetura, integração, testes); API explora o fluxo de negócio sem atrito.
- **Negativas:** **não usar em produção**; evolução natural: OAuth2 com JWT no gateway (o envelope de erros e o requestId já suportam propagar contexto de segurança).
