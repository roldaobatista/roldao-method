---
owner: tech-lead
revisado-em: AAAA-MM-DD
status: proposta
decidido-em: _(quando aceito)_
decidido-por: _(quem aprovou)_
prd: PRD-NNN
epico: EP-NNN
story: US-NNN
supersedes: []
superseded-by: null
origem:
  data: AAAA-MM-DD
  incidente-ou-feedback: _(o que originou — link pra retro/incidente/auditoria)_
  sintoma-observado: _(em 1 frase — o que estava errado)_
---

# ADR-NNN — Pipeline resumability — _(nome do pipeline)_

> Template especifico pra decisao de **resumability de pipeline** (workflow > 5 fases que precisa retomar apos crash/compactacao). Codifica INV-012 do framework.

---

## Contexto

_(2-3 paragrafos. Descrever o pipeline em questao, quantas fases tem, qual a duracao tipica, qual o impacto de perder progresso no meio.)_

**Sinais que motivaram este ADR:**
- _(ex: Roldao reportou em retro que perdeu 2h de trabalho 3x em sessoes longas)_
- _(ex: pipeline X tem 12 fases e auto-compactacao perde marker no meio)_
- _(ex: crash do Claude no meio de execucao deixou pipeline orfao com markers parciais)_

---

## Decisao

**Pipeline `<nome>` ganha persistencia de estado em `<formato>` que sobrevive a:**

- Auto-compactacao da sessao Claude Code
- Crash do processo (kill, SIGTERM, OOM)
- `claude --continue` em sessao nova
- Worktrees paralelos (sem colisao)

### Mecanismo

_(Detalhar como o estado e salvo. Exemplos:)_

- **JSON consolidado:** `.claude/.runtime/pipeline-state-<US>.json` (modelo ADR-024)
- **Database:** tabela `pipeline_state` em SQLite (se projeto ja usa SQLite)
- **Sentinel + JSON:** coexistencia controlada via flag `ROLDAO_METHOD_LEGACY_MARKERS=1`

### Granularidade do checkpoint

| Quando | O que e persistido |
|---|---|
| SubagentStart | Marker `<agente>-running-<ts>` |
| SubagentStop | Update em `pipeline-state-<US>.json` etapas[] |
| Cada N tool calls | Snapshot defensivo |
| Pre-compact | Persistencia completa (hook PreCompact) |

### Retomada (`/retomar` ou equivalente)

_(Como o sistema retoma. Quem decide continuar? Confirmacao do usuario obrigatoria? Auto-resume permitido em algum cenario?)_

### Atomicidade

_(Como evitar corrupcao no meio de escrita do JSON/db. Pattern atomic-write recomendado.)_

---

## Alternativas consideradas

### Alternativa 1 — Sem resumability (estado so em RAM)

Vantagens: simplicidade.
Desvantagens: perda de trabalho real ao crash/compactacao.
**Status:** _(aceita/recusada)_ — _(motivo)_

### Alternativa 2 — Sentinel files binarios (legacy)

Vantagens: zero overhead.
Desvantagens: sem payload, agente re-le tudo.
**Status:** _(...)_

### Alternativa 3 — Database (SQLite)

Vantagens: queries cruzadas, transacoes ACID.
Desvantagens: dependencia binaria, complexidade.
**Status:** _(...)_

### Alternativa 4 — JSON consolidado + sentinels coexistindo

_(...)_

---

## Consequencias

### Positivas

- _(item)_

### Negativas

- _(item)_

### Compativel com

- INV-001 (estado compartilhado em disco)
- INV-012 (pipeline > 5 fases exige resumability)
- ADR-024 (pipeline-state.json — se aplicavel)
- _(outros ADRs relevantes)_

---

## Gatilhos de reabertura

- _(metrica X passar de Y → revisar)_
- _(N reports de Z → revisar)_

---

## Como verificar

- Comando: _(...)_
- Resultado esperado: _(...)_

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | proposta inicial |
