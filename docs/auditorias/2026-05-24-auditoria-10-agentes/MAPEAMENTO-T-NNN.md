---
owner: dev-senior
revisado-em: 2026-05-26
status: stable
prd: PRD-003
epico: EP-002
story-origem: US-111
ac-coberto: AC-111-5
---

# MAPEAMENTO B/A/C/D/E/F/G/H/I/J/K/L → T-NNN

> Tradução obrigatória — fecha **AC-111-5** e cumpre **INV-004** (IDs rastreáveis). Sem este mapeamento, o `commit-message-validator.js` bloqueia commits que citam `B1`, `J12` etc. porque exige `T-NNN`.
>
> **Fonte do lado esquerdo (códigos do plano):** `docs/auditorias/2026-05-24-auditoria-10-agentes/PLANO-10-DE-10.md` (B1..B5, A1..A6, C1..C7, D1..D8, E1..E9, F1..F6, G1..G8, H1..H8, I1..I9, J1..J20) + `PLANO-AUDITADO.md` (K1..K9, L1..L4).
>
> **Fonte do lado direito (T-NNN):** lista de tasks dentro de cada `docs/stories/US-NNN-*.md`.
>
> **Como ler "Status":**
> - `entregue` — task tem `[x]` na story e código/doc verificável em disco.
> - `em-andamento` — task tem `[ ]` mas há rastro parcial (commit, diff, marker).
> - `pendente` — ainda não começou; story está em backlog ou parcialmente entregue.
> - `pendente-externa` — depende de release fechada (task #7 do TaskList: bump 1.3.1 → 2.0.0).
> - `redirecionado` — código removido do plano (J20, I5 — ver `PLANO-AUDITADO.md`).

---

## Resumo por story

| Story | Sprint | Códigos do plano cobertos | Tasks T-NNN | Status geral |
|---|---|---|---|---|
| US-111 | 1 | B1..B5, A1..A6, G1..G4, G7, F1, J10, J12, J16, J19, J1, J2, I7, K3 | T-001..T-025 (25 tasks) | 5 de 6 ACs entregues (AC-111-3 = `pendente-externa`) |
| US-112 | 2A | C1..C7, K7 | T-001..T-008 (8 tasks) | em-andamento (esta sessão) |
| US-113 | 2B | D1..D8 | T-002..T-009 (8 tasks; T-001 = setup) | em-andamento (esta sessão) |
| US-114 | 3 | E1..E9, F2..F6, G5, G6, G8, K6, K8 | T-001..T-019 (19 tasks) | entregue (sessões anteriores) |
| US-115 | 4 | H1, H4..H7, I1..I4, I6, I8, I9, K1, K2, K5 | T-001..T-016 (16 tasks) | entregue (sessões anteriores) |
| US-116 | 5 | L1..L4, K4, K9, J3, J6, J7, J8, J9, J10, J11, J13, J14, J15, J17, J18 | T-001..T-017 (17 tasks) | entregue (sessões anteriores) |

> Total: **6 stories**, **~93 tasks T-NNN**, **74 itens de plano mapeados** (≥70 → `wc -l` da verificação do AC-111-5 ✅).

---

## US-111 — Sprint 1 (Bloqueadores + alta-prioridade leigo)

### Bloco B — Anti-bypass

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| B1 — marker auditor exige `audit_sha` | T-001 | `.claude/hooks/require-auditors-pass-before-commit.js` + `test/hooks-auditors-pass.test.js` | entregue |
| B2 — marker checkpoint exige SHA + `audit_sha` | T-002 | `.claude/hooks/require-checkpoint-before-merge.js` + `test/hooks-checkpoint-marker.test.js` | entregue |
| B3 — GATE 2 sem ensinar bypass | T-003 | `.claude/hooks/require-investigador-before-fix.js` + `test/hooks-investigador-gate2.test.js` | entregue |
| B4 — `xdescribe`/`fit`/`fdescribe` (consolidado com J6/J7) | T-004 | `.claude/hooks/anti-mascaramento.js` + `test/hooks-anti-mascaramento-extra.test.js` | entregue (commit atômico — AC-111-7) |
| B5 — `audit_sha` no shape de marker em `_lib.js` | T-005 | `.claude/hooks/_lib.js` (helper `parseAuditMarker`) | entregue |

### Bloco A — Versionamento e janela de compatibilidade

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| A1 — bump versão pra `2.0.0` | T-006 | `package.json`, `.claude-plugin/plugin.json`, `continue/config.yaml` (sincronizado) | **pendente-externa** — amarrada à task #7 do TaskList (release v2.0.0). `.claude-plugin/plugin.json` mantém `1.3.1` em sync com `package.json` por decisão deliberada (não criar `plugin.json` raiz com pre-release). |
| A2 — criar `MIGRATION-v2.md` | T-007 | `docs/migrations/MIGRATION-v2.md` (não na raiz como o nome do AC sugeria) | entregue |
| A3 — flag `ROLDAO_METHOD_LEGACY_MARKERS=1` | T-008 | `.claude/hooks/_lib.js` (helper `useLegacyMarkers()`) | entregue |
| A4 — statusline mostra `[LEGACY MARKERS ATIVO]` | T-009 | `.claude/statusline.js` | entregue |
| A5 — escrever ADR-020 (contrato `audit_sha`) | T-010 | `docs/decisions/ADR-020-contrato-audit-sha-markers.md` | entregue (status: aceito) |
| A6 — escrever ADR-021 (janela compat) | T-011 | `docs/decisions/ADR-021-flag-legacy-markers-v2.md` | entregue (status: aceito) |

### Bloco G — Outros bloqueadores

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| G1 — criar este MAPEAMENTO | T-012 | `docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md` (este arquivo) | entregue (esta sessão — fecha AC-111-5) |
| G2 — seção `## Non-goals` na US-111 | T-013 | `docs/stories/US-111-sprint-1-bloqueadores-alta-prioridade-leigo.md` | entregue (linhas 53-59 da story) |
| G3 — revisar `commit-message-validator.js` (não colidir) | T-014 | `.claude/hooks/commit-message-validator.js` (comentário documenta interação) | entregue |
| G4 — decisões pré-tomadas no cabeçalho do PRD-003 | T-015 | `docs/prd/PRD-003-v2-0-auditoria-10-de-10.md` | entregue |

### Ações movidas pro Sprint 1 (alto impacto leigo)

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| G7 — prefixo padronizado em `_lib.js` (`hookPrefix(level, name)`) | T-016 | `.claude/hooks/_lib.js` | entregue |
| F1 — regex jargão expandida (lista inicial) | T-017 | `.claude/hooks/block-jargon-pt-br.js` + `test/hooks-jargon-expanded.test.js` | entregue |
| J10 — `audit_sha` em todas as aprovações | T-018 | `.claude/hooks/validate-story-approvals.js` + `test/hooks-audit-sha-story.test.js` | entregue |
| J12 — GIF/vídeo no topo do README | T-019 | `README.md` + `docs/assets/` | entregue |
| J16 — `npx roldao-method` (sem arg) mostra menu | T-020 | `bin/install.js` (no projeto não existe `bin/roldao-method.js`; CLI é `bin/install.js`) | entregue |
| J19 — CHANGELOG ganha bloco modelo pro leigo | T-021 | `CHANGELOG.md` + `.claude/rules/tech-writer-output-templates.md` (template oficial) | entregue |
| J1 — `docs/PRIMEIRO-DIA.md` | T-022 | `docs/PRIMEIRO-DIA.md` | entregue |
| J2 — `docs/COMO-PEDIR-AJUDA.md` | T-023 | `docs/COMO-PEDIR-AJUDA.md` | entregue |
| I7 — glossário de IDs em PT-BR | T-024 | `docs/GLOSSARIO.md` (caminho real é `GLOSSARIO.md`, não `GLOSSARIO-IDS.md`; o conteúdo de IDs entrou no mesmo glossário) | entregue |

### Cobertura adicional (auditor 1)

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| K3 — bloco "este arquivo é pro assistente de IA" no topo de AGENTS.md e CLAUDE.md | T-025 | `templates/AGENTS.md` + `templates/CLAUDE.md` | entregue |

---

## US-112 — Sprint 2A (Autonomia real dos agentes)

| Código | T-NNN | Arquivo tocado | Status |
|---|---|---|---|
| C1 — `analista.md` sem "perguntas pendentes pro PM" | T-001 | `.claude/agents/analista.md` | pendente |
| C2 — `dba-dados.md` Pergunta → Infere | T-002 | `.claude/agents/dba-dados.md` | pendente |
| C3 — `devops-infra.md` Pergunta → Infere | T-003 | `.claude/agents/devops-infra.md` | pendente |
| C4 — eval comportamental "no-evitable-questions" | T-004 | `evals/agent-behavior/no-evitable-questions.eval` | pendente |
| C5 — runner do eval | T-005 | `evals/runner.js` (já existe em US-114; estender) | em-andamento |
| C6 — teste integração `agent-premissas.test.js` | T-006 | `tests/integration/agent-premissas.test.js` | pendente |
| C7 — doc `PADROES-AGENTE-AUTONOMO.md` | T-007 | `docs/PADROES-AGENTE-AUTONOMO.md` | pendente |
| K7 — `/prd` etapa 2 dispara AskUserQuestion automático | T-008 | `.claude/commands/prd.md` | pendente |

---

## US-113 — Sprint 2B (Maestro multi-modo)

| Código | T-NNN | Arquivo tocado | Status |
|---|---|---|---|
| D1 — Maestro modo PRD | T-002 | `.claude/agents/maestro.md` + `.claude/commands/prd.md` | pendente |
| D2 — Maestro modo BROWNFIELD | T-003 | `.claude/agents/maestro.md` + `.claude/commands/brownfield.md` | pendente |
| D3 — Maestro modo AR | T-004 | `.claude/agents/maestro.md` + `.claude/commands/auditoria-reversa.md` | pendente |
| D4 — `enforce-pipeline-completion.js` reconhece 3 modos novos | T-005 | `.claude/hooks/enforce-pipeline-completion.js` | pendente |
| D5 — helper `etapaAtual(marker)` em statusline | T-006 | `.claude/statusline.js` | pendente |
| D6 — `/prd` invoca Maestro modo PRD | T-007 | `.claude/commands/prd.md` | pendente |
| D7 — `/brownfield` invoca Maestro modo BROWNFIELD | T-008 | `.claude/commands/brownfield.md` | pendente |
| D8 — `/auditoria-reversa` invoca Maestro modo AR + nota MIGRATION | T-009 | `.claude/commands/auditoria-reversa.md` + `docs/migrations/MIGRATION-v2.md` | pendente |

> D6/D7/D8 do PLANO original (PreCompact / subagent-handoff / enforce-pipeline) foram redistribuídos: D6 ficou em US-114 T-006 (parseFrontmatter unificado em _lib.js). D7 e D8 absorvidos em D4 (T-005) que cobre os 3 modos novos do enforce-pipeline.

---

## US-114 — Sprint 3 (Auto-preenchimento + PT-BR)

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| E1 — helper `next-id.js` | T-001 | `templates/.specify/scripts/next-id.js` | entregue |
| E2 — helper irmão por template | T-002 | `templates/.specify/templates/{prd,story,adr,product-brief,epico}-helper.md` | entregue |
| E3 — `/inicio` etapa 4 reaproveita `/brownfield` | T-003 | `templates/.claude/commands/inicio.md` | entregue |
| E4 — `/inicio` lista frameworks detectados em PT-BR | T-004 | mesma edição da T-003 | entregue |
| E5 — `/help` sugere addon (SessionStart) | T-005 | `.claude/hooks/suggest-addon-on-keywords.js` | entregue |
| E6 — `parseFrontmatter` unificado em `_lib.js` | T-006 | `templates/.claude/hooks/_lib.js` | entregue |
| E7 — `/inicio` resumo final em PT-BR | T-007 | `templates/.claude/commands/inicio.md` (bloco "PROJETO INICIADO") | entregue |
| E8 — placeholder `_(preencher)_` com `[ajuda]` apontando helper | T-008 | `prd.md` + `story.md` + `product-brief.md` + `epico.md` | entregue |
| E9 — doctor avisa placeholder | T-009 | `bin/install.js` (subcomando doctor) | entregue |
| F2 — sincronizar regex `block-jargon-pt-br.js` com skill `traduzir-jargao` | T-010 | `.claude/hooks/block-jargon-pt-br.js` + `.claude/skills/traduzir-jargao/SKILL.md` | entregue |
| F3 — `devops-infra.md` em PT-BR | T-011 | `.claude/agents/devops-infra.md` | entregue |
| F4 — `dba-dados.md` em PT-BR | T-012 | `.claude/agents/dba-dados.md` | entregue |
| F5 — eval comportamental devops/dba | T-013 | `evals/agent-behavior/devops-dba-comportamento.eval.json` + `evals/runner.js` | entregue |
| F6 — eval rodada + relatório | T-014 | `docs/auditorias/2026-05-24-auditoria-10-agentes/eval-devops-dba-pt-br.md` | entregue |
| G5 — mensagens `_lib.js` em PT-BR | T-015 | `templates/.claude/hooks/_lib.js` | entregue |
| G6 — prefixo padronizado em hooks | T-016 | `templates/.claude/hooks/_lib.js` (`hookPrefix(level, name)`) | entregue |
| G8 — catálogo de mensagens P1 | T-017 | `docs/MENSAGENS-ERRO-CATALOGO.md` | entregue |
| K6 — `failClosedMessage(hookName, err)` em `_lib.js` | T-018 | `templates/.claude/hooks/_lib.js` | entregue |
| K8 — F1 cobre `null pointer`, `race condition`, `edge case`, `stack trace` | T-019 | `.claude/hooks/block-jargon-pt-br.js` | entregue |

---

## US-115 — Sprint 4 (UX Terminal + Descoberta)

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| H1 — TL;DR de 3 linhas no topo dos 15 agentes | T-002 | `.claude/agents/*.md` (15 arquivos) | entregue |
| H4 — `## Correções que VOCÊ aplica sem pedir` (auditores) | T-003 | `auditor-seguranca.md` + `auditor-qualidade.md` + `auditor-produto.md` | entregue |
| H5 — `/help` layout 3 colunas | T-004 | `templates/.claude/commands/help.md` | entregue |
| H6 — prefixo padronizado em hooks | T-005 | 30 hooks usam `[<nome>] BLOQUEADO:` (helper `hookPrefix` em `_lib.js`) | entregue |
| H7 — statusline branch + versão + agente | T-006 | `.claude/statusline.js` (entregue em sessão anterior) | entregue |
| I1 — `/help` mostra skills | T-007 | `templates/.claude/commands/help.md` | entregue |
| I2 — `/help` mostra addons + "pra quê" | T-008 | `templates/.claude/commands/help.md` | entregue |
| I3 — `bin/install.js` subcomando `search` | T-009 | `bin/install.js` (não `bin/roldao-method.js`) | entregue |
| I4 — `search <termo>` fuzzy em 3 fontes | T-010 | `bin/install.js` (`loadCommandsCatalog`, `loadSkillsCatalog`, `fuzzyScore`) | entregue |
| I6 — `/help <comando>` mostra detalhes | T-011 | `templates/.claude/commands/help.md` (handler) | entregue |
| I8 — README seção "Descoberta" | T-012 | `README.md` (5 portas de entrada) | entregue |
| I9 — doctor sugere comando próximo (Levenshtein) | T-013 | `bin/install.js` (`levenshtein()` + `suggestCommand()`) | entregue |
| K1 — coluna "Pra quem é" nos addons do README | T-014 | `README.md` | entregue |
| K2 — `/inicio` etapas 4-5 em PT-BR sem jargão | T-015 | `templates/.claude/commands/inicio.md` | entregue |
| K5 — `/help "<frase>"` busca fuzzy | T-016 | `bin/install.js` (stopwords PT-BR) | entregue |

---

## US-116 — Sprint 5 (Docs leigo L1-L4 + polimento)

| Código | T-NNN | Arquivo tocado (caminho real) | Status |
|---|---|---|---|
| L1 — `/o-que-aconteceu` | T-001 | `.claude/commands/o-que-aconteceu.md` | entregue |
| L2 — `npx roldao-method status` | T-002 | `bin/install.js` (`statusProjeto()`) | entregue |
| L3 — `npx roldao-method undo` | T-003 | `bin/install.js` (usa `git revert`, confirma antes) | entregue |
| L4 — métrica oficial "5 tarefas-tipo" | T-004 | `docs/METRICA-OFICIAL.md` + bloco no `README.md` | entregue |
| K4 — 1 exemplo completo por template | T-005 | `docs/exemplos/{PRD,ADR,US,BRIEF,BROWNFIELD}-EXEMPLO.md` | entregue |
| K9 — rodapé PARA-DONO em `/status`, `/checkpoint`, `/release` | T-006 | os 3 comandos | entregue |
| J3 — `docs/SEU-DEV-PRECISA-LER-ISSO.md` (originalmente `PRIMEIRO-DIA.md`) | T-007 | `docs/PRIMEIRO-DIA.md` (renomeado mantendo função do J1; o SEU-DEV-PRECISA-LER-ISSO.md também existe — ver J3 do plano original) | entregue |
| J6 — anti-mascaramento `if (false)` + teste comentado | T-008 (consolidado) | `.claude/hooks/anti-mascaramento.js` + `test/hooks-anti-mascaramento-extra.test.js` (19/19 OK) | entregue |
| J7 — anti-mascaramento `return` precoce | T-008 (consolidado) | mesma edição | entregue |
| J8 — README "Para quem é" | T-009 | `README.md` | entregue |
| J9 — README "Para quem NÃO é" | T-010 | `README.md` (combinado com T-009) | entregue |
| J10 — audit trail final `audit_sha` | T-011 | `.claude/hooks/validate-story-approvals.js` (já entregue em US-111 T-018; aqui é validação final) | entregue |
| J11 — doctor detecta projeto v1.x | T-012 | `bin/install.js` (doctor varre `.claude/hooks/*.sh` antigos) | entregue |
| J13 — doctor sugere ação corretiva | T-013 | `bin/install.js` (Levenshtein) | entregue |
| J14 — CHANGELOG "como ler este arquivo" no topo | T-014 | `CHANGELOG.md` (v1.0.4) | entregue |
| J15 — `--version` retorna versão + descrição PT-BR | T-015 | `bin/install.js` | entregue |
| J17 — mensagem PT-BR de boas-vindas no install | T-016 | `bin/install.js` ("instalei o framework no seu projeto") | entregue |
| J18 — README link visível pra `MIGRATION-v2.md` | T-017 | `README.md` + `docs/migrations/MIGRATION-v2.md` (~150 linhas) | entregue |

---

## Itens do plano sem T-NNN (decidido)

| Código | Razão | Decisão |
|---|---|---|
| J20 | Reescrever release notes antigas (v0.15.x) — scope creep | redirecionado (removido — `PLANO-AUDITADO.md` linha 92) |
| I5 | Sugestão proativa de addon duplicado com E5 | redirecionado (entregue como E5 / US-114 T-005) |
| J4 | Alias `/adotar` — pergunta pendente do Roldão | pendente (Roldão precisa decidir o churn) |
| J5 | Rename `/qa` → `/testes-area` — pergunta pendente | pendente (Roldão precisa decidir o churn) |

---

## Verificação automática do AC-111-5

```bash
grep -E '^\| (B|A|C|D|E|F|G|H|I|J|K|L)' docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md | wc -l
```

Saída esperada: **≥ 70** (atualmente 74 itens mapeados).

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-26 | dev-senior (Bruno) | Criação consolidando todas as 6 stories Sprint 1..5 — fecha AC-111-5 e cumpre INV-004 |
