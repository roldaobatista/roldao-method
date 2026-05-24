---
tipo: story
id: US-113
versao: 1
status: draft
prd: PRD-003
epico: EP-002
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: [US-111, US-112]
aprovacoes: []
sprint: 2B
esforco-dias-uteis: 10
premissas:
  - "Maestro multi-modo extende o Maestro atual (que só serve /feature) — não cria novo agente; adiciona 3 modos (PRD, BROWNFIELD, AR) ao mesmo agente."
  - "Contrato marker→etapa é documentado no ADR-019 antes do dev começar (gate AC-113-1)."
  - "Statusline N/7 reaproveita helper de statusline.js já existente; consolidação completa fica pra US-115."
adrs-decorrentes:
  - ADR-019 (Maestro multi-modo — PRD/BROWNFIELD/AR)
---

# US-113 — Sprint 2B: Orquestração Maestro multi-modo (D1-D8)

> Story file gerado pelo `/epico` em Modo DECOMP.

---

## Como, quero, para

**Como** dono de produto que não programa,
**quero** que workflows longos (`/prd`, `/brownfield`, `/auditoria-reversa`) tenham orquestrador igual `/feature` tem,
**para** não precisar saber qual é o próximo agente nem qual o estado atual do pipeline.

---

## Critérios de aceitação

- **AC-113-1** — ADR-019 escrito e com `status: aceito` ANTES de qualquer task de código começar (gate INV-002). Verificação: `grep -l 'status: aceito' docs/decisions/ADR-019-maestro-multimodo.md` retorna 1 caminho; commit do ADR é anterior ao commit do T-002 (`git log --reverse --format=%H docs/decisions/ADR-019-*.md | head -1` precede `git log --format=%H -- .claude/agents/maestro.md | tail -1`).
- **AC-113-2** — Statusline mostra `etapa N/7` quando dentro de pipeline. Verificação: teste `tests/integration/statusline-pipeline-etapa.test.js` retorna 0 (simula marker, lê statusline, valida string `N/7`).
- **AC-113-3** — Contrato marker→etapa documentado em ADR-019 §"Contrato". Verificação: `grep -E 'feature-active|prd-active|brownfield-active|ar-active' docs/decisions/ADR-019-*.md | wc -l` ≥ 4.
- **AC-113-4** — `/prd`, `/brownfield`, `/auditoria-reversa` invocam Maestro nos modos PRD/BROWNFIELD/AR respectivamente. Verificação: `grep -l 'modo: PRD' .claude/commands/prd.md` + idem brownfield/auditoria-reversa retorna 3 caminhos.
- **AC-113-5** — Cada hook editado nesta story ganha 2 testes adversariais (passa + bloqueia) em `tests/hooks/*.test.js` no mesmo commit. Verificação: `git log --oneline --grep='T-0' -- .claude/hooks/ tests/hooks/` mostra que cada commit de hook editado tem teste irmão.
- **AC-113-6** — Cobertura: cada ação D1-D8 do PLANO-AUDITADO tem 1 task T-NNN nesta story (ver MAPEAMENTO-T-NNN.md).
- **AC-113-7** — Addons (`fintech-br`, `fiscal-br-completo`) recebem nota no `MIGRATION-v2.md` se contrato de marker mudar de forma incompatível. Verificação: `grep -A 3 'Addons' docs/migrations/MIGRATION-v2.md` lista os 7 addons impactados ou declara "nenhum impacto".

---

## Non-goals (INV-003)

- **Não** muda comandos `/feature`, `/bug`, `/hotfix`, `/quick-dev` — já têm orquestração (Maestro modo FEATURE). Escopo são os 3 longos sem orquestrador.
- **Não** reescreve statusline completo — refactor consolidado fica pra US-115 (D5+D7+H2+H3+H8). Aqui só adiciona "N/7" no caminho existente.
- **Não** cria modo novo do Maestro além dos 3 (PRD/BROWNFIELD/AR). `/sprint`, `/release`, `/retro` continuam sem Maestro nesta v2.
- **Não** muda contrato de marker dos workflows que **já funcionam** (`/feature`) — só estende.

---

## Contexto técnico

_(Investigador preenche antes de Bruno codar.)_

- **Arquivos afetados (esperado):** `.claude/agents/maestro.md`, `.claude/commands/prd.md`, `.claude/commands/brownfield.md`, `.claude/commands/auditoria-reversa.md`, `.claude/hooks/enforce-pipeline-completion.js` (estender pros 3 modos), `.claude/statusline.js` (helper N/7), `docs/decisions/ADR-019-maestro-multimodo.md` (novo), `docs/migrations/MIGRATION-v2.md` (adicionar nota addons), `tests/hooks/enforce-pipeline-completion-multimodo.test.js` (novo), `tests/integration/statusline-pipeline-etapa.test.js` (novo).
- **Migrations necessárias:** Possível — se contrato de marker mudar shape (novos campos `modo: PRD|BROWNFIELD|AR`), addons que leem marker precisam ler campo novo. Documentado no MIGRATION-v2.md (T-009).
- **ADRs relacionados:** ADR-019 (gate desta story).

---

## Tasks

- [ ] **T-001** — D-pre: escrever **ADR-019** documentando os 3 modos novos do Maestro (PRD/BROWNFIELD/AR), contrato marker→etapa, formato `modo:` no marker, política de fallback. Status `aceito` antes de T-002 (AC-113-1).
- [ ] **T-002** — D1: estender `maestro.md` com modo PRD (orquestra `/prd`: analista → gerente-produto → tech-lead → [ux] → decomposição).
- [ ] **T-003** — D2: estender `maestro.md` com modo BROWNFIELD (orquestra `/brownfield`: investigador → tech-lead → gerente-produto → auditor-seguranca).
- [ ] **T-004** — D3: estender `maestro.md` com modo AR (orquestra `/auditoria-reversa`: investigador → 3 auditores → tech-writer).
- [ ] **T-005** — D4: estender `enforce-pipeline-completion.js` pra reconhecer os 3 modos novos + 2 testes adversariais por modo.
- [ ] **T-006** — D5: adicionar helper `etapaAtual(marker)` em `statusline.js` que retorna `N/7` lendo marker `*-active-*`. + teste.
- [ ] **T-007** — D6: editar `.claude/commands/prd.md` pra invocar Maestro modo PRD desde a etapa 1.
- [ ] **T-008** — D7: editar `.claude/commands/brownfield.md` pra invocar Maestro modo BROWNFIELD.
- [ ] **T-009** — D8: editar `.claude/commands/auditoria-reversa.md` pra invocar Maestro modo AR + adicionar nota no `MIGRATION-v2.md` sobre impacto em addons (AC-113-7).

---

## Testes esperados

- **Unitário:** helper `etapaAtual(marker)` em `statusline.js`.
- **Integração:** `enforce-pipeline-completion-multimodo.test.js` (1 caso por modo, total 3 cenários × 2 = 6 casos adversariais); `statusline-pipeline-etapa.test.js`.
- **E2E:** rodar `/prd` end-to-end (modo PRD) em sandbox e validar que o pipeline completa as 4-5 etapas sem trancar.

---

## Regulamentação BR aplicável

- **INV-001** — Documento é estado compartilhado. ADR-019 é o estado canônico do contrato — sem ele, agente inventa modo diferente cada vez.
- **INV-002** — Spec gera código. AC-113-1 trava commit de código antes do ADR estar `aceito`.
- **INV-004** — IDs rastreáveis. Marker passa a ter `modo:` explicito.
- **TST-002** — Cada hook tocado tem teste adversarial no mesmo commit (AC-113-5).

---

## Status

- [x] draft
- [ ] aprovada
- [ ] em implementação
- [ ] revisão
- [ ] entregue

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-113 |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** _(a definir)_
- **Modelo usado:** _(a registrar)_
- **Custo aproximado:** _(a registrar)_
- **Tempo total:** _(a registrar)_
- **Arquivos tocados:** _(a registrar)_
- **Tasks concluídas:** _(T-001..T-009)_
- **Hooks que bloquearam:** _(a registrar)_
- **Decisões fora do PRD:** _(virar ADR se houver)_
- **Skills invocadas:** _(a registrar)_
- **Subagentes invocados:** _(investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(a registrar)_
