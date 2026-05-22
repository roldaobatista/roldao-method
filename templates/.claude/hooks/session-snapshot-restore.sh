#!/usr/bin/env bash
# session-snapshot-restore.sh — SessionStart hook.
# Se houver snapshot da sessão anterior em .claude/.runtime/session-snapshot.md,
# imprime no stderr pra entrar no contexto inicial do Claude. Não bloqueia.

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi
RUNTIME="$PROJDIR/.claude/.runtime"
SNAPSHOT="$RUNTIME/session-snapshot.md"

[ ! -f "$SNAPSHOT" ] && exit 0

# Se snapshot for muito antigo (>7 dias), ignora — provável lixo.
if command -v find >/dev/null 2>&1; then
  STALE=$(find "$SNAPSHOT" -mtime +7 2>/dev/null | head -1)
  [ -n "$STALE" ] && exit 0
fi

printf '\n[session-snapshot-restore] Snapshot da sessão anterior:\n' >&2
cat "$SNAPSHOT" >&2 2>/dev/null || true
printf '\n[session-snapshot-restore] Snapshot lido. Continue de onde parou ou rode `/status` pra confirmar.\n\n' >&2

exit 0
