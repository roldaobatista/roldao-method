#!/usr/bin/env bash
# session-snapshot.sh — PreCompact + SessionEnd hook.
#
# Grava 2 arquivos em .claude/.runtime/:
#   1. session-snapshot.md — narrativo PT-BR pra humano ler / Claude contextualizar.
#   2. session-state.json — maquinas. session-snapshot-restore.sh le e RECRIA
#      markers ativos na proxima sessao (--continue/--resume).
#
# Sem o .json, --continue perdia markers de Sofia/Detetive/Rafael e obrigava refazer.

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi
RUNTIME=$(safe_runtime_dir "$PROJDIR")

SNAPSHOT="$RUNTIME/session-snapshot.md"
STATE="$RUNTIME/session-state.json"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Hash atual (le persistido se houver)
HASH=$(sanitize_session_hash "" "$PROJDIR")

# ----- 1. Snapshot textual -----
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

# ----- 2. State machine-readable -----
# Lista todos os markers ativos relevantes pra restaurar: feature-active-*,
# bug-active-*, *-done-*, *-skipped-*, readiness-passed-*, audit-*-pass-*.
# Cada um vira { "name": ..., "content": <head -1> } no JSON.

ALL_MARKERS=""
for pat in 'feature-active-*' 'bug-active-*' '*-done-*' '*-skipped-*' 'readiness-passed-*' 'auditor-*-pass-*' 'investigator-invoked-*' 'sofia-invoked-*' 'rafael-invoked-*' 'rafael-skipped-*' 'checkpoint-done-*'; do
  for f in "$RUNTIME"/$pat; do
    [ -e "$f" ] || continue
    ALL_MARKERS="$ALL_MARKERS$f"$'\n'
  done
done

{
  printf '{\n'
  printf '  "session_hash": "%s",\n' "$HASH"
  printf '  "saved_at": "%s",\n' "$TS"
  printf '  "active_markers": [\n'

  FIRST=1
  if [ -n "$ALL_MARKERS" ]; then
    while IFS= read -r marker; do
      [ -z "$marker" ] && continue
      name=$(basename "$marker")
      # Le conteudo da 1a linha, escapa pra JSON (aspas + barra invertida)
      content=$(head -1 "$marker" 2>/dev/null | perl -pe 's/\\/\\\\/g; s/"/\\"/g; s/\t/ /g; chomp')
      if [ $FIRST -eq 1 ]; then
        FIRST=0
      else
        printf ',\n'
      fi
      printf '    {"name": "%s", "content": "%s"}' "$name" "$content"
    done <<< "$ALL_MARKERS"
    printf '\n'
  fi

  printf '  ]\n'
  printf '}\n'
} > "$STATE" 2>/dev/null || true

exit 0
