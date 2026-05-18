#!/usr/bin/env bash
# context-budget.sh — avisa quando AGENTS.md / CLAUDE.md crescem além do limite.
# Hook SessionStart.
# INV-005 — conciso vence completo.

set -u

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

AGENTS_MD="$PROJECT_DIR/AGENTS.md"
CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"

AGENTS_LIMIT=200
CLAUDE_LIMIT=150

warn() {
  printf '[context-budget] %s\n' "$1" >&2
}

if [ -f "$AGENTS_MD" ]; then
  LINES=$(wc -l < "$AGENTS_MD" | tr -d '[:space:]')
  if [ "$LINES" -gt "$AGENTS_LIMIT" ]; then
    warn "AGENTS.md tem $LINES linhas (limite: $AGENTS_LIMIT). Consolide ou extraia conteúdo pra ADR/doc específico."
  fi
fi

if [ -f "$CLAUDE_MD" ]; then
  LINES=$(wc -l < "$CLAUDE_MD" | tr -d '[:space:]')
  if [ "$LINES" -gt "$CLAUDE_LIMIT" ]; then
    warn "CLAUDE.md tem $LINES linhas (limite: $CLAUDE_LIMIT). Mova conteúdo de produto pra AGENTS.md."
  fi
fi

exit 0
