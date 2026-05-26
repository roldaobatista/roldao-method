---
owner: tech-lead
revisado-em: 2026-05-26
status: stable
escopo: estado real de entrega das 44 ACs do PRD-003 (US-111..US-116) em 2026-05-26
disparada-por: decisao do Roldao de bumpar v2.0.0 formal antes de iniciar PRD-004 (v3.0.0)
---

# Auditoria — ACs pendentes do PRD-003 (descobertas em 2026-05-26)

> Esta auditoria nasceu durante a tentativa de fechar release v2.0.0 (PRD-003). Antes de marcar US-111..US-116 como entregues, verifiquei cada AC contra o codigo atual. Resultado: **~36 de 44 ACs (~82%) NAO foram entregues** apesar das releases v1.0.x..v1.3.1 terem rodado.

## Contexto

- Versao atual no `package.json`: `1.3.1`
- PRD-003 prevê: `v2.0.0` (major bump) com `MIGRATION-v2.md` em `docs/migrations/`
- Trabalho aconteceu em série de releases v1.x mas spec ficou desalinhada
- PRD-004 v3.0.0 assume "v2.0.0 entregue" como pré-requisito

## Resultado por story

| Story | OK | Falta | Detalhe |
|---|---|---|---|
| US-111 | 2/8 | 6 | `plugin.json` nao existe, `tests/hooks/legacy-markers.test.js` ausente, `MAPEAMENTO-T-NNN.md` ausente, 2 testes de hook ausentes |
| US-112 | 0/6 | 6 | `analista.md` ainda devolve "perguntas pendentes" (2 ocorrencias), `dba-dados.md` tem "pergunta padrao" (1 ocorrencia), evals/integration tests ausentes |
| US-113 | 1/7 | 6 | **ADR-019 ainda `status: proposta`** (bloqueia gate INV-002), Maestro multimodo nao codificado em `/prd`, `/brownfield`, `/auditoria-reversa` |
| US-114 | 2/8 | 6 | `_lib.js` tem 6 mensagens em ingles (failed/error/invalid), `tests/hooks/lib-fail-closed.test.js` ausente, teste de termos novos ausente |
| US-115 | 0/7 | 7 | **20 agentes sem TL;DR** (AC pede zero), `bin/roldao-method.js` nao existe (logo nem `help`/`status`/`undo` CLI funcionam) |
| US-116 | 3/8 | 5 | Validacao ao vivo das 5 tarefas-tipo (AC-116-7 = gate do epico EP-002) nao aconteceu |

**Total:** ~8 de 44 ACs entregues. ~36 pendentes.

## ACs OK confirmadas

- AC-111-3 parcial — `docs/migrations/MIGRATION-v2.md` existe (151 linhas, atende AC-116-8)
- AC-111-8 — ADR-020 e ADR-021 com `status: aceito` (confirmado)
- AC-112-3 parcial — `evals/runner.js` existe (falta o eval especifico)
- AC-114-1 — `.specify/scripts/next-id.js` existe
- AC-116-1 parcial — `.claude/commands/o-que-aconteceu.md` existe (falta o `bin/` que o teste exige)
- AC-116-5 parcial — `docs/exemplos/` tem 6 arquivos (AC pede `>=5`, OK)

## ACs FALTA confirmadas (lista executavel)

### US-111 (6 pendentes)
- AC-111-1: criar `tests/hooks/require-auditors-pass.test.js` com 3 cenarios adversariais
- AC-111-2: criar `tests/hooks/anti-mascaramento.test.js` com 2 casos novos (xdescribe ja esta no hook — confirmado 2 ocorrencias)
- AC-111-3: criar `plugin.json` com `"version": "2.0.0"`
- AC-111-4: criar `tests/hooks/legacy-markers.test.js` + flag `ROLDAO_METHOD_LEGACY_MARKERS=1`
- AC-111-5: criar `docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md` listando >=70 itens B/A/C/.../L → T-NNN
- AC-111-6: confirmar 9 acoes alto impacto (G7, F1, J10, J12, J16, J19, J1, J2, I7) — algumas ja podem ter sido entregues nas v1.x
- AC-111-7: garantir 1 commit T-004 atomico em `anti-mascaramento.js`

### US-112 (6 pendentes)
- AC-112-1: limpar "perguntas pendentes" do `analista.md` (2 ocorrencias atuais)
- AC-112-2: limpar "pergunta padrao" do `dba-dados.md` (1 ocorrencia)
- AC-112-3: criar `evals/agent-behavior/no-evitable-questions.eval` + rodar com `<5%` taxa
- AC-112-4: criar `tests/integration/agent-premissas.test.js`
- AC-112-5: criar `tests/integration/prd-etapa-2-askuserquestion.test.js`
- AC-112-6: confirmar cobertura C1-C7

### US-113 (6 pendentes)
- AC-113-1: aceitar ADR-019 (atualizar `status: proposta` → `aceito`)
- AC-113-2: criar `tests/integration/statusline-pipeline-etapa.test.js`
- AC-113-3: documentar contrato marker→etapa em ADR-019
- AC-113-4: adicionar `modo: PRD` em `/prd`, `/brownfield`, `/auditoria-reversa` (atualmente 0)
- AC-113-5: garantir teste irmao em cada commit de hook
- AC-113-6: confirmar cobertura D1-D8
- AC-113-7: nota de impacto pros 7 addons no `MIGRATION-v2.md`

### US-114 (6 pendentes)
- AC-114-3: criar `tests/hooks/block-jargon-pt-br-termos-novos.test.js` com 12 termos
- AC-114-4: reescrever `devops-infra.md` e `dba-dados.md` sem jargao
- AC-114-5: criar `evals/agent-behavior/devops-dba-comportamento.eval`
- AC-114-6: traduzir 6 mensagens em ingles no `_lib.js`
- AC-114-7: criar `tests/hooks/lib-fail-closed.test.js`
- AC-114-8: confirmar cobertura E1-E9, F2-F6, G5, G6, G8, K6, K8

### US-115 (7 pendentes)
- AC-115-1: refactor `statusline.js` consolidado (D5+D7+H2+H3+H8)
- AC-115-2: adicionar `## TL;DR` em 20 agentes (audit-arbiter, auditor-produto, auditor-qualidade, auditor-seguranca, analista, etc.)
- AC-115-3: criar `bin/roldao-method.js` com `help`, `status`, `undo` + entrada no `package.json` `bin`
- AC-115-4: criar `tests/unit/help-fuzzy.test.js` + implementar busca fuzzy
- AC-115-5: garantir `NO_COLOR=1` respeitado em `statusline.js`
- AC-115-6: confirmar cobertura H1-H8 + I1-I4, I6, I8, I9
- AC-115-7: K1, K2, K5 — coluna "Pra quem e" no README, `/inicio` sem termos tecnicos

### US-116 (5 pendentes)
- AC-116-2: criar `npx roldao-method status` (depende de US-115 bin/)
- AC-116-3: criar `npx roldao-method undo` (depende de US-115 bin/)
- AC-116-4: trocar metrica oficial em AGENTS.md §1 (10/10 → 5 tarefas-tipo)
- AC-116-6: confirmar cobertura J3, J6, J7, J8, J9, J11, J13, J14, J15, J17, J18, K4, K9, L1-L4
- AC-116-7: **validacao ao vivo com Roldao das 5 tarefas-tipo** (gate humano — registrar em `docs/auditorias/2026-06-XX-validacao-5-tarefas-tipo.md`)

## Plano de execucao

Ordem dependente (caminho critico):
1. **US-111** → bloqueia todas (Sprint 1 baseline)
2. **US-112** → bloqueia US-113
3. **US-113** → bloqueia US-114 e US-115 (Maestro multimodo)
4. **US-114 + US-115** → paralelizaveis
5. **US-116** → ultima (depende de bin/ pra `npx roldao-method status`/`undo`)

Esforco estimado: ~7+5+5+7+8+5 dias = **~37 dias uteis** (~7-8 semanas). Pode reduzir com automacao via pipeline `/feature` por story.

## Premissas

- Algumas ACs `cobertura X1-XN` podem ja estar atendidas pelas releases v1.x sem doc — auditoria conservadora marcou todas como pendentes ate confirmacao item-a-item.
- Validacao AC-116-7 (5 tarefas-tipo ao vivo) requer presenca do Roldao — gate humano nao automatizavel.
