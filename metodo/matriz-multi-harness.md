---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: matriz de compatibilidade entre os principais harnesses de agente IA (quem suporta o quê).
---

# Matriz multi-harness — Claude Code, Cursor, Windsurf, Codex CLI, Kiro

> **Escopo:** esta matriz é a **visão cross-harness** (compatibilidade de features entre 5 ferramentas). Para o **contrato detalhado do Claude Code** (eventos × matchers × hooks × decisão × severidade), ver [`matriz-harness.md`](./matriz-harness.md). As duas matrizes coexistem: esta declara "quem suporta o quê"; aquela declara "como o Claude Code deve se comportar".

> **Para o agente IA:** consulte esta matriz quando precisar decidir onde implementar uma regra crítica. Regra crítica vai em **pre-commit git + CI** (universal); harness-específico (C9b) é **UX** — feedback imediato pro agente, não rede de segurança.

## Compatibilidade por recurso + fallback portável

| Recurso | Claude Code | Cursor | Windsurf | Codex CLI | Kiro | Fallback portável |
|---|---|---|---|---|---|---|
| Hooks de tool (PreToolUse, etc.) | ✓ `.claude/settings.json` | ✗ | parcial `.windsurf/` | ✗ | ✗ | pre-commit git (sub-segundo, universal) |
| Subagentes especialistas | ✓ `.claude/agents/*.md` | ✗ (usa Rules) | ✗ (usa Workflows) | ✗ | parcial | rule por path no harness + script invocável |
| Skills (Anthropic) | ✓ `.claude/skills/<n>/SKILL.md` | ✗ | ✗ | ✗ | ✗ | script em `scripts/<skill>.sh` invocado via Bash |
| Commands (`/comando`) | ✓ `.claude/commands/` | ✓ `.cursor/commands/` | ✓ Cascade | parcial | ✓ | task no `Makefile`/`justfile` |
| Rules por path | ✓ `.claude/rules/` | ✓ `.cursor/rules/*.mdc` (`globs:`) | ✓ `.windsurfrules` | via `AGENTS.md` | ✓ `.kiro/steering/` | seção em `AGENTS.md` referenciada |
| MCP (`.mcp.json`) | ✓ | ✓ | ✓ | parcial | ✓ | CLI wrapper + Bash |
| Arquivo "adendo" canônico | `CLAUDE.md` | `.cursorrules` | `.windsurfrules` | `AGENTS.md` | `.kiro/steering/` | `AGENTS.md` (todos leem) |
| Output styles / tom | ✓ `.claude/output-styles/` | parcial via rules | parcial | ✗ | ✓ | seção "Tom" em `AGENTS.md` |
| Evals próprios | ✓ `.claude/evals/` (manual) | ✗ nativo | ✗ nativo | ✗ | ✗ | suite de testes manual em `scripts/eval/` |
| Pre-commit git (independe do harness) | ✓ | ✓ | ✓ | ✓ | ✓ | nativo |
| CI (universal) | ✓ | ✓ | ✓ | ✓ | ✓ | nativo |

## Estratégia decisória (onde implementar cada regra)

| Tipo de regra | Camada primária | Reforço | Por que |
|---|---|---|---|
| Segredo em código | pre-commit (gitleaks) | hook PreToolUse no Claude Code | sub-segundo no commit; tempo real no harness suportado |
| Mascaramento (`\|\| true`, `@ts-ignore`) | pre-commit | hook PreToolUse (block) + CI gate | bloqueio antes da escrita e antes do commit |
| Frontmatter obrigatório em docs | pre-commit | hook PreToolUse no Claude Code | bloqueia gravação inválida |
| Linha-limite de doc | pre-commit (block) | hook PreToolUse no Claude Code | bloqueia doc inchado antes da escrita |
| Override de flag perigosa (`--force-with-lease`) | hook PreToolUse + `override-ledger.sh` | log auditado em `.claude/overrides.log` | precisa de motivo registrado |
| Bloqueio de comando destrutivo | permissions deny + hook | pre-commit pré-push | tempo real |
| Dependências do dev (jq, python3, bash≥4) | hook SessionStart (warn) | CI matrix | uma vez por sessão |
| Linting/formatação estrutural | pre-commit | CI | sub-segundo |
| Compatibilidade cross-OS | CI (build matrix) | — | minutos |

Regra geral: **regra crítica vai em pre-commit + CI (universal); harness-específico é UX (feedback imediato)**, não rede de segurança. Projeto multi-harness não pode confiar só em hook.

## Equivalência mínima por harness

- Claude Code → `CLAUDE.md` linha 1: `@AGENTS.md`.
- Cursor → `.cursorrules` referencia `AGENTS.md` no topo.
- Windsurf → `.windsurfrules` referencia `AGENTS.md` no topo.
- Codex CLI → lê `AGENTS.md` direto (default).
- Kiro → `.kiro/steering/00-agents.md` aponta pra `AGENTS.md`.

Codex CLI não tem template separado por decisão de design: o contrato dele é o próprio `AGENTS.md`, que também é o contrato comum dos demais harnesses.

## Implicação prática

- **Não dependa de hook PreToolUse** pra impedir vazamento de secret — funciona só no Claude Code. Use pre-commit git (universal) + CI scanner.
- **Subagente especialista** (tech-lead, especialista-juridico, etc.) só roda no Claude Code. Em outros harnesses, vira **rule por path** ou **command manual**.
- **Skills Anthropic** são intransferíveis. Se projeto multi-harness, evite depender de Skill — use script em `scripts/` que qualquer harness invoca via Bash.
- **Windows + Git Bash:** todos os hooks usam `bash "$VAR/..."` com aspas duplas e `#!/usr/bin/env bash` + `set -euo pipefail` + fallback para `timeout`/`date -d` ausente. Compatibilidade Windows é parte do contrato — ver `matriz-harness.md §6`.
