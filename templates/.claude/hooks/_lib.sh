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
# sanitize_session_hash — gera hash da sessao com persistencia.
# Strip-a tudo que nao e [a-zA-Z0-9]. Se vazio, usa "default" pra evitar
# marcadores genericos tipo "feature-active-" (que liberam qualquer sessao).
#
# Auditoria 10-agentes (2026-05-22): em --continue/--resume, CLAUDE_SESSION_ID
# muda — markers de Sofia/Detetive/Rafael ficam orfaos e workflow obriga refazer.
# Solucao: persistir o hash da PRIMEIRA invocacao em .claude/.runtime/.session-hash
# e reusar enquanto o arquivo existir. Worktrees diferentes tem .runtime separado,
# entao nao ha colisao. SessionEnd/PreCompact removem se quiser forcar hash novo.
#
# Argumento opcional: PROJDIR (default: sanitize_projdir).
# ---------------------------------------------------------------------------
sanitize_session_hash() {
  local raw="${1:-${CLAUDE_SESSION_ID:-default}}"
  local projdir="${2:-}"
  local hash

  # Tenta ler hash persistido primeiro (so se projdir for valido).
  if [ -z "$projdir" ]; then
    projdir=$(sanitize_projdir 2>/dev/null) || projdir=""
  fi
  if [ -n "$projdir" ] && [ -f "$projdir/.claude/.runtime/.session-hash" ]; then
    hash=$(head -1 "$projdir/.claude/.runtime/.session-hash" 2>/dev/null | tr -cd 'a-zA-Z0-9')
    if [ -n "$hash" ]; then
      printf '%s' "$hash"
      return 0
    fi
  fi

  hash=$(printf '%s' "$raw" | perl -pe 'chomp; tr/a-zA-Z0-9//cd;')
  if [ -z "$hash" ]; then
    hash="default"
  fi

  # Persiste pra proxima sessao (best-effort, nao falha se sem permissao).
  if [ -n "$projdir" ]; then
    local runtime="$projdir/.claude/.runtime"
    mkdir -p "$runtime" 2>/dev/null
    printf '%s\n' "$hash" > "$runtime/.session-hash" 2>/dev/null || true
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

# ---------------------------------------------------------------------------
# secret_token_patterns — lista CANONICA de regex de tokens/segredos (ERE),
# uma por linha. Fonte unica consumida por secrets-scanner.sh e
# block-secrets-in-commit-message.sh — antes cada hook tinha sua copia e
# elas divergiam (auditoria round 8). Cobre o superset: nenhum hook perde
# deteccao, ambos ganham a uniao. Regra de senha inline fica em cada hook
# (contexto difere: arquivo exige aspas, mensagem de commit nao).
# ---------------------------------------------------------------------------
secret_token_patterns() {
  cat <<'PATTERNS'
AKIA[0-9A-Z]{16}
aws_secret_access_key[[:space:]]*=[[:space:]]*[A-Za-z0-9/+=]{40}
-----BEGIN[[:space:]]+[A-Z]*[[:space:]]*(PRIVATE[[:space:]]+)?KEY-----
sk-[A-Za-z0-9_-]{20,}
sk-proj-[A-Za-z0-9_-]{20,}
sk-ant-(api[0-9]{2}-)?[A-Za-z0-9_-]{32,}
ghp_[A-Za-z0-9]{36}
github_pat_[A-Za-z0-9_]{70,}
xox[baprs]-[A-Za-z0-9-]{10,}
AIza[0-9A-Za-z_-]{35}
glpat-[A-Za-z0-9_-]{20}
Bearer[[:space:]]+[A-Za-z0-9._-]{40,}
sk_live_[0-9a-zA-Z]{16,}
rk_live_[0-9a-zA-Z]{16,}
eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}
(postgres|postgresql|mysql|mongodb(\+srv)?|redis|amqps?)://[^:@/[:space:]]+:[^@/[:space:]]+@
"private_key"[[:space:]]*:[[:space:]]*"-----BEGIN
PATTERNS
}

# ---------------------------------------------------------------------------
# hook_block_header — cabecalho padronizado de bloqueio em stderr.
# Uso: hook_block_header "nome-hook" "motivo curto"
# Convencao a partir da round 8: hooks novos DEVEM usar isto. Os existentes
# permanecem (heredoc proprio) ate proxima refatoracao — trocar 26 heredocs
# de uma vez e churn com risco de regressao, sem ganho funcional.
# ---------------------------------------------------------------------------
hook_block_header() {
  printf '[%s] BLOQUEADO: %s\n\n' "${1:-hook}" "${2:-violacao de politica}" >&2
}
