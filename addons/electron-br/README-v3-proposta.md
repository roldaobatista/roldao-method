---
owner: framework-core
revisado-em: 2026-05-26
status: proposta
substitui: nenhum (estende addon v2)
parent-readme: README.md (v2, status: stable, 2026-05-18)
prd: PRD-004
story: US-123
adr: ADR-030
---

# electron-br v3 — PROPOSTA DE EXPANSAO

> **ATENCAO:** este e um documento de **proposta**, nao substitui o `README.md` (v2 estavel) ao lado. Aplica INV-007 (preservacao). O Roldao decide se aceita expandir o addon de v2 (1 agente/1 hook/1 skill/3 regras) pra v3 (2 agentes/5 hooks/7 skills/8 templates) ou mantem v2.

---

## Estado atual (v2 — 2026-05-18)

`addon.yaml` declara:
- 1 agente: `electron-arch`
- 1 hook: `block-ipc-without-validation`
- 1 skill: `migration-sqlite-segura`
- 3 regras: ELECTRON-001, ELECTRON-002, ELECTRON-003

Pastas `agents/`, `hooks/`, `skills/` estao **vazias** — addon nunca foi totalmente implementado.

## Proposta de expansao (v3 — apos US-123 ser entregue)

`ADDON-v3-proposta.json` declara estrutura ampliada:

| Item | v2 atual | v3 proposta |
|---|---|---|
| **Agentes** | 1 (`electron-arch`, vazio) | 2 (`electron-architect` + `electron-security`) |
| **Hooks** | 1 (`block-ipc-without-validation`, vazio) | 5 (insecure-webprefs, context-bridge-preload, window-open, single-instance, csp-meta) |
| **Skills** | 1 (`migration-sqlite-segura`, vazio) | 7 (gerar-ipc, gerar-preload, validar-csp, secrets-vault, migration, mcp-local, windows-line-endings) |
| **Templates** | 0 | 8 (builder.yml, preload, main-index, entitlements, tsconfig, package.json, migration, schema-pii) |
| **Regras** | 3 (ELECTRON-001..003) | 3 (preservadas) + mapeamento pra novos hooks |

## O que MUDA conceitualmente

- `electron-arch` (v2) e mais GENERICO. Vira `electron-architect` (v3) + ganha colega `electron-security` (especialista de Caio).
- ELECTRON-001 (contextIsolation + sandbox) **continua valida** — vira codificada em hook `block-electron-insecure-webprefs.js` (alem do prompt do agente).
- ELECTRON-002 (validacao de input IPC) **continua valida** — hook `block-ipc-without-validation.js` v2 e PRESERVADO. v3 adiciona `require-context-bridge-preload.js` complementar.
- ELECTRON-003 (migration com backup) **continua valida** — skill `migration-sqlite-segura` v2 e PRESERVADA. v3 adiciona skill `gerar-migration-sqlite-segura` (gerador) ao lado da existente (validador).

## Caminho de migracao v2 → v3 (ADR-031 — preservacao)

1. **Agentes v2 mantidos:** `electron-arch` continua respondendo. Vira alias de `electron-architect` v3.
2. **Hook v2 mantido:** `block-ipc-without-validation` continua bloqueando. v3 adiciona 4 hooks complementares.
3. **Skill v2 mantida:** `migration-sqlite-segura` (validadora) continua. v3 adiciona `gerar-migration-sqlite-segura` (geradora).
4. **Regras v2 mantidas:** ELECTRON-001..003 inalteradas.

Nenhuma capacidade v2 perdida.

## Acao do Roldao

- [ ] **Aceitar v3** — apos US-123 (Onda 7 do PRD-004) ser entregue: substituir `README.md` por `README-v3-proposta.md`, substituir `addon.yaml` por `ADDON-v3-proposta.json` (manter ambos por 1 release como compat).
- [ ] **Adiar v3** — manter v2 atual; v3 fica como referencia escrita pra futuro.
- [ ] **Hibrido** — aceitar parte (ex: so os hooks novos) e adiar resto.

---

## Por que essa proposta veio agora

Analise externa do lionclaw em 2026-05-26 (`docs/analises/2026-05-26-licoes-do-lionclaw.md` §3, §4, §5) identificou 8 padroes bons + 5 anti-padroes Electron que valeriam empacotar como addon completo. ADR-030 formalizou a decisao arquitetural. PRD-004 US-123 detalha o escopo.

---

## Detalhes operacionais

Pra detalhes operacionais do v3 (lista completa de agentes, hooks, skills, templates, exemplos de uso), ver:

- **PRD-004 US-123** — `docs/stories/US-123-addon-electron-br.md`
- **ADR-030** — `docs/decisions/ADR-030-addon-electron-br-primeira-classe.md`
- **Analise lionclaw** — `docs/analises/2026-05-26-licoes-do-lionclaw.md` §3-§5

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-18 | Roldao | v2 inicial (README + addon.yaml + 3 regras) |
| 2026-05-26 | gerente-produto | proposta v3 escrita ao lado (NAO substituiu v2) |
