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

- [x] **T-001** — H-consolidado (D5+D7+H2+H3+H8): refactor único do `statusline.js`. Entregue em sessão anterior (commit `0b4843a`+). Validado: `NO_COLOR=1 node .claude/statusline.js` retorna zero códigos ANSI.
- [x] **T-002** — H1: TL;DR de 3 linhas no topo dos agentes. Entregue em sessões anteriores (commits `b44e557` + `f6cebdc` + esta sessão para devops-infra/dba-dados). Total: 15 agentes com bloco `## TL;DR` padronizado.
- [x] **T-003** — H4: agentes auditores ganham `## Correções que VOCÊ aplica sem pedir`. Auditoria: `grep -l 'Correções que VOCÊ aplica'` retorna 3 (auditor-seguranca, auditor-qualidade, auditor-produto). Já entregue em sessão anterior.
- [x] **T-004** — H5: comando `/help` ganha layout 3 colunas (Comando | Pra quê | Quando usar). Editado `templates/.claude/commands/help.md`. Bonus: ganhou seções "Skills disponíveis" e "Addons disponíveis" pra cumprir AC-115-3 junto.
- [x] **T-005** — H6: padronizar prefixo de mensagem de hook. Auditoria: 30 hooks usam padrão `[<nome>] BLOQUEADO:` consistente. Helper `hookPrefix(level, name)` em `_lib.js` está disponível pra futuras.
- [x] **T-006** — H7: statusline mostra branch + versão + agente atual. Já entregue em US-115 T-001 consolidado (sessão anterior).

**Bloco I — Descoberta:**

- [x] **T-007** — I1: `/help` mostra skills disponíveis. Editado `templates/.claude/commands/help.md` — tabela "Skills disponíveis" com 13 entradas (validar-cpf-cnpj, validar-pix, etc.).
- [x] **T-008** — I2: `/help` mostra addons disponíveis. Editado `templates/.claude/commands/help.md` — tabela "Addons disponíveis" com 7 entradas e descrição "Pra quê" em PT-BR.
- [x] **T-009** — I3: `bin/install.js` (CLI) tem paridade — subcomando `search` lista comandos + skills + addons.
- [x] **T-010** — I4: `npx roldao-method search <termo>` busca fuzzy em 3 fontes. Implementação em `bin/install.js`: `loadCommandsCatalog`, `loadSkillsCatalog`, `fuzzyScore` (ignora stopwords PT-BR). Validado ao vivo: `search bug`, `search pix`, `search "preciso reportar bug"` retornam resultados esperados.
- [x] **T-011** — I6: `/help <comando>` mostra ajuda detalhada do comando. Entregue: handler em `templates/.claude/commands/help.md` que aceita código curto (BG, FT) OU nome (`bug`, `feature`) e renderiza pra quê + quando usar + etapas + agentes (com nome humano: Sofia, Detetive) + non-goals + relacionados.
- [x] **T-012** — I8: README ganha seção "Descoberta" linkando `/help`, `npx roldao-method search`, `PRIMEIRO-DIA.md`. Entregue: tabela com 5 portas de entrada (`/help`, `search`, `PRIMEIRO-DIA.md`, `docs/exemplos/`, `doctor`).
- [x] **T-013** — I9: doctor sugere comando próximo via Levenshtein. Entregue: `levenshtein()` puro em `bin/install.js` + `suggestCommand()` com threshold de 2. Validado ao vivo: `instal` → `install`, `seach` → `search`, `xyz123` → sem sugestão.

**Cobertura adicional (K1, K2, K5):**

- [x] **T-014** — K1: coluna "Pra quem é" na tabela de addons do README. Já entregue em US-116 (sessão anterior).
- [x] **T-015** — K2: reescrever output do `/inicio` Etapas 4-5 em PT-BR sem "frontmatter/gate/EP-status". Editado `templates/.claude/commands/inicio.md`. Validado: `grep -iE 'frontmatter|gate|EP-status' inicio.md` retorna 0.
- [x] **T-016** — K5: `/help "<frase>"` busca fuzzy. Implementação em `bin/install.js` com stopwords PT-BR. Validado: `npx roldao-method search "preciso reportar bug"` retorna `/bug` no topo.

**Sincronização e validação:**

- [x] **T-017** — auditoria: skills/addons aparecem no help. Validado ao vivo: `node bin/install.js help` retorna 2 matches em "(addons|search)".
- [x] **T-018** — auditoria: NO_COLOR no statusline. Validado: `NO_COLOR=1 node .claude/statusline.js <<< '{}' | grep -c $'\x1b\['` retorna 0.

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
- [x] aprovada
- [x] em implementação
- [x] revisão
- [x] entregue

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-115 |
| 2026-05-24 | dev-senior (Bruno) | T-003/T-004/T-005/T-006/T-007/T-008/T-009/T-010/T-014/T-015/T-016 entregues. T-011/T-012/T-013 ficam como débito baixo (não bloqueia release). |
| 2026-05-24 | dev-senior (Bruno) | T-011 (help comando detalhado), T-012 (README Descoberta), T-013 (Levenshtein no doctor) entregues. **US-115 100% completa.** |

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
