---
tipo: story
id: US-118
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-117]
aprovacoes: []
---

# US-118 — Onda 2: Onboarding sem armadilha + Memoria tag-based

## Como, quero, para

**Como** Roldao iniciando projeto novo OU operando projeto com framework instalado ha 2 meses,
**quero** o framework me ajudar ativamente a preencher contratos vazios e carregar so a memoria relevante pra tarefa em curso
**para** parar de carregar 9KB de log de sprint pra responder "qual a stack?" e parar de viver com `_(preencher)_` esquecido por semanas.

## Criterios de aceitacao

- **AC-118-1** — Hook `require-agents-md-preenchido.js` (PreToolUse Task) bloqueia subagente exceto `gerente-produto`/`analista`/`investigador` se `AGENTS.md` contem `_(preencher)_` em §1, §2 ou §6. Excecao: `roldao.skip_onboarding: true` em settings.local.json.
- **AC-118-2** — Comando `/comeco` novo faz entrevista de 5 perguntas (nome, frase do que faz, quem usa, tipo, stack detectada). Cada resposta vira commit atomico em AGENTS.md. Marker `.roldao-method/onboarding.json` suporta `/comeco --continuar`.
- **AC-118-3** — Hook `welcome-first-session.js` (SessionStart) detecta primeira vez e sugere `/comeco` | `/brownfield` | `/help` em PT-BR.
- **AC-118-4** — `npx roldao-method install` detecta tipo via `package.json`/`requirements.txt`/`go.mod`/etc. Electron → sugere addon `electron-br`. `nfe-`/`pix-`/`sped-` em deps → sugere `fintech-br`/`fiscal-br-completo`.
- **AC-118-5** — Hook `detect-existing-claude-md.js` no install: se `CLAUDE.md` existe com conteudo, NAO sobrescreve. Cria `CLAUDE.md.roldao-merge-pendente` ao lado + diff PT-BR.
- **AC-118-6** — `.claude/hooks/memory-router.js` (UserPromptSubmit) extrai keywords, le `tags:` de cada `.md` em `memory/`, injeta top 3-5 via system-reminder. ~70% reducao no orcamento de memoria por turno.
- **AC-118-7** — `.claude/rules/MEMORY-PRECEDENCE.md` (≤80 linhas) declara ordem canonica: REGRAS-INEGOCIAVEIS > memory/* > AGENTS.md > CLAUDE.md projeto > CLAUDE.md global. Hook `memory-conflict-detector.js` avisa contradicao em soft warning.
- **AC-118-8** — `memory/.history/` ganha versionamento automatico via hook `memory-history-snapshot.js` (PreToolUse Write/Edit sobre `memory/*`). Retencao 90 dias. Comando `/memoria-revisar <arquivo>` mostra diff.
- **AC-118-9** — Frontmatter de memoria ganha campo opcional `tags:`. Script `tools/migrar-memorias-pra-v3.js` propoe tags pras 8 memorias existentes.
- **AC-118-10** — `.claude/hooks/memory-budget.js` (SessionStart) mede `memory/`. >50KB warn, >100KB block ate `/memoria-consolidar`.
- **AC-118-11** — `memory/agent-notes/<agente>.md` (novo). Hook SubagentStop permite agente persistir nota ≤500 chars. Hook SubagentStart injeta nota relevante no proximo agente da cadeia.
- **AC-118-12** — `~/.claude/memory-cross-project/` habilitada. Frontmatter do projeto declara `cross-project-tags: [pix, lgpd, electron]`. Hook SessionStart injeta memorias cross-project com tag matching.

## Non-goals

- NAO implementar `memory-skeptic` (vai pra US-121)
- NAO mexer em `MEMORY.md` index inicial (so adicionar tags em memorias individuais)
- NAO criar comando `/memoria-all` ainda (cabe na US-121 com `memory-skeptic`)
- NAO sobrescrever `CLAUDE.md` existente em hipotese nenhuma (sempre staging)

## Contexto tecnico

_(Investigador preenche apos `/feature US-118`.)_

- **Arquivos afetados (estimativa):**
  - `.claude/hooks/require-agents-md-preenchido.js` (novo)
  - `.claude/hooks/welcome-first-session.js` (novo)
  - `.claude/hooks/detect-existing-claude-md.js` (novo)
  - `.claude/hooks/memory-router.js` (novo)
  - `.claude/hooks/memory-conflict-detector.js` (novo)
  - `.claude/hooks/memory-history-snapshot.js` (novo)
  - `.claude/hooks/memory-budget.js` (novo)
  - `.claude/commands/comeco.md` (novo)
  - `.claude/commands/memoria-revisar.md` (novo)
  - `.claude/rules/MEMORY-PRECEDENCE.md` (novo)
  - `bin/install.js` — adicionar deteccao de tipo de projeto + perguntas
  - `tools/migrar-memorias-pra-v3.js` (novo)
- **ADRs relacionados:** ADR-026 (Memory router) — bloqueante

## Tasks

- [ ] **T-118-001** — Hook `require-agents-md-preenchido.js`
- [ ] **T-118-002** — Comando `/comeco` (entrevista guiada + marker onboarding.json)
- [ ] **T-118-003** — Hook `welcome-first-session.js`
- [ ] **T-118-004** — Estender `bin/install.js` com deteccao de tipo de projeto
- [ ] **T-118-005** — Hook `detect-existing-claude-md.js`
- [ ] **T-118-006** — Hook `memory-router.js` (le tags, ranqueia, injeta system-reminder)
- [ ] **T-118-007** — `.claude/rules/MEMORY-PRECEDENCE.md`
- [ ] **T-118-008** — Hook `memory-conflict-detector.js`
- [ ] **T-118-009** — Hook `memory-history-snapshot.js` + comando `/memoria-revisar`
- [ ] **T-118-010** — Frontmatter `tags:` em memorias existentes via `tools/migrar-memorias-pra-v3.js`
- [ ] **T-118-011** — Hook `memory-budget.js`
- [ ] **T-118-012** — `memory/agent-notes/<agente>.md` — hooks SubagentStart/SubagentStop
- [ ] **T-118-013** — `~/.claude/memory-cross-project/` — hook SessionStart + frontmatter `cross-project-tags:` no CLAUDE.md
- [ ] **T-118-014** — Testes em `__tests__/`: router, history, budget, agent-notes, cross-project, install-com-deteccao

## Testes esperados

- **Unitario:** tokenizacao + ranking do memory-router (sem stopwords PT-BR); migrate-memorias idempotente; conflict-detector
- **Integracao:** install em sandbox vazio → comeco roda → AGENTS.md preenchido; install em sandbox com Electron → addon sugerido; install em sandbox com CLAUDE.md existente → merge-pendente criado
- **Regressao:** memoria sem tags continua carregada via fallback; `MEMORY.md` index intacto

## Regulamentacao BR aplicavel

- **LGPD-002** — `~/.claude/memory-cross-project/` permite `/memoria-esquecer <tag>` (exclusao efetiva)
- **INV-001** — toda memoria continua doc versionado
- **INV-005** — MEMORY-PRECEDENCE.md ≤80 linhas

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 2) |
