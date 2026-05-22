#!/usr/bin/env bash
# session-snapshot.sh — PreCompact + SessionEnd hook.
# Grava snapshot de stories abertas em .claude/.runtime/session-snapshot.md.
# Permite que a próxima sessão (ou retomada via --continue/--resume) saiba
# imediatamente onde paramos.

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi
RUNTIME=$(safe_runtime_dir "$PROJDIR")

SNAPSHOT="$RUNTIME/session-snapshot.md"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

{
  printf '# Snapshot de sessão — %s\n\n' "$TS"

  printf '## Stories ativas\n\n'
  FEATURES=$(ls -1 "$RUNTIME"/feature-active-* 2>/dev/null || true)
  if [ -n "$FEATURES" ]; then
    for f in $FEATURES; do
      US=$(cat "$f" 2>/dev/null | head -1)
      printf -- '- %s (marker: `%s`)\n' "$US" "$(basename "$f")"
    done
  else
    printf -- '- (nenhuma)\n'
  fi

  printf '\n## Bugs ativos\n\n'
  BUGS=$(ls -1 "$RUNTIME"/bug-active-* 2>/dev/null || true)
  if [ -n "$BUGS" ]; then
    for b in $BUGS; do
      printf -- '- `%s`\n' "$(basename "$b")"
    done
  else
    printf -- '- (nenhum)\n'
  fi

  printf '\n## Markers de agentes (últimos 10)\n\n'
  MARKERS=$(ls -1t "$RUNTIME"/*-done-* "$RUNTIME"/*-skipped-* 2>/dev/null | head -10 || true)
  if [ -n "$MARKERS" ]; then
    for m in $MARKERS; do
      printf -- '- `%s`\n' "$(basename "$m")"
    done
  else
    printf -- '- (nenhum)\n'
  fi

  printf '\n## Branch git\n\n'
  BRANCH=$(git -C "$PROJDIR" branch --show-current 2>/dev/null || echo '—')
  STATUS=$(git -C "$PROJDIR" status --short 2>/dev/null | head -20 || echo '')
  printf -- '- Branch: `%s`\n' "$BRANCH"
  if [ -n "$STATUS" ]; then
    printf -- '- Working tree:\n\n```\n%s\n```\n' "$STATUS"
  else
    printf -- '- Working tree: limpo\n'
  fi
} > "$SNAPSHOT" 2>/dev/null || true

exit 0
