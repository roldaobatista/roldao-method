#!/usr/bin/env bash
# auto-format-on-write.sh — PostToolUse hook (Write|Edit).
# Roda lint/format do arquivo recém-tocado quando o projeto declarou ferramenta.
# Detecta por extensão; só age se o binário existe (no-op caso contrário).
# Nunca bloqueia (exit 0 sempre) — formatador não deve quebrar fluxo.

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi

# Lê o JSON do hook via stdin pra extrair o file_path (campo padrão do Claude Code).
INPUT="$(cat 2>/dev/null || echo '{}')"
FILE=$(printf '%s' "$INPUT" | perl -ne 'print $1 if /"file_path"\s*:\s*"([^"]+)"/' | head -1)

[ -z "$FILE" ] && exit 0
[ ! -f "$FILE" ] && exit 0

EXT="${FILE##*.}"

format_if() {
  command -v "$1" >/dev/null 2>&1 || return 0
  shift
  "$@" >/dev/null 2>&1 || true
}

case "$EXT" in
  js|jsx|mjs|cjs|ts|tsx|json|md|yml|yaml|css|scss|html)
    if [ -f "$PROJDIR/node_modules/.bin/prettier" ]; then
      "$PROJDIR/node_modules/.bin/prettier" --write "$FILE" >/dev/null 2>&1 || true
    elif command -v prettier >/dev/null 2>&1; then
      prettier --write "$FILE" >/dev/null 2>&1 || true
    fi
    if [ "$EXT" = "ts" ] || [ "$EXT" = "tsx" ] || [ "$EXT" = "js" ] || [ "$EXT" = "jsx" ]; then
      if [ -f "$PROJDIR/node_modules/.bin/eslint" ]; then
        "$PROJDIR/node_modules/.bin/eslint" --fix "$FILE" >/dev/null 2>&1 || true
      fi
    fi
    ;;
  py)
    format_if ruff ruff format "$FILE"
    format_if ruff ruff check --fix "$FILE"
    format_if black black "$FILE"
    ;;
  go)
    format_if gofmt gofmt -w "$FILE"
    format_if goimports goimports -w "$FILE"
    ;;
  rs)
    format_if rustfmt rustfmt "$FILE"
    ;;
  sh|bash)
    format_if shfmt shfmt -w "$FILE"
    ;;
esac

exit 0
