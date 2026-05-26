---
tipo: auditoria
id: AUD-NNN
versao: 1
status: draft
owner: _(auditor responsavel — caio | julia | pedro | audit-arbiter | external)_
revisado-em: AAAA-MM-DD
round: 1
parent-audit: null
max-rounds: 3
escopo: _(o que foi auditado — PR, release, fluxo, arquitetura)_
criterio-parada: riscos_novos == 0 OU round == max-rounds
---

# Auditoria — _(titulo curto)_

> Template canonico de auditoria (US-120 / ADR-029). Formato Cn/An/Mn/Bn/Gn/Rn/ALT-n. Para auditoria iterativa (`/auditoria-iterativa`), criar 1 arquivo por round + apontar `parent-audit:` no frontmatter.

---

## Veredito geral

_(1 linha)_ — **aprovado** | **reprovado** | **aprovado-com-ressalva** | **escalado-pra-revisao-humana** (INV-AGENT-007 — apos 2 rounds)

## Resumo executivo (PT-BR pro nao-programador)

_(2-4 linhas em linguagem leiga. Camila modo MSG ajuda. O que o cliente final precisa saber sem jargao.)_

---

## Achados por severidade

### Criticos (C1-Cn) — must-fix-merge

| ID | Descricao | Arquivo:linha | rule_id | Status |
|---|---|---|---|---|
| C1 | _(descricao em PT-BR claro)_ | `src/...:NNN` | `LGPD-004` | open |

### Altos (A1-An) — must-fix-merge

| ID | Descricao | Arquivo:linha | rule_id | Status |
|---|---|---|---|---|

### Medios (M1-Mn) — todo-post-release

| ID | Descricao | Arquivo:linha | rule_id | Status |
|---|---|---|---|---|

### Baixos (B1-Bn) — info

| ID | Descricao | Arquivo:linha | rule_id |
|---|---|---|---|

### Gaps cruzados (G1-Gn)

_(Findings que tocam 2+ arquivos OU 2+ regras simultaneamente. Util quando audit-arbiter consolida.)_

| ID | Descricao | Arquivos | Regras tocadas |
|---|---|---|---|

### Riscos novos descobertos (R1-Rn) — APENAS em rounds 2+

_(So preencher quando `round > 1`. Listar riscos que **nao apareceram** no round anterior.)_

| ID | Descricao | Origem | Acao |
|---|---|---|---|

### Alternativas valiosas nao consideradas (ALT-1..ALT-n)

_(Opcoes que o auditor sugeriu mas o time nao escolheu — registradas pra historia.)_

| ID | Alternativa | Por que nao foi escolhida |
|---|---|---|

---

## Status final por item (apenas rounds 2+)

> Re-auditor classifica cada finding do round anterior.

| # | Status | Evidencia |
|---|---|---|
| C1 (round 1) | MANTIDO | `src/...:NNN` ainda vivo |
| A2 (round 1) | JA-CORRIGIDO | `git show <sha>` |
| A3 (round 1) | PERIGOSO — TIRADO | Aplicar quebraria fase X |
| M1 (round 1) | AMPLIADO | Risco maior que parecia (vide R1 deste round) |
| ALT-2 (round 1) | SAIU DO ESCOPO | Adiado pra v3.1 |

---

## Findings detalhados

### C1 — _(titulo curto)_

**Descricao em PT-BR claro:**
_(O que esta errado, em 2-4 linhas.)_

**Por que e ruim** (modo `--coach`):
_(Impacto pro cliente final.)_

**Como arrumar** (modo `--coach`):
_(Sugestao concreta.)_

**Evidencia:**
- `src/...:NNN` — _(snippet ou referencia)_
- `audit_sha`: _(SHA do diff no momento da auditoria)_

**Regra:** LGPD-004 (ou outro ID)

**Severity:** must-fix-merge

---

### C2 — ...

_(repetir pra cada finding)_

---

## Trilha de auditoria

| Data | Quem | Round | Acao |
|---|---|---|---|
| AAAA-MM-DD | Caio (auditor-seguranca) | 1 | Criou auditoria com C1+C2+A1 |
| AAAA-MM-DD | Bruno (dev-senior) | - | Fechou C1, C2 via commit `<sha>` |
| AAAA-MM-DD | Caio (re-auditor) | 2 | C1+C2 fechados; A1 mantido; descobriu R1 |
| AAAA-MM-DD | audit-arbiter | - | Consolidou A1 (Julia) + P1 (Pedro) em A1-consolidado |

---

## Decisao final (apos ciclo)

- [ ] **APROVADO** — todos os criticos+altos fechados, riscos_novos == 0
- [ ] **REPROVADO** — criticos ainda abertos
- [ ] **ESCALADO PRA REVISAO HUMANA** — 2+ rounds sem convergencia (INV-AGENT-007)

**Justificativa:**

_(1-2 linhas)_
