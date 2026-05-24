---
tipo: story
id: US-101
versao: 1
status: entregue
prd: PRD-001
epico: EP-001
tamanho: G
owner: Roldão
revisado-em: 2026-05-24
depende-de: []
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
    notas: "auditoria 10-agentes 2026-05-24 — sem CRITICO, sem ALTO"
  - etapa: auditor-qualidade
    agente: Julia
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-produto
    agente: Pedro
    data: 2026-05-24
    status: aprovado-retroativo
---

# US-101 — Infra de hook Node (`_lib.js`)

> Story file gerado pelo `/historia`. Vive em disco, não na conversa (INV-001).

---

## Como, quero, para

**Como** mantenedor do framework,
**quero** uma biblioteca Node única (`templates/.claude/hooks/_lib.js`) que espelha as funções de `_lib.sh`,
**para** que os 26 hooks portados (US-102..US-107) compartilhem helpers de sanitização, leitura de stdin JSON, geração de métrica e header de bloqueio.

---

## Critérios de aceitação

- **AC-101-1** — `_lib.js` exporta as funções: `sanitizeProjdir(candidate?)`, `sanitizeSessionHash(raw?, projdir?)`, `safeRuntimeDir(projdir)`, `safeTmpfile(prefix)`, `secretTokenPatterns()`, `hookBlockHeader(name, reason)`, `recordMetric(kind, label, reason)`, `readStdinJson()`.
- **AC-101-2** — Cada função do `_lib.js` produz a **mesma saída** que a função correspondente em `_lib.sh` para um conjunto de fixtures (mínimo 5 por função). Suíte de equivalência em `test/lib-equivalence.test.js` valida.
- **AC-101-3** — Arquivo é **CommonJS puro, zero dependências runtime** (verificado por `node --check` + grep por `require(` que cita só path relativo / builtin).
- **AC-101-4** — Funções `sanitizeProjdir` e `sanitizeSessionHash` mantêm as proteções do `_lib.sh`: bloqueio de `..` (path traversal), exigência de path absoluto (Unix `/` ou Windows `C:\` / `/c/`), strip de caracteres não-alfanuméricos no hash.
- **AC-101-5** — `recordMetric` appenda JSONL em `.claude/.runtime/metrics.jsonl` no mesmo formato que a versão `.sh` (`{"ts","kind","label","reason"}`), tolerante a disco cheio / sem permissão (best-effort).
- **AC-101-6** — `readStdinJson` lê stdin completo, tenta `JSON.parse`, retorna `{}` em caso de erro (fail-soft equivalente ao `perl -MJSON::PP` com `eval`).
- **AC-101-7** — Tamanho do arquivo `_lib.js` ≤ 250 linhas (alvo: 150-200).

---

## Non-goals (INV-003)

- Portar qualquer um dos 26 hooks bloqueadores — isso é US-102..US-107.
- Reescrever `bin/install.js` — já é Node, fora do escopo.
- Migrar `_test-runner.sh` — é US-108.
- Cobrir `safeTmpfile` com lock de concorrência multi-processo — equivalência funcional com o `.sh` é suficiente.

---

## Contexto técnico

- **Arquivo afetado (criado):** `templates/.claude/hooks/_lib.js`.
- **Arquivo de teste novo:** `test/lib-equivalence.test.js`.
- **ADRs relacionados:** [ADR-012](../decisions/ADR-012-hooks-node-port.md), [ADR-013](../decisions/ADR-013-convencao-hook-node.md).
- **Dependências externas:** zero. Só Node stdlib (`fs`, `path`, `os`, `crypto`, `child_process` se necessário pra spawn `bash _lib.sh` na suíte de equivalência).
- **Bash legado preservado:** `_lib.sh` continua em `templates/.claude/hooks/` até US-110 (deleção pós-port completo).

---

## Tasks

- [x] **T-001** — Criar `templates/.claude/hooks/_lib.js` com as 8 funções listadas em AC-101-1.
- [x] **T-002** — Criar `test/lib-equivalence.test.js` rodando cada função `_lib.js` vs equivalente em `_lib.sh`. **14/14 OK local.**
- [x] **T-003** — Adicionar `test/lib-equivalence.test.js` ao `npm test` no `package.json` (script `test:lib-equivalence` registrado).
- [ ] **T-004** — Atualizar `docs/EXTENDENDO/hook.md` (ou criar se não existe) explicando como escrever um hook Node novo seguindo o esqueleto definido por ADR-013. **Pendente — faz parte da última story do épico (US-110) ou pode ser feita avulsa.**

---

## Testes esperados

- **Unitário (`test/lib-equivalence.test.js`):**
  - `sanitizeProjdir` bloqueia `..`, exige absoluto, aceita Windows `C:\` e Git Bash `/c/`.
  - `sanitizeSessionHash` strip não-alfanumérico, persiste em `.session-hash`, reusa em chamada subsequente.
  - `safeRuntimeDir` cria `.claude/.runtime/` se não existe.
  - `secretTokenPatterns` retorna lista igual à do `.sh` (linha por linha).
  - `recordMetric` appenda JSONL válido + tolera disco cheio.
  - `readStdinJson` retorna `{}` em input vazio ou inválido.
- **Integração:** suíte completa só inicia em US-108. Esta US foca em paridade unitária.

---

## Regulamentação BR aplicável

- INV-005 (conciso vence completo — `_lib.js` ≤ 250 linhas, alvo 150-200).
- TST-001/TST-002 (suíte de equivalência bloqueia divergência; sem `skip` permitido).

---

## Status

- [x] draft
- [x] aprovada (PRD-001 + ADRs 012/013/014 aceitos)
- [x] em implementação (T-001 entregue, T-002..T-004 pendentes)
- [ ] revisão
- [ ] entregue

---

## Histórico

| Data       | Quem    | Mudança                                          |
|------------|---------|--------------------------------------------------|
| 2026-05-23 | Roldão  | criação a partir de EP-001; T-001 já implementado |
