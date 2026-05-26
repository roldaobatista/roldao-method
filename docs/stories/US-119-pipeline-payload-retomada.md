---
tipo: story
id: US-119
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-118]
aprovacoes: []
---

# US-119 — Onda 3: Pipeline com payload + retomada universal

## Como, quero, para

**Como** Roldao rodando `/feature` em US grande que demora horas,
**quero** retomar exatamente de onde parei depois de auto-compactacao OU crash OU `--continue` na sessao seguinte
**para** parar de refazer trabalho que ja estava feito quando Claude perde marker de pipeline ativo.

## Criterios de aceitacao

- **AC-119-1** — Formato `.claude/.runtime/pipeline-state-<US>.json` consolidado. Schema em `.specify/schemas/pipeline-state.schema.json` (ADR-024).
- **AC-119-2** — Hook `migrate-runtime-markers.js` (SessionStart) le sentinels legados e popula pipeline-state.json se faltar. Sentinels legados CONTINUAM funcionando (flag `ROLDAO_METHOD_LEGACY_MARKERS=1` default true em v3.0.0).
- **AC-119-3** — Handoff payload tipado em `.claude/.runtime/handoff/<from>-para-<to>-<sess>.json`. Schema em `.specify/schemas/handoff-payload.schema.json` (ADR-025). Hook `require-handoff-payload.js` em modo soft warning v3.0.0.
- **AC-119-4** — Comando `/retomar` novo le pipeline-state + ultimo checkpoint, mostra "ultima sessao parou apos X em US-NNN. Falta Y → Z. Continuar?".
- **AC-119-5** — `bin/lib/session-relay.js` ganha `measureProgress()`. 15min sem nova entrada em metrics.jsonl → grava `agent-stalled-${ts}` + aviso PT-BR.
- **AC-119-6** — Hook `crashed-session-recovery.js` (SessionStart) varre markers `*-active-*` > 4h sem write → marca `crashed: true` + oferece recuperacao.
- **AC-119-7** — Hook `session-diary.js` (SessionEnd) gera `docs/diario/AAAA-MM-DD-HHmm.md` com arquivos tocados, comandos rodados, agentes invocados, proximo passo.
- **AC-119-8** — `session-snapshot-restore.js` ganha "ULTIMO FOCO" estruturado em 3 linhas no stderr.
- **AC-119-9** — Status line dinamica troca "ultimo agente -done-" por agente CORRENTE (marker `*-running-*`). Formato: `v3.0.0 - Opus - main - US-118 - [3/7 Rafael] - $1.40`.
- **AC-119-10** — Hook `handoff-progress-render.js` (PreToolUse Task em pipeline ativo) injeta linha ASCII `[OK] Sofia (1/7) - [ATIVO] Rafael (3/7)`.
- **AC-119-11** — Comando `/painel` novo combina status + custo + linha do tempo + saude. ≤24 linhas ASCII.
- **AC-119-12** — Hook `auto-pulse.js` (PostToolUse) emite system-reminder a cada 15 tool calls OU 5min com resumo.
- **AC-119-13** — Hook `worktree-advisor.js` (SessionStart) sugere `git worktree add` se 3+ stories in-progress + commits cruzam arquivos disjuntos; avisa colisao se 2 stories tocam mesmo arquivo.

## Non-goals

- NAO mexer em comportamento de agente (so adicionar payload)
- NAO substituir sentinel markers — coexistencia 1 release inteira via ADR-024
- NAO implementar `vigia-fluxo` (Olivia) — fica pra US-121
- NAO criar daemon de background (auto-pulse usa next tool call como gatilho)

## Contexto tecnico

- **Arquivos afetados:** `.specify/schemas/pipeline-state.schema.json`, `.specify/schemas/handoff-payload.schema.json`, 8 hooks novos, 2 comandos novos, `.claude/statusline.js`, `bin/lib/session-relay.js`
- **ADRs bloqueantes:** ADR-024 (pipeline state JSON), ADR-025 (handoff payload)

## Tasks

- [ ] **T-119-001** — Schemas JSON em `.specify/schemas/`
- [ ] **T-119-002** — Hook `migrate-runtime-markers.js`
- [ ] **T-119-003** — Estender prompts dos 17 agentes pra emitir handoff payload no SubagentStop
- [ ] **T-119-004** — Hook `require-handoff-payload.js` (modo soft warning)
- [ ] **T-119-005** — Comando `/retomar`
- [ ] **T-119-006** — `bin/lib/session-relay.js` com `measureProgress()`
- [ ] **T-119-007** — Hook `crashed-session-recovery.js`
- [ ] **T-119-008** — Hook `session-diary.js`
- [ ] **T-119-009** — Estender `session-snapshot-restore.js` com "ULTIMO FOCO"
- [ ] **T-119-010** — Estender `.claude/statusline.js` (marker `*-running-*` + agente corrente)
- [ ] **T-119-011** — Atualizar todos os 17 agentes pra criar `<slug>-running-<ts>` em SubagentStart
- [ ] **T-119-012** — Hook `handoff-progress-render.js`
- [ ] **T-119-013** — Comando `/painel`
- [ ] **T-119-014** — Hook `auto-pulse.js`
- [ ] **T-119-015** — Hook `worktree-advisor.js`
- [ ] **T-119-016** — Testes integrados de retomada apos crash simulado

## Testes esperados

- **Unitario:** schema validacao; migrate-markers idempotente; tokenization do prompt no auto-pulse
- **Integracao:** rodar `/feature US-117` ate metade + matar processo + `claude --continue` + `/retomar` → continua corretamente
- **Regressao:** projeto v2 com sentinels funciona em v3 sem ROLDAO_METHOD_LEGACY_MARKERS explicito (default true); agentes sem prompt atualizado continuam funcionando (fallback)

## Regulamentacao BR aplicavel

- **INV-001** — JSON em runtime e estado compartilhado
- **ADR-031** (Preservacao de capacidade) — sentinels coexistem

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 3) |
