---
tipo: story
id: US-110
versao: 1
status: entregue
prd: PRD-001
epico: EP-001
tamanho: M
owner: Roldão
revisado-em: 2026-05-23
depende-de: [US-101, US-102, US-103, US-104, US-105, US-106, US-107, US-108, US-109]
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

# US-110 — Trocar settings.json, deletar .sh, release v1.0.0-rc1

## Como, quero, para

**Como** mantenedor,
**quero** finalizar o port: trocar `settings.json` pra apontar `.js`, deletar todos os `.sh`, bumpar versão pra `1.0.0-rc1`,
**para** entregar v1.0.0-rc1 ao npm — a primeira versão estável do ROLDAO-METHOD com promessa real de funcionar em Windows puro.

---

## Critérios de aceitação

- **AC-110-1** — `templates/.claude/settings.json` aponta `node hook.js` em todas as 33 entradas de hook + statusline (35 substituições totais).
- **AC-110-2** — Os 26 hooks `.sh` + `_lib.sh` + `_test-runner.sh` + `statusline.sh` (35 arquivos) removidos do repo.
- **AC-110-3** — `tools/validar-templates.js` aceita semver com prerelease (`1.0.0-rc1`), valida shebang Node, conta hooks `.js`.
- **AC-110-4** — `tools/validar-cobertura-hooks.js` escaneia `test/hooks-node-only.test.js` (28/28 cobertos).
- **AC-110-5** — `tools/validar-ids-rastreaveis.js` lê `*.js` em vez de `*.sh` (43/43 IDs rastreados).
- **AC-110-6** — `package.json` v1.0.0-rc1, `plugin.json` v1.0.0-rc1, `.continue/config.yaml` v1.0.0-rc1.
- **AC-110-7** — CHANGELOG.md tem entrada `[1.0.0-rc1] — 2026-05-23` com breaking changes anunciados.
- **AC-110-8** — `docs/releases/v1.0.0-rc1.md` com release notes em PT-BR.
- **AC-110-9** — `docs/MIGRACAO-V1.md` com guia passo-a-passo de migração v0.x → v1.0.
- **AC-110-10** — `bin/install.js doctor` checa `.js` (não `.sh`); `_lib.js` na lista de exigidos.
- **AC-110-11** — `test/install.test.js` espera `.js`; E2E hook usa `node` em vez de `bash`.
- **AC-110-12** — Workflow `validar.yml`: removidos jobs `shellcheck-hooks` e `rodar-hooks`; mantido `hooks-node-windows-no-bash` (US-109).
- **AC-110-13** — `npm test` completo verde local.

---

## Non-goals

- Migrar hooks `.sh` dos 6 addons oficiais — fica pra v1.0.1.
- Atualizar README/QUICKSTART/etc. citando "v1.0" — pra release v1.0.0 final (não rc1).
- Tag/release no GitHub — fica pra próximo passo após confirmação.
- Publicar no npm — depende do Roldão (npm credentials, INV-AGENT-005).

---

## Tasks

- [x] **T-052** — Criar `templates/.claude/statusline.js` (port da `.sh`).
- [x] **T-053** — Substituir `bash hook.sh` por `node hook.js` em `settings.json` (35 ocorrências).
- [x] **T-054** — `git rm` em 35 arquivos `.sh` + cleanup `tools/_substitute-settings.js` temp.
- [x] **T-055** — Atualizar `tools/validar-templates.js` pra contar `.js` + aceitar semver prerelease.
- [x] **T-056** — Atualizar `tools/validar-cobertura-hooks.js` (suites Node).
- [x] **T-057** — Atualizar `tools/validar-ids-rastreaveis.js` (`.js`).
- [x] **T-058** — Atualizar `bin/install.js doctor` lista de checks pra `.js`.
- [x] **T-059** — Atualizar `test/install.test.js`: lista esperada `.js` + E2E com `node`.
- [x] **T-060** — Atualizar `package.json`: remover `test:hooks`/equivalence; novo script `test:hooks-node-only` no `npm test`.
- [x] **T-061** — Remover jobs CI `shellcheck-hooks` + `rodar-hooks`; manter `hooks-node-windows-no-bash`.
- [x] **T-062** — Bump versão 0.20.0 → 1.0.0-rc1 em `package.json` + `plugin.json` + `continue.yaml`.
- [x] **T-063** — CHANGELOG entrada `[1.0.0-rc1] — 2026-05-23`.
- [x] **T-064** — `docs/releases/v1.0.0-rc1.md` (release notes PT-BR).
- [x] **T-065** — `docs/MIGRACAO-V1.md` (guia migração).
- [x] **T-066** — `npm test` verde local.

---

## Status

- [x] em implementação
- [x] **ENTREGUE** — fechamento do EP-001 (10/10 stories ✓)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + entrega (T-052..T-066) |
