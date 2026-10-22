# ADR-014: Frontend Angular fora do escopo do MVP

**Status:** Substituída — o frontend Angular foi implementado como evolução
posterior ao MVP (ver `docs/frontend-architecture.md` e
`docs/frontend-api-integration.md`). A decisão original permanece registrada
abaixo pelo valor histórico: o MVP priorizou os critérios avaliados e o frontend
nasceu consumindo os contratos já publicados, sem alterá-los.

## Contexto

O briefing final do candidato cita "frontend Angular" na stack, mas o desafio oficial avalia exclusivamente serviços backend, integração e artefatos de liderança. O plano de 14 fases aprovado não contém fase de frontend.

## Decisão

Não implementar frontend no MVP. A stack Angular permanece registrada como direção de evolução (consumindo os contratos OpenAPI já publicados pelos dois serviços). A decisão prioriza os critérios de avaliação: qualidade do backend, testes, integração e artefatos de governança.

## Consequências

- **Positivas:** esforço concentrado nos critérios avaliados; contratos OpenAPI prontos para qualquer cliente (Angular ou não).
- **Negativas:** demonstração visual fica a cargo dos curls/Swagger UI (suficiente para avaliação técnica).
