---
tipo: story
id: US-124
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-120]
aprovacoes: []
---

# US-124 — Onda 8: Workflow `/documentar-repo` + agente documentation-master

## Como, quero, para

**Como** Roldao herdando ou retomando projeto brownfield sem documentacao,
**quero** rodar `/documentar-repo` e ter PRD retroativo + ADRs extraidos + SCHEMA/API/TYPES + README + RUNBOOK + ONBOARDING + CLAUDE.md gerados em 1 sessao
**para** ter doutrina capturada em vez de codigo orfao — SEM sobrescrever doc existente nunca.

## Criterios de aceitacao

- **AC-124-1** — Agente `documentation-master` em `.claude/agents/documentation-master.md`. Orquestrador. Gatilho: `/documentar-repo`. Coordena 23 fases em 7 stages (Scan→Triage→Architecture→Schema→Modules→Docs→Finalization).
- **AC-124-2** — Comando `/documentar-repo` novo. Etapas: (1) Scan: profila repo + git log + inventaria docs; (2) Triage: PRD retroativo + revisao; (3) Architecture: doc + ADRs extraidos; (4) Schema: SCHEMA/API/TYPES; (5) Modules: pool paralelo de 3 workers; (6) Docs: README + RUNBOOK + ONBOARDING + USER_GUIDE; (7) Finalization: INDEX + CLAUDE.md + Skeptic.
- **AC-124-3** — **TODA escrita em `docs/` do usuario passa por 4 stages obrigatorios:** Stage 1 staging em `.specify/runs/documentation-<runId>/`; Stage 2 engine calcula `PublishPlan` com `action: create|overwrite|identical` + diff; Stage 3 confirmacao humana arquivo-a-arquivo via `/documentar-repo --publicar`; Stage 4 apply com lock + manifest tracking. **Auto-publish proibido por arquitetura** (codifica INV-007).
- **AC-124-4** — Skill `gerar-doc-com-preservacao`: (1) buscar doc equivalente em candidates; (2) ler integralmente truncando 40KB UTF-8-safe via `StringDecoder`; (3) anti-symlink (`realpath` dentro de `projectRoot`); (4) output em diff; (5) marcar secoes `[novo]`, `[atualizado]`, `[preservado]`, `[deprecated]`.
- **AC-124-5** — Hook `block-doc-overwrite-without-diff.js` (ja em AC-122-2): path `docs/**` + arquivo existe + diff > 30% sem flag explicita = exit 2.
- **AC-124-6** — Hook `enforce-read-before-write-doc.js` (ja em AC-122-3): Write em `docs/X.md` sem Read previo na sessao = exit 2.
- **AC-124-7** — `docs/internal/` opcional adotado como padrao em projeto novo (`audit-log.md`, `tech-debt.md`, `core-systems.md`, `pipelines.md`, `file-map.md`, `contributing-pipeline.md`, `glossary.md`). Templates em `templates/docs/internal/*`. Distincao: `docs/internal/` doutrina perene; `docs/<artefato>/` artefato de pipeline.
- **AC-124-8** — Limite explicito: codebase com > 50k arquivos rastreaveis por `git ls-files` → workflow emite erro PT-BR sugerindo `/documentar-repo --area src/` (subset).

## Non-goals

- NAO substituir `/brownfield` existente (continua valido pra adocao incremental — ADR-031)
- NAO migrar projetos antigos pra docs/internal/ (so disponibilizar template)
- NAO suportar codebase > 50k arquivos (limite declarado)
- NAO entregar version offline (depende de Claude SDK pra escrever conteudo)

## Contexto tecnico

- **ADRs bloqueantes:** ADR-031 (preservacao), AC-122-2 e AC-122-3 ja entregam hooks
- **Depende de:** US-120 (audit findings — `doc-skeptic` consome)
- **Arquivos afetados:** 1 agente novo, 1 comando novo, 1 skill nova, 7 templates de doc internal, 1 schema staging

## Tasks

- [ ] **T-124-001** — Agente `documentation-master` em `.claude/agents/documentation-master.md`
- [ ] **T-124-002** — Comando `/documentar-repo` em `.claude/commands/documentar-repo.md`
- [ ] **T-124-003** — Subcomando `/documentar-repo --publicar` (apply stage)
- [ ] **T-124-004** — Subcomando `/documentar-repo --area <subpath>` (escopo reduzido)
- [ ] **T-124-005** — Skill `gerar-doc-com-preservacao` (5 stages)
- [ ] **T-124-006** — Helper `tools/doc-existing-reader.js` (anti-symlink + UTF-8-safe truncation)
- [ ] **T-124-007** — Schema `.specify/schemas/publish-plan.schema.json`
- [ ] **T-124-008** — Templates `templates/docs/internal/{audit-log,tech-debt,core-systems,pipelines,file-map,contributing-pipeline,glossary}.md`
- [ ] **T-124-009** — Testes integrados em sandbox brownfield (repo com docs/PRD.md existente)

## Testes esperados

- **Unitario:** `gerar-doc-com-preservacao` em 5 cenarios (doc nao existe; doc existe identico; doc existe diff <30%; doc existe diff >30%; symlink); UTF-8-safe truncation em 40KB
- **Integracao:** `/documentar-repo` em sandbox sem docs → gera 14 arquivos via staging; `/documentar-repo` em sandbox com `docs/PRD.md` ja existente → docs/PRD.md NAO sobrescrito, `.specify/runs/documentation-*/PRD.md` proposto, dialog pede confirmacao
- **Regressao:** workflow `/brownfield` existente continua funcionando

## Regulamentacao BR aplicavel

- **INV-007** — confirmacao + diff antes de sobrescrever (codificada em AC-122-1..3)
- **ADR-031** — `/brownfield` antigo continua valido

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 8) |
