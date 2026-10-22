# Padrão de Governança de Qualidade para Squads

## Objetivo e princípios

Estabelecer um mínimo comum de qualidade entre squads e clientes, mantendo autonomia para adaptar ferramentas sem negociar critérios de risco. Qualidade é responsabilidade compartilhada de produto, engenharia, QA, segurança e operação. O COE define padrões, habilita pessoas, mede tendências e remove impedimentos; não deve virar uma fila central de aprovação manual.

## Ciclo de desenvolvimento e Definition of Ready

Antes do desenvolvimento, histórias devem conter objetivo de negócio, critérios de aceitação testáveis, exemplos de dados, regras negativas, requisitos não funcionais relevantes e dependências/contratos. QA participa do refinamento (shift-left), identifica riscos e define estratégia por impacto. Mudanças em API exigem contrato atualizado e compatibilidade avaliada.

## Estratégia e automação

- Testes unitários para regras locais; integração para persistência/contratos; API para regras e cenários negativos; E2E para jornadas críticas, evitando duplicar toda regra na UI.
- Automação deve ser determinística, independente, legível, com dados isolados, asserts de negócio e logs úteis. Não usar sleeps fixos quando houver espera por condição.
- Casos baseados em risco: segurança, dinheiro, privacidade, integridade e caminhos de receita têm maior prioridade.
- IA pode sugerir cenários, dados, scripts e análise; toda saída precisa de revisão humana, vínculo com requisito, execução e registro de prompt/ferramenta. Nunca inserir segredo, dado pessoal real ou código confidencial em serviço não aprovado.
- Testes de performance e segurança devem ser autorizados, não destrutivos e executados em ambientes acordados.

## Pull Request — bloqueios obrigatórios

O PR **não pode ser aprovado/mesclado** quando houver qualquer condição abaixo:
1. Build, lint, análise estática ou testes obrigatórios falhando.
2. Teste crítico ausente para regra de negócio de alto risco ou mudança de contrato sem teste de compatibilidade.
3. Defeito S1/S2 aberto sem aceitação formal do risco por responsável autorizado.
4. Segredo, credencial, dado pessoal real ou vulnerabilidade crítica/alta introduzida sem plano de correção aprovado.
5. Migração destrutiva sem estratégia de backup/rollback e validação.
6. Código não revisado por pelo menos uma pessoa diferente do autor; mudanças de alto risco exigem especialista do domínio.
7. Teste instável ignorado/suprimido sem issue, dono e prazo.
8. Evidência ou resultado de IA não validado apresentado como fato.

## Quality gates no CI/CD

Ordem recomendada: instalação reprodutível → lint/format → unitários → análise de dependências/segredos → integração/API → cobertura mínima acordada por módulo e diff → E2E smoke → build artefato → verificação de imagem → aprovação para deploy. A suíte de performance completa pode rodar em pipeline agendado/pré-release; um smoke curto pode bloquear release se houver SLO. Deploy requer todos os gates obrigatórios verdes e artefato imutável identificado por commit.

## Métricas sem incentivo perverso

Acompanhar taxa de escape para produção, tempo de feedback, flaky rate, tempo de correção por severidade, cobertura de requisitos de risco, taxa de sucesso da pipeline, lead time de PR e tendências de vulnerabilidades. Não ranquear pessoas por quantidade de bugs/testes nem usar cobertura de linha como medida única de qualidade. Definir baseline, meta e dono por métrica.

## Governança e desenvolvimento de pessoas

COE mantém catálogo de competências, trilhas por senioridade, guildas, revisão de padrões, mentoria e matriz de alocação. Alocação considera domínio, autonomia, comunicação, idioma, disponibilidade, risco e necessidades do cliente. Realizar revisão mensal de tendências e revisão trimestral de padrões, com ADRs para decisões relevantes. Exceções têm justificativa, aprovador, mitigação e data de expiração.

## Definition of Done

Critérios de aceitação atendidos; testes adequados executados; documentação/contrato atualizados; logs e correlação úteis; acessibilidade/i18n aplicáveis validadas; vulnerabilidades triadas; monitoramento preparado; rollback conhecido; evidências vinculadas ao ticket; PO e stakeholders informados sobre riscos residuais.
