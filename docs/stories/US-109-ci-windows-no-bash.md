---
tipo: story
id: US-109
versao: 1
status: em-implementacao
prd: PRD-001
epico: EP-001
tamanho: P
owner: Roldão
revisado-em: 2026-05-23
depende-de: [US-107, US-108]
aprovacoes: []
---

# US-109 — Job CI Windows-no-bash valida hooks .js puros

## Como, quero, para

**Como** mantenedor,
**quero** um job CI rodando em `windows-latest` SEM `shell: bash` em nenhum step,
**para** provar que os 26 hooks `.js` portados rodam em ambiente Windows puro (PowerShell) sem dependência de Git for Windows — comprovando a promessa central do PRD-001.

---

## Critérios de aceitação

- **AC-109-1** — Novo job `hooks-node-windows-no-bash` no `.github/workflows/validar.yml`, com `runs-on: windows-latest` e NENHUM `shell: bash` declarado (default = PowerShell).
- **AC-109-2** — Job roda `node test/hooks-node-only.test.js` que executa os 26 hooks `.js` via Node puro com `spawnSync('node', ...)`.
- **AC-109-3** — Teste cobre: (a) cada hook existe + sintaxe OK; (b) cenários básicos de bloqueio/liberação por hook (~30 cenários adicionais).
- **AC-109-4** — `test:hooks-node-only` registrado no `package.json` + adicionado ao `npm test`.
- **AC-109-5** — Job verde no CI Windows.

---

## Non-goals

- Cobrir os 168 cenários de `hooks-equivalence` em PowerShell — esses dependem de bash pra rodar `.sh` em paralelo (e a comparação só faz sentido onde bash existe).
- Rodar suite Python (skills) no job windows-no-bash — Python já tem job dedicado.
- Substituir `hooks-equivalence`/`hooks-state-equivalence` — esses continuam rodando em Ubuntu/macOS/Windows-with-bash.

---

## Tasks

- [x] **T-049** — Criar `test/hooks-node-only.test.js` com smoke dos 26 hooks + 30 cenários básicos.
- [x] **T-050** — Adicionar job `hooks-node-windows-no-bash` ao workflow CI.
- [x] **T-051** — Registrar `test:hooks-node-only` no `package.json`.

---

## Status

- [x] em implementação (T-049..T-051 ✓)
- [ ] entregue (depende de US-110 fechar v1.0)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + implementação (59 OK / 0 FAIL local) |
