---
tipo: story
id: US-115
versao: 1
status: draft
prd: PRD-003
epico: EP-002
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: [US-113]
aprovacoes: []
sprint: 4
esforco-dias-uteis: 5
premissas:
  - "Refactor consolidado de statusline.js cobre D5+D7+H2+H3+H8 num único commit (auditor 3 — consolidação)."
  - "TL;DR de 3 linhas no topo dos 17 agentes (15 agentes + PERSONAS.md + MAPA-VISUAL.md) entra como bloco padronizado no formato '## TL;DR'."
  - "I5 (sugestão proativa de addon) foi removido por duplicação com E5 (já em US-114). Não recriar aqui."
adrs-decorrentes: []
---

# US-115 — Sprint 4: UX Terminal + Descoberta (H + I)

> Story file gerado pelo `/epico` em Modo DECOMP.

---

## Como, quero, para

**Como** dono de produto que não programa,
**quero** statusline que respeita `NO_COLOR`, TL;DR no topo de cada agente, e skills/addons visíveis no `/help`,
**para** descobrir sozinho o que o framework oferece sem precisar abrir 17 arquivos `.md`.

---

## Critérios de aceitação

- **AC-115-1** — `statusline.js` consolidado num único refactor cobrindo D5+D7+H2+H3+H8. Verificação: `git log --oneline --grep='T-001' -- .claude/statusline.js` retorna 1 commit; commit toca `.claude/statusline.js` + `tests/unit/statusline.test.js` apenas.
- **AC-115-2** — TL;DR de 3 linhas no topo dos 17 agentes. Verificação: `grep -L '^## TL;DR' .claude/agents/*.md` retorna 0 caminhos (todos têm o bloco).
- **AC-115-3** — `/help` mostra skills + addons (hoje quase invisíveis). Verificação: `node bin/roldao-method.js help | grep -E '(Skills|Addons)' | wc -l` ≥ 2 + teste `tests/integration/help-skills-addons.test.js`.
- **AC-115-4** — `/help "<frase em PT-BR>"` faz busca fuzzy nos comandos. Verificação: `node bin/roldao-method.js help "preciso reportar bug"` retorna `/bug` no topo dos resultados; teste `tests/unit/help-fuzzy.test.js` valida 5 cenários.
- **AC-115-5** — Statusline respeita `NO_COLOR=1`. Verificação: `NO_COLOR=1 node .claude/statusline.js` retorna string sem códigos ANSI (regex `/\x1b\[/` não casa).
- **AC-115-6** — Cobertura: cada ação H1-H8 + I1-I4, I6, I8, I9 do PLANO-AUDITADO tem 1 task T-NNN (I5 removido por duplicação com E5/US-114; I7 já foi em US-111 T-024).
- **AC-115-7** — K1, K2, K5 entregues: coluna "Pra quem é" na tabela de addons, output `/inicio` etapas 4-5 sem termo `frontmatter/gate/EP-status`, busca fuzzy `/help` (= AC-115-4). Verificação: `grep -E '^\|.*Pra quem é' README.md` retorna 1+ linhas; `grep -iE 'frontmatter|gate|EP-status' .claude/commands/inicio.md` retorna 0 linhas.

---

## Non-goals (INV-003)

- **Não** cria comando novo (`/o-que-aconteceu`, `npx roldao-method status/undo` — vão pra US-116).
- **Não** reescreve agentes em PT-BR (foi US-114). Aqui só adiciona TL;DR no topo.
- **Não** muda contrato de marker nem Maestro (foi US-113).
- **Não** cobre I5 (duplicado com E5 já entregue em US-114).
- **Não** muda README pra novo formato — só adiciona coluna "Pra quem é" na tabela de addons (K1).

---

## Contexto técnico

_(Investigador preenche antes de Bruno codar.)_

- **Arquivos afetados (esperado):** `.claude/statusline.js`, `.claude/agents/*.md` (17 arquivos — adicionar TL;DR), `bin/roldao-method.js` (subcomando `help` com fuzzy), `.claude/commands/help.md`, `README.md` (tabela addons com coluna "Pra quem é"), `.claude/commands/inicio.md` (etapas 4-5 sem jargão), `tests/unit/statusline.test.js`, `tests/unit/help-fuzzy.test.js`, `tests/integration/help-skills-addons.test.js`.
- **Migrations necessárias:** Não.
- **ADRs relacionados:** Nenhum.

---

## Tasks

**Bloco H — UX Terminal:**

- [ ] **T-001** — H-consolidado (D5+D7+H2+H3+H8): refactor único do `statusline.js` cobrindo etapa N/7, NO_COLOR, layout consolidado, helper de cor único, símbolos PT-BR. + teste completo.
- [ ] **T-002** — H1: TL;DR de 3 linhas no topo dos 17 agentes (`.claude/agents/*.md` + PERSONAS.md + MAPA-VISUAL.md). Bloco `## TL;DR` padronizado.
- [ ] **T-003** — H4: agentes auditores ganham `## Correções que VOCÊ aplica sem pedir` (já existem? confirmar com `grep` e adicionar onde falta).
- [ ] **T-004** — H5: comando `/help` ganha layout 3 colunas (Comando | Pra quê | Quando usar). Editar `.claude/commands/help.md`.
- [ ] **T-005** — H6: padronizar prefixo de mensagem de hook (já feito em US-111 T-016 e US-114 T-016 — auditar consistência aqui).
- [ ] **T-006** — H7: statusline mostra branch + versão + agente atual (já existe — validar e ajustar se necessário).

**Bloco I — Descoberta:**

- [ ] **T-007** — I1: `/help` mostra skills disponíveis (hoje invisíveis). + teste (AC-115-3).
- [ ] **T-008** — I2: `/help` mostra addons disponíveis. + teste.
- [ ] **T-009** — I3: `bin/roldao-method.js help` (CLI) mostra mesmo conteúdo do `/help` (paridade).
- [ ] **T-010** — I4: `npx roldao-method search <termo>` busca em comandos + skills + addons. + teste.
- [ ] **T-011** — I6: `/help <comando>` mostra ajuda detalhada do comando (não só lista). + teste.
- [ ] **T-012** — I8: README ganha seção "Descoberta" linkando `/help`, `npx roldao-method search`, `PRIMEIRO-DIA.md`.
- [ ] **T-013** — I9: doctor (`npx roldao-method doctor`) sugere comando próximo quando comando errado é digitado (fuzzy + nivel de Levenshtein).

**Cobertura adicional (K1, K2, K5):**

- [ ] **T-014** — K1: coluna "Pra quem é" na tabela de addons do README (auditor 1).
- [ ] **T-015** — K2: reescrever output do `/inicio` Etapas 4-5 em PT-BR sem "frontmatter/gate/EP-status" (auditor 1).
- [ ] **T-016** — K5: `/help "<frase>"` busca fuzzy (= T-010 + AC-115-4). Implementar fuzzy match no `bin/roldao-method.js`. + teste.

**Sincronização e validação:**

- [ ] **T-017** — auditoria: rodar `node bin/roldao-method.js help` antes/depois e validar que skills/addons aparecem.
- [ ] **T-018** — auditoria: rodar `NO_COLOR=1` e validar que statusline não emite ANSI (AC-115-5).

---

## Testes esperados

- **Unitário:** `statusline.test.js` (NO_COLOR, etapa N/7, helpers), `help-fuzzy.test.js` (5 cenários de query PT-BR).
- **Integração:** `help-skills-addons.test.js` (skills + addons aparecem no output).
- **E2E:** rodar `/help` interativo e verificar que Roldão encontra `/bug` digitando "preciso reportar bug" (tarefa-tipo 3 do PRD-003).

---

## Regulamentação BR aplicável

- **INV-AGENT-001** — Sem jargão. K2 (T-015) remove jargão das etapas 4-5 do `/inicio`.
- **INV-005** — Conciso vence completo. TL;DR de 3 linhas em cada agente (T-002) reduz overhead de leitura.
- **SEC-005** — URLs externas via env. T-013 (doctor) precisa validar se algum addon expõe URL hardcoded em sugestão.

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
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-115 |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** _(a definir)_
- **Modelo usado:** _(a registrar)_
- **Custo aproximado:** _(a registrar)_
- **Tempo total:** _(a registrar)_
- **Arquivos tocados:** _(a registrar)_
- **Tasks concluídas:** _(T-001..T-018)_
- **Hooks que bloquearam:** _(a registrar)_
- **Decisões fora do PRD:** _(virar ADR se houver)_
- **Skills invocadas:** _(a registrar)_
- **Subagentes invocados:** _(investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(a registrar)_
