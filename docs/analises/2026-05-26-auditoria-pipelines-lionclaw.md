---
owner: roldao
revisado-em: 2026-05-26
status: draft
fonte: auditoria paralela de 10 agentes Claude Code focada nos pipelines de C:/PROJETOS/lionclawv1.0
companion: 2026-05-26-licoes-do-lionclaw.md (analise geral)
---

# Auditoria de Pipelines do LionClaw → ROLDAO-METHOD

> Auditoria focada nos PIPELINES de execucao de agentes IA do lionclaw (v1.0 / v2.2.0). 10 agentes em paralelo, cada um com 1 dimensao:
> 1. Catalogo geral, 2. Arquitetura interna do engine, 3. Pipeline de documentacao (incidente real), 4. Pipeline harness/architecture-review, 5. Agent-runtime polimorfico, 6. Seed-agents (70 agentes + drift), 7. MCP servers, 8. Persistencia de estado, 9. Erro/retry/recovery, 10. Streaming/UI/observabilidade. Bonus: 11. Migrations cross-pipeline (drift).
>
> **Objetivo:** identificar padroes mecanicos (registry, executor, watchdog, checkpoint, streaming, retencao) que valem virar primitiva no ROLDAO-METHOD — e mapear os anti-padroes pra codificar como hook bloqueador.

---

## SUMARIO EXECUTIVO

O lionclaw tem **5 pipelines ativos + 1 planejado**, executados por uma god-class `PipelineEngine` de **8198 linhas** acoplada a uma arquitetura solida de **agent-runtime polimorfico** (cloud/local/external/codex), com **70 seed-agents** em 11 familias e **15 MCPs locais embarcados**.

**Pontos fortes a importar:**
- Registry declarativo de pipeline (`registry/<nome>.ts`) com tipos `auto|conversation|loop`
- Watchdog de 5 sinais de prova-de-vida (text/thinking/toolUse/toolUseComplete/activity)
- Permission profiles tipados (3 perfis) com `canUseTool` filtrando por nome
- Erros semanticos tipados (`PipelinePausedError`, `CodexAuthError`, `CodexUnavailableError`)
- Persistencia UPSERT por (project, phase, sprint) com idempotencia em UNIQUE
- `recoverInterruptedPipelines()` no boot — running→interrupted
- Meta-MCP `skills` que expoe artefatos de disco como tools MCP

**Anti-padroes a codificar como bloqueio:**
- God-file de 8198 linhas (despacho `if (phaseNumber === N)` em 4-8 metodos)
- 65% das migrations v50..v71 sao re-prompt de agente (prompt virou schema mutavel)
- Zero retry automatico, zero circuit breaker, zero fallback declarado
- Zero `aria-live` em qualquer view de pipeline
- Zero retencao temporal em `pipeline_messages` (risco LGPD-002)
- Auto-publish reintroduzido via setting (mesma dor que causou o incidente original)
- Marker frágil `[PHASE_COMPLETE]` como string no stream
- Reconcile insert-only — mudanca no `.ts` nao propaga pra DB existente

---

## 1. CATALOGO DE PIPELINES (5 ativos + 1 planejado)

| # | Pipeline | Fases | Stages | Proposito | Termina em |
|---|---|---|---|---|---|
| 1 | **development** | 14 | 5 (Discovery→PRD→Tech→Spec→Execution) | Greenfield: produto novo de Discovery ate codigo rodando | Codigo via harness coder/evaluator |
| 2 | **feature** | 14 | 5 (mesma topologia de development) | Brownfield: adicionar 1 feature a repo existente | Codigo via harness |
| 3 | **security** | 11 | 4 (Scan→Validacao→Spec→Execucao) | Auditoria multi-agente + remediacao automatica | Codigo de fix |
| 4 | **architecture-review** | 11 | 5 (Review→Evidence→Decision→Spec→Execution) | Diagnosticar debito arquitetural e refatorar | Codigo de refactor |
| 5 | **documentation** | 23 | 7 (Scan→Triage→Architecture→Schema→Modules→Docs→Finalization) | Gerar documentacao tecnica completa de repo existente | Arquivos `.md` |
| 6 | **correction** (planejado v2.2.0) | 12 | — | Diagnostico cross-camadas + correcao de bug com 7 specialists paralelos | Codigo/Report |

**Taxonomia (3 grupos):**
- **Build-up:** development, feature, correction → terminam em codigo via `harness-coder/evaluator` loop
- **Discovery/Audit:** security, architecture-review → produzem findings + SPEC de remediacao
- **Doc-gen:** documentation → unico sem fase de execucao de codigo (pool de 5 workers em paralelo)

**Gatilho:** todos sao **sincronos via UI** — usuario clica "+ Novo Pipeline" em `PipelinePage`, abre `NewPipelineModal`. Nao existe cron nem filesystem watcher.

**Persistencia compartilhada:** `harness_projects`, `harness_sprints`, `harness_rounds`, `pipeline_phase_metrics`, `pipeline_messages`, `security_agent_status`.

### GAP ACIONAVEL pro ROLDAO-METHOD

| Pipeline lionclaw | Equivalente roldao-method | Acao |
|---|---|---|
| **documentation** (23 fases) | Nenhum! | **`/documentar-repo` novo** — maior gap. PRD retroativo + ADR extraction + schema/API/types auto + README/RUNBOOK/ONBOARDING |
| security | `/auditoria` (Caio) | **Enriquecer** com auditor-deduplicador + dual skeptic (security/quality) |
| architecture-review | `/refactor` + `/auditoria-reversa` | **Enriquecer** com architecture-mapper → target-triage → decision-interviewer |
| correction (planejado) | `/bug` + `/hotfix` + `/incident-postmortem` | **Enriquecer `/bug`** com pool paralelo de 7 specialists |

---

## 2. ARQUITETURA INTERNA — pipeline-engine (god-class 8198 linhas)

### Estrutura do `index.ts`

| Linhas | Bloco |
|---|---|
| 1-207 | Imports + logger + helper `resolveModelForAgent` |
| 208-340 | Constantes globais de fase + 9 funcoes delegando pro registry |
| 342-423 | Templates de prompt embutidos |
| 424-657 | Tipos internos + `MAX_STALLS_BEFORE_ABORT = 4` |
| 659-8198 | **`class PipelineEngine`** com ~50 metodos |

**Metodos gigantes:**
- `approvePhase` (2988-4546) — **1558 linhas**
- `runPhase9` (4547-5965) — **1418 linhas** (so a fase 9)
- `runAutoPhase` (1962-2741) — **780 linhas**, despacho gigante por `pipelineType` + `phaseNumber`

### Modelo de execucao

- **NAO ha maquina de estado explicita.** Estado em `Map<projectId, PhaseState>` em memoria + colunas em SQLite
- **Transicao:** `startPipeline` → `runAutoPhase(phase)` → ao terminar chama `advancePhase` ou aguarda input
- **Tipos de fase:** `'conversation' | 'auto' | 'loop'` (loop = par Coder/Evaluator)
- **State compartilhado entre fases:** o **filesystem do projeto** e o backbone (PRD.md, SPEC.md, etc.)
- **`[PHASE_COMPLETE]` e um marker string no stream do LLM** — frágil
- **Comunicacao UI:** 227 `emitIPC()` espalhados
- **Recovery:** `recoverInterruptedPipelines()` varre `status='running'` no boot e marca como `interrupted`

### Ponto de extensao

- **Pipeline novo (bom):** criar `registry/<nome>.ts` exportando `PipelineDef` + registrar no `PIPELINE_REGISTRY`. Metadados declarativos
- **Fase nova (ruim):** registry so cobre metadados. Logica vive no despacho `if (phaseNumber === N)` espalhado entre `runAutoPhase` + `approvePhase` + `sendMessage` + `runPhase9` + handlers de arch-review/doc. **81 ramificacoes `if (phaseNumber === N)` e 7 ramificacoes `pipelineType ===`** no mesmo arquivo

### Debito arquitetural visivel

1. God class (~7500 linhas, 50+ metodos)
2. Despacho disperso: mesma fase em 4-8 metodos
3. `approvePhase` 1558 linhas + `runPhase9` 1418 linhas = **36% do arquivo em 2 funcoes**
4. Registry so extraiu metadado, nao comportamento (declarado no proprio `types.ts`)
5. In-flight guards manuais (`approveInFlight`, `sendInFlight`, `resumeInFlight`) — falta abstracao de lock por fase
6. Marker `[PHASE_COMPLETE]` frágil — protocolo string nao-tipado
7. Comentarios `FIX A3-005`, `FIX C1`, `BUG-21`, `Onda 1 R1` dentro do codigo = cemiterio de regressao

### Pro framework

**Padroes a trazer:**
- Registry declarativo de workflow → skill `gerar-workflow-roldao` + template `templates/workflows/`
- Tipo `PhaseDefinition.type: auto|conversation|loop`
- `phaseArtifactMap` declarativo (qual fase apaga qual artefato) → util pra `/replanejar`
- `recoverInterruptedPipelines()` no boot → hook lifecycle
- Stall counter `MAX_STALLS=4` + watchdog → hook `watchdog-stall-detector.js`

**Anti-padroes (regras novas):**
- **INV-008 reforcada** — orquestrador ≤ 500 linhas por arquivo
- **INV-009** (nova) — Logica de fase mora junto da fase. Hook `block-phase-number-dispatch.js` bloqueia >5 ramos `phaseNumber === N` no mesmo arquivo
- **INV-010** (nova) — Workflow e dado + funcao, nao so dado. Registry precisa carregar `handler: () => Promise<PhaseResult>` junto do metadado
- **INV-011** (nova) — Saida estruturada por fase. Hook `require-structured-phase-output.js` exige JSON estruturado em vez de marker string

---

## 3. PIPELINE DE DOCUMENTACAO — anatomia do incidente

### Fluxo (23 fases, 7 stages)

| Stage | Fases | O que faz |
|---|---|---|
| 1. Scan | 1-4 | Profila repo, mapeia modulos, inventaria docs existentes, classifica gaps |
| 2. Triage | 5-7 | PRD retroativo a partir do codigo + git log |
| 3. Architecture | 8-10 | Documenta arquitetura, extrai ADRs |
| 4. Schema | 11-13 | SCHEMA.md, API.md, TYPES.md a partir de SQL/IPC/types |
| 5. Modules | 14-16 | Pool paralelo de 5 workers por modulo |
| 6. Docs | 17-20 | README, OPS/RUNBOOK, ONBOARDING, USER_GUIDE |
| 7. Finalization | 21-23 | Indexer + AI Context + Skeptic |

**Agentes envolvidos:** 11 writers + 12 utilitarios = **23 agentes doc-***

### A falha original (causa raiz dupla)

**F1 — Writers ignoravam docs existentes:** 8 de 11 writers (doc-prd-retroactive, doc-architect, doc-schema, doc-api, doc-types, doc-ops-writer, doc-onboarding-writer, doc-user-guide) geravam do zero a partir do codigo + git log. So 3 (doc-readme-writer, doc-adr-extractor, doc-ai-context) instruíam "leia o que ja existe" no `systemPrompt`.

**F2 — Publicacao automatica silenciosa na Fase 21:** `publishDocArtifacts()` em `pipeline-engine/index.ts:6133-6157` era chamado por side-effect na linha 6066, copiando `<runDir>/*.md` → `<projectPath>/docs/*.md` **sem dialog, sem diff, sem confirmacao**. Faltava handler IPC, faltava campo `published` no manifest, faltava UI.

Resultado: projeto com `docs/PRD.md` valioso → sobrescrito sem aviso.

### A correcao (4 ondas)

- **Onda 1:** Helper `pipeline-shared/doc-existing-reader.ts` com `findExistingDoc()` + anti-symlink (`realPathInsideIfExists`) + truncamento 40KB com `StringDecoder` UTF-8-safe
- **Onda 2:** Edicao dos 8 `systemPrompts` + migration `v68-doc-writers-preserve-existing.ts` realinha 11 prompts via `UPDATE ... WHERE system_prompt = ?` (preserva customizacao)
- **Onda 3:** `publishDocArtifacts` refatorado pra "plan-and-execute" retornando `PublishPlan` com `action: 'create'|'overwrite'|'identical'`. Removida chamada automatica. 3 handlers IPC: preview/apply/cancel. Dialog UI `DocPublishDialog.tsx`. Validacao bidirecional realpath
- **Onda 4:** Campo `publication?: { attempted_at, applied_at, applied_files, skipped_files, user_action }` no manifest

### VULNERABILIDADES RESIDUAIS

1. **Auto-publish reintroduzido (Onda 5):** se `settings.documentation_auto_publish === 'true'`, fase 21 volta a publicar TUDO sem dialog. Default `false`, mas vetor existe. **Um clique errado em config recria o incidente.**
2. Historico de publicacao sobrescreve a cada republicar — auditoria pos-incidente fica cega
3. Fases 15-16 (modulos) ficaram fora da injecao de doc existente — `docs/modules/<slug>.md` antigos ainda podem ser sobrescritos
4. Customizacao via UI quebra o realign

### LICOES PRO FRAMEWORK

**INV-007 refinada — Agente nunca escreve em `docs/` do usuario sem confirmacao explicita:**

- Hook `block-doc-overwrite-without-diff.js` (PreToolUse): path == `docs/**` E arquivo ja existe E diff > 30% → exit 2, exige flag ou prompt explicito
- Hook `enforce-read-before-write-doc.js`: agente vai escrever em `docs/X.md` e nunca chamou Read em `docs/X.md` na mesma sessao → exit 2
- Setting de auto-publish sem `read-existing-first` = debito tecnico, nao opcional

**Skill `gerar-doc-com-preservacao` (template canonico):**

1. Buscar doc equivalente em lista de candidates (`docs/X.md`, `X.md`, `spec/X.md`, etc.)
2. Se existir, ler integralmente (truncar 40KB UTF-8-safe via `StringDecoder` — nao `subarray().toString()` cego)
3. Anti-symlink: validar `realpath` esta dentro de `projectRoot`
4. Output em diff: gerar SEMPRE como diff contra o original
5. Marcar secoes: `[novo]`, `[atualizado]`, `[preservado]`, `[deprecated]`

**Padrao universal "diff visual antes de aplicar":**

1. **Stage 1 (sempre):** Agente escreve em staging isolado (`.{tool}/runs/<runId>/`)
2. **Stage 2 (sempre):** Engine calcula `PublishPlan` com `action: create|overwrite|identical` + diff
3. **Stage 3 (sempre):** Confirmacao humana arquivo-a-arquivo com diff inline
4. **Stage 4 (sempre):** Apply com lock per-project + manifest tracking
5. **NUNCA:** copy automatico como side-effect de "fim de fase". Mesmo com setting, exigir double-opt-in

---

## 4. PIPELINE HARNESS / ARCHITECTURE-REVIEW (auditoria iterativa)

### Modelo de dados (3 tabelas)

```
harness_projects (1) ─< harness_sprints (N) ─< harness_rounds (N)
```

- **harness_projects:** projeto-alvo, `pipeline_type`, `status` (idle/planning/reviewing/ready/running/paused/done/failed/**aborted**/**interrupted**), `current_sprint_index`, `total_sprints`, `config` JSON
- **harness_sprints:** N sprints por projeto, `coder_agent_id`, `evaluator_agent_id`, **`rounds_used`**, **`max_rounds` (default 3)**, `status`, `verdict`
- **harness_rounds:** 1 round = 1 par (coder, evaluator). Guarda tokens, custo USD, duracao, `verdict ('pass'|'fail')`, `feedback_summary`, session_id de cada lado

### Ciclo iterativo (`harness-engine.ts:1384-1437`)

```
for roundNum in 1..maxRounds:
  if abort/pause: break
  output = spawnCoder(prompt + lastFeedback)
  updateHarnessSprint(rounds_used = roundNum)
  evaluation = spawnEvaluator(output)
  if verdict == 'pass': sprintPassed=true; break
  lastFeedback = buildFeedbackFromEvaluation(evaluation)
```

### Criterio de parada (3 combinados)

1. **`max_rounds` (default 3, configuravel)** — apos esgotar, status vira `paused` com `failureReason='max_rounds_exhausted'`. **Nao falha — pausa pra intervencao humana** (decisao excelente)
2. **`verdict='pass'`** do evaluator no round corrente — break
3. **`abortController` ou `pauseRequested`** — usuario cancela

No fluxo manual de auditoria documental (4-camadas), o criterio foi **convergencia por exclusao**: re-auditoria classifica itens em `MANTIDO | JA-CORRIGIDO | PERIGOSO | AMPLIADO`. Para quando `riscos_novos_descobertos == 0`.

### Agentes architecture-review

| Fase | Agente | Funcao |
|---|---|---|
| 1-2 | `architecture-mapper` | Mapeia modulos (Module/Interface/Implementation/Depth/Seam/Adapter/Leverage/Locality) |
| 2 | `architecture-target-triage` | Gera `Candidates.md` |
| 3 | `architecture-diagnostician` | Prova friccao com evidencia arquivo:linha; classifica deps em 4 categorias |
| 4 | `architecture-decision-interviewer` | Conversa com usuario → produz `Decisions.md` (D1, D2, ...) |
| 5-7 | `spec-builder-architecture` / `spec-validator-architecture` / `spec-enricher-architecture` | SPEC override local |
| 8-11 | Coder/Evaluator loop por sprint | Cada sprint em ate 3 rounds |

### Padrao de output (severidade rastreavel)

- **#1-#20** — achados originais numerados, classificados Criticos/Altos/Medios/Baixos
- **C1-C5** — criticos novos da re-auditoria
- **A1-A6** — altos novos
- **M1-M4** — medios
- **G1-G5** — gaps cruzados entre auditorias
- **R1-R10** — riscos novos descobertos (so rounds 2+)
- **ALT-1, ALT-2, ALT-3** — alternativas valiosas
- Status: `MANTIDO | MANTIDO + AMPLIADO | SAIU DO ESCOPO | TIRADO — PERIGOSO | TIRADO — refactor maior`

### POR QUE 4 RODADAS (dor real)

1. **Auditoria one-shot alucina** — relator #10 disse "fase 2 nao esta em conversationPhases" mas estava; #7 e #8 "ainda quebrados" mas ja corrigidos. Sem segunda passada, plano executaria fixes inuteis
2. **Achados perigosos** — #13 propunha "remover Write/Edit do triage" mas o triage **escreve** o `Candidates.md`. Aplicar quebraria a fase 2
3. **Cobertura incompleta** — primeira passada nao detectou R1 (permission guard), R5 (prompt injection), R6 (manifest schema sem validacao), R7 (rollback ausente). 8 riscos novos em audit-2
4. **Conflito de migration (R2)** — Ondas 3 e 4 reservavam mesmo `v70`. So visivel ao auditor cruzar planos

### Pro framework

**`/auditoria` one-shot → `/auditoria-iterativa` (regra INV-AGENT-007 codificada):**

- Round 1: 3 auditores (Caio/Julia/Pedro) em paralelo → `auditoria-r1.md`
- Round 2: 1 meta-auditor le `auditoria-r1.md` + codigo real, classifica achados, adiciona `R-NNN`
- **Criterio de parada:** round N+1 com `riscos_novos == 0` OU `max_rounds=3` (default)
- Hook `enforce-audit-iteration.js` bloqueia commit se `riscos_novos != 0` no ultimo round
- Frase do enunciado: "Auditoria one-shot alucina; aplicar fix sem re-auditoria pode quebrar funcionalidade. Use `/auditoria-iterativa` quando achado for critico/alto"

**Template `templates/auditoria.md`:**

```yaml
---
owner: auditor-revisor
round: 1
parent-audit: null  # round 2+ aponta pro r1
max-rounds: 3
status: draft|stable
---
```

Secoes fixas: `Veredito geral` · `Criticos (C1-Cn)` · `Altos (A1-An)` · `Medios (M1-Mn)` · `Baixos (B1-Bn)` · `Gaps cruzados (G1-Gn)` · `Riscos novos (R1-Rn)` (so rounds 2+) · `Alternativas (ALT-1..n)` · `Status final por item` (tabela com `# | status | evidencia`).

**Skill `gerar-relatorio-auditoria-multinivel`** — normaliza achados brutos pro esquema Cn/An/Mn/Bn/Gn/Rn/ALT-n; valida que cada item tem `arquivo:linha` (proibido `arquivo:?`); marca itens orfaos pra re-auditoria.

**Tabela opcional `audit_round`** (projeto que adota tracking — equivalente do `harness_rounds`):

```sql
CREATE TABLE audit_round (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  parent_round_id TEXT,
  findings_kept INTEGER,
  findings_dropped INTEGER,
  findings_new INTEGER,
  status TEXT CHECK (status IN ('running','converged','max_rounds')),
  report_path TEXT,
  created_at TEXT
);
```

---

## 5. AGENT-RUNTIME (polimorfismo + watchdog)

### Arquitetura

**Strategy pattern com discriminated union exaustivo.** Interface `RuntimeExecutor { run(req, config): Promise<AgentExecutionResult> }` implementada por 4 modulos isolados. Dispatcher central `execute.ts` faz `switch(config.runtime)` com **exhaustiveness guard via `const _exhaustive: never`** — adicionar runtime novo sem case quebra o compilador.

Todo I/O com agente passa por callbacks padronizados (`onText`, `onThinking`, `onToolUse`, `onToolUseComplete`, `onActivity`, `onStalled`). Watchdog injetada **antes** de chamar o executor.

Cancelamento via `AbortController`. Erro semantico `PipelinePausedError` distingue **pausa esperada** (reason: 'codex-auth' | 'user-abort' | 'other') de falha — evita metricas falsas.

### 4 executors

| Executor | Provider |
|---|---|
| **cloud-executor** | `@anthropic-ai/claude-agent-sdk` (Claude oficial, CLI subprocess) |
| **local-executor** | Ollama / LM Studio / endpoint OpenAI-compat local |
| **external-executor** | OpenRouter / OpenAI direto / endpoint OpenAI-compat remoto |
| **codex-executor** | OpenAI Codex CLI via `codex-bridge` (JSON-RPC, pool de processos) |

### 3 permission profiles

- **`PERM_BYPASS_NO_GUARD`** — `mode:'bypassPermissions'`, `dangerouslySkipPermissions:true`. Sem guard. Uso interno
- **`PERM_DEFAULT_WITH_GUARD(guard)`** — `mode:'default'`, bypass off, com callback `canUseTool` que filtra tool por tool
- **`PERM_DEFAULT_NO_BYPASS`** — `mode:'default'`, bypass off, sem guard (delega ao SDK)

### Watchdog

Monitora **silencio entre chunks de progresso** (default 5min = 300_000ms). NAO monitora memoria nem CPU. Considera **5 sinais como prova-de-vida**: `onText`, `onThinking`, `onToolUse`, `onToolUseComplete`, `onActivity`.

Ao expirar: dispara `onStalled` e **reagenda** — permite contar `stallCount` e abortar em `MAX_STALLS_BEFORE_ABORT=4`. Timeout configuravel por chamada.

### Pro framework

**Skill `gerar-agent-executor`** — scaffold polimorfico: `types.ts` (request/result/executor interface), dispatcher com `default:never`, perfis como constantes/factories, callbacks padronizados.

**Hook `require-watchdog-on-agent-spawn`** — escaneia codigo que invoca SDK Anthropic/OpenAI/Ollama (`query(`, `client.messages.create(`, `chat.completions.create(`) sem `AbortController` nem timer de inatividade → exit 2.

**Hook `require-permission-profile`** — proibe `dangerouslySkipPermissions: true` literal ou `bypassPermissions` hardcoded em qualquer arquivo que nao declare `// PERM-PROFILE: <nome>` no topo. Forca a indirecao pelo modulo de perfis.

**Padrao "audit-log por chamada de agente" (LGPD-004):** todo executor gera registro com `{agentId, runtime, model, provider, durationMs, inputTokens, outputTokens, toolUses, costUsd, prompt-hash}`. Hook `audit-log-agent-execution` + skill `mascarar-dado-pessoal` aplicado no prompt antes do hash.

**Padrao "erro semantico":** classe base `PipelineError` exigindo `userMessagePtBr`. Hook `enforce-user-message-on-pipeline-error.js` bloqueia `throw new Error(...)` cru em codigo de pipeline.

### GAPS LIONCLAW (oportunidade pra framework liderar)

1. Sem rate-limit por agentId/projectId — watchdog so ve silencio, nao ve "agente em loop 200x/min"
2. `accumulatedText`/`textBlocks` so no cloud — fallback JSON multi-tier nao funciona em local/external/codex
3. Permission profile nao cobre filesystem — falta `cwdJail` no perfil
4. Audit log nao e estruturalmente imutavel (sem hash-chain append-only)
5. Sem `dry-run` por perfil — falta modo "simular, nao executar tool"
6. Sem metrica de qualidade de saida — mede tokens/custo/duracao, nao mede se output passou em parsing/validacao

---

## 6. SEED-AGENTS (70 agentes em 11 familias)

### Catalogo confirmado (nao 50, **70**)

| Familia (`squad`) | Qtd | Exemplos |
|---|---|---|
| documentation | 23 | doc-architect, doc-adr-extractor, doc-api, doc-schema, doc-readme-writer, doc-skeptic, doc-user-guide |
| pipeline | 18 | discovery-agent, prd-generator, prd-validator, sprint-validator, spec-builder, spec-validator, architecture-mapper/diagnostician/target-triage/decision-interviewer |
| security | 11 | secrets-scanner, auth-auditor, isolation-inspector, duplication-detector, logic-analyzer, owasp-scanner, standards-checker, deduplicator, skeptic-security, skeptic-quality, resolution-tracker, repo-profiler |
| feature | 8 | feat-discovery, feat-prd-generator/validator/completo, feat-tech-{database,backend,frontend,security} |
| dev | 5 | frontend-developer, backend-developer, electron-pro, javascript-pro, nextjs-developer |
| harness | 3 | harness-planner, harness-coder, harness-evaluator |
| enrich | 2 | spec-validator-enrich, spec-enricher |
| tooling | 1 | skill-creator |
| tech | 4 | tech-database, tech-backend, tech-frontend, tech-security |

**Models:** sonnet 4.6 (53), opus 4.7 (13 — planners/decompositores), haiku 4.5 (5 — tarefas baratas).

### Schema de AgentConfig

**Obrigatorios:** `id`, `name`, `description`, `model`, `effort` (`low|high`), `thinking` (`disabled|enabled|adaptive`), `allowedTools[]`, `mcpServers[]`, `isActive`, `skills[]`, `runtime` (`cloud|codex`), `squad`, `systemPrompt`.

**Opcionais:** `thinkingBudget`, `maxTurns`, `maxToolRounds`.

**NAO existe `output_schema`/`response_format`.** Output shape e instruido via texto no `systemPrompt` ("comece sua resposta com `{`") — fragilidade observada em `harness-planner.ts:91-99`.

### Drift gap real (apos o fix da auditoria)

Teste `seed-agents-r10-drift.test.ts` compara hoje: `model, squad, runtime, effort, thinking, thinkingBudget?, maxTurns?, maxToolRounds?, allowedTools, mcpServers, skills, name, systemPrompt`.

**Ainda nao compara (gap remanescente):**
1. `description` — desviar a descricao muda gatilho de uso do agente, sem deteccao
2. `isActive` — alguem pode commitar agente desativado e DB pre-existente continua ativo
3. `thinkingBudget` quando o valor e `undefined`/`0` no `.ts` mas DB tem valor diferente (normalizacao `n || null` mascara `0` legitimo)
4. Ordem de `allowedTools` — normalizada via `sortArr`, perde sinal se ordem importa
5. NAO testa o lado oposto (DB→`.ts`)
6. NAO testa snapshot `.lionclaw/agents/<id>/config.json`
7. Sem fixture de DB legado

### Padrao de prompt em camadas

`_shared/` tem 8 blocos reutilizaveis interpolados via template literal:
- `language-pt-br.ts` → `PT_BR_BLOCK` (forca PT-BR)
- `critical-rules.ts` → anti-alucinacao ("leia arquivo real, nao invente caminhos")
- `git-restrictions.ts`, `bash-validation.ts`, `no-secrets.ts`, `style-guide.ts`, `tech-decision-block.ts`, `existing-doc.ts`

**Estrutura tipica:** `Voce e <papel>` → `## Contexto/Papel` → `## Principios/Metodologia` → `## Regras criticas` → `## Formato de output` → `${BLOCO_SHARED}`.

### Carregamento e armadilha do reconcile

`ensureAllSeedAgents()` roda no boot **apos** `initDatabase`. **NAO e migration — e reconcile insert-only** via `reconcileSeedAgent()`: se o `id` existe no DB, NAO atualiza (edicao do usuario via UI vence).

**Consequencia operacional grave:** mudar `systemPrompt` no `.ts` NAO propaga pra usuario existente — so pra fresh install. Daí a necessidade do teste de drift + fluxo de upgrade explicito.

### Pro framework

**Hook `validate-seed-agent-drift.js`** — PreToolUse de `Edit/Write` em `.claude/agents/*.md`, comparar frontmatter vs definicao registrada. Cobrir: `name`, `description`, `model`, `tools`, `prompt body hash`. Bloquear se hash do prompt mudou sem bump de `revisado-em` no frontmatter.

**Template `seed-agent.ts.example`** com schema completo + blocos compartilhados `${PT_BR_BLOCK}` + `${REGRA_ZERO_BLOCK}`.

**Skill `gerar-seed-agent`** — gera arquivo `.claude/agents/<id>.md` + entrada em registry `agents.index.json` + teste de drift correspondente. Consistencia triple.

**Adotar `seed-agents/` versionado no core:** hoje os 17 agentes vivem so como `.claude/agents/<nome>.md`. Vale criar `seed-agents/` no framework como `.json`/`.yml` (Node puro zero-deps) + teste de drift em CI. Camadas `_shared/` mapeiam em `.claude/rules/*.md` lazy load.

### Agentes aproveitaveis pro framework (faltam no roldao-method)

- `architecture-decision-interviewer` → assistente do `tech-lead` quando ADR ainda nao tem decisao
- `doc-skeptic` / `security-skeptic-quality` → padrao "cetico". Modo do `revisor` (Ines) que questiona ao inves de aprovar
- `harness-evaluator` → loop avaliador→coder→avaliador. **Framework hoje tem auditores pos-fato; faltam gates iterativos no meio do pipeline**
- `resolution-tracker` → rastreia se finding de auditor foi mesmo fechado
- `doc-onboarding-writer`, `doc-user-guide`, `doc-readme-writer` → especializacoes do `tech-writer` (Camila)
- `architecture-mapper`/`architecture-diagnostician` → fortalece `/brownfield` e `/auditoria-reversa`

### O framework tem e o lionclaw NAO

- Agentes BR-especificos (`fiscal-br`, `dba-dados`, `sre-on-call`, `qa-automation`, `analista` de mercado BR, `ux-designer`)
- `investigador` codificado como bloqueio de hook (`require-investigador-before-fix.js`)
- Regra #0 + REGRAS-INEGOCIAVEIS com IDs rastreaveis

---

## 7. MCP SERVERS LOCAIS (15 embarcados)

### Anatomia de um MCP

Padrao consistente em `mcp-servers/<nome>/`:
```
<nome>/
├── src/index.ts          ← McpServer + StdioServerTransport + server.tool()
├── dist/index.js         ← saida TS compilada (entrypoint do spawn)
├── package.json          ← @modelcontextprotocol/sdk + zod
├── tsconfig.json
└── node_modules/         ← deps locais embarcadas
```

`src/index.ts` instancia `new McpServer({ name, version })`, registra tools com `server.tool(nome, descricao, zodSchema, handler)`, conecta `StdioServerTransport` e fala JSON-RPC pelo stdin/stdout.

### Integracao com pipeline (2 caminhos)

1. **`electron/main/mcp-manager.ts`** — gerencia global. `startActiveMCPServers()` faz `spawn` com secrets resolvidos do `secrets-vault`, registra em `runningServers: Map<string, ChildProcess>`
2. **`electron/main/mcp-tool-bridge.ts`** — caminho external (Ollama tool-use). Fala JSON-RPC sobre stdio (request id incremental + buffer linha por linha em `stdoutBuf`). Timeouts: `JSONRPC_TIMEOUT_MS=10s`, `INIT_TIMEOUT_MS=8s`

### Gestao de ciclo de vida (watchdog completo)

- **Crash counter:** janela de 5min, max 3 crashes antes de marcar `failed`
- **Backoff exponencial:** `[1s, 5s, 30s]` por tentativa
- **Status enum:** `running | crashed | restarting | stopped | failed` — emitido via `mcp:status-changed`
- **Manual stop:** flag `manualStops: Set<string>` impede auto-restart durante shutdown
- **Anti-zumbi Windows:** `killProcessTree()` usa `taskkill /PID <pid> /T` (propaga pra netos do processo). Escalona pra `/F` apos 800ms
- **`stopAllMCPServers()`** awaitable — sequencia shutdown ordenada

### Os 15 MCPs classificados

| Categoria | MCPs |
|---|---|
| Conhecimento/Memoria | memory-search (BM25+vec SQLite), knowledge-base, graph-search |
| Produtividade Google | google-calendar, google-drive, google-gmail, google-sheets |
| Midia/IA generativa | elevenlabs (voz), nano-banana (imagem), youtube, excalidraw |
| IA local | local-llm (Ollama wrapper) |
| Comercial | shopify |
| **Meta-MCPs** | **skills** (le `~/.lionclaw/skills/`), **local-agents** (delega pra Ollama/OpenRouter) |

### Pro framework

**Skill `gerar-mcp-local-electron`** — template completo: `src/index.ts` com `McpServer` + zod + `server.tool()`, `package.json` com SDK pinado, esqueleto de watchdog (backoff `[1s,5s,30s]`, `taskkill /T` Windows).

**Hook `mcp-validator.js` reforcado** — hoje so checa allowlist. Adicionar:
- Smoke-test: rodar `node dist/index.js` com `tools/list` input
- Bloquear MCP sem `inputSchema` declarado em pelo menos uma tool
- Verificar declaracao de timeout/teardown no codigo que spawna

**`docs/EXTENDENDO.md` nova secao "MCP local embarcado"** com anatomia, exemplo `McpServer.tool`, watchdog minimo, `killProcessTree` Windows, JSON-RPC framing.

**Padrao "MCP de meta-skill" como referencia canonica** — o `skills` MCP do lionclaw materializa o sonho: skills do ROLDAO-METHOD viram tools MCP consumiveis por qualquer cliente (Claude Code, Cursor, ChatGPT). **ADR proposto: "skills do ROLDAO-METHOD sao expostas como MCP tools via servidor `skills` embarcado".** Habilitaria as 19 skills BR (validar-cpf-cnpj, gerar-br-code, mascarar-dado-pessoal, etc.) serem invocadas por qualquer agente IA fora do harness Claude Code.

**Gap lionclaw a evitar no framework:** sem permission-profiles formal pra MCP — controle binario (`isActive`) + allowlist de env vars. Framework deveria ter perfil de MCP igual ao perfil de agente.

---

## 8. PERSISTENCIA DE ESTADO

### Tabelas (db.ts + migrations-v32-v51)

- **harness_projects** — raiz. CHECK status: `idle/planning/reviewing/ready/running/paused/done/failed/aborted/interrupted`
- **harness_sprints** — `sprint_index`, `status`, `verdict`, `rounds_used`, `max_rounds`
- **harness_rounds** — metricas completas dos dois lados (input/output/cache/cost/duration/tool_uses/api_requests), `coder_session_id`, `evaluator_session_id`
- **pipeline_phase_metrics** — uma linha **por (project_id, phase_number, sprint_index)** com UNIQUE. Status: pending/running/completed/failed/skipped/**interrupted**
- **pipeline_messages** — log conversacional. `role`, `content` (TEXT livre), `tool_calls (JSON)`, `sprint_index`, `round_index`, `agent_id`. Indices em (project, phase, sprint, round)
- **security_agent_status** — pipeline de seguranca paralelo
- Sessoes correlatas: `enrich_sessions`/`enrich_messages`, `workflow_runs` (current_stage + current_question)

### Granularidade de checkpoint

**Por fase (UPSERT)** em `savePipelinePhaseMetrics()` — UPSERT via `ON CONFLICT(project_id, phase_number, sprint_index)`. Statement **cached** (hot path: 17+ vezes por sprint).

**Por mensagem (INSERT incremental)** em `savePipelineMessage()` — uma linha por turno do agente.

**NAO ha persistencia por chunk de streaming.** Chunks emitidos via IPC em RAM, consolidados como linha em `pipeline_messages` so quando o turno completa. Crash no meio de turno perde os chunks — mas fase e reentrante (resume re-executa o turno).

### Resume

`resumePipeline(projectId)`:
1. Se cold start pos-restart, **rehidrata** a partir de `harness_projects.pipeline_current_phase` + `sprint_index`
2. Identifica tipo da fase via `getPipelineDef(pipelineType)`
3. Conversation → no-op + reemite `awaiting-user`
4. Auto → reexecuta a fase inteira
5. Loop → reexecuta o sprint do comeco

**Crash recovery no boot:** `recoverInterruptedPipelines()` varre `WHERE status IN ('running','planning')`, marca como `interrupted`, libera lock, marca sprints orfaos e **rounds orfaos** (`completed_at IS NULL`) — usuario aciona "Retomar" manualmente.

**Limitacoes:**
- Continuidade de sessao do SDK Cloud nao rehidrata totalmente
- Resume sempre reexecuta a fase/round **inteiro**, nunca do meio de um turno

### Idempotencia

- **Em RAM:** `state.resumeInFlight` + `state.approveInFlight` previnem duplo-clique
- **Em RAM:** `activeLocks: Map<projectId, ProjectLock>` per-project lock. Zerado em restart
- **Em DB:** `UNIQUE(project_id, phase_number, sprint_index)` em `pipeline_phase_metrics` + UPSERT — re-execucao sobrescreve metricas
- **Sem idempotency-key persistido entre processos** — unico mecanismo cross-restart e status `running→interrupted` no boot

### Atomicidade por fase

Sim: `pause()` envolve `[savePipelinePhaseMetrics + updateRound]` em `db.transaction()`. `setProjectStatus` fica fora pra evitar IPC dentro de transacao.

### RETENCAO (BURACO LGPD)

**Nao ha TTL automatico em `pipeline_messages` nem `pipeline_phase_metrics`.** Unico delete e `deletePipelineMessagesFromPhase` quando usuario re-roda a partir de uma fase.

**Implicacao:** crescimento sem limite + risco LGPD-002 (direito ao esquecimento) — `pipeline_messages` armazena texto livre do usuario/PRD.

### Pro framework

**Skill `gerar-pipeline-com-checkpoint-sqlite`** — gera 3 tabelas (runs/phases/messages), helper UPSERT por `(run_id, phase_number)`, `resumeFromPhase(runId)`, `recoverInterrupted()` no boot.

**Template `db/schema-pipeline-state.sql`** — copiar tabelas `harness_projects` + `pipeline_phase_metrics` + `pipeline_messages` (generica), com CHECK `status IN ('idle','running','paused','done','failed','aborted','interrupted')`.

**Hook `require-pipeline-resumable.js`** — varre comandos `/feature`, `/prd`, workflows novos: se declaram > 5 fases sem coluna `current_phase` no schema OU sem funcao `resume*`, emite warning. Bonus: bloqueia se persistencia de mensagem esta fora de `db.transaction()`.

**ADR template `ADR-pipeline-resumability.md`** — secoes: granularidade do checkpoint (fase/turno/chunk), politica de idempotencia (UPSERT + UNIQUE), estrategia de crash recovery, retencao LGPD-002.

**Risco LGPD novo (LGPD-011 reforcado):** payload de fase/mensagem persistido em `pipeline_messages.content` (TEXT livre) pode conter PII. Hook `lgpd-pipeline-payload-reminder.js` (soft warning) ao criar tabela `*_messages` / `*_phase_metrics` sem `purge_after_days` configuravel.

---

## 9. ERRO / RETRY / RECOVERY (gaps grandes)

### Categorias tratadas

1. **Stall (agente sem progresso)** — watchdog 5min entre chunks; `MAX_STALLS_BEFORE_ABORT=4`
2. **Auth quebrada (Codex/Anthropic CLI)** — `PipelinePausedError` → status `paused`, IPC pra reautenticar
3. **Runtime indisponivel** — `CodexUnavailableError` → emite `pipeline:error` (sem fallback)
4. **Subprocess CLI silencioso** — probe de 30s pra primeiro chunk, loga `NO chunks received in 30s`
5. **EPIPE em subprocess** — ignorado em `uncaughtException`
6. **Crash generico** — `uncaughtException`/`unhandledRejection` apenas logam
7. **Cancelamento via abort** — `AbortController` por sessao
8. **Fase desconhecida** — `pipeline:error` com mensagem PT-BR

### Estrategias

| Categoria | Estrategia |
|---|---|
| Stall | Watchdog reset por 5 sinais; 4 stalls → abort |
| Timeout | Por chamada (`watchdogTimeoutMs` default 300s); **NAO ha timeout global do pipeline** |
| Retry | **Sem retry automatico no engine** — confiam no backoff HTTP do SDK |
| Circuit breaker | **Inexistente** (0 ocorrencias) |
| Fallback cloud→local | **Nao existe** — comentario "D8 — no fallback" |
| Recovery | Manual: usuario clica retry. `rejectSprint` faz retry com feedback consolidado |
| Crash main | Log + segue vivo |

### Padroes bons

1. **Watchdog com 5 sinais de prova de vida** — qualquer chunk reseta. Resolveu falsos stalls em agentes que ficam minutos so raciocinando
2. **Erros tipados como classes** (`PipelinePausedError`, `CodexUnavailableError`, `CodexAuthError`) — IPC com titulo PT-BR. Stack trace nunca vai cru pra UI
3. **Probe de 30s pro primeiro chunk** — separa "agente lento" de "subprocess pendurado"

### Gaps grandes

- **Zero retry com backoff no engine** — falhou → fase morre. Pipeline de 9 fases queima 30min de trabalho
- **Sem circuit breaker** — se Anthropic API ficar lenta, todos agentes tomam stall em sequencia sem `failureCount > N → abre circuito`
- **Sem fallback cloud→local declarado** (D8)
- **Sem modo degradado / partialSuccess** — pipeline e all-or-nothing por fase
- **Sem timeout global do pipeline** — pode rodar 4h sem ninguem notar
- **`uncaughtException` apenas loga** — nao rollback de transacao, nao notifica UI de fases orfas
- **Watchdog nao rearma se executor nao envia `onActivity`** — bug historico (Bug #5, #7)

### Pro framework

**Skill `gerar-pipeline-resiliente`** — template obrigatorio com:
```yaml
phase:
  timeout: 600s          # global da fase
  watchdog: 300s         # entre sinais de vida
  retry: { max: 2, backoffMs: [5000, 15000] }
  fallback: cloud->local | local->cached | none (declarar!)
  on_error_user_msg: "Texto PT-BR mostrado ao Roldao"
```

**Hook `require-timeout-on-pipeline-step.js`** — passo sem campo `timeout` explicito → exit 2.

**Hook `block-empty-catch.js` reforcado pra pipelines** — detectar `catch (err) { logger.warn(err); /* continua sem propagar */ }` (silenciamento via log).

**Agente `sre-on-call` (Marcos) + skill `desenhar-runbook-pipeline`** — runbook com: gatilhos de stall, ordem de degradacao, criterio de "matar pipeline", canal de notificacao.

**Padrao "erro de pipeline em PT-BR":** classe base obrigando `userMessagePtBr`. Hook `enforce-user-message-on-pipeline-error.js` bloqueia `throw new Error(...)` cru em pipeline. Stack trace nunca chega ao Roldao sem traducao.

---

## 10. STREAMING / UI / OBSERVABILIDADE

### Canais IPC (12+ canais `pipeline:*`)

- `pipeline:stream` — chunk granular `{projectId, phase, type: 'text'|'tool_call'|'thinking'|'done', content?, tool?}`
- `pipeline:phase-changed` — transicao de fase (running|completed|failed|skipped)
- `pipeline:metrics` — tokens/custo acumulado
- `pipeline:sprint-updated`, `pipeline:sprint-round`, `pipeline:sprints-loaded`
- `pipeline:agent-completed`, `pipeline:stalled`, `pipeline:error`, `pipeline:auth-required`
- `pipeline:document-updated`, `pipeline:project-updated`, `pipeline:notes-updated`

**Broadcast helper:** `emitIPC(channel, payload)` faz `BrowserWindow.getAllWindows() → webContents.send()`, idempotente.

**Preload** expoe `window.lionclaw.pipeline.{invoke...}` + `on*(handler) → unsubscribe`. Renderer NUNCA toca `ipcRenderer` diretamente.

### Subscricao no React

Centralizada em `src/stores/pipeline-store.ts:1331` (zustand). Um subscribe por canal alimenta dois stores irmaos:
- `pipeline-store` (persistido) — ciclo de vida, fases, metrics agregadas
- `pipeline-runtime-store` (volatil) — streams ao vivo, tokens, audit agents. Map por projeto, **GC LRU em 20 entries**, hot path muta Map em vez de clonar (evita 50-200MB de churn por sprint)

### UI Components

| Componente | Funcao |
|---|---|
| `PipelinePage.tsx` | Container raiz |
| `ActivePipelineView.tsx` | Layout do projeto ativo |
| `PipelineProgressBar.tsx` | Barra de fases com stages + connectors + tooltip de metrics |
| `PipelineStreamView.tsx` | Stream ao vivo (texto + tool calls colapsaveis) |
| `PipelineChatView.tsx` | Conversa por fase |
| `PipelineMetricsFooter.tsx` | Footer fixo: tokens/custo/timer |
| `PipelineMetricsReport.tsx` | Relatorio consolidado pos-execucao |
| `PipelinesActiveSidebar.tsx` | Lista de pipelines em paralelo |

### Metricas exibidas (ricas)

- **Custo USD** (`formatCost` — `$0.001` ou `0.30c` pra sub-centavo)
- **Duracao** (`formatMs` — `ms / s / m s`)
- **Input/Output tokens** + `formatTokens` 1.2K/1.2M
- **Cache read/creation tokens**
- **Tool uses count**
- **Model name por fase**
- **Timer ao vivo** H:MM:SS no footer
- **Round counter** + nome do agente atual

### Cancelamento

- API: `window.lionclaw.pipeline.abort(projectId)` → IPC `pipeline:abort`
- UI: botao com `aria-busy={submitting}` + `disabled` durante a Promise
- **Limitacoes:** sem feedback "abortando..." aria-live, sem timeout visivel, sem cancelar fase unica (aborta projeto inteiro)

### BURACOS DE OBSERVABILIDADE

- **Zero `aria-live`** em qualquer view de pipeline. Unico `role="alert"` e no banner de fase fora do range. **Screen reader nao anuncia mudanca de fase, conclusao de agente, erro**
- Nenhum `aria-busy` no container de stream — so nos botoes
- Erros chegam como string crua (`pipeline:error.error`) — sem traducao para PT-BR claro/causa/proximo passo
- Sem export estruturado de timeline (JSON/CSV de eventos)

### Pro framework

**Template `templates/components/PipelineDashboard.tsx.example`** — replicar pattern:
- 3 zonas: barra de fases, stream view, footer metrics
- Subscribe em IPC events via store dedicado (nao dentro do componente)
- Hook `useActiveRuntimeState` separa store persistido vs volatil

**Skill `gerar-painel-pipeline-pt-br`** — componente acessivel:
- `<section aria-live="polite" aria-busy={isStreaming}>` no container de stream
- `aria-label="Fase X de N: <nome>"` no progress bar
- Status PT-BR (`pending`→"Aguardando", `running`→"Em andamento", `completed`→"Concluido", `failed`→"Falhou", `skipped`→"Pulado")
- Anuncio de transicao via region polite com texto traduzido

**Hook `require-aria-live-on-pipeline-stream.js`** — PostToolUse em `.tsx` que toca canal `pipeline:stream`, verifica presenca de `aria-live` / `role="status"`. Sem isso → block JSON.

**Traducao automatica de erro** (integrar com `tech-writer` Camila modo MSG): receber `pipeline:error.error` cru → expandir em:
```
SINTOMA: <visivel>
CAUSA: <1 frase PT-BR>
JA FEITO: <retry automatico?>
PROXIMO: <acao do usuario>
```
Componente `PipelineErrorBanner` consome esse formato.

**Metricas obrigatorias por fase (template observability):**
- `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheCreationTokens`
- `costUsd` acumulado + delta da fase
- `durationMs` (start/end timestamps)
- `model` por fase
- `toolUses` count
- `roundNumber` + `agentId` quando ha loop
- Persistir em `pipeline-state.json` no diretorio `.specify/runtime/<feature>/metrics.json`

---

## 11. MIGRATIONS v50..v71 — drift estrutural (BONUS)

### Tabela resumo (20 migrations)

| Migration | Tipo | DDL real? | Conteudo | Rollback | Teste |
|---|---|---|---|---|---|
| v50-prompts | **prompt** | nao | UPDATE system_prompt de 3 agentes | nao | helper |
| v53-architecture-review | seed+prompt | nao | INSERT OR IGNORE de 4 agentes | nao | nao |
| v54-triage-meta-exclusions | **prompt** | nao | UPDATE system_prompt do triage | nao | helper |
| v55-arch-mapper-layers | **prompt** | nao | UPDATE system_prompt do mapper | nao | helper |
| v56-interviewer-strict-format | **prompt** | nao | UPDATE system_prompt do interviewer | nao | helper |
| v57-drop-token-usage | **schema** | DROP TABLE + 3 indices | — | nao | nao |
| v58-runtime-used-codex | semantica | `SELECT 1` decorativo | aceita 'codex' em runtime | nao | nao |
| v59-sprints-aborted-check | **schema** (CHECK) | table-recreate FK off+on | expande CHECK status | nao | nao |
| v60-prompts-onda4 | **prompt** | nao | UPDATE 5 agentes | nao | helper |
| v61-agent-models | **modelo** | nao | UPDATE model de 13 agentes | nao | nao |
| v62-agent-models-realign | **modelo (fix v61)** | nao | re-UPDATE alias-aware + 5 extras | nao | nao |
| v63-documentation-pipeline | seed (no-op inicial) | nao | INSERT OR IGNORE doc-* (array vazio) | nao | nao |
| v64-doc-agents-tools-fix | **parametro (fix v63)** | nao | UPDATE allowed_tools de 14 agentes | nao | nao |
| v65-fk-cascade-and-checks | **schema** | table-recreate FK + CHECK + FTS | — | nao | nao |
| v66-agent-params-realign | **parametro** | nao | UPDATE effort/thinking/budget/turns/model de ~17 agentes | nao | nao |
| v67-prompts-onda7 | **prompt** | nao | UPDATE system_prompt de 15 agentes | nao | snapshot OLD inline ~50KB |
| v68-doc-writers-preserve-existing | **prompt** | nao | UPDATE system_prompt de 11 agentes doc-* | nao | snapshot OLD inline ~80KB |
| v69-prompts-onda8 | **conteudo** | nao | INSERT OR IGNORE em settings | nao | nao |
| v70-arch-spec-agents | seed | nao | INSERT OR IGNORE de 3 agentes | manual | nao |
| v71-arch-mapper-thinking | **parametro** | nao | UPDATE thinking_budget 8000→12000 (1 agente) | manual | nao |

### Ratio estrutural vs conteudo

- **DDL real (schema):** 3/20 = **15%** (v57, v59, v65)
- **Seed/INSERT de agente novo:** 3/20 = 15% (v53, v63, v70)
- **Conteudo puro (prompt/modelo/param):** **13/20 = 65%**
- **Semantica/no-op decorativa:** 1/20 = 5% (v58)
- **Settings:** 1/20 = 5% (v69)

**Tese confirmada com vigor:** 65% sao UPDATE em coluna de agente, ou seja, **prompt virou schema mutavel**. Somando INSERT de seed novo: **80% pipeline-related**.

### Cascatas "fix the fix" (5 casos)

1. **v61 → v62:** v61 fez `WHERE model='claude-sonnet-4-6'`; DBs antigos guardavam alias `'sonnet'` → v61 pulou esses. v62 "alias-aware" e recobre drift R10 de 5 agentes
2. **v62 → v66:** v62 so toca `model`. v66 realinha `effort/thinking/thinking_budget/max_turns`
3. **v63 → v64:** v63 inseriu 14 agentes doc-* com `allowed_tools` quebrado (sem `Write`); v64 patcheia
4. **v59 → (v59 fixed):** "Fix da V59 inicial: primeira tentativa colocou tudo num BEGIN/COMMIT sem desligar FK, e o boot do app travou em SqliteError"
5. **v67 → v69:** v69 explicitamente NAO atualiza prompts da Onda 8 (decisao de nao fazer "fix the fix" mais uma vez), deixando divida documentada

### Sinais de dor adicionais

- **Snapshots OLD inline gigantes:** v67 e v68 carregam o prompt antigo em string literal dentro do `.ts`. v68 tem **~80KB** de prompts colados como dicionario. Migration vira arquivo de 100KB+ com 5% logica e 95% fixture
- **`__VNN_INTERNAL` export-only-pra-teste** em v50/v54/v55/v56 — exporta constantes so pra teste poder importar, **mas nenhum teste de cadeia full-chain existe**
- **"R10 dupla"** citada literalmente em 9 migrations — regra "edita o `.ts` + escreve migration espelhada" e o sintoma
- **Rollback formal: 0/20**
- **Teste full-chain: 0/20**

### Pro framework

**Hook `block-prompt-in-migration.js` (TST-005):**

Bloquear (`exit 2`) qualquer arquivo em `**/db-migrations/**` ou `**/migrations/**` que contenha:
- `UPDATE\s+agents\s+SET\s+(system_prompt|prompt|instructions|description|allowed_tools|model|effort|thinking|thinking_budget|max_turns)`
- String literal > 2000 chars dentro do arquivo de migration (heuristica pra detectar prompt embutido)
- Import de `seed-agents/*` em arquivo cujo nome bate `v\d+-(prompts|agents|.*-onda\d+|.*-realign|.*-preserve-existing|.*-models|.*-params|.*-tools-fix).*`

Mensagem PT-BR: *"Migration parece estar versionando conteudo de agente (prompt/modelo/parametro). Conteudo de agente e codigo-fonte, nao schema — versione no `.ts` em `seed-agents/` e use boot-time reconcile, nao migration. Ver ADR-NNN."*

**Skill `extrair-prompt-de-migration` (refactor automatizado):**

1. Detecta o ID do agente (`WHERE id = 'foo'`)
2. Extrai a string literal do prompt
3. Cria/atualiza `seed-agents/<id>.ts` com prompt versionado
4. Reescreve a migration pra apenas chamar `reconcileSeedAgent(db, fooSeed)` — ou remove e bumpa `schema_version` no boot
5. Gera teste validando que `.ts` corresponde ao prompt esperado

CLI: `npx roldao-method extract-prompt-migration <path/to/migration.ts>`.

**Padrao arquitetural a documentar:**

> **"Migration = mudanca estrutural. Prompt/parametro de agente = codigo-fonte versionado no `.ts`, aplicado por reconcile no boot."**

**Criterio de decisao:**
- **E migration** se: DDL (CREATE/DROP/ALTER/CHECK), backfill cross-coluna, mudanca de invariante, drop de dado
- **NAO e migration** se: muda string de prompt, troca modelo de agente, ajusta `thinking_budget`, conserta `allowed_tools` — isso vai pro `.ts` + reconciler INSERT-or-UPDATE consciente

**Hook `require-migration-test-fullchain.js`** — migration nova sem arquivo-irmao `*.test.ts` que importe `applyMigrationVNN` e rode contra DB efemero in-memory → warning soft.

**ADR sugerido `ADR-NNN-prompts-fora-da-migration.md`** — template completo no arquivo companion `2026-05-26-licoes-do-lionclaw.md`.

---

## 12. CONSOLIDADO: NOVOS HOOKS PROPOSTOS NESTA AUDITORIA (16)

| # | Hook | ID/Regra | Bloqueia |
|---|---|---|---|
| 1 | `block-doc-overwrite-without-diff.js` | INV-007 | Write em `docs/**` pre-existente com diff > 30% sem confirmacao |
| 2 | `enforce-read-before-write-doc.js` | INV-007 | Write em doc sem ter chamado Read antes na mesma sessao |
| 3 | `block-phase-number-dispatch.js` | INV-009 | >5 ramos `phaseNumber === N` no mesmo arquivo |
| 4 | `require-structured-phase-output.js` | INV-011 | Marker string `[PHASE_COMPLETE]` em vez de JSON estruturado |
| 5 | `enforce-audit-iteration.js` | INV-AGENT-007 | Commit com `riscos_novos != 0` no ultimo round |
| 6 | `require-watchdog-on-agent-spawn.js` | INV-AGENT-008 | Spawn de agente IA sem AbortController + watchdog |
| 7 | `require-permission-profile.js` | SEC-007 | `dangerouslySkipPermissions:true` literal sem `// PERM-PROFILE:` declarado |
| 8 | `enforce-user-message-on-pipeline-error.js` | INV-AGENT-009 | `throw new Error()` cru em codigo de pipeline (precisa userMessagePtBr) |
| 9 | `validate-seed-agent-drift.js` | TST-006 | Mudanca em prompt body sem bump `revisado-em` no frontmatter |
| 10 | `require-pipeline-resumable.js` | INV-012 | Workflow > 5 fases sem coluna `current_phase` ou funcao `resume*` |
| 11 | `require-timeout-on-pipeline-step.js` | INV-AGENT-010 | Passo de pipeline sem campo `timeout` explicito |
| 12 | `block-empty-catch-pipeline.js` (reforco) | TST-001 | `catch { logger.warn(); }` em codigo de pipeline (silencia via log) |
| 13 | `require-aria-live-on-pipeline-stream.js` | INV-AGENT-011 | Componente `.tsx` que toca `pipeline:stream` sem `aria-live` |
| 14 | `block-prompt-in-migration.js` (reforco) | TST-005 | UPDATE em coluna de agente em migration; string > 2000 chars; nomes `*-prompts-ondaN` etc. |
| 15 | `require-migration-test-fullchain.js` | TST-006 | Migration sem arquivo-irmao `.test.ts` que aplica migration em DB efemero |
| 16 | `lgpd-pipeline-payload-reminder.js` | LGPD-011 | Criar tabela `*_messages` / `*_phase_metrics` sem `purge_after_days` configuravel |

---

## 13. CONSOLIDADO: NOVAS REGRAS COM ID (8)

| ID | Texto |
|---|---|
| **INV-008** (reforcada) | Orquestrador ≤ 500 linhas por arquivo (god-class de 8198 e prova) |
| **INV-009** | Logica de fase mora junto da fase (proibido despacho `phaseNumber === N` espalhado em >5 ramos) |
| **INV-010** | Workflow e dado + funcao (registry carrega `handler` junto do metadado, nao so metadado) |
| **INV-011** | Saida estruturada por fase (JSON estruturado, nao marker string como `[PHASE_COMPLETE]`) |
| **INV-012** | Workflow > 5 fases exige resumability declarada (coluna `current_phase` + funcao `resume*`) |
| **INV-AGENT-008** | Spawn de agente IA exige AbortController + watchdog de inatividade |
| **INV-AGENT-009** | Erro de pipeline herda de classe base com `userMessagePtBr` (stack trace nunca chega ao usuario) |
| **INV-AGENT-010** | Passo de pipeline declara `timeout` explicito |
| **INV-AGENT-011** | Componente que renderiza stream de pipeline tem `aria-live` |
| **SEC-007** | `dangerouslySkipPermissions:true` so via perfil declarado (proibido hardcoded) |
| **TST-006** | Migration nova exige teste full-chain (aplicar em DB efemero in-memory) |

---

## 14. CONSOLIDADO: NOVAS SKILLS (10)

1. **`gerar-workflow-roldao`** — template de pipeline declarativo (registry com `handler` junto)
2. **`gerar-pipeline-com-checkpoint-sqlite`** — 3 tabelas (runs/phases/messages) + UPSERT + resume
3. **`gerar-pipeline-resiliente`** — template com timeout/watchdog/retry/fallback/userMsg declarados
4. **`gerar-agent-executor`** — scaffold polimorfico (strategy + discriminated union)
5. **`gerar-seed-agent`** — `.claude/agents/<id>.md` + entrada registry + teste de drift (consistencia triple)
6. **`gerar-mcp-local-electron`** — template completo McpServer + watchdog + killProcessTree Windows
7. **`gerar-doc-com-preservacao`** — template de doc-writer que respeita conteudo existente
8. **`gerar-relatorio-auditoria-multinivel`** — normaliza achados pro esquema Cn/An/Mn/Bn/Gn/Rn/ALT-n
9. **`gerar-painel-pipeline-pt-br`** — componente acessivel (aria-live + status PT-BR + traducao de erro)
10. **`extrair-prompt-de-migration`** — refactor automatizado: migration → `seed-agents/<id>.ts`
11. **`desenhar-runbook-pipeline`** (pareia com Marcos) — runbook com stall/degradacao/criterio matar

---

## 15. CONSOLIDADO: NOVOS TEMPLATES (7)

| Template | Origem |
|---|---|
| `templates/workflows/<nome>.ts.example` | `pipeline-engine/registry/*` |
| `templates/db/schema-pipeline-state.sql` | `harness_projects` + `pipeline_phase_metrics` + `pipeline_messages` |
| `templates/components/PipelineDashboard.tsx.example` | `PipelineStreamView` + `PipelineProgressBar` + `PipelineMetricsFooter` |
| `templates/seed-agent.ts.example` | `seed-agents/electron-pro.ts` + `_shared/` |
| `templates/auditoria.md` | Formato Cn/An/Mn/Bn/Gn/Rn/ALT-n com frontmatter `round`+`parent-audit` |
| `templates/docs/ADR-pipeline-resumability.md` | Novo |
| `templates/docs/ADR-prompts-fora-da-migration.md` | Novo |

---

## 16. CONSOLIDADO: NOVOS AGENTES (3)

| Agente | Persona | Gatilho |
|---|---|---|
| **`documentation-master`** | (novo) | `/documentar-repo` — 23 fases, gera doc retroativa de repo brownfield |
| **`architecture-decision-interviewer`** | (apoio do tech-lead Rafael) | Quando ADR ainda nao tem decisao tomada — conversa guiada com Roldao |
| **`harness-evaluator`** | (apoio do revisor Ines) | Gates iterativos no MEIO do pipeline (nao so pos-fato como hoje) |

`resolution-tracker` cabe como skill, nao agente.

---

## 17. ROADMAP DE IMPLEMENTACAO (4 Ondas — substitui o roadmap anterior)

### Onda 1 — Fundacao de pipeline (3-5 dias)

- Skill `gerar-workflow-roldao` (registry declarativo + handler junto)
- Skill `gerar-pipeline-com-checkpoint-sqlite` + template `schema-pipeline-state.sql`
- Skill `gerar-pipeline-resiliente` (timeout/watchdog/retry/fallback/userMsg)
- Hooks INV-009, INV-010, INV-011, INV-012 (fase mora junto, workflow=dado+funcao, output estruturado, resumability)
- Reforco INV-008 (≤500 linhas em orquestrador)
- Atualizar `REGRAS-INEGOCIAVEIS.md` com 8 IDs novos

### Onda 2 — Agente IA seguro (3-5 dias)

- Skill `gerar-agent-executor` (polimorfico)
- Skill `gerar-seed-agent` (consistencia triple: arquivo+registry+teste)
- Hook `validate-seed-agent-drift.js` (compara frontmatter + hash do prompt)
- Hook `require-watchdog-on-agent-spawn.js` (INV-AGENT-008)
- Hook `require-permission-profile.js` (SEC-007)
- Hook `enforce-user-message-on-pipeline-error.js` (INV-AGENT-009)
- Hook `require-timeout-on-pipeline-step.js` (INV-AGENT-010)
- Hook `block-empty-catch-pipeline.js` reforcado
- Template `seed-agent.ts.example` com `_shared/` PT-BR + REGRA #0

### Onda 3 — Auditoria iterativa + doc (3-5 dias)

- Workflow `/auditoria-iterativa` (3 rounds + meta-auditor + tabela opcional `audit_round`)
- Hook `enforce-audit-iteration.js` (INV-AGENT-007 — riscos_novos==0 antes do commit)
- Skill `gerar-relatorio-auditoria-multinivel`
- Template `auditoria.md` com formato Cn/An/Mn/Bn/Gn/Rn/ALT-n
- Workflow `/documentar-repo` (novo command, 23 fases adaptadas — opcional Onda 3.1)
- Agente `documentation-master`
- Skill `gerar-doc-com-preservacao` (5 stages, anti-symlink, UTF-8-safe)
- Hook `block-doc-overwrite-without-diff.js` (INV-007 refinada)
- Hook `enforce-read-before-write-doc.js`

### Onda 4 — UI acessivel + MCP + retencao (3-5 dias)

- Template `PipelineDashboard.tsx.example`
- Skill `gerar-painel-pipeline-pt-br` (aria-live, status PT-BR, traducao de erro)
- Hook `require-aria-live-on-pipeline-stream.js`
- Skill `gerar-mcp-local-electron` (template completo + watchdog Windows)
- Hook `mcp-validator.js` reforcado (smoke-test `tools/list`)
- ADR "Skills do ROLDAO-METHOD expostas como MCP via servidor `skills` embarcado"
- Hook `lgpd-pipeline-payload-reminder.js` (LGPD-011 — `purge_after_days`)
- Skill `extrair-prompt-de-migration` + hook `block-prompt-in-migration.js` reforcado
- Hook `require-migration-test-fullchain.js` (TST-006)

---

## 18. ARQUIVOS-EVIDENCIA (paths absolutos)

### Pipelines e engine
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts` (8198 linhas)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/types.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/registry/{index,development,security,feature,architecture-review,documentation}.ts`
- `C:/PROJETOS/lionclawv1.0/src/types/pipeline.ts` (linhas 94-217 — `PhaseDefinition` + arrays canonicos)
- `C:/PROJETOS/lionclawv1.0/src/components/pipeline/NewPipelineModal.tsx`
- `C:/PROJETOS/lionclawv1.0/electron/main/ipc/pipeline.ts`

### Pipeline documentation (incidente)
- `C:/PROJETOS/lionclawv1.0/auditoria-pipeline-documentation.md`
- `C:/PROJETOS/lionclawv1.0/plano-fix-pipeline-documentation.md`
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts:6280-6500` (fase 21 + handlers)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-shared/doc-existing-reader.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/db-migrations/v68-doc-writers-preserve-existing.ts`

### Harness
- `C:/PROJETOS/lionclawv1.0/electron/main/db.ts:347-410` (schema)
- `C:/PROJETOS/lionclawv1.0/electron/main/harness-engine.ts:1384-1681` (loop coder/evaluator + max_rounds_exhausted)
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/architecture-diagnostician.ts`
- `C:/PROJETOS/lionclawv1.0/PLANO-ARCHITECTURE-REVIEW.md`
- `C:/PROJETOS/lionclawv1.0/auditoria-do-plano.md`

### Agent runtime
- `C:/PROJETOS/lionclawv1.0/electron/main/agent-runtime/{execute,types,watchdog,permission-profiles,cloud-executor,local-executor,external-executor,codex-executor}.ts`

### Seed agents
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/index.ts` (370 linhas — agrupamento)
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/ensure.ts` (reconcile + snapshot)
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/electron-pro.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/harness-planner.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/seed-agents/_shared/{language-pt-br,critical-rules,git-restrictions}.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/__tests__/seed-agents-r10-drift.test.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/db/repositories/agents.ts:213` (`reconcileSeedAgent` insert-only)

### MCP
- `C:/PROJETOS/lionclawv1.0/mcp-servers/memory-search/src/index.ts` (510 linhas — referencia)
- `C:/PROJETOS/lionclawv1.0/mcp-servers/skills/src/index.ts` (meta-MCP)
- `C:/PROJETOS/lionclawv1.0/mcp-servers/local-agents/src/index.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/mcp-manager.ts` (spawn + watchdog + crash recovery)
- `C:/PROJETOS/lionclawv1.0/electron/main/mcp-tool-bridge.ts` (JSON-RPC stdio)

### Persistencia
- `C:/PROJETOS/lionclawv1.0/electron/main/db.ts:347-622` (tabelas raiz)
- `C:/PROJETOS/lionclawv1.0/electron/main/db/migrations-v32-v51.ts` (V36, V38)
- `C:/PROJETOS/lionclawv1.0/electron/main/db/repositories/pipeline.ts:131-236` (UPSERT cacheado)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts:855-970` (recoverInterrupted)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-shared/lock.ts`
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-shared/persist.ts`

### Erro/retry
- `C:/PROJETOS/lionclawv1.0/electron/main/agent-runtime/watchdog.ts` (117 linhas — referencia)
- `C:/PROJETOS/lionclawv1.0/electron/main/agent-runtime/cloud-executor.ts:140-147` (probe primeiro chunk)
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-engine/index.ts:502, 1781-1815, 1859-1874` (MAX_STALLS, erros tipados, IPC)
- `C:/PROJETOS/lionclawv1.0/electron/main/index.ts:74-92` (uncaughtException)

### Streaming/UI
- `C:/PROJETOS/lionclawv1.0/electron/main/pipeline-shared/ipc-emitter.ts`
- `C:/PROJETOS/lionclawv1.0/electron/preload/index.ts:423-595`
- `C:/PROJETOS/lionclawv1.0/src/stores/pipeline-store.ts:1331`
- `C:/PROJETOS/lionclawv1.0/src/stores/pipeline-runtime-store.ts`
- `C:/PROJETOS/lionclawv1.0/src/components/pipeline/{PipelineStreamView,PipelineProgressBar,PipelineMetricsFooter,PhaseActionButtons}.tsx`

### Migrations
- `C:/PROJETOS/lionclawv1.0/electron/main/db-migrations/v50-prompts.ts` ate `v71-arch-mapper-thinking.ts` (20 migrations)
- Maiores em conteudo (>50KB): `v67-prompts-onda7.ts`, `v68-doc-writers-preserve-existing.ts`
- Cascatas: v61→v62→v66, v63→v64

---

_Fim da auditoria. Companion: `2026-05-26-licoes-do-lionclaw.md` (analise geral nao-focada em pipelines)._
