---
tipo: story
id: US-106
versao: 1
status: entregue
prd: PRD-001
epico: EP-001
tamanho: G
owner: Roldão
revisado-em: 2026-05-24
depende-de: [US-101]
aprovacoes: []
---

# US-106 — Port grupo pipeline (10 hooks de fluxo /feature)

## Como, quero, para

**Como** dev BR em Windows puro,
**quero** que os 10 hooks de pipeline (gate entre etapas do /feature, audit trail, scope de /quick-dev, validação de commit) funcionem nesse ambiente,
**para** que o fluxo `/feature` mecânico (Sofia → Detetive → Rafael → Bruno → Auditores → Checkpoint) continue forçado mesmo sem Git Bash.

---

## Critérios de aceitação

- **AC-106-1** — Os 10 hooks portados produzem comportamento idêntico ao `.sh`:
  1. `enforce-pipeline-completion.js` — Stop hook, retorna JSON `decision:block` se pipeline aberto sem checkpoint.
  2. `require-investigador-before-fix.js` — bloqueia Write/Edit se bug-trigger sem investigator-invoked.
  3. `require-readiness-before-feature.js` — bloqueia se feature-active sem readiness-passed (lê `docs/readiness/EP-NNN-status.md` pra auto-aprovar).
  4. `require-agent-sequence-before-dev.js` — exige sofia-done + detetive-done + (rafael-done OR rafael-skipped).
  5. `require-checkpoint-before-merge.js` — bloqueia git commit/merge/push se feature-active sem checkpoint-done (libera prefixos `docs:`/`chore:`/`ci:`/`build:`/`style:`).
  6. `require-auditors-pass-before-commit.js` — exige 3 markers `auditor-{seg,qual,prod}-pass-*`; valida staleness via hash SHA-256 do `git diff HEAD`.
  7. `validate-quick-dev-scope.js` — quick-dev ativo + arquivo sensível (fiscal/Pix/LGPD/etc) bloqueia imediato; conta arquivos únicos, ≤3 permite.
  8. `validate-story-dependencies.js` — lê `depende-de:` da story ativa, valida status `entregue` de cada dep.
  9. `validate-story-approvals.js` — bloqueia mudar `status: entregue` numa story sem 7 etapas no bloco `aprovacoes:` + 0 reprovados/bloqueados.
  10. `commit-message-validator.js` — 1ª linha ≤72, 1 prefixo, tipo Conventional, T-NNN/US-NNN obrigatório em sessão `/feature` ou `/bug` ativa.

- **AC-106-2** — Hashes (audit_sha do diff) reimplementados em Node via `crypto.createHash('sha256')` substituindo `shasum`/`sha256sum` do `.sh`.
- **AC-106-3** — Walk de filesystem (`docs/stories/`, `docs/readiness/`) usa `fs.readdirSync` puro, sem `find` shell.
- **AC-106-4** — Suite acumulada cobre os 10 hooks novos com cenários triviais (sem markers ativos = exit 0; comando irrelevante = exit 0; story que não está sendo marcada como entregue = exit 0). Cenários de bloqueio real (com markers/repos sintéticos) ficam pra **US-108**.

---

## Non-goals

- Cenários de bloqueio com state real (criar markers, repos com upstream, etc.) — fica pra US-108.
- Mudar formato dos markers em `.claude/.runtime/` — paridade byte-a-byte com `.sh`.
- Mudar protocolo Stop hook (continua JSON `decision:block` em stdout, `exit 0`).

---

## Tasks

- [x] **T-023..T-032** — 10 ports concluídos.
- [x] **T-033** — Cenários triviais adicionados à suite (147+ casos acumulados).

---

## Status

- [x] em implementação (T-023..T-033 ✓)
- [ ] entregue (depende de US-108)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + implementação |
