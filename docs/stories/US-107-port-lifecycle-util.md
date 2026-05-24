---
tipo: story
id: US-107
versao: 1
status: em-implementacao
prd: PRD-001
epico: EP-001
tamanho: G
owner: Roldão
revisado-em: 2026-05-23
depende-de: [US-101]
aprovacoes: []
---

# US-107 — Port grupo lifecycle/util (11 hooks)

## Como, quero, para

**Como** dev BR em Windows puro,
**quero** que os 11 hooks lifecycle/util funcionem nesse ambiente,
**para** completar o port total dos 26 hooks (100%).

---

## Critérios de aceitação

- **AC-107-1** — 11 hooks portados:
  1. `auto-format-on-write.js` — PostToolUse Write/Edit, roda prettier/eslint/ruff/black/gofmt/rustfmt/shfmt se binário existe. Nunca bloqueia.
  2. `context-budget.js` — SessionStart, avisa em stderr se AGENTS.md > 200 linhas ou CLAUDE.md > 150.
  3. `session-snapshot.js` — PreCompact + SessionEnd, grava `session-snapshot.md` + `session-state.json` usando `fs.readdirSync` (path com espaço seguro). Equivalente ao port bash original que já tinha sido feito; agora em Node.
  4. `session-snapshot-restore.js` — SessionStart, lê snapshot e recria markers via `fs.writeFileSync`. STALE > 7 dias.
  5. `subagent-handoff-audit.js` — SubagentStop, avisa se investigador/auditor encerrou sem gravar artefato. Soft warning, exit 0.
  6. `paths-frontmatter-validator.js` — PreToolUse Write/Edit em `docs/*.md`, exige `owner`, `revisado-em`, `status`. Pula README.md/INDICE.md/etc.
  7. `block-todo-without-issue.js` — PreToolUse Write/Edit, bloqueia TODO/FIXME/XXX/HACK sem ID rastreável (#N, US-N, T-N, etc).
  8. `block-jargon-pt-br.js` — PostToolUse/Stop, JSON `decision:block` se resposta usa jargão (commit, push, deploy, etc) sem tradução PT-BR.
  9. `block-confirmation-questions.js` — PostToolUse/Stop, JSON `decision:block` se resposta tem "quer que eu...?" sem cobrir operação destrutiva.
  10. `mcp-validator.js` — SessionStart, AVISA (não bloqueia) se `.mcp.json` tem server fora da allowlist de ~60 fornecedores oficiais.
  11. `regra-zero-reminder.js` — UserPromptSubmit, INJETA lembrete REGRA #0 no contexto e cria marker `bug-trigger-*` quando prompt tem palavra-gatilho de bug.

- **AC-107-2** — Suite acumulada: **168 OK / 0 FAIL**. **26/26 hooks portados (100%).**

---

## Non-goals

- Migrar formatadores (prettier/eslint/etc.) — apenas invoca se já instalados.
- Suportar `find` shell em `session-snapshot.js` — substituído por `fs.readdirSync`.
- Mudar formato de marker em `.claude/.runtime/` — paridade byte-a-byte.

---

## Tasks

- [x] **T-034..T-044** — 11 ports concluídos.
- [x] **T-045** — +22 cenários na suite (168 OK / 0 FAIL).

---

## Status

- [x] em implementação (T-034..T-045 ✓)
- [ ] entregue (depende de US-108)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + implementação (todos os 11 ports + suite) |
