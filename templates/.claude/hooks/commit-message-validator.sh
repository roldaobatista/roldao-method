#!/usr/bin/env bash
# commit-message-validator.sh — valida mensagem de commit antes de executar git commit.
# Hook PreToolUse, matcher: Bash.
# Politica: 1 linha curta (<=72) + corpo opcional, sem misturar fix+feat+refactor.

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

# So agir em git commit
case "$CMD" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

# Aplica: commits com -m/--message OU amend. Commit via editor (sem -m) tambem e validado
# atraves de COMMIT_EDITMSG quando possivel.
HAS_INLINE_MSG=""
case "$CMD" in
  *-m[[:space:]]*|*--message=*|*--message[[:space:]]*) HAS_INLINE_MSG=1 ;;
  *--amend*) ;;
  *)
    # commit via editor — tentar ler COMMIT_EDITMSG depois do hook (best effort)
    # Como PreToolUse roda ANTES do commit, COMMIT_EDITMSG ainda nao existe.
    # Se houver template configurado (commit.template), avisa que sera validado pelo proprio editor.
    exit 0
    ;;
esac

# Extrai mensagem entre aspas (simples ou duplas) ou heredoc
MSG=$(printf '%s\n' "$CMD" | perl -ne '
  if (/-m\s+(["\x27])(.*?)\1/s) { print $2; exit }
  if (/<<\s*\x27?(\w+)\x27?\s*\n(.*?)\n\1/s) { print $2; exit }
')

# Se nao achou, deixa passar (git pode ter forma exotica)
[ -z "$MSG" ] && exit 0

PRIMEIRA_LINHA=$(printf '%s\n' "$MSG" | head -n1)
LEN=${#PRIMEIRA_LINHA}

VIOLATIONS=()

# Regra 1: primeira linha <= 72
if [ "$LEN" -gt 72 ]; then
  VIOLATIONS+=("primeira linha tem $LEN caracteres (maximo 72): $PRIMEIRA_LINHA")
fi

# Regra 2: nao misturar prefixos na primeira linha
PREFIXES=$(printf '%s' "$PRIMEIRA_LINHA" | grep -oiE '\b(feat|fix|refactor|chore|docs|test|perf|build|ci|revert)\b' | tr '[:upper:]' '[:lower:]' | sort -u | tr '\n' ' ')
NUM_PREFIXES=$(echo "$PREFIXES" | wc -w)
if [ "$NUM_PREFIXES" -gt 1 ]; then
  VIOLATIONS+=("commit mistura prefixos: $PREFIXES — separe em commits atomicos (INV-AGENT-005)")
fi

# Regra 3: alerta se nao tem prefixo conhecido (so warning, nao bloqueia)
if [ "$NUM_PREFIXES" -eq 0 ]; then
  printf '[commit-message-validator] AVISO: sem prefixo (feat/fix/refactor/chore/docs/test): %s\n' "$PRIMEIRA_LINHA" >&2
fi

# Regra 4: se ha sessao /feature ou /bug ativa, commit feat/fix/refactor deve citar (US-NNN T-NNN) ou (T-NNN).
# Resolve gap auditado em 2026-05-18 (auditor 1/10): rastreabilidade T-NNN -> commit so era best practice.
PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
MARK_FEATURE="$PROJDIR/.claude/.runtime/feature-active-${SESSION_HASH}"
MARK_BUG="$PROJDIR/.claude/.runtime/bug-trigger-${SESSION_HASH}"

if [ -f "$MARK_FEATURE" ] || [ -f "$MARK_BUG" ]; then
  case " $PREFIXES " in
    *" feat "*|*" fix "*|*" refactor "*|*" perf "*)
      if ! printf '%s' "$MSG" | grep -qE '\b(US-[0-9]+|T-[0-9]+)\b'; then
        VIOLATIONS+=("sessao /feature ou /bug ativa — commit precisa citar (US-NNN T-NNN) ou (T-NNN) na mensagem para rastreabilidade")
      fi
      ;;
  esac
fi

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[commit-message-validator] BLOQUEADO: mensagem de commit nao atende politica.

Violacoes:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Politica:
  - Primeira linha <= 72 caracteres.
  - 1 prefixo por commit (feat OU fix OU refactor OU ...).
  - Corpo opcional, separado por linha em branco.
EOF
  exit 2
fi

exit 0
