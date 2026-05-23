#!/usr/bin/env bash
# session-snapshot.sh — PreCompact + SessionEnd hook.
#
# Grava 2 arquivos em .claude/.runtime/:
#   1. session-snapshot.md — narrativo PT-BR pra humano ler / Claude contextualizar.
#   2. session-state.json — maquinas. session-snapshot-restore.sh le e RECRIA
#      markers ativos na proxima sessao (--continue/--resume).
#
# Sem o .json, --continue perdia markers de Sofia/Detetive/Rafael e obrigava refazer.
#
# Paths com espaco (Windows: C:\Meus Projetos\app): coleta via `find -print0` +
# array bash. `ls` + word-splitting quebrava qualquer marker dentro de pasta
# com espaco no caminho — auditoria 10-agentes (round 7).

set -uo pipefail

. "$(dirname "$0")/_lib.sh"

if ! PROJDIR=$(sanitize_projdir); then exit 0; fi
RUNTIME=$(safe_runtime_dir "$PROJDIR")

SNAPSHOT="$RUNTIME/session-snapshot.md"
STATE="$RUNTIME/session-state.json"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Hash atual (le persistido se houver)
HASH=$(sanitize_session_hash "" "$PROJDIR")

# ----- Coleta de markers (resiste a path com espaco) -----
# find -print0 + array bash 3.2-safe. Antes: `ls` + word-splitting quebrava
# qualquer pasta com espaco no caminho (Windows: C:\Meus Projetos\app).
FEATURES=()
while IFS= read -r -d '' f; do FEATURES+=("$f"); done < <(find "$RUNTIME" -maxdepth 1 -type f -name 'feature-active-*' -print0 2>/dev/null)

BUGS=()
while IFS= read -r -d '' f; do BUGS+=("$f"); done < <(find "$RUNTIME" -maxdepth 1 -type f -name 'bug-active-*' -print0 2>/dev/null)

# Markers de agentes — todos *-done-* e *-skipped-*, depois ordena por mtime
# (find -printf nao existe em Git Bash/BSD) e pega os 10 mais recentes.
MARKERS_ALL=()
while IFS= read -r -d '' f; do MARKERS_ALL+=("$f"); done < <(find "$RUNTIME" -maxdepth 1 -type f \( -name '*-done-*' -o -name '*-skipped-*' \) -print0 2>/dev/null)

MARKERS=()
if [ ${#MARKERS_ALL[@]} -gt 0 ]; then
  MARKERS_SORTED=$(printf '%s\0' "${MARKERS_ALL[@]}" | perl -0ne '
    chomp; push @f, $_;
    END {
      @f = sort { (stat $b)[9] <=> (stat $a)[9] } @f;
      print join("\0", @f[0..($#f < 9 ? $#f : 9)]), "\0";
    }
  ')
  while IFS= read -r -d '' f; do MARKERS+=("$f"); done < <(printf '%s' "$MARKERS_SORTED")
fi

# ----- 1. Snapshot textual -----
# Redirect com 2>/dev/null + sem `set -e`: erro de gravacao (disco cheio,
# permissao) nao derruba o hook lifecycle — snapshot e best-effort.
{
  printf '# Snapshot de sessão — %s\n\n' "$TS"

  printf '## Stories ativas\n\n'
  if [ ${#FEATURES[@]} -gt 0 ]; then
    for f in "${FEATURES[@]}"; do
      US=$(head -1 "$f" 2>/dev/null)
      printf -- '- %s (marker: `%s`)\n' "$US" "$(basename "$f")"
    done
  else
    printf -- '- (nenhuma)\n'
  fi

  printf '\n## Bugs ativos\n\n'
  if [ ${#BUGS[@]} -gt 0 ]; then
    for b in "${BUGS[@]}"; do
      printf -- '- `%s`\n' "$(basename "$b")"
    done
  else
    printf -- '- (nenhum)\n'
  fi

  printf '\n## Markers de agentes (últimos 10)\n\n'
  if [ ${#MARKERS[@]} -gt 0 ]; then
    for m in "${MARKERS[@]}"; do
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
} > "$SNAPSHOT" 2>/dev/null

# ----- 2. State machine-readable -----
ALL_MARKERS=()
while IFS= read -r -d '' f; do ALL_MARKERS+=("$f"); done < <(find "$RUNTIME" -maxdepth 1 -type f \( \
  -name 'feature-active-*' -o \
  -name 'bug-active-*' -o \
  -name '*-done-*' -o \
  -name '*-skipped-*' -o \
  -name 'readiness-passed-*' -o \
  -name 'auditor-*-pass-*' -o \
  -name 'investigator-invoked-*' -o \
  -name 'sofia-invoked-*' -o \
  -name 'rafael-invoked-*' -o \
  -name 'rafael-skipped-*' -o \
  -name 'checkpoint-done-*' \
\) -print0 2>/dev/null)

{
  printf '{\n'
  printf '  "session_hash": "%s",\n' "$HASH"
  printf '  "saved_at": "%s",\n' "$TS"
  printf '  "active_markers": [\n'

  FIRST=1
  if [ ${#ALL_MARKERS[@]} -gt 0 ]; then
    for marker in "${ALL_MARKERS[@]}"; do
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
    done
    [ $FIRST -eq 0 ] && printf '\n'
  fi

  printf '  ]\n'
  printf '}\n'
} > "$STATE" 2>/dev/null

exit 0
