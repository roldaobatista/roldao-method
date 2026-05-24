---
tipo: story
id: US-108
versao: 1
status: entregue
prd: PRD-001
epico: EP-001
tamanho: M
owner: Roldão
revisado-em: 2026-05-24
depende-de: [US-102, US-103, US-104, US-105, US-106, US-107]
aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: 2026-05-23
    status: aprovado-retroativo
    notas: "US do port EP-001; aprovacao informal no merge da v1.0.0-rc1; formalizada na auditoria 10-agentes em 2026-05-24"
  - etapa: investigador
    agente: Detetive
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: tech-lead
    agente: Rafael
    data: 2026-05-23
    status: aprovado-retroativo
    notas: "decisao em ADR-012/013/014"
  - etapa: dev-senior
    agente: Bruno
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: revisor
    agente: Ines
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: auditor-seguranca
    agente: Caio
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-qualidade
    agente: Julia
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-produto
    agente: Pedro
    data: 2026-05-24
    status: aprovado-retroativo
---

# US-108 — Suite de equivalência completa (com state real)

## Como, quero, para

**Como** mantenedor,
**quero** uma suite que valide paridade `.sh ↔ .js` em cenários **com state real** (markers em `.claude/.runtime/`, repos git sintéticos, `docs/stories/` populadas),
**para** garantir que os 26 hooks portados se comportam EXATAMENTE igual nos caminhos de bloqueio que dependem de filesystem — não só nos triviais (`exit 0` sem state) já cobertos por `hooks-equivalence`.

---

## Critérios de aceitação

- **AC-108-1** — `test/hooks-state-equivalence.test.js` monta workspace temp por bloco de cenário, cria markers/stories/etc, roda hook `.sh` e `.js` apontando `CLAUDE_PROJECT_DIR=<workspace>`, compara exit code.
- **AC-108-2** — Cobre **34 cenários com state real**:
  - require-investigador-before-fix: 3 (sem trigger, bloqueado, liberado).
  - require-readiness-before-feature: 3.
  - require-agent-sequence-before-dev: 3.
  - require-checkpoint-before-merge: 4 (sem feature, sem chk, docs: prefix, com chk).
  - require-auditors-pass-before-commit: 4 (sem feature, sem auditor, 1 blocked, todos pass).
  - validate-story-dependencies: 3 (sem feature, dep draft, dep entregue).
  - validate-quick-dev-scope: 6 (sem QD, 4 arquivos contando, 4o estoura, fiscal sempre bloqueia).
  - commit-message-validator: 3 (sem T-NNN bloqueia em sessão ativa, com libera, docs: libera).
  - enforce-pipeline-completion: 3 (sem feature OK, com decision:block, com checkpoint OK).
  - regra-zero-reminder: 2 (cria marker, exit 0).
- **AC-108-3** — Registrada como `test:hooks-state-equivalence` em `package.json` + incluída no `npm test`.
- **AC-108-4** — 100% verde local + CI (Ubuntu/macOS/Windows-with-bash). **34 OK / 0 FAIL.**

---

## Non-goals

- Cobrir cenários de bloqueio de hooks de conteúdo (`secrets-scanner`, `anti-mascaramento`, etc.) com state — esses já têm cobertura completa em `hooks-equivalence.test.js` que não depende de markers.
- Testar timeouts/race conditions reais (cobertura conceitual).
- Testar `no-amend-after-push` com git repo + upstream — exige setup complexo (init bare + commit + push) e flakes em Windows; coberto por `_test-runner.sh` legado quando aplicável.

---

## Tasks

- [x] **T-046** — Criar `test/hooks-state-equivalence.test.js` com helper `setupWorkspace()` + `runHookInWorkspace()`.
- [x] **T-047** — 34 cenários com state cobrindo 10 hooks de pipeline.
- [x] **T-048** — Registrar `test:hooks-state-equivalence` no `package.json` + adicionar ao `npm test`.

---

## Status

- [x] em implementação (T-046..T-048 ✓)
- [ ] entregue (depende de US-109 + US-110 fecharem o épico)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + implementação (34 OK / 0 FAIL) |
