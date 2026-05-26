---
owner: dev-senior
revisado-em: 2026-05-26
status: stable
story: US-111
ac-fechados-nesta-sessao: [AC-111-5]
ac-amarrados-release: [AC-111-3]
audit_sha: 753b17ec792da48e3a027e13c4c3784cd2ed10c6
session: 6a34d1ffdc80
---

# CHK-2026-05-26 — US-111 fecha AC-111-5 (MAPEAMENTO-T-NNN.md) + audita 7 ACs

> Checkpoint do pipeline `/feature` aprovado pelo agente principal em mensagem prévia (decisões pré-aprovadas: AC-111-3 fica pendente-externa amarrada à task #7; AC-111-1/2/4/7 marcadas como ENTREGUES com caminhos diferentes do literal; AC-111-5 substantivo nesta sessão).

---

## Status final da US-111

| AC | Status | Evidência |
|---|---|---|
| AC-111-1 | ENTREGUE | `.claude/hooks/require-auditors-pass-before-commit.js` + `test/hooks-auditors-pass.test.js` (passa) |
| AC-111-2 | ENTREGUE | `.claude/hooks/anti-mascaramento.js` linhas 38-40 (`xdescribe`, `fit`, `fdescribe`) + `test/hooks-anti-mascaramento-extra.test.js` 19/19 OK |
| AC-111-3 | **PENDENTE-EXTERNA** | Amarrado à task #7 (bump 1.3.1 → 2.0.0). `.claude-plugin/plugin.json` em sync com `package.json` por decisão deliberada. |
| AC-111-4 | ENTREGUE | Helper `useLegacyMarkers()` em `.claude/hooks/_lib.js` + 4 hooks consomem |
| AC-111-5 | **ENTREGUE NESTA SESSÃO** | `docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md` — 74 itens; `grep -cE '^\| (B\|A\|C\|D\|E\|F\|G\|H\|I\|J\|K\|L)'` retorna **109** (≥ 70 ✅) |
| AC-111-6 | ENTREGUE | 9 ações de alto impacto leigo em T-016..T-024 |
| AC-111-7 | ENTREGUE | `.claude/hooks/anti-mascaramento.js` linha 5 cita `T-004 (B4 + J6 + J7)` |
| AC-111-8 | ENTREGUE | ADR-020 + ADR-021 com `status: aceito` (grep retorna 2) |

**Resultado:** **7 de 8 ACs entregues. AC-111-3 amarrada ao release v2.0.0 (task externa #7).** A US-111 NÃO é marcada como "100% entregue" conforme decisão pré-aprovada do agente principal — fica como **"5 de 6 ACs substantivos entregues; AC-111-3 pendente-externa"** (contando os 7 sem o pendente-externa: 7/8 = 87.5%).

---

## Diff desta sessão

```
docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md  | NEW (~230 linhas)
docs/stories/US-111-sprint-1-bloqueadores-alta-prioridade-leigo.md   | 34 +/- 33
```

**Mudanças mensuráveis:** 2 arquivos, +260/-33 linhas (aproximado), 0 testes novos (cobertura existente continua 6/6 verde).

---

## Verificações rodadas

```bash
# AC-111-5
$ grep -cE '^\| (B|A|C|D|E|F|G|H|I|J|K|L)' docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md
109   # ≥ 70 ✅

# AC-111-2 / AC-111-7 / AC-111-1 / AC-111-4
$ node --test test/hooks-auditors-pass.test.js test/hooks-anti-mascaramento-extra.test.js \
              test/hooks-jargon-expanded.test.js test/hooks-audit-sha-story.test.js \
              test/hooks-checkpoint-marker.test.js test/hooks-investigador-gate2.test.js
6 OK, 0 FAIL (45.95s)

# AC-111-8
$ grep -c 'status: aceito' docs/decisions/ADR-020-contrato-audit-sha-markers.md docs/decisions/ADR-021-flag-legacy-markers-v2.md
docs/decisions/ADR-020-contrato-audit-sha-markers.md:1
docs/decisions/ADR-021-flag-legacy-markers-v2.md:1
```

---

## Pipeline executado (markers gravados em `.claude/.runtime/`)

| Etapa | Agente | Marker | Status |
|---|---|---|---|
| 1 | Sofia (gerente-produto) | `sofia-done-default` | herdado de sessões anteriores |
| 2 | Detetive (investigador) | `detetive-done-default` + `investigation-US-111.json` | herdado |
| 3 | Rafael (tech-lead) | `rafael-done-default` | herdado (ADR-020/021 já aceitos) |
| 4 | Bruno (dev-senior) | (esta sessão) | criou MAPEAMENTO-T-NNN.md + atualizou US-111 |
| 5 | Inês (revisor) | `revisor-done-default` | auditou diff: GO (sem ressalvas) |
| 6a | Caio (auditor-seguranca) | `auditor-seg-pass-6a34d1ffdc80` | GO — diff é só doc, sem secret/PII/URL hardcoded |
| 6b | Júlia (auditor-qualidade) | `auditor-qual-pass-6a34d1ffdc80` | GO — anti-mascaramento intacto, 6/6 testes verdes |
| 6c | Pedro (auditor-produto) | `auditor-prod-pass-6a34d1ffdc80` | GO — aderente ao AC-111-5, AC-111-3 explicitamente pendente-externa, non-goals preservados |
| 7 | Checkpoint | (este arquivo) | aprovado |

**audit_sha:** `753b17ec792da48e3a027e13c4c3784cd2ed10c6` (gerado via `git diff HEAD \| git hash-object --stdin`)
**session_hash:** `6a34d1ffdc80`

---

## Decisões pré-aprovadas honradas

1. ✅ AC-111-3 fica "pendente-externa" — sem criar `plugin.json` raiz com `2.0.0-pre.0`.
2. ✅ AC-111-1, AC-111-2, AC-111-4, AC-111-7 marcadas como ENTREGUES, com caminhos reais documentados (test/, bin/install.js, .claude-plugin/plugin.json, docs/GLOSSARIO.md).
3. ✅ AC-111-5 implementado substantivamente — MAPEAMENTO-T-NNN.md criado com 74 itens (109 linhas pelo grep).
4. ✅ US-111 NÃO marcada como "100% entregue" — apenas 7/8 ACs entregues no histórico.

---

## Próximo passo

Seguir pra task #7 (bump 1.3.1 → 2.0.0 + CHANGELOG v2.0.0 + tag), que destranca o AC-111-3 pendente-externa. Em paralelo, prosseguir com tasks #8..#12 (US-112..US-116) — exceto US-116 que já está marcada `[completed]` na auditoria de sessões anteriores.
