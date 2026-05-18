#!/usr/bin/env bash
# _lib.sh — funcoes compartilhadas pelos hooks bloqueadores.
# Centralizar sanitizacao reduz risco de path traversal e bypass por sessao vazia.
#
# Uso: . "$(dirname "$0")/_lib.sh"  # sourceia no inicio de cada hook
#
# Auditado em 2026-05-18 (auditor 8/10): CLAUDE_PROJECT_DIR e CLAUDE_SESSION_ID
# vinham do ambiente sem validacao. PR malicioso podia injetar ".." e bypassar
# escopo do projeto. Agora todos hooks que tocam paths/markers passam por aqui.

# ---------------------------------------------------------------------------
# sanitize_projdir — valida e devolve um PROJDIR seguro.
# Aceita opcionalmente um valor (default: $CLAUDE_PROJECT_DIR ou $PWD).
# Bloqueia (exit 2) se:
#   - path vazio
#   - path contem "..": qualquer segmento que tente subir um nivel
#   - path nao e absoluto (em Unix: comeca com /; em Win Git Bash: /c/...)
# Em sucesso, ecoa o path normalizado.
# ---------------------------------------------------------------------------
# IMPORTANTE: usar `return` (nao `exit`) — funcao roda em subshell de `$(...)`,
# e `exit` so mataria o subshell, deixando o script principal seguir com
# PROJDIR vazio (bypass do hook). Caller deve fazer:
#   if ! PROJDIR=$(sanitize_projdir); then exit 2; fi
sanitize_projdir() {
  local candidate="${1:-${CLAUDE_PROJECT_DIR:-$PWD}}"

  if [ -z "$candidate" ]; then
    printf '[_lib.sh] PROJDIR vazio — abortando para evitar gravar fora do projeto.\n' >&2
    return 2
  fi

  # Bloqueia traversal explicito (.. em qualquer segmento)
  case "$candidate" in
    *"/.."*|*"/.."|".."/*|"..")
      printf '[_lib.sh] PROJDIR contem ".." (path traversal). Recusado: %s\n' "$candidate" >&2
      return 2
      ;;
  esac

  # Exige path absoluto. Unix: /algo. Windows Git Bash: /c/algo OU C:\algo OU C:/algo.
  case "$candidate" in
    /*) ;;
    [A-Za-z]:[\\/]*) ;;
    *)
      printf '[_lib.sh] PROJDIR nao e absoluto: %s\n' "$candidate" >&2
      return 2
      ;;
  esac

  printf '%s' "$candidate"
  return 0
}

# ---------------------------------------------------------------------------
# sanitize_session_hash — gera hash da sessao com fallback.
# Strip-a tudo que nao e [a-zA-Z0-9]. Se vazio, usa "default" pra evitar
# marcadores genericos tipo "feature-active-" (que liberam qualquer sessao).
# ---------------------------------------------------------------------------
sanitize_session_hash() {
  local raw="${1:-${CLAUDE_SESSION_ID:-default}}"
  local hash
  hash=$(printf '%s' "$raw" | perl -pe 'chomp; tr/a-zA-Z0-9//cd;')
  if [ -z "$hash" ]; then
    hash="default"
  fi
  printf '%s' "$hash"
}

# ---------------------------------------------------------------------------
# safe_runtime_dir — garante que .claude/.runtime existe e devolve o path.
# Usa o PROJDIR ja sanitizado.
# ---------------------------------------------------------------------------
safe_runtime_dir() {
  local projdir="${1:?safe_runtime_dir: PROJDIR obrigatorio}"
  local dir="$projdir/.claude/.runtime"
  mkdir -p "$dir" 2>/dev/null
  printf '%s' "$dir"
}

# ---------------------------------------------------------------------------
# safe_tmpfile — cria arquivo temporario com fallback seguro por usuario.
# Em /tmp world-writable (Linux multi-user), atacante local pode pre-criar
# /tmp/hook.<PID> como symlink — sobrescrita do hook ataca arquivo do usuario.
# Esta funcao isola o fallback em $TMPDIR/roldao-<UID>/, mode 700.
#
# Uso:
#   TMPF=$(safe_tmpfile "prefix") || exit 2
#   trap 'rm -f "$TMPF"' EXIT
# ---------------------------------------------------------------------------
safe_tmpfile() {
  local prefix="${1:-hook}"
  local tmpf
  tmpf=$(mktemp 2>/dev/null) && { printf '%s' "$tmpf"; return 0; }
  # Fallback isolado por UID — evita colisao em multi-user.
  local uid
  uid=$(id -u 2>/dev/null || echo 0)
  local safe_dir="${TMPDIR:-/tmp}/roldao-${uid}"
  mkdir -p "$safe_dir" 2>/dev/null || return 2
  chmod 700 "$safe_dir" 2>/dev/null || true
  tmpf="$safe_dir/${prefix}.$$"
  : > "$tmpf" || return 2
  printf '%s' "$tmpf"
}
