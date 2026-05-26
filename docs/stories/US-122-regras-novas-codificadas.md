---
tipo: story
id: US-122
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-119]
aprovacoes: []
---

# US-122 — Onda 6: Regras INV/SEC/TST/LGPD codificadas em hook

## Como, quero, para

**Como** Roldao querendo que o framework prove proativamente as licoes catalogadas nas 3 analises de 2026-05-26,
**quero** todos os 17 IDs novos codificados em REGRAS-INEGOCIAVEIS.md + hook bloqueador correspondente
**para** evitar que projeto novo passe pelas mesmas dores diagnosticadas no lionclaw + no fluxo interno.

## Criterios de aceitacao

- **AC-122-1** — `REGRAS-INEGOCIAVEIS.md` ganha **INV-007** (Geracao automatica em path do usuario exige confirmacao + diff). Hooks `block-doc-overwrite-without-diff.js` + `enforce-read-before-write-doc.js` + `block-overwriting-user-docs.js`.
- **AC-122-2** — **INV-008** reforcada (warn 1500 linhas, block 3000 sem ADR; orquestrador ≤500). Hook `block-god-file.js`.
- **AC-122-3** — **INV-009** (Logica de fase mora junto da fase). Hook `block-phase-number-dispatch.js`.
- **AC-122-4** — **INV-010** (Workflow e dado + funcao). Soft warning em registry sem `handler`.
- **AC-122-5** — **INV-011** (Saida estruturada por fase). Hook `require-structured-phase-output.js`.
- **AC-122-6** — **INV-012** (Workflow > 5 fases exige resumability). Hook `require-pipeline-resumable.js`.
- **AC-122-7** — **INV-AGENT-007** (Max 2 rodadas de auditoria antes de escalar). Hook `enforce-audit-iteration.js` (ja em AC-120-10).
- **AC-122-8** — **INV-AGENT-008** (Spawn de agente IA exige AbortController + watchdog). Hook `require-watchdog-on-agent-spawn.js`.
- **AC-122-9** — **INV-AGENT-009** (Erro de pipeline com `userMessagePtBr`). Hook `enforce-user-message-on-pipeline-error.js`.
- **AC-122-10** — **INV-AGENT-010** (Passo de pipeline declara `timeout` explicito). Hook `require-timeout-on-pipeline-step.js`.
- **AC-122-11** — **INV-AGENT-011** (Componente de stream de pipeline tem `aria-live`). Hook `require-aria-live-on-pipeline-stream.js`.
- **AC-122-12** — **SEC-006** (Working tree sem `.tmp*`, `*.snapshot`, `*.bak`, `*.log` >1MB nao gitignored). Hook `block-tmp-log-in-tree.js`.
- **AC-122-13** — **SEC-007** (`dangerouslySkipPermissions:true` so via perfil declarado). Hook `require-permission-profile.js`.
- **AC-122-14** — **SEC-008** (Comando restrito por agente via frontmatter `restricted-to:`). Hook `enforce-command-permissions.js` (opt-in, default permissivo — preservacao).
- **AC-122-15** — **TST-005** (Orcamento de skip + prompt nunca em migration). Hooks `skip-budget-validator.js` + `block-prompt-in-migration.js`.
- **AC-122-16** — **TST-006** (Migration nova exige teste full-chain + seed-agent drift compara TODOS os campos). Hook `require-migration-test-fullchain.js` + reforco em `validate-seed-agent-drift.js`.
- **AC-122-17** — **LGPD-011** (Mascaramento em log livre + retencao em `*_messages`/`*_phase_metrics`). Hooks `block-pii-in-audit-log.js` + `lgpd-pipeline-payload-reminder.js`.
- **AC-122-18** — Reforco do `anti-mascaramento.js` existente (NAO substitui): pega expect tautologico alem dos padroes ja cobertos. Allowlist por path: `docs/analises/**`, `docs/auditorias/**`, `docs/decisions/ADR-*.md`, `templates/**.example`.
- **AC-122-19** — `.claude/rules/roldao-method.md` ganha tabela atualizada hook→regra com TODOS os IDs novos. Origens preenchidas (AC-121-2).

## Non-goals

- NAO mexer em regras existentes INV-001..006 (intactas, ADR-031)
- NAO ligar hook em modo block antes de 1 release com modo warning (preservacao + ciclo de deprecation)
- NAO codificar regras BR especificas neste US (estao em addons existentes)

## Contexto tecnico

- **Depende de:** US-117 (manifest de hook), US-119 (pipeline state pra varios hooks consultarem)
- **Arquivos afetados:** REGRAS-INEGOCIAVEIS.md (17 IDs novos), `.claude/hooks/` (~16 hooks novos + reforco em 1), `.claude/rules/roldao-method.md`

## Tasks (1 task por hook + 1 pra REGRAS + 1 pra rules)

- [ ] **T-122-001** — Atualizar REGRAS-INEGOCIAVEIS.md com 17 IDs novos + `origem:` em cada (referenciando arquivos de analise)
- [ ] **T-122-002** — Hook `block-doc-overwrite-without-diff.js` (INV-007)
- [ ] **T-122-003** — Hook `enforce-read-before-write-doc.js` (INV-007)
- [ ] **T-122-004** — Hook `block-overwriting-user-docs.js` (INV-007)
- [ ] **T-122-005** — Hook `block-god-file.js` (INV-008)
- [ ] **T-122-006** — Hook `block-phase-number-dispatch.js` (INV-009)
- [ ] **T-122-007** — Hook `require-structured-phase-output.js` (INV-011)
- [ ] **T-122-008** — Hook `require-pipeline-resumable.js` (INV-012)
- [ ] **T-122-009** — Hook `require-watchdog-on-agent-spawn.js` (INV-AGENT-008)
- [ ] **T-122-010** — Hook `enforce-user-message-on-pipeline-error.js` (INV-AGENT-009)
- [ ] **T-122-011** — Hook `require-timeout-on-pipeline-step.js` (INV-AGENT-010)
- [ ] **T-122-012** — Hook `require-aria-live-on-pipeline-stream.js` (INV-AGENT-011)
- [ ] **T-122-013** — Hook `block-tmp-log-in-tree.js` (SEC-006)
- [ ] **T-122-014** — Hook `require-permission-profile.js` (SEC-007)
- [ ] **T-122-015** — Hook `enforce-command-permissions.js` (SEC-008, opt-in)
- [ ] **T-122-016** — Hook `skip-budget-validator.js` (TST-005)
- [ ] **T-122-017** — Hook `block-prompt-in-migration.js` (TST-005)
- [ ] **T-122-018** — Hook `require-migration-test-fullchain.js` (TST-006)
- [ ] **T-122-019** — Reforcar `validate-seed-agent-drift.js` (TST-006)
- [ ] **T-122-020** — Hook `block-pii-in-audit-log.js` (LGPD-011)
- [ ] **T-122-021** — Hook `lgpd-pipeline-payload-reminder.js` (LGPD-011, soft warning)
- [ ] **T-122-022** — Reforco do `anti-mascaramento.js` com allowlist por path (AC-122-18)
- [ ] **T-122-023** — Atualizar `.claude/rules/roldao-method.md` com tabela hook→regra completa

## Testes esperados

- **Unitario:** cada hook novo com `__tests__/hook-<id>.test.js` (3 casos: deve bloquear, nao deve bloquear, degenerado)
- **Integracao:** rodar fluxo de cada regra e ver bloqueio em modo block (v3.1.0)
- **Regressao:** suite `__tests__/regressao-v2-hooks.test.js` confirma que hooks existentes continuam bloqueando

## Regulamentacao BR aplicavel

- Todos os IDs introduzidos referenciados acima
- **ADR-031** — modo soft warning v3.0.0, block v3.1.0 honra ciclo de deprecation reverso

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 6) |
