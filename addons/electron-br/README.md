---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# electron-br — Addon ROLDAO-METHOD pra Electron BR

App Electron tem armadilhas próprias: IPC sem validação, banco SQLite local com dado pessoal LGPD, processo main vs renderer, migrations destrutivas que apagam dado offline do cliente.

Este addon traz:

- **1 agente:** `electron-arch` — guia decisões específicas de Electron (contextIsolation, sandboxing, IPC, autoupdater, build pipeline).
- **1 hook:** `block-ipc-without-validation` — barra `ipcMain.handle` sem validação de schema na primeira linha do handler.
- **1 skill:** `migration-sqlite-segura` — pattern de migration SQLite com backup automático antes de aplicar.
- **3 regras:** `ELECTRON-001`, `ELECTRON-002`, `ELECTRON-003`.

## Como instalar (manual, por enquanto)

Copie o conteúdo `addons/electron-br/.claude/` pro `.claude/` do seu projeto. Mescle settings.json adicionando os hooks.

## Regras

### ELECTRON-001 — Sempre `contextIsolation: true` + `sandbox: true`
Renderer não pode ter `nodeIntegration`. Comunicação só via `contextBridge` + preload script.

### ELECTRON-002 — IPC handler valida schema na primeira linha
Toda função em `ipcMain.handle` valida input antes de executar. Hook `block-ipc-without-validation` força.

### ELECTRON-003 — Migration SQLite com backup automático
Migration que altera schema OU dados faz backup do `.db` antes. Skill `migration-sqlite-segura` tem padrão.

## Cenários cobertos

- IPC seguro com Zod/JSON Schema.
- Migrations com backup auto.
- Dado pessoal local + LGPD-002 (rota de exclusão LOCAL — não só na nuvem).
- Logs sem CPF em texto puro.
- Auto-updater seguro (signature check).

## Non-goals

- Criar projeto Electron do zero (use `create-electron-app` ou `electron-vite`).
- Code signing (depende de certificado pago).
- Forge vs electron-builder (deixa pro tech-lead do projeto).
