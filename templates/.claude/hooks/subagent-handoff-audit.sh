#!/usr/bin/env bash
# subagent-handoff-audit.sh — SubagentStop hook.
# Valida handoff de subagentes que produzem artefato em disco:
#  - investigador: deve gravar .claude/.runtime/investigation-<ref>.json
#  - auditor-*:    deve gravar .claude/.runtime/auditor-{seg,qual,prod}-{pass,blocked}-*
# Em sessão /feature ou /bug ativa, falta de artefato vira aviso (stderr).
# Não bloqueia (exit 0) — o gate principal está em require-auditors-pass-before-commit.sh
# e require-investigador-before-fix.sh; este hook só sinaliza inconsistência.

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi
SESSION_HASH=$(sanitize_session_hash)
RUNTIME=$(safe_runtime_dir "$PROJDIR")

INPUT="$(cat 2>/dev/null || echo '{}')"
SUBAGENT=$(printf '%s' "$INPUT" | perl -ne 'print $1 if /"subagent_type"\s*:\s*"([^"]+)"/' | head -1)

[ -z "$SUBAGENT" ] && exit 0

ACTIVE_FEATURE=$(ls -1 "$RUNTIME"/feature-active-* 2>/dev/null | head -1 || true)
ACTIVE_BUG=$(ls -1 "$RUNTIME"/bug-active-* 2>/dev/null | head -1 || true)

case "$SUBAGENT" in
  investigador)
    if [ -n "$ACTIVE_BUG" ] || [ -n "$ACTIVE_FEATURE" ]; then
      FOUND=$(ls -1 "$RUNTIME"/investigation-*.json 2>/dev/null | head -1 || true)
      if [ -z "$FOUND" ]; then
        printf '[subagent-handoff-audit] AVISO: investigador encerrou sem gravar .claude/.runtime/investigation-<ref>.json. Próximo agente (dev-senior) vai bloquear.\n' >&2
      fi
    fi
    ;;
  auditor-seguranca|auditor-qualidade|auditor-produto)
    if [ -n "$ACTIVE_FEATURE" ]; then
      KEY=""
      case "$SUBAGENT" in
        auditor-seguranca) KEY=seg ;;
        auditor-qualidade) KEY=qual ;;
        auditor-produto)   KEY=prod ;;
      esac
      PASS=$(ls -1 "$RUNTIME"/auditor-"$KEY"-pass-* 2>/dev/null | head -1 || true)
      BLOCK=$(ls -1 "$RUNTIME"/auditor-"$KEY"-blocked-* 2>/dev/null | head -1 || true)
      if [ -z "$PASS" ] && [ -z "$BLOCK" ]; then
        printf '[subagent-handoff-audit] AVISO: %s encerrou sem gravar veredito (pass/blocked). Commit/merge será bloqueado.\n' "$SUBAGENT" >&2
      fi
    fi
    ;;
esac

exit 0
