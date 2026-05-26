---
owner: roldao
revisado-em: 2026-05-26
status: draft
fonte: 20 agentes Claude Code (2 rodadas de 10) sobre C:/PROJETOS/lionclawv1.0
companion: 2026-05-26-auditoria-pipelines-lionclaw.md (foco em pipelines)
---

# Licoes do lionclaw para o ROLDAO-METHOD

> Documento mestre. Consolida 2 rodadas de auditoria com 10 agentes cada (20 agentes no total) sobre `C:/PROJETOS/lionclawv1.0` (LionClaw v2.2.0 — Electron + Vite + React 19 + TypeScript + better-sqlite3 + Claude Agent SDK).
>
> **Rodada 1 (geral):** stack, `.claude/`, CLAUDE/AGENTS/SPEC, `docs/`, testes/CI, Electron, frontend TS/React, banco/persistencia, debitos tecnicos, scripts/release.
> **Rodada 2 (pipelines):** catalogo, engine, doc-pipeline (incidente), harness/architecture-review, agent-runtime, seed-agents, MCPs, persistencia, erro/retry, streaming/UI + bonus de migrations v50..v71.
>
> **Foco:** extrair tudo do uso real desse projeto que pode virar melhoria concreta no framework ROLDAO-METHOD.
>
> **Nota de leitura:** este arquivo CITA padroes anti-mascaramento como exemplo (nao usa). Onde os hooks de protecao do proprio framework bloqueariam, a citacao e feita em prosa: "expect tautologico", "diretiva de ignorar tipo do TS", etc.

---

## 0. Contexto critico (causa raiz)

O **lionclaw NAO usa o ROLDAO-METHOD**. Ele tem seu proprio mini-framework agentic em `.lionclaw/` (estrutura paralela: `SOUL.md`, `RULES.md`, `BOOTSTRAP.md`, `MEMORY.md`, `USER.md`, `agents/`, `skills/`, `workflows/`). O `.claude/` dele so tem `settings.local.json` com permissoes de Bash.

**Leitura disso:** o Roldao comecou a construir o ROLDAO-METHOD **depois** de ja ter sentido as dores documentadas abaixo no lionclaw. Cada dor mapeada aqui e uma dor que o framework atual ainda **nao previne com hook bloqueador**. Esse arquivo e a lista de candidatos a virarem protecao no framework.

---

## SUMARIO EXECUTIVO

O lionclaw e um **Electron BR ambicioso (~10MB de codigo)** que orquestra agentes IA via **5 pipelines ativos + 1 planejado**, executados por uma god-class `PipelineEngine` de **8198 linhas**, com **70 seed-agents** em 11 familias, **15 MCPs locais embarcados** e **agent-runtime polimorfico** (cloud/local/external/codex).

**O que ele faz bem e vale importar (top 10):**
1. Registry declarativo de pipeline com tipos `auto|conversation|loop`
2. Watchdog de 5 sinais de prova-de-vida (text/thinking/toolUse/toolUseComplete/activity)
3. Permission profiles tipados (3 perfis com `canUseTool` filtrando por nome)
4. Erros semanticos tipados (`PipelinePausedError`, `CodexAuthError`, `CodexUnavailableError`) com mensagem PT-BR
5. UPSERT idempotente por (project, phase, sprint) em SQLite cacheado
6. `recoverInterruptedPipelines()` no boot — running→interrupted
7. Cofre de secrets em 3 camadas (safeStorage → keytar → AES-256-GCM)
8. Meta-MCP `skills` que expoe artefatos como tools MCP
9. `check-skip-budget.mjs` — orcamento numerico de skip com tolerancia controlada
10. Modal acessivel a mao (`Modal.tsx` com focus trap + useId + ARIA + restauracao de foco)

**Onde ele se queimou (top 10 dores) — viram hooks no framework:**
1. Pipeline de documentacao reescreveu `docs/` do usuario sem confirmacao (4 ondas de fix)
2. God-file `pipeline-engine/index.ts` com 8198 linhas — auditor humano vira refem de grep
3. 65% das migrations v50..v71 sao re-prompt de agente (prompt virou schema mutavel)
4. Auditoria de auditoria de auditoria (4 camadas antes de implementar)
5. Lixo versionado: `CLAUDE.md.snapshot` (61KB) + `.tmp-dev.log` (9.8MB)
6. Zero `aria-live` em qualquer view de pipeline (inacessivel pra screen reader)
7. Zero retry automatico, zero circuit breaker, zero fallback declarado
8. Zero retencao temporal em `pipeline_messages` (risco LGPD-002)
9. Reconcile insert-only de seed-agents — mudanca no `.ts` nao propaga pra DB existente
10. Auto-publish reintroduzido via setting (mesma dor que causou o incidente original)

---

## 1. TOP 5 DORES OPERACIONAIS DO LIONCLAW

Custo ja pago em horas/PRs:

### Dor 1 — Pipeline reescreveu `docs/` do usuario sem avisar

**Evidencia:** `auditoria-pipeline-documentation.md:14-16` documenta que `<projectPath>/docs/` era reescrito cego na fase 21 do pipeline, sem botao "publicar".

**Causa raiz dupla:**
- **F1** — 8 de 11 doc-writers ignoravam docs existentes (geravam do zero a partir do codigo + git log)
- **F2** — `publishDocArtifacts()` em `pipeline-engine/index.ts:6133-6157` era chamado por side-effect na linha 6066, copiando `<runDir>/*.md` → `<projectPath>/docs/*.md` sem dialog, sem diff, sem confirmacao

**Custo:** 1 auditoria (5 agentes paralelos) + 1 plano + 1 auditoria do plano + 4 ondas de fix (PRs #1 e #2) + migrations `v68`, `v69`. **3+ tentativas** de corrigir a mesma coisa.

**Risco residual:** se `settings.documentation_auto_publish === 'true'`, fase 21 volta a publicar TUDO sem dialog. Default `false`, mas vetor existe.

**Prevencao no framework:**
- Hook `block-doc-overwrite-without-diff.js` — INV-007
- Hook `enforce-read-before-write-doc.js`
- Skill `gerar-doc-com-preservacao` (5 stages, anti-symlink, UTF-8-safe via StringDecoder)
- Padrao universal "diff visual antes de aplicar" como guideline transversal

### Dor 2 — God-files monstro

**Evidencia:**
- `electron/main/pipeline-engine/index.ts` → **8198 linhas**
- `codex-bridge.ts` → 1426 linhas

**Estrutura do god-file:**
- 1 classe `PipelineEngine` com ~50 metodos
- `approvePhase` (linhas 2988-4546) — **1558 linhas**
- `runPhase9` (linhas 4547-5965) — **1418 linhas** (so a fase 9)
- `runAutoPhase` (linhas 1962-2741) — **780 linhas**, despacho gigante
- **81 ramificacoes `if (phaseNumber === N)`** + **7 ramificacoes `pipelineType ===`** no mesmo arquivo
- Adicionar fase nova exige editar 4-8 metodos

**Prevencao no framework:**
- Hook `block-god-file.js` — INV-008 (warn 1500 linhas, block 3000)
- Hook `block-phase-number-dispatch.js` — INV-009
- Regra INV-010 — workflow e dado + funcao (registry carrega `handler` junto)

### Dor 3 — Plano corrigia plano (auditoria de auditoria)

**Evidencia:** pasta-raiz tem cascata:
1. `auditoria-pipeline-documentation.md`
2. `plano-fix-pipeline-documentation.md`
3. `auditoria-do-plano.md`
4. `PLANO-ARCHITECTURE-REVIEW.md` (com "re-auditoria da Onda 0")

**Padrao:** plano nasce, audita-se o plano, descobre 5 criticos + 6 altos no PLANO antes mesmo de executar. **4 camadas de auditoria** antes da implementacao.

**Por que aconteceu:**
- Auditoria one-shot alucina — relator #10 disse "fase 2 nao esta em conversationPhases" mas estava
- Achados perigosos — #13 propunha remover Write/Edit do triage, mas o triage **escreve** o `Candidates.md`
- Cobertura incompleta — primeira passada nao detectou 8 riscos novos (R1-R8) que so apareceram em audit-2
- Conflito de migration (R2) — Ondas 3 e 4 reservavam mesmo `v70`

**Prevencao no framework:**
- Regra INV-AGENT-007 — *"Se 2+ rodadas de auditoria forem necessarias antes de implementar, escalar pra revisao arquitetural humana — nao criar 3a auditoria."*
- Workflow `/auditoria-iterativa` com max 3 rounds + criterio de parada `riscos_novos == 0`
- Hook `enforce-audit-iteration.js`
- Template `templates/auditoria.md` com formato Cn/An/Mn/Bn/Gn/Rn/ALT-n
- Tabela opcional `audit_round` (equivalente do `harness_rounds` do lionclaw)

### Dor 4 — Lixo operacional versionado

**Evidencia:**
- `CLAUDE.md.snapshot` (61KB) — backup pre-edit, provavelmente porque ele perdeu conteudo em update
- `.tmp-dev.log` (9.8MB) — stream Codex/cloud-executor repetido milhares de vezes versionado

**Prevencao no framework:**
- Hook `block-tmp-log-in-tree.js` — SEC-006

### Dor 5 — 22 migrations so pra re-prompt de agente

**Evidencia confirmada por analise transversal:**
- 20 migrations v50..v71
- **65% sao UPDATE em coluna de agente** (system_prompt/model/effort/thinking_budget/allowed_tools)
- 15% sao DDL real (v57, v59, v65)
- **5 cascatas "fix the fix":** v61→v62→v66, v63→v64, v59 com fix interno
- **0/20 com rollback formal**, **0/20 com teste full-chain**
- Snapshots OLD inline gigantes: v67 (~50KB), v68 (~80KB)
- Citacao literal "R10 dupla" em 9 migrations (regra "edita `.ts` + escreve migration espelhada" virou ritual)

**Prevencao no framework:**
- Hook `block-prompt-in-migration.js` — TST-005
- Skill `extrair-prompt-de-migration` (refactor automatizado)
- Hook `require-migration-test-fullchain.js` — TST-006
- ADR template `ADR-NNN-prompts-fora-da-migration.md`
- Padrao: **"Migration = mudanca estrutural. Prompt/parametro = codigo-fonte versionado no `.ts`, aplicado por reconcile no boot."**

---

## 2. NOVOS HOOKS PROPOSTOS (28 total)

### 2.1 — Criticos (codificam dor real)

| Hook | ID | Bloqueia |
|---|---|---|
| `block-god-file.js` | INV-008 | Arquivo > 3000 linhas sem ADR; warn em 1500 |
| `block-overwriting-user-docs.js` | INV-007 | Write em `docs/` pre-existente sem confirmacao |
| `block-doc-overwrite-without-diff.js` | INV-007 | Diff > 30% em doc existente sem flag explicita |
| `enforce-read-before-write-doc.js` | INV-007 | Write em doc sem Read previo na sessao |
| `block-tmp-log-in-tree.js` | SEC-006 | `.tmp*`, `*.snapshot`, `*.bak`, `*.log >1MB` no commit |
| `block-prompt-in-migration.js` | TST-005 | UPDATE em coluna de agente em migration; string > 2000 chars; nomes `*-prompts-ondaN` |
| `skip-budget-validator.js` | TST-005 | Orcamento numerico de skip ultrapassado |
| `anti-mascaramento.js` (reforco) | TST-001 | Expect tautologico (true equals true, 1 equals 1) |

### 2.2 — Pipeline / agente IA

| Hook | ID | Bloqueia |
|---|---|---|
| `block-phase-number-dispatch.js` | INV-009 | >5 ramos `phaseNumber === N` no mesmo arquivo |
| `require-structured-phase-output.js` | INV-011 | Marker string `[PHASE_COMPLETE]` em vez de JSON estruturado |
| `enforce-audit-iteration.js` | INV-AGENT-007 | Commit com `riscos_novos != 0` no ultimo round |
| `require-watchdog-on-agent-spawn.js` | INV-AGENT-008 | Spawn de agente IA sem AbortController + watchdog |
| `require-permission-profile.js` | SEC-007 | `dangerouslySkipPermissions:true` sem perfil declarado |
| `enforce-user-message-on-pipeline-error.js` | INV-AGENT-009 | `throw new Error()` cru em codigo de pipeline |
| `validate-seed-agent-drift.js` | TST-006 | Mudanca em prompt body sem bump `revisado-em` |
| `require-pipeline-resumable.js` | INV-012 | Workflow > 5 fases sem `current_phase` + funcao `resume*` |
| `require-timeout-on-pipeline-step.js` | INV-AGENT-010 | Passo de pipeline sem `timeout` explicito |
| `require-aria-live-on-pipeline-stream.js` | INV-AGENT-011 | Componente `.tsx` que toca `pipeline:stream` sem `aria-live` |
| `require-migration-test-fullchain.js` | TST-006 | Migration sem arquivo-irmao `.test.ts` |
| `lgpd-pipeline-payload-reminder.js` | LGPD-011 | Tabela `*_messages` / `*_phase_metrics` sem `purge_after_days` |

### 2.3 — Electron-specific (addon `electron-br`)

| Hook | Bloqueia |
|---|---|
| `block-electron-insecure-webprefs.js` | `nodeIntegration` ligado, `contextIsolation` desligado, `webSecurity` desligado |
| `require-context-bridge-preload.js` | `ipcRenderer` usado fora de `preload/` |
| `block-window-open-without-handler.js` | `new BrowserWindow` sem `setWindowOpenHandler` |
| `require-single-instance-lock.js` | Projeto com SQLite/keytar sem `requestSingleInstanceLock()` |
| `require-csp-meta.js` | `index.html` sem `<meta http-equiv="Content-Security-Policy">` |

### 2.4 — Frontend TS/React + Banco

| Hook | Bloqueia |
|---|---|
| `block-any-ts-ignore.js` | Tipo `any` cru, cast `as any`, e diretivas TS de ignorar/expected-error/nocheck em `*.ts/*.tsx` fora de `__tests__/` |
| `block-empty-catch.js` | `catch` vazio sem log (refina TST-001 pra TS) |
| `require-zod-schema-on-form.js` | `useState` em form com >3 campos sem Zod (soft warning) |
| `block-pii-in-audit-log.js` | INSERT em `audit_log`/`messages` sem mascaramento previo |
| `require-migration-rollback.js` | Migration TS nova sem `down()` ou justificativa `// no-rollback:` |
| `require-retention-policy.js` | `CREATE TABLE` com `created_at/content/payload` sem ADR de retencao |
| `block-secret-in-json-column.js` | `INSERT` em coluna JSON com token sem passar pelo vault |
| `mock-overuse-warn.js` | >5 `vi.mock` de modulo interno por arquivo de teste |
| `validate-electron-test.js` | `better-sqlite3`/`node-pty` em teste sem `rebuild` no `pretest` |
| `release-gate-without-ci.js` (soft) | `prebuild` rodando teste sem `.github/workflows/` |
| `mcp-validator.js` reforcado | Smoke-test `tools/list` falha; MCP sem `inputSchema` declarado |

---

## 3. NOVAS REGRAS COM ID CANONICO (14 total)

| ID | Texto |
|---|---|
| **INV-007** | Geracao automatica de arquivo em path do usuario exige passo de confirmacao humana e diff visual |
| **INV-008** (reforcada) | Arquivo de codigo fonte > 1500 linhas warning, > 3000 bloqueio sem ADR; orquestrador ≤ 500 linhas |
| **INV-009** | Logica de fase mora junto da fase (proibido despacho `phaseNumber === N` espalhado em >5 ramos) |
| **INV-010** | Workflow e dado + funcao (registry carrega `handler` junto do metadado, nao so metadado) |
| **INV-011** | Saida estruturada por fase (JSON estruturado, nao marker string como `[PHASE_COMPLETE]`) |
| **INV-012** | Workflow > 5 fases exige resumability declarada (coluna `current_phase` + funcao `resume*`) |
| **INV-AGENT-007** | Se 2+ rodadas de auditoria forem necessarias antes de implementar, escalar pra revisao arquitetural humana — nao criar 3a auditoria |
| **INV-AGENT-008** | Spawn de agente IA exige AbortController + watchdog de inatividade |
| **INV-AGENT-009** | Erro de pipeline herda de classe base com `userMessagePtBr` (stack trace nunca chega ao usuario) |
| **INV-AGENT-010** | Passo de pipeline declara `timeout` explicito |
| **INV-AGENT-011** | Componente que renderiza stream de pipeline tem `aria-live` |
| **SEC-006** | Working tree nao pode conter `.tmp*`, `*.snapshot`, `*.bak`, `*.log` > 1MB nao declarado no `.gitignore` |
| **SEC-007** | `dangerouslySkipPermissions:true` so via perfil declarado (proibido hardcoded) |
| **TST-005** | Orcamento numerico de skip controlado + prompt de agente nunca em migration |
| **TST-006** | Migration nova exige teste full-chain (aplicar em DB efemero in-memory) + seed-agent drift compara TODOS os campos |
| **LGPD-011** | Log de auditoria que aceita conteudo livre exige mascaramento de PII na entrada (sustenta LGPD-004); tabela `*_messages`/`*_phase_metrics` sem `purge_after_days` |

---

## 4. NOVOS AGENTES PROPOSTOS (7)

### 4.1 — Electron BR (addon)

| Agente | Persona | Gatilho |
|---|---|---|
| `electron-architect` | (novo) | `/inicio` Electron, decisao main/preload/renderer, IPC contract. Entrega skeleton com `tsconfig` project references + `electron-vite.config.ts` com `externalizeDepsPlugin` |
| `electron-security` | (especialista de Caio) | Edit em `webPreferences`, `electron-builder.yml`, signing/notarization. Audita CSP, custom protocols, asar, code signing BR, notarization Mac, atestado Windows |

### 4.2 — Pipeline / agentes IA (auditoria de pipelines)

| Agente | Persona | Gatilho |
|---|---|---|
| `documentation-master` | (novo) | `/documentar-repo` — 23 fases, gera doc retroativa de repo brownfield (PRD + ADRs + SCHEMA + API + TYPES + README + RUNBOOK + ONBOARDING) |
| `architecture-decision-interviewer` | (apoio do tech-lead Rafael) | Quando ADR ainda nao tem decisao tomada — conversa guiada com Roldao |
| `harness-evaluator` | (apoio do revisor Ines) | Gates iterativos no MEIO do pipeline (nao so pos-fato como hoje) |
| `migration-master` | (pareia com `dba-dados`) | `/feature` que toca DDL ou `/refactor` de schema. Foco em change management: idempotencia, rollback, teste full-chain |

### 4.3 — Frontend

| Agente | Persona | Gatilho |
|---|---|---|
| `frontend-acessibilidade` | "Bruna" | `/feature` com UI. Padrao WCAG 2.2 AA + **eMAG (norma BR de acessibilidade gov)** |

**Cabem como skill, nao agente:**
- `forms-validacao-br` → skill `validar-cpf-react-hook-form` + rule `frontend-typescript.md`
- `state-management` → skill `zustand-store-pt-br`
- `resolution-tracker` (do lionclaw) → skill que rastreia se finding foi mesmo fechado

---

## 5. NOVAS SKILLS PROPOSTAS (21 total)

### 5.1 — Core (gap real do framework)

1. **`testar-webapp`** — extraido do `webapp-testing` do lionclaw. Playwright pra E2E browser
2. **`construir-mcp`** — guia pra criar MCP server em TypeScript
3. **`limpar-memoria`** — limpa duplicatas/desatualizados em `MEMORY.md`/`USER.md`
4. **`extrair-prompt-de-migration`** — refactor automatizado: migration → `seed-agents/<id>.ts`

### 5.2 — Pipeline / agente IA

5. **`gerar-workflow-roldao`** — template de pipeline declarativo (registry com `handler` junto)
6. **`gerar-pipeline-com-checkpoint-sqlite`** — 3 tabelas (runs/phases/messages) + UPSERT + resume + `recoverInterrupted()` no boot
7. **`gerar-pipeline-resiliente`** — template com timeout/watchdog/retry/fallback/userMsg declarados
8. **`gerar-agent-executor`** — scaffold polimorfico (strategy + discriminated union exaustivo)
9. **`gerar-seed-agent`** — `.claude/agents/<id>.md` + entrada registry + teste de drift (consistencia triple)
10. **`gerar-doc-com-preservacao`** — template de doc-writer que respeita conteudo existente (5 stages, anti-symlink, UTF-8-safe)
11. **`gerar-relatorio-auditoria-multinivel`** — normaliza achados pro esquema Cn/An/Mn/Bn/Gn/Rn/ALT-n
12. **`gerar-painel-pipeline-pt-br`** — componente acessivel (aria-live + status PT-BR + traducao de erro)
13. **`desenhar-runbook-pipeline`** (pareia com Marcos sre-on-call) — runbook com stall/degradacao/criterio matar

### 5.3 — Electron BR (addon)

14. `gerar-ipc-handler` — gera trio main+preload+renderer tipado
15. `gerar-preload-seguro` — template `preload/index.ts` com `contextBridge` + tipagem + padrao unsubscribe
16. `validar-csp-electron` — checklist contra CSP do `index.html`
17. `gerar-secrets-vault-electron` — porta o padrao safeStorage → keytar → AES-GCM em 3 camadas do lionclaw
18. `gerar-migration-sqlite-segura` — template TS com BEGIN/COMMIT, guard idempotente, teste full-chain incluso
19. `gerar-mcp-local-electron` — template completo McpServer + watchdog Windows
20. `windows-line-endings-check` — generaliza Windows Health Check do lionclaw

### 5.4 — Frontend BR

21. `validar-cpf-react-hook-form` / `validar-cnpj-react-hook-form` / `validar-cep-react`

### 5.5 — Familia design/UI (avaliar addon `design-system-br`)

O lionclaw tem 8 skills de "design taste":
- `design-taste-frontend`, `design-visual-alto-nivel`, `frontend-design`
- `redesign-projetos-existentes`, `stitch-design-taste`
- `ui-brutalista-industrial`, `ui-minimalista`, `ui-premium-veo3`

**Avaliacao:** pareiam com `ux-designer` (hoje so faz wireframe ASCII). Forte candidato a **addon `design-system-br`**.

---

## 6. NOVOS TEMPLATES (16 total)

### 6.1 — Pipeline / workflow

| Template | Origem |
|---|---|
| `templates/workflows/<nome>.ts.example` | `pipeline-engine/registry/*` do lionclaw |
| `templates/db/schema-pipeline-state.sql` | `harness_projects` + `pipeline_phase_metrics` + `pipeline_messages` |
| `templates/components/PipelineDashboard.tsx.example` | `PipelineStreamView` + `PipelineProgressBar` + `PipelineMetricsFooter` |
| `templates/seed-agent.ts.example` | `seed-agents/electron-pro.ts` + `_shared/` PT-BR + REGRA #0 |

### 6.2 — Spec-driven / auditoria

| Template | Origem |
|---|---|
| `templates/auditoria.md` | Formato Cn/An/Mn/Bn/Gn/Rn/ALT-n com frontmatter `round`+`parent-audit` |
| `templates/plano-fix.md` | Padrao "Ondas" + tabela visao geral |
| `templates/debito-tecnico.md` | `docs/internal/tech-debt.md` do lionclaw |
| `templates/SPEC.md` + `SPEC_PROGRESS.md` | Epico de 13 sprints nao cabe em US individual |
| `templates/glossary.md` | Regras nomeadas tipo R2/R6/R7 citaveis |
| `templates/discovery-notes.md` | Output enxuto do agente `analista` no `/brief` |
| `templates/docs/ADR-pipeline-resumability.md` | Novo |
| `templates/docs/ADR-prompts-fora-da-migration.md` | Novo |
| `templates/CLAUDE.md` com bloco `## 0. Overrides` | Lionclaw sobrescreve regras globais — mecanismo declarativo de override |

### 6.3 — Electron BR (addon)

| Template | Origem |
|---|---|
| `electron-builder.yml.example` | YAML do lionclaw (asarUnpack, extraResources, hardened runtime) |
| `preload-secure.ts.example` | `electron/preload/index.ts` (700 linhas, didatico) |
| `main-index.ts.example` | `electron/main/index.ts` (1088 linhas, boot completo) |
| `entitlements.mac.plist.example` | + checklist de notarization (gap no lionclaw — vira referencia) |
| `tsconfig.json` em project references | `tsconfig.json` + `electron/tsconfig.json` + `src/tsconfig.json` |
| `package.json` com gates encadeados | `predev`/`pretest`/`prebuild`/`predist` do lionclaw |

### 6.4 — Frontend

| Template | Origem |
|---|---|
| `component-acessivel.tsx` | `src/components/ui/Modal.tsx` (focus trap + useId + ARIA) |
| `zustand-store.ts` | `src/stores/auth-store.ts` |
| `form-zod-react-hook-form.tsx` | Montar do zero (lionclaw nao usa) |
| `tsconfig-strict.json` | `src/tsconfig.json` com strict + noUnusedLocals + noUncheckedIndexedAccess |

### 6.5 — Banco

| Template | Origem |
|---|---|
| `db/schema-template-pii.sql` | Coluna PII com comentario `-- PII: tipo, base-legal, retencao-dias` |
| `db/migration-template.ts` | Espelha `runMigration()` do lionclaw |
| `docs/ADR-retencao-template.md` | Novo — LGPD-002 sem template hoje |

---

## 7. CATALOGO DOS PIPELINES DO LIONCLAW (referencia)

**Confirmado:** 5 pipelines ativos + 1 planejado, todos com gatilho sincrono via UI (sem cron).

| # | Pipeline | Fases | Stages | Termina em |
|---|---|---|---|---|
| 1 | **development** | 14 | 5 (Discovery→PRD→Tech→Spec→Execution) | Codigo via harness coder/evaluator |
| 2 | **feature** | 14 | 5 (mesma topologia) | Codigo via harness |
| 3 | **security** | 11 | 4 (Scan→Validacao→Spec→Execucao) | Codigo de fix |
| 4 | **architecture-review** | 11 | 5 (Review→Evidence→Decision→Spec→Execution) | Codigo de refactor |
| 5 | **documentation** | 23 | 7 (Scan→Triage→Architecture→Schema→Modules→Docs→Finalization) | Arquivos `.md` |
| 6 | **correction** (planejado) | 12 | — | Codigo/Report |

**Persistencia compartilhada:** `harness_projects > sprints > rounds`, `pipeline_phase_metrics` (UPSERT por project+phase+sprint), `pipeline_messages` (TEXT livre — risco LGPD).

### GAP ACIONAVEL pro framework

| Pipeline lionclaw | Equivalente roldao-method | Acao |
|---|---|---|
| **documentation (23 fases)** | Nenhum! | **`/documentar-repo` novo** — maior gap; PRD retroativo + ADR extraction + schema/API/types auto + README/RUNBOOK/ONBOARDING |
| security | `/auditoria` (Caio) | Enriquecer com auditor-deduplicador + dual skeptic (security/quality) |
| architecture-review | `/refactor` + `/auditoria-reversa` | Enriquecer com architecture-mapper → target-triage → decision-interviewer |
| correction (planejado) | `/bug` + `/hotfix` + `/incident-postmortem` | Enriquecer `/bug` com pool paralelo de 7 specialists |

---

## 8. PADROES TECNICOS BONS A IMPORTAR

### 8.1 — Arquitetura geral

- Electron + electron-vite + React 19 + Tailwind 4 + TS 5.9 + Zustand 5
- better-sqlite3 + sqlite-vec (busca vetorial) + FTS5 unicode61 (BM25 PT-BR)
- TypeScript em **project references** (`electron/tsconfig.json` + `src/tsconfig.json` separados)
- IPC fatiado por dominio em `electron/main/ipc/` (32 handlers, 1 arquivo por feature)
- `src/services/` espelhado no renderer (33 wrappers IPC tipados)
- Stores Zustand por feature (8 stores) — 1 persistido + 1 volatil
- Migrations programaticas TS versionadas (v50→v71) com prefixo descritivo `vNN-descricao.ts`

### 8.2 — Pipeline engine (apesar do god-file)

- Registry declarativo `registry/<nome>.ts` exporta `PipelineDef` + registra no `PIPELINE_REGISTRY`
- Tipos de fase: `'conversation' | 'auto' | 'loop'`
- Stall counter `MAX_STALLS_BEFORE_ABORT = 4` + watchdog
- `recoverInterruptedPipelines()` no boot — varre `status='running'` e marca como `interrupted`
- UPSERT cacheado por `(project_id, phase_number, sprint_index)` — 17+ vezes por sprint
- `pause()` envolve `[savePipelinePhaseMetrics + updateRound]` em `db.transaction()` atomica

### 8.3 — Agent runtime polimorfico

- **Strategy + discriminated union exaustivo** com `const _exhaustive: never` (compilador detecta runtime novo sem case)
- 4 executors: cloud-executor (Claude SDK), local-executor (Ollama), external-executor (OpenRouter), codex-executor (OpenAI Codex CLI)
- 3 permission profiles: `PERM_BYPASS_NO_GUARD`, `PERM_DEFAULT_WITH_GUARD(guard)`, `PERM_DEFAULT_NO_BYPASS`
- Watchdog com **5 sinais de prova-de-vida**: text, thinking, toolUse, toolUseComplete, activity (default 5min)
- Erros semanticos tipados (`PipelinePausedError` com `reason: 'codex-auth' | 'user-abort' | 'other'`)
- AbortController por sessao
- Probe de 30s pro primeiro chunk

### 8.4 — Seguranca Electron

- `contextIsolation` ligado, `nodeIntegration` desligado, `webSecurity` ligado
- Worker secundario com `sandbox` ligado
- `setWindowOpenHandler` denega navegacao interna
- `app.requestSingleInstanceLock()` evita 2 instancias disputando SQLite WAL
- `powerMonitor` lock-screen/suspend → `logout()` automatico
- `protocol.registerSchemesAsPrivileged([{scheme:'lionclaw-asset', ...}])` em vez de `file://`
- `keytar` para credenciais, TOTP, 2FA
- Cleanup ordenado em `before-quit` com timeout 5s
- Sanitizacao de `</script>` no JSON injetado em template HTML (XSS guard)

### 8.5 — Cofre de secrets em 3 camadas

`safeStorage` (DPAPI/Keychain/libsecret) → fallback `keytar` → fallback AES-256-GCM em arquivo. Versao marcada (`safeStorage-v1`) com upgrade transparente.

### 8.6 — MCP servers locais (15 embarcados)

- Padrao consistente `mcp-servers/<nome>/{src,dist,package.json,node_modules}`
- `mcp-manager.ts`: spawn + crash counter (5min/3 crashes) + backoff `[1s, 5s, 30s]` + status enum
- Anti-zumbi Windows: `taskkill /T` propaga pra netos do processo, escala pra `/F` apos 800ms
- JSON-RPC stdio framing linha por linha em `stdoutBuf`
- Timeouts: `JSONRPC_TIMEOUT_MS=10s`, `INIT_TIMEOUT_MS=8s`
- **Meta-MCPs:** `skills` (le `~/.lionclaw/skills/` e expoe como tools) e `local-agents` (delega pra Ollama/OpenRouter)

### 8.7 — Empacotamento

`electron-builder.yml` faz `asarUnpack` cirurgico de `.node` natives + `sqlite-vec-*` por OS/arch. MCPs ficam fora do asar como `extraResources`. Hardened runtime Mac + NSIS Windows perMachine=false.

**Gap notado:** notarize macOS ausente.

### 8.8 — Streaming/UI

- 12+ canais IPC `pipeline:*` (stream, phase-changed, metrics, sprint-updated, agent-completed, stalled, error, auth-required, document-updated, project-updated, notes-updated)
- Broadcast helper `emitIPC(channel, payload)` idempotente
- Stores duplos: `pipeline-store` (persistido) + `pipeline-runtime-store` (volatil, **GC LRU em 20 entries**, muta Map em vez de clonar — evita 50-200MB de churn por sprint)
- Metricas exibidas: custo USD, duracao, input/output/cache tokens, tool uses, model por fase, timer ao vivo

### 8.9 — Padroes operacionais

- **`check-skip-budget.mjs`** — orcamento numerico de skip (default 27 + margem 5), nao falha se diminuir
- **`prebuild`/`predist` rodam testes** — release gate sem precisar de CI
- **`predev`/`pretest` rebuild nativo** — evita "funciona Electron, quebra Vitest"
- **Modal acessivel a mao** (`Modal.tsx`): focus trap + role/aria-modal + useId + restauracao de foco + ESC handler
- **TS strict + zero diretivas de ignorar tipo** em todo `src/` (disciplina real)
- **Windows Health Check com consentimento** — feature dedicada pra dor real do dev Windows BR (CRLF, autocrlf, gitattributes)
- **Audit log global** (`audit_log` table) com `event_type/tool_name/input/output/duration_ms/approved` — bate com LGPD-004

---

## 9. ANTI-PADROES OBSERVADOS NO LIONCLAW

| Anti-padrao | Evidencia | Como prevenir |
|---|---|---|
| God-file pipeline-engine 8198 linhas | `pipeline-engine/index.ts` | INV-008 + `block-god-file.js` |
| Despacho `phaseNumber === N` em 4-8 metodos | 81 ramificacoes no mesmo arquivo | INV-009 + `block-phase-number-dispatch.js` |
| Marker frágil `[PHASE_COMPLETE]` no stream | Protocolo string nao-tipado | INV-011 + `require-structured-phase-output.js` |
| Prompt em migration (65% das migrations) | v50..v71 — 5 cascatas "fix the fix" | TST-005 + `block-prompt-in-migration.js` |
| Reconcile insert-only | Mudanca em `.ts` nao propaga pra DB existente | Adotar matriz `reconcileMode: 'preserve' \| 'force-canonical'` por campo |
| Expect tautologico em teste | `db-migration-v58.test.ts:54` + 1 outro | Reforco em `anti-mascaramento.js` |
| 27 testes skipados por NODE_MODULE_VERSION | Vitest vs Electron mismatch | Skill `migrar-teste-skipado` |
| `vi.mock` pesado de modulo interno | 591 ocorrencias em 25 arquivos | Hook `mock-overuse-warn.js` |
| 64 usos do tipo `any` / cast pra `any` em 22 arquivos | concentrado em pipeline stores | Hook `block-any-ts-ignore.js` |
| Forms sem schema (`useState` puro) | AgentFormModal, NewProjectModal, TaskFormModal | Skill + warning `require-zod-schema-on-form.js` |
| `catch` vazio silencioso | `auth-store.ts:33,42` | Hook `block-empty-catch.js` |
| Zero `aria-live` em pipeline UI | Inacessivel pra screen reader | INV-AGENT-011 + `require-aria-live-on-pipeline-stream.js` |
| Erro como string crua na UI | `pipeline:error.error` sem traducao | INV-AGENT-009 + `enforce-user-message-on-pipeline-error.js` |
| Zero retry automatico no engine | Falhou → fase morre | Skill `gerar-pipeline-resiliente` |
| Sem circuit breaker, sem fallback declarado | Cloud cai → pipeline morre | Skill `gerar-pipeline-resiliente` |
| Sem retencao em `pipeline_messages` | TEXT livre pode ter PII | LGPD-011 + `lgpd-pipeline-payload-reminder.js` |
| `audit_log` mutavel | Sem trigger before update | LGPD-011 + template `schema-pii.sql` |
| `channels.config` com token cru em JSON | Token Telegram fora do vault | Hook `block-secret-in-json-column.js` |
| DB inteiro sem criptografia em repouso | better-sqlite3 puro, sem SQLCipher | Hook `enforce-sqlcipher-or-justify.js` |
| 71 migrations sem rollback declarado | v50..v71 | Hook `require-migration-rollback.js` |
| Auto-publish doc reintroduzido via setting | Recriar o incidente original | Setting de auto-publish sem `read-existing-first` = debito tecnico |
| Strings PT-BR hardcoded no JSX | App inteiro sem i18n | Soft warning `block-hardcoded-ptbr-strings.js` (futuro) |

---

## 10. INSIGHTS META SOBRE O FRAMEWORK

### 10.1 — INV-005 (≤150 linhas) e irreal pra projeto grande

CLAUDE.md do lionclaw tem **500+ linhas e funciona**, usando convencao `<!-- DETAIL: docs/internal/X.md -->` (ponteiros agente-agnosticos — funcionam em Cursor/Codex tambem).

**Sugestao:** relaxar pra "≤150 no overview + ponteiros DETAIL ilimitados".

### 10.2 — Falta "epico-com-sprints" entre PRD e Story

Lionclaw tem epicos de 13 sprints (`SPEC_PROGRESS.md`). Template atual de Story nao acomoda.

### 10.3 — Falta `/onboarding-projeto` interativo

`AGENTS.md` template tem `_(preencher)_` em §1, §2, §6. O `BOOTSTRAP.md` do lionclaw mostra padrao de **entrevista guiada com 1 pergunta por vez** que funciona pro perfil nao-programador.

### 10.4 — "Onda" vs "Sprint"

Roldao usa "Onda" como unidade de entrega em 3 arquivos do lionclaw. Framework usa Sprint (Scrum). **Aceitar Onda como sinonimo em `/sprint`** ou criar `/onda`.

### 10.5 — Auditoria iterativa e padrao real, nao excecao

`/auditoria` atual e one-shot. Padrao real do lionclaw e "auditoria → plano → auditoria do plano → onda" (ate 4 rodadas). **Mas** combinado com INV-AGENT-007: documentar 2 rodadas max antes de redesenho humano.

### 10.6 — Override de regra global precisa ser declarativo

Lionclaw desliga commits atomicos no §0 do CLAUDE.md. Framework precisa de mecanismo declarativo (bloco `## 0. Overrides` comentado pronto pra ativar) — hoje quem quer overridar adivinha.

### 10.7 — Convencao de migrations: `vNN-descricao.ts` em vez de timestamp

Lionclaw usa `v50..v71-descricao.ts`. Mais legivel em PR e git log. **Adotar como default no agente `dba-dados`**.

### 10.8 — CI remoto ausente e padrao real

Lionclaw confia 100% em gate local (`prebuild: npm test`). Framework podia adicionar soft warning quando ha `prebuild test` sem `.github/workflows/`.

### 10.9 — Auditoria de pipelines revelou padroes ausentes no framework

Framework hoje tem auditores **pos-fato**. Faltam:
- **Gates iterativos no MEIO do pipeline** (modelo coder/evaluator do harness)
- **Erros semanticos tipados** com `userMessagePtBr` obrigatorio
- **Permission profiles tipados** (3 perfis canonicos)
- **Watchdog declarativo** (5 sinais de prova-de-vida)
- **Resumability como contrato** (workflow > 5 fases exige `current_phase` + `resume*`)

### 10.10 — Adotar `seed-agents/` versionado no core

Hoje os 17 agentes vivem so como `.claude/agents/<nome>.md`. Vale criar `seed-agents/` no framework como `.json`/`.yml` (Node puro zero-deps) + teste de drift em CI. Camadas `_shared/` mapeiam em `.claude/rules/*.md` lazy load.

### 10.11 — Padrao "MCP de meta-skill" como ADR

O `skills` MCP do lionclaw materializa o sonho: skills do ROLDAO-METHOD viram tools MCP consumiveis por qualquer cliente (Claude Code, Cursor, ChatGPT). **ADR proposto:** "skills do ROLDAO-METHOD sao expostas como MCP tools via servidor `skills` embarcado". Habilitaria as 19 skills BR (validar-cpf-cnpj, gerar-br-code, mascarar-dado-pessoal, etc.) serem invocadas por qualquer agente IA fora do harness Claude Code.

---

## 11. DOCS QUE LIONCLAW INVENTOU QUE FALTAM NO FRAMEWORK

### `docs/internal/` — doutrina viva separada de spec

Lionclaw separa:
- `docs/Docs<timestamp>/` — artefato de execucao de pipeline (PRD, discovery, stories, sprints)
- `docs/internal/` — doutrina perene: `audit-log.md`, `tech-debt.md`, `core-systems.md`, `pipelines.md`, `file-map.md`, `contributing-pipeline.md`, `glossary.md`

**Framework nao tem essa distincao.** ROLDAO-METHOD hoje so tem `docs/prd/`, `docs/epicos/`, `docs/stories/`, `docs/decisions/`, `docs/releases/`.

**Sugestao:** adicionar `docs/internal/` opcional pro projeto cliente, com templates pros 7 arquivos acima.

### Templates de validacao intermediaria

Lionclaw tem `prd-validation.md`, `spec-validation.md`, `sprint-validation.md`, `enrich-suggestions.md` — relatorios de auditoria com checklist `[APLICADO]/[PENDENTE]/[REJEITADO]`.

**Framework hoje:** `/auditoria` existe mas o output nao e arquivado em formato citavel.

**Sugestao:** workflow `/auditoria` produzir arquivo em `docs/auditorias/AUD-NNN-*.md` com esse formato.

---

## 12. DOCS QUE LIONCLAW EVITOU CRIAR (framework ja vence)

| O que faltou | Por que importa pro framework |
|---|---|
| `CHANGELOG.md` | Framework ja e mais rigoroso aqui — nada a absorver |
| ADRs canonicos | Framework ja tem `docs/decisions/ADR-NNN` — lionclaw embute decisao arquitetural no PRD (anti-padrao) |
| Frontmatter `owner/revisado-em/status` | Framework exige; lionclaw usa header markdown em prosa (anti-padrao) |
| IDs `US-NNN` em nome de arquivo | Lionclaw tem `US-01..US-17` apenas dentro dos docs, sem rastreio cruzado |
| Rastreio US→AC→T→commit | `commit-message-validator.js` do framework nao foi adotado |

---

## 13. NAO TRAZER PRO FRAMEWORK

- **Snapshot por timestamp em pasta** (`Docs20260513_064050/`) — vira lixo
- **`sprints.v1.json` + `sprints20260513.json`** convivendo — schema migrou e ficaram os 2
- **Status em prosa** em vez de frontmatter
- **`audit-log.md` com saltos** (numeracao 10, 13, 14...) — itens resolvidos fora de ordem
- **Workflow `build-plan/` 7 etapas** do `.lionclaw/` — conceitualmente coberto por `/inicio` + `/prd` + `/historia`. Mas a forma "entrevista guiada 1 pergunta por vez" pode inspirar reforco do `/inicio`
- **Reconcile insert-only de seed-agents** — adotar matriz `reconcileMode` por campo em vez disso

---

## 14. ROADMAP DE IMPLEMENTACAO (4 Ondas)

### Onda 1 — Dores reais codificadas (2-3 dias, ROI altissimo)

- Hook `block-god-file.js` (INV-008)
- Hook `block-overwriting-user-docs.js` + `block-doc-overwrite-without-diff.js` + `enforce-read-before-write-doc.js` (INV-007)
- Hook `block-tmp-log-in-tree.js` (SEC-006)
- Hook `block-prompt-in-migration.js` (TST-005)
- Hook `skip-budget-validator.js`
- Reforco `anti-mascaramento.js` (pegar tautologia)
- Atualizar `REGRAS-INEGOCIAVEIS.md` com 14 IDs novos
- Atualizar `.claude/rules/roldao-method.md` (tabela hook→regra)

### Onda 2 — Fundacao de pipeline + agente IA seguro (4-6 dias)

- Skill `gerar-workflow-roldao` (registry declarativo + handler junto)
- Skill `gerar-pipeline-com-checkpoint-sqlite` + template `schema-pipeline-state.sql`
- Skill `gerar-pipeline-resiliente` (timeout/watchdog/retry/fallback/userMsg)
- Skill `gerar-agent-executor` (polimorfico)
- Skill `gerar-seed-agent` (consistencia triple)
- Hooks INV-009, INV-010, INV-011, INV-012 (fase mora junto, workflow=dado+funcao, output estruturado, resumability)
- Hook `validate-seed-agent-drift.js` (compara frontmatter + hash do prompt)
- Hook `require-watchdog-on-agent-spawn.js` (INV-AGENT-008)
- Hook `require-permission-profile.js` (SEC-007)
- Hook `enforce-user-message-on-pipeline-error.js` (INV-AGENT-009)
- Hook `require-timeout-on-pipeline-step.js` (INV-AGENT-010)
- Hook `block-empty-catch-pipeline.js` reforcado
- Template `seed-agent.ts.example` com `_shared/` PT-BR + REGRA #0

### Onda 3 — Addon `electron-br` materializado + auditoria iterativa (5-7 dias)

**Electron BR:**
- Agentes: `electron-architect`, `electron-security`
- 5 hooks Electron (insecure-webprefs, context-bridge-preload, window-open, single-instance, csp-meta)
- 6 skills Electron (gerar-ipc-handler, gerar-preload-seguro, validar-csp-electron, gerar-secrets-vault-electron, gerar-migration-sqlite-segura, gerar-mcp-local-electron)
- Templates: electron-builder.yml, preload-secure.ts, main-index.ts, entitlements.mac.plist, tsconfig project references, package.json com gates
- Skill `windows-line-endings-check`
- Hook `mcp-validator.js` reforcado (smoke-test `tools/list`)

**Auditoria iterativa:**
- Workflow `/auditoria-iterativa` (3 rounds + meta-auditor + tabela `audit_round`)
- Hook `enforce-audit-iteration.js` (INV-AGENT-007)
- Skill `gerar-relatorio-auditoria-multinivel`
- Template `auditoria.md` com formato Cn/An/Mn/Bn/Gn/Rn/ALT-n
- Agente `harness-evaluator` (gates iterativos no meio do pipeline)
- Agente `architecture-decision-interviewer` (apoio do Rafael)

### Onda 4 — Core utilitario + docs + UI acessivel + retencao (3-5 dias)

**Core utilitario:**
- Skill `testar-webapp` (Playwright)
- Skill `construir-mcp`
- Skill `limpar-memoria`
- Skill `extrair-prompt-de-migration` + hook `require-migration-test-fullchain.js` (TST-006)

**Workflow `/documentar-repo`:**
- Novo command (23 fases adaptadas)
- Agente `documentation-master`
- Skill `gerar-doc-com-preservacao` (5 stages, anti-symlink, UTF-8-safe)

**UI acessivel:**
- Template `PipelineDashboard.tsx.example`
- Skill `gerar-painel-pipeline-pt-br` (aria-live, status PT-BR, traducao de erro)
- Hook `require-aria-live-on-pipeline-stream.js` (INV-AGENT-011)

**Frontend BR:**
- Hooks: `block-any-ts-ignore.js`, `block-empty-catch.js`, `require-zod-schema-on-form.js`
- Skills: `validar-cpf-react-hook-form`, `validar-cnpj-react-hook-form`, `validar-cep-react`
- Agente `frontend-acessibilidade` (Bruna) com eMAG BR

**Retencao + LGPD:**
- Hook `lgpd-pipeline-payload-reminder.js` (LGPD-011)
- Template `ADR-retencao.md`
- Skill `gerar-retention-job-lgpd`

**Templates de doc:**
- `auditoria.md`, `plano-fix.md`, `debito-tecnico.md`, `SPEC.md`, `SPEC_PROGRESS.md`, `glossary.md`, `discovery-notes.md`
- `CLAUDE.md` com bloco `## 0. Overrides`
- Workflow `/onboarding-projeto` (entrevista guiada que preenche AGENTS.md §1/§2/§6)

**Avaliar addons (Onda 5 futura):**
- `design-system-br` (8 skills de design taste do lionclaw)
- `mcp-dev`
- `docs-office-br` (pdf/pptx/xlsx)
- ADR "Skills do ROLDAO-METHOD expostas como MCP via servidor `skills` embarcado"

---

## 15. ARQUIVOS-EVIDENCIA (paths absolutos)

### Dor 1 — Overwriting docs
- `C:/PROJETOS/lionclawv1.0/auditoria-pipeline-documentation.md`
- `C:/PROJETOS/lionclawv1.0/plano-fix-pipeline-documentation.md`
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts:6280-6500` (fase 21 + handlers)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-shared/doc-existing-reader.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/db-migrations/v68-doc-writers-preserve-existing.ts`

### Dor 2 — God-file
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts` (8198 linhas)
- `C:/PROJETOS/lionclawv1.0/electron/main/codex-bridge.ts` (1426 linhas)

### Dor 3 — Auditoria de auditoria
- `C:/PROJETOS/lionclawv1.0/auditoria-do-plano.md`
- `C:/PROJETOS/lionclawv1.0/PLANO-ARCHITECTURE-REVIEW.md`

### Dor 4 — Lixo versionado
- `C:/PROJETOS/lionclawv1.0/CLAUDE.md.snapshot` (61KB)
- `C:/PROJETOS/lionclawv1.0/.tmp-dev.log` (9.8MB)

### Dor 5 — Migration de prompt
- `C:/PROJETOS/lionclawv1.0/electron/main/db-migrations/v50..v71` (20 migrations)
- Maiores em conteudo (>50KB): `v67-prompts-onda7.ts`, `v68-doc-writers-preserve-existing.ts`
- Cascatas: v61→v62→v66, v63→v64

### Pipelines e engine
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/types.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/registry/{index,development,security,feature,architecture-review,documentation}.ts`
- `C:/PROJETOS/lionclawv1.0/src/types/pipeline.ts` (linhas 94-217)
- `C:/PROJETOS/lionclawv1.0/src/components/pipeline/NewPipelineModal.tsx`

### Harness / architecture-review
- `C:/PROJETOS/lionclawv1.0/electron/main/db.ts:347-410` (schema)
- `C:/PROJETOS/lionclawv1.0/electron/main/harness-engine.ts:1384-1681` (loop coder/evaluator)
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/architecture-diagnostician.ts`

### Agent runtime
- `C:/PROJETOS/lionclawv1.0/electron/main/agent-runtime/{execute,types,watchdog,permission-profiles,cloud-executor,local-executor,external-executor,codex-executor}.ts`

### Seed agents
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/index.ts` (370 linhas)
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/ensure.ts` (reconcile + snapshot)
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/_shared/{language-pt-br,critical-rules,git-restrictions}.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/__tests__/seed-agents-r10-drift.test.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/db/repositories/agents.ts:213` (`reconcileSeedAgent`)

### MCP servers
- `C:/PROJETOS/lionclawv1.0/mcp-servers/memory-search/src/index.ts` (510 linhas — referencia)
- `C:/PROJETOS/lionclawv1.0/mcp-servers/skills/src/index.ts` (meta-MCP)
- `C:/PROJETOS/lionclawv1.0/mcp-servers/local-agents/src/index.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/mcp-manager.ts` (spawn + watchdog)
- `C:/PROJETOS/lionclawv1.0/electron/main/mcp-tool-bridge.ts`

### Persistencia
- `C:/PROJETOS/lionclawv1.0/electron/main/db.ts` (1284 linhas)
- `C:/PROJETOS/lionclawv1.0/electron/main/db/repositories/pipeline.ts:131-236` (UPSERT cacheado)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts:855-970` (recoverInterrupted)
- `C:/PROJETOS/lionclawv1.0/electron/main/secrets-vault.ts` (cofre 3-camadas)

### Streaming/UI
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-shared/ipc-emitter.ts`
- `C:/PROJETOS/lionclawv1.0/electron/preload/index.ts` (700 linhas)
- `C:/PROJETOS/lionclawv1.0/src/stores/pipeline-store.ts:1331`
- `C:/PROJETOS/lionclawv1.0/src/components/pipeline/{PipelineStreamView,PipelineProgressBar,PipelineMetricsFooter,PhaseActionButtons}.tsx`

### Padroes bons (referencia)
- `C:/PROJETOS/lionclawv1.0/electron/main/index.ts` — boot Electron completo (1088 linhas)
- `C:/PROJETOS/lionclawv1.0/electron-builder.yml`
- `C:/PROJETOS/lionclawv1.0/electron.vite.config.ts`
- `C:/PROJETOS/lionclawv1.0/src/components/ui/Modal.tsx` — modal acessivel
- `C:/PROJETOS/lionclawv1.0/src/stores/auth-store.ts` — Zustand tipado
- `C:/PROJETOS/lionclawv1.0/tsconfig.json` + `src/tsconfig.json` — strict mode
- `C:/PROJETOS/lionclawv1.0/scripts/check-skip-budget.mjs`
- `C:/PROJETOS/lionclawv1.0/scripts/build-all-mcps.js`
- `C:/PROJETOS/lionclawv1.0/CLAUDE.md` — modelo CLAUDE.md grande com DETAIL/Do-NOT/Divida/Ameaca
- `C:/PROJETOS/lionclawv1.0/SPEC.md` + `SPEC_PROGRESS.md`
- `C:/PROJETOS/lionclawv1.0/discovery-notes.md`
- `C:/PROJETOS/lionclawv1.0/docs/internal/` — doutrina viva (7 arquivos)
- `C:/PROJETOS/lionclawv1.0/.lionclaw/BOOTSTRAP.md` — onboarding conversacional
- `C:/PROJETOS/lionclawv1.0/.lionclaw/skills/` — 15 skills (webapp-testing, mcp-builder, context-cleanup, 8 design)

---

_Fim da analise consolidada. Companion com detalhes de pipeline: `2026-05-26-auditoria-pipelines-lionclaw.md`._

_Proximo passo sugerido: priorizar a Onda 1 e abrir issues no GitHub do framework pra cada item — comecando pelos hooks de dor real, que tem ROI imediato._
