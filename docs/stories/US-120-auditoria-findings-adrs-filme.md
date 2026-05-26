---
tipo: story
id: US-120
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-119]
aprovacoes: []
---

# US-120 — Onda 4: Auditoria com findings rastreaveis + ADRs como filme

## Como, quero, para

**Como** Roldao rodando `/auditoria` em release importante,
**quero** rastrear cada finding ate o commit que o resolveu E ter ADRs que evoluem (nao foto estatica)
**para** parar de re-auditar a mesma coisa porque ninguem provou que foi resolvido + parar de operar com 22 ADRs sem saber qual ainda vale.

## Criterios de aceitacao

- **AC-120-1** — Formato `.claude/.runtime/audit-finding-{seg|qual|prod}-${SESSION}.jsonl`. Schema em `.specify/schemas/audit-finding.schema.json` (ADR-029).
- **AC-120-2** — Hook `require-findings-resolved.js` (PreToolUse Bash quando commit feat/fix) bloqueia se `status=open` && `severity=must-fix-merge`. Dev cita `Fixes: AF-001` em commit msg pra fechar.
- **AC-120-3** — Severidade em 2 tiers + 1 informativo: `must-fix-merge`, `todo-post-release`, `info`. Hook `require-tier-on-finding.js` rejeita finding sem tier.
- **AC-120-4** — Agente `audit-arbiter` novo (mediador, nao auditor). Acionado em conflito entre 2 auditores no mesmo arquivo. Produz UMA recomendacao. Nao recursivo.
- **AC-120-5** — Protocolo Sofia↔Pedro "AC contestada". Pedro escreve `docs/stories/contestacoes/US-NNN-AC-N.md` em vez de bloquear. Workflow `/replanejar` le contestacoes.
- **AC-120-6** — Auditoria incremental via `audit_sha_base`. Re-auditoria le `git diff $audit_sha_base...HEAD`. Acelera 5x re-auditoria.
- **AC-120-7** — `.claude/.runtime/audit-bias.json` acumula `{rule_id: {miss_count, last_miss_at}}`. Apos `miss_count >= 3`, auditor entra em modo rigoroso automatico.
- **AC-120-8** — Hook `require-human-release-approval.js` bloqueia `git tag` sem `.claude/.runtime/release-approval-${VERSAO}.json` preenchido. Comando `/release --aprovar v3.0.0` cria.
- **AC-120-9** — `/auditoria --coach` modo coach: saida adaptada com "Por que e ruim / Como arrumar / Por que resolve". Reaproveita skill `traduzir-jargao`.
- **AC-120-10** — Workflow `/auditoria-iterativa` novo (alem do `/auditoria` existente). 3 rounds max + criterio `riscos_novos == 0`. Hook `enforce-audit-iteration.js`. Tabela opcional `audit_round` em `audit-rounds-${SESSION}.jsonl`.
- **AC-120-11** — ADR ganha campos `superseded-by` + `supersedes`. Hook `validate-adr-graph.js` valida bidirecionalidade. Skill `gerar-adr-pt-br --supersede ADR-NNN`.
- **AC-120-12** — `docs/decisions/notas/DN-NNN-*.md` (ADR-Lite). Template ≤30 linhas. Comando `/dn <titulo>`. Regra de promocao: 3 DNs do mesmo dominio = Otavio propoe ADR.
- **AC-120-13** — `.claude/adr-triggers.yml` (versionado) lista areas sensiveis. Hook `require-adr-on-sensitive-area.js`.
- **AC-120-14** — Hook `adr-stale-reminder.js` (soft warning UserPromptSubmit). ADR >180 dias sem revisao. Workflow `/adr-review <ADR-NNN>`.
- **AC-120-15** — Comando `/adr-mapa` gera `docs/decisions/MAPA.md` auto agrupando por dominio + linhagem.

## Non-goals

- NAO substituir auditores existentes — `audit-arbiter` so entra em CONFLITO
- NAO migrar ADRs antigos pra `superseded-by` automaticamente — preenchimento manual conforme casos surgem
- NAO criar meta-auditor recursivo — INV-AGENT-007 bloqueia
- NAO matar `/auditoria` one-shot — coexistencia com `/auditoria-iterativa`

## Contexto tecnico

- **ADRs bloqueantes:** ADR-028 (DN-NNN), ADR-029 (audit_findings)
- **Arquivos afetados:** ~10 hooks novos, 1 agente novo (`audit-arbiter`), 4 comandos novos, 1 template ADR-extension

## Tasks

- [ ] **T-120-001** — Schema `.specify/schemas/audit-finding.schema.json`
- [ ] **T-120-002** — Estender prompts de Caio/Julia/Pedro pra emitir findings JSONL
- [ ] **T-120-003** — Hook `require-findings-resolved.js`
- [ ] **T-120-004** — Hook `require-tier-on-finding.js`
- [ ] **T-120-005** — Agente `audit-arbiter`
- [ ] **T-120-006** — Estender workflow `/auditoria` pra acionar arbiter em conflito
- [ ] **T-120-007** — Protocolo Sofia↔Pedro: pasta `docs/stories/contestacoes/` + estender `validate-story-approvals.js`
- [ ] **T-120-008** — Estender markers de auditor com `audit_sha_base`
- [ ] **T-120-009** — `.claude/.runtime/audit-bias.json` + logica de "modo rigoroso"
- [ ] **T-120-010** — Hook `require-human-release-approval.js` + comando `/release --aprovar`
- [ ] **T-120-011** — `/auditoria --coach` (estender command + integrar skill `traduzir-jargao`)
- [ ] **T-120-012** — Workflow `/auditoria-iterativa` + hook `enforce-audit-iteration.js`
- [ ] **T-120-013** — ADR template ganha campos `superseded-by`/`supersedes`; hook `validate-adr-graph.js`; skill `gerar-adr-pt-br --supersede`
- [ ] **T-120-014** — DN-NNN template + skill `gerar-decision-note-pt-br` + comando `/dn`
- [ ] **T-120-015** — `.claude/adr-triggers.yml` + hook `require-adr-on-sensitive-area.js`
- [ ] **T-120-016** — Hook `adr-stale-reminder.js` + workflow `/adr-review`
- [ ] **T-120-017** — Comando `/adr-mapa` + skill `gerar-mapa-adr`

## Testes esperados

- **Unitario:** schema validacao; arbiter resolvendo conflito sintetico; adr-graph bidirecional
- **Integracao:** `/auditoria` produz 3 findings JSONL; commit citando `Fixes: AF-001` muda status; `/dn` gera DN-001 valida; `/adr-mapa` lista ADRs por dominio
- **Regressao:** `/auditoria` one-shot continua funcionando; auditor sem prompt atualizado nao gera findings mas tambem nao quebra

## Regulamentacao BR aplicavel

- **LGPD-004** — `descricao_pt_br` de finding nao contem PII
- **INV-AGENT-005** — `/release --aprovar` exige sinatura humana
- **ADR-031** — `/auditoria` antigo + `/auditoria-iterativa` novo coexistem

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 4) |
