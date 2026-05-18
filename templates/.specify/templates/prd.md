---
tipo: prd
id: PRD-NNN
versao: 1
status: draft
owner: _(preencher)_
revisado-em: AAAA-MM-DD
---

# PRD-NNN — _(nome curto da iniciativa)_

> **PRD = Product Requirements Document.** Em PT-BR: documento que diz o que vamos construir, pra quem, por quê, e como saberemos que deu certo. Spec-as-source (INV-002): este documento gera as user stories e o código, não o contrário.

---

## 1. Problema

_(1-3 parágrafos. Quem sofre, o que está sofrendo, com que frequência, com que custo.)_

**Evidência:** _(número, citação de cliente, métrica atual, ticket de suporte recorrente.)_

---

## 2. Personas

| Persona | Quem é | O que quer | Onde sofre hoje |
|---|---|---|---|
| _(ex: dono PME)_ | _(papel)_ | _(objetivo)_ | _(dor)_ |

---

## 3. Hipótese de solução

_(1 parágrafo. O que vamos construir, em alto nível. Não é design, é direção.)_

---

## 4. User stories (rastreáveis)

> Cada US deve ter critérios de aceitação testáveis (`AC-NNN-N`). Cadeia: `US-NNN` → `AC-NNN-N` → `T-NNN` → commit. Ver INV-004.

### US-001 — _(título)_
**Como** _(persona)_, **quero** _(ação)_ **para** _(benefício)_.

**Critérios de aceitação:**
- **AC-001-1** — _(verificável: dado X, quando Y, então Z)_
- **AC-001-2** — _(...)_

### US-002 — _(...)_

---

## 5. Non-goals (INV-003)

O que NÃO está no escopo desta iniciativa:

- _(item 1)_
- _(item 2)_

---

## 6. Métricas de sucesso

| Métrica | Valor atual | Meta | Como medir |
|---|---|---|---|
| _(ex: taxa de erro no cadastro)_ | _(X%)_ | _(Y%)_ | _(query / dashboard)_ |

---

## 7. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| _(...)_ | _(alta/média/baixa)_ | _(alta/média/baixa)_ | _(plano B)_ |

---

## 8. Regulamentação BR aplicável

_(citar IDs do REGRAS-INEGOCIAVEIS.md: LGPD-NNN, FISCAL-NNN, SEC-NNN. Se nenhum se aplica, escrever "N/A".)_

- _(ex: LGPD-007 — base legal: execução de contrato)_
- _(ex: FISCAL-001 — emite NF-e, XML imutável)_

---

## 9. Histórico de mudanças

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| AAAA-MM-DD | 1 | _(quem)_ | criação |
