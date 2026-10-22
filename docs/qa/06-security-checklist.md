# Checklist de segurança e plano de verificação

**Escopo:** verificação defensiva, local e não destrutiva; não equivale a pentest ou certificação. Executar somente no ambiente autorizado do desafio.

| ID | Verificação | Método/evidência | Critério |
|---|---|---|---|
| SEC-01 | Dependências vulneráveis | `npm audit` e OWASP Dependency-Check Maven no CI | vulnerabilidade crítica/alta deve bloquear até triagem/mitigação aprovada |
| SEC-02 | Segredos no repositório | secret scanning do GitHub ou ferramenta aprovada | nenhum segredo válido commitado; rotacionar se encontrado |
| SEC-03 | Validação de payload | casos de tipos inesperados, campos ausentes, limites e JSON malformado | resposta controlada; sem stack trace interno |
| SEC-04 | Limite de corpo | payload acima de 1 MB no endpoint de pedidos | 413 `PAYLOAD_TOO_LARGE` |
| SEC-05 | Injeção | entradas com metacaracteres em campos de texto/IDs | sem execução de consulta ou alteração indevida; consultas parametrizadas |
| SEC-06 | Erros e correlação | induzir erro funcional e conferir envelope/request ID | mensagem sem segredo/detalhe interno; request ID correlacionável |
| SEC-07 | Headers e TLS | revisar headers no ambiente e TLS apenas quando exposto via HTTPS | política compatível com arquitetura de implantação; não presumir TLS em localhost |
| SEC-08 | CORS e autenticação | confirmar configuração e registrar que APIs do desafio não possuem auth | não expor fora do ambiente pretendido sem controles de borda/autorização |
| SEC-09 | DAST baseline | OWASP ZAP baseline contra UI local autorizada | triagem manual de alertas; sem tratar alerta automático como defeito confirmado |
| SEC-10 | Dados pessoais | usar apenas dados sintéticos em testes/logs | sem dados reais ou tokens em artefatos |

## Automação e resultado registrado

- OWASP Dependency-Check para os módulos Maven roda no workflow principal e publica o relatório junto aos artifacts de teste.
- `npm audit --audit-level=high` roda para os lockfiles `frontend` e `qa-tests`. A execução local de 21/10/2026 encontrou no frontend 11 advisories (2 críticas, 6 altas, 3 moderadas) e nenhum na automação QA; veja [security-findings.md](./security-findings.md). O achado de pacote não prova explorabilidade no sistema, mas bloqueia build/publish enquanto aguarda triagem conforme a política de severidade.
- OWASP ZAP baseline passivo é executado como gate de PR contra frontend e APIs em stack local descartável; uma execução semanal/manual adicional publica relatórios. Relatórios são evidência para triagem, não pentest ou certificação.
- Execução ZAP local em 21/10/2026 gerou relatórios nos três serviços: frontend com 8 alertas de risco e 2 informativos; cada API com 1 alerta de risco e 1 informativo. Os alertas de headers do frontend precisam de triagem. As APIs responderam 500 em rotas não mapeadas; a resposta verificada não tinha stack trace, e o comportamento está registrado em [QA-ISSUE-005](./issues.md).
- Os resultados ZAP e Dependency-Check em GitHub Actions ainda não foram observados nesta entrega. Não registrar aprovação dessas ferramentas antes de execução real.

### Limitação conhecida

O ADR-013 declara ausência de autenticação no escopo do desafio. Isso deve ser tratado como limitação arquitetural deliberada, não como falha inesperada do teste; antes de uma exposição real, exigir decisão de segurança sobre autenticação, autorização, rate limiting, TLS, CORS e gestão de segredos.
