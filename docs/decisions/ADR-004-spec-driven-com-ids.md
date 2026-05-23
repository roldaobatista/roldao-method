---
id: ADR-004
titulo: Spec-driven com IDs rastreáveis
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-004 — Spec-driven com IDs rastreáveis

## Contexto

Agente de IA decide diferente cada conversa quando não há documento canônico. Spec oral vira `git log` ambíguo: 6 meses depois ninguém sabe se uma feature foi pedida pelo PO, foi débito técnico do dev, ou foi alucinação do agente. Rastreabilidade entre intenção (story) → critério (AC) → trabalho (task) → entrega (commit) some.

## Decisão

O framework é **spec-driven**:

1. **Documento é estado compartilhado** (INV-001). Decisão fora de doc versionado não existe.
2. **Spec gera código** (INV-002). Discrepância spec↔código corrige o código pra alinhar com a spec, ou atualiza a spec se o código revelou problema.
3. **IDs rastreáveis** (INV-004): `US-NNN` (user story) → `AC-NNN-N` (acceptance criteria) → `T-NNN` (task) → commit cita `T-NNN`.
4. **Hierarquia de docs**:
   - `docs/prd/PRD-NNN-*.md` — PRD
   - `docs/epicos/EP-NNN-*.md` — épico
   - `docs/stories/US-NNN-*.md` — user story
   - `docs/decisions/ADR-NNN-*.md` — decisão arquitetural
5. **Frontmatter obrigatório** em cada doc: `owner`, `revisado-em`, `status: draft|stable|deprecated`. Hook `paths-frontmatter-validator.sh` checa.

## Consequências

**Positivas:**
- Agente de IA reabre conversa sabendo o estado real (não inventa).
- `git log` cita `T-NNN` → rastreável até a US original.
- Auditoria de aderência (`auditor-produto`) tem critério objetivo.
- Onboarding novo: leu PRD + épicos + stories abertas → entende o produto.

**Negativas:**
- Mais escrita antes de codar. Mitigado pelos workflows (`/feature`, `/historia`) que geram o esqueleto em segundos.
- IDs `US-NNN` precisam de gerenciamento (numeração crescente). Aceito — `tools/validar-ids-rastreaveis.js` valida.

## Alternativas descartadas

- **Spec oral em chat:** descartado por INV-001 (memória de conversa não conta).
- **Issues do GitHub como spec:** descartado. Issues somem com migração de repo. Spec em markdown versionada sobrevive.
- **JIRA como fonte de verdade:** descartado. Spec precisa estar próxima do código (mesmo PR).

## Non-goals

- **Não exige sync com JIRA/Linear** — IDs vivem no markdown versionado próximo do código.
- **Não cobre tracking de tempo ou velocity de sprint** nativamente — métrica é responsabilidade de outra ferramenta.
- **Não auto-numera IDs** — cliente decide a sequência (US-001, US-002...) e o validador checa duplicata.

## Como aplicar

Workflows `/inicio`, `/prd`, `/epico`, `/historia`, `/feature` geram os artefatos no formato esperado. Hook `commit-message-validator.sh` exige `T-NNN` em commits `feat:`/`fix:`. Validator `tools/validar-ids-rastreaveis.js` checa que todo ID `INV-*`, `SEC-*`, `TST-*`, `LGPD-*`, `FISCAL-*`, `PIX-*`, `INV-AGENT-*` declarado em `REGRAS-INEGOCIAVEIS.md` tem ponto operacional (hook, agente, regra ou checklist).
