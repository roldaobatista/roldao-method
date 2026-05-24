---
description: Implementa funcionalidade nova — pipeline orquestrado pelo Maestro (Sofia → Detetive → Rafael → Bruno → Inês → 3 auditores → checkpoint).
argument-hint: "[US-NNN | descricao-da-feature]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(touch:*), Bash(mkdir:*), Task
---

# /feature — funcionalidade nova

Use `$ARGUMENTS` como `US-NNN` (preferido) ou descricao inicial da feature.

## Delegue ao Maestro

```
Task subagent_type=maestro prompt="Modo FT. US=$ARGUMENTS. Orquestre o pipeline completo."
```

O agente `maestro` (`.claude/agents/maestro.md`) e a **fonte unica do pipeline mecanico** — cria markers em cada etapa, dispara auditores em paralelo, re-roda quando hash do diff muda, reporta em etapas numeradas. Voce nao conduz o pipeline manualmente.

## REGRA #0 — voce decide o caminho antes de delegar

Pergunte sozinho (nao pro usuario):

> **A feature MUDA comportamento existente?** (Ex: muda como o PDF sai, muda calculo de imposto, altera fluxo de cadastro ja em uso.)

- **Sim** → instrua o Maestro: "Caminho REGRA #0: Detetive ANTES de Sofia (mexer em comportamento sem entender por que esta como esta reproduz o erro classico)."
- **Nao** → feature greenfield. Maestro segue ordem padrao Sofia → Detetive → Rafael.

Anuncie em 1 frase o caminho escolhido. Nao pergunte ao usuario.

## Quando NAO usar /feature

- Mudanca trivial (≤3 arquivos, ≤50 linhas, **sem** logica de negocio nova) → `/quick-dev`.
- Bug em comportamento existente → `/bug` (Detetive obrigatorio).
- Hotfix urgente em producao → `/hotfix`.

## Hooks que aplicam

- `require-readiness-before-feature.js` — exige readiness PRONTO antes de Edit/Write.
- `require-agent-sequence-before-dev.js` — exige Sofia + Detetive + Rafael (ou rafael-skipped).
- `require-auditors-pass-before-commit.js` — exige 3 auditores aprovados com hash do diff atual.
- `enforce-pipeline-completion.js` — exige pipeline completo (todos os markers) antes de encerrar a sessao.

Detalhes mecanicos completos (SESSION_HASH, audit_sha, markers, limpeza, modo BUG, modo AUDIT) estao em `.claude/agents/maestro.md`. Decisao registrada em `docs/decisions/ADR-011-maestro-fonte-unica-pipeline.md`.
