#!/usr/bin/env bash
# session-snapshot-restore.sh — SessionStart hook.
#
# Le snapshot da sessao anterior em .claude/.runtime/session-snapshot.md e:
#   1. Imprime no stderr pra entrar no contexto inicial do Claude.
#   2. Le tambem .claude/.runtime/session-state.json (se existir) e RECRIA
#      markers ativos (feature-active-*, bug-active-*, *-done-*) que foram
#      gravados pelo session-snapshot.sh. Sem isso, --continue/--resume
#      perdia Sofia/Detetive/Rafael e obrigava refazer.
# Nao bloqueia.

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi
RUNTIME="$PROJDIR/.claude/.runtime"
SNAPSHOT="$RUNTIME/session-snapshot.md"
STATE="$RUNTIME/session-state.json"

# Imprime snapshot textual se existir e for recente (<7 dias)
if [ -f "$SNAPSHOT" ]; then
  if command -v find >/dev/null 2>&1; then
    STALE=$(find "$SNAPSHOT" -mtime +7 2>/dev/null | head -1)
    if [ -z "$STALE" ]; then
      printf '\n[session-snapshot-restore] Snapshot da sessao anterior:\n' >&2
      cat "$SNAPSHOT" >&2 2>/dev/null || true
      printf '\n[session-snapshot-restore] Snapshot lido. Continue de onde parou ou rode `/status` pra confirmar.\n\n' >&2
    fi
  fi
fi

# Recria markers a partir do session-state.json (se existir e for recente)
# Formato esperado:
#   {
#     "session_hash": "abc123",
#     "saved_at": "2026-05-22T10:00:00Z",
#     "active_markers": [
#       {"name": "feature-active-abc123", "content": "US-042"},
#       {"name": "sofia-done-abc123", "content": ""},
#       ...
#     ]
#   }
if [ -f "$STATE" ]; then
  # Ignora se >7 dias
  STALE=$(find "$STATE" -mtime +7 2>/dev/null | head -1 || true)
  if [ -z "$STALE" ]; then
    # Restaura SESSION_HASH primeiro pra hooks subsequentes encontrarem
    SAVED_HASH=$(perl -MJSON::PP -e '
      local $/; my $j = decode_json(<STDIN>);
      print $j->{session_hash} // "";
    ' < "$STATE" 2>/dev/null)
    if [ -n "$SAVED_HASH" ]; then
      printf '%s\n' "$SAVED_HASH" > "$RUNTIME/.session-hash" 2>/dev/null || true
      printf '[session-snapshot-restore] SESSION_HASH restaurado: %s\n' "$SAVED_HASH" >&2
    fi

    # Recria cada marker ativo
    RESTORED=0
    while IFS=$'\t' read -r mname mcontent; do
      [ -z "$mname" ] && continue
      # Validacao: nome nao pode ter / ou ..
      case "$mname" in
        */*|*..*) continue ;;
      esac
      MARKER="$RUNTIME/$mname"
      if [ ! -e "$MARKER" ]; then
        printf '%s' "$mcontent" > "$MARKER" 2>/dev/null && RESTORED=$((RESTORED + 1))
      fi
    done < <(perl -MJSON::PP -e '
      local $/; my $j = decode_json(<STDIN>);
      my $ms = $j->{active_markers} // [];
      for my $m (@$ms) {
        my $n = $m->{name} // "";
        my $c = $m->{content} // "";
        $c =~ s/\t/ /g; $c =~ s/\n/ /g;
        print "$n\t$c\n";
      }
    ' < "$STATE" 2>/dev/null)

    if [ "$RESTORED" -gt 0 ]; then
      printf '[session-snapshot-restore] %d marker(s) recriado(s) — Sofia/Detetive/Rafael preservados entre sessoes.\n\n' "$RESTORED" >&2
    fi
  fi
fi

exit 0
