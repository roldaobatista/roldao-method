---
tipo: story
id: US-123
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-119]
aprovacoes: []
---

# US-123 — Onda 7: Addon `electron-br` materializado

## Como, quero, para

**Como** Dev BR plugando ROLDAO-METHOD em produto Electron (NF-e, Pix, certificado A1, eSocial),
**quero** o addon `electron-br` instalavel via `npx roldao-method add electron-br` com agentes/hooks/skills/templates production-ready
**para** parar de copiar o padrao do lionclaw na unha e replicar os mesmos anti-padroes (god-file, prompt em migration, zero aria-live).

## Criterios de aceitacao

- **AC-123-1** — Pasta `addons/electron-br/` criada com estrutura: `agents/`, `hooks/`, `skills/`, `templates/`, `rules/`, `README.md`, `ADDON.json`. Instalavel via `npx roldao-method add electron-br`.
- **AC-123-2** — Agente `electron-architect` em `addons/electron-br/agents/electron-architect.md`. Gatilho: `/inicio` Electron, decisao main/preload/renderer. Entrega skeleton com tsconfig project references + electron-vite.config.ts com externalize de natives.
- **AC-123-3** — Agente `electron-security` em `addons/electron-br/agents/electron-security.md`. Especialista de Caio. Audita CSP, custom protocols, asar, code signing BR (A1/A3 vs Apple Developer ID), notarization Mac.
- **AC-123-4** — 5 hooks Electron em `addons/electron-br/hooks/`:
  - `block-electron-insecure-webprefs.js` (nodeIntegration/contextIsolation/webSecurity)
  - `require-context-bridge-preload.js` (ipcRenderer so em preload/)
  - `block-window-open-without-handler.js` (new BrowserWindow sem setWindowOpenHandler)
  - `require-single-instance-lock.js` (projeto com SQLite/keytar sem requestSingleInstanceLock)
  - `require-csp-meta.js` (index.html sem meta CSP)
- **AC-123-5** — 7 skills em `addons/electron-br/skills/`:
  - `gerar-ipc-handler` (trio main+preload+renderer)
  - `gerar-preload-seguro` (contextBridge + tipagem + unsubscribe)
  - `validar-csp-electron` (checklist contra CSP)
  - `gerar-secrets-vault-electron` (3 camadas safeStorage→keytar→AES-GCM)
  - `gerar-migration-sqlite-segura` (BEGIN/COMMIT + guard idempotente + teste full-chain)
  - `gerar-mcp-local-electron` (template McpServer + watchdog Windows)
  - `windows-line-endings-check` (autocrlf + gitattributes)
- **AC-123-6** — 8 templates em `addons/electron-br/templates/`:
  - `electron-builder.yml.example` (production-ready com asarUnpack, extraResources, hardened runtime Mac)
  - `preload-secure.ts.example`
  - `main-index.ts.example` (boot completo)
  - `entitlements.mac.plist.example` + checklist notarization
  - `tsconfig-project-references.json`
  - `package-json-com-gates.json` (predev/pretest/prebuild/predist)
  - `db/migration-template.ts`
  - `db/schema-template-pii.sql`
- **AC-123-7** — Rule `addons/electron-br/rules/electron-br.md` com `paths: ['**/*.tsx', 'electron/**', 'src/main/**', 'src/renderer/**', 'src/preload/**']`.
- **AC-123-8** — `npx roldao-method add electron-br` integra com auto-deteccao do install (AC-118-4) — sugere addon quando `package.json` tem `electron` em deps.
- **AC-123-9** — `addons/electron-br/README.md` em PT-BR: quando usar, o que entrega, integracao com framework core, exemplo `/inicio` Electron BR.
- **AC-123-10** — `addons/electron-br/ADDON.json` com `framework_compat: ">=3.0.0"`, namespace `electron-br`, deteccao automatica declarada.
- **AC-123-11** — Hooks do addon vivem em `.claude/hooks/_electron-br/` (namespaced) — nao colidem com hooks do core nem com `_local/` customizado.
- **AC-123-12** — `.claude-addons.json` (registro de addons instalados no projeto) atualizado por `add`. Comando `npx roldao-method addons` (novo) lista addons instalados.

## Non-goals

- NAO migrar lionclaw pra usar este addon (lionclaw e cliente, nao framework)
- NAO escrever Windows Code Signing pago (cert paga — fora do escopo)
- NAO entregar `fintech-br`/`fiscal-br-completo` materializados (existem como referencia, aprimoramento em release futura)
- NAO replicar god-file de 8000+ linhas do lionclaw — IPC fatiado max 200 linhas/arquivo

## Contexto tecnico

- **ADRs bloqueantes:** ADR-030 (addon electron-br primeira-classe), ADR-031 (preservacao)
- **Depende de:** US-117 (manifest de hook), US-119 (alguns padroes Electron tocam pipeline state)
- **Arquivos afetados:** `addons/electron-br/` inteira + `bin/cli.js` (subcomando `addons`)

## Tasks

- [ ] **T-123-001** — Estrutura `addons/electron-br/` + `ADDON.json` + `README.md`
- [ ] **T-123-002** — Agente `electron-architect`
- [ ] **T-123-003** — Agente `electron-security`
- [ ] **T-123-004** — 5 hooks (T-123-004a..e)
- [ ] **T-123-005** — Skill `gerar-ipc-handler`
- [ ] **T-123-006** — Skill `gerar-preload-seguro`
- [ ] **T-123-007** — Skill `validar-csp-electron`
- [ ] **T-123-008** — Skill `gerar-secrets-vault-electron` (3 camadas)
- [ ] **T-123-009** — Skill `gerar-migration-sqlite-segura`
- [ ] **T-123-010** — Skill `gerar-mcp-local-electron`
- [ ] **T-123-011** — Skill `windows-line-endings-check`
- [ ] **T-123-012** — 8 templates Electron
- [ ] **T-123-013** — Rule `addons/electron-br/rules/electron-br.md`
- [ ] **T-123-014** — Integracao com auto-deteccao do install (T-118-004)
- [ ] **T-123-015** — Subcomando `npx roldao-method addons` listar addons instalados
- [ ] **T-123-016** — Testes integrados em sandbox Electron

## Testes esperados

- **Unitario:** cada hook do addon com `__tests__/`
- **Integracao:** `npx roldao-method add electron-br` em sandbox vazio → 23 arquivos copiados em <3s; criar BrowserWindow com nodeIntegration ativo → hook bloqueia
- **Regressao:** projeto sem addon nao recebe hooks do `_electron-br/`

## Regulamentacao BR aplicavel

- **ADR-030** — addon como primeira-classe
- **ADR-031** — addon nao remove nada do core
- **LGPD-004** — secrets-vault 3 camadas evita PII em log

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 7) |
