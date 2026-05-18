#!/usr/bin/env bash
# no-amend-after-push.sh — bloqueia git commit --amend se HEAD ja foi pushado.
# Hook PreToolUse, matcher: Bash.
# Regra: "sempre criar NOVO commit, nunca amend de commit ja pushado".
#
# v0.5.0: compara HEAD com @{u} (upstream tracking branch) em vez de exigir `git fetch` recente.

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

# Hook roda no PWD do harness Claude. Aceita PROJDIR via env (sanitizado) ou
# cai pra PWD se o usuario invocou direto. Sem isso, em sub-pasta o hook lia
# repo errado.
PROJDIR=$(sanitize_projdir "${CLAUDE_PROJECT_DIR:-$PWD}") || exit 0
cd "$PROJDIR" 2>/dev/null || exit 0

INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

# Casa `--amend` como argumento isolado (regex via grep evita falso-positivo
# em flags como --amend-bar; case glob anterior era frouxo demais).
case "$CMD" in
  *"git commit"*)
    if ! printf '%s' "$CMD" | grep -qE -- '(^|[[:space:]])--amend([[:space:]]|$)'; then
      exit 0
    fi
    ;;
  *) exit 0 ;;
esac

# Estrategia 1: comparar HEAD com @{u} (upstream tracking)
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)

if [ -n "$UPSTREAM" ]; then
  # Se HEAD existe no upstream (ancestral ou igual), foi pushado
  LOCAL_SHA=$(git rev-parse HEAD 2>/dev/null)
  UPSTREAM_SHA=$(git rev-parse "$UPSTREAM" 2>/dev/null)
  if [ -n "$LOCAL_SHA" ] && [ -n "$UPSTREAM_SHA" ]; then
    # Se HEAD == upstream OU se HEAD é ancestral do upstream, foi pushado
    if [ "$LOCAL_SHA" = "$UPSTREAM_SHA" ] || git merge-base --is-ancestor "$LOCAL_SHA" "$UPSTREAM_SHA" 2>/dev/null; then
      PUSHED_TO="$UPSTREAM"
    fi
  fi
fi

# Estrategia 2 (fallback): qualquer branch remota contendo HEAD
if [ -z "${PUSHED_TO:-}" ]; then
  REMOTE_BRANCH=$(git branch -r --contains HEAD 2>/dev/null | head -n1 | sed 's/^[[:space:]]*//')
  if [ -n "$REMOTE_BRANCH" ]; then
    PUSHED_TO="$REMOTE_BRANCH"
  fi
fi

if [ -n "${PUSHED_TO:-}" ]; then
  cat >&2 <<EOF
[no-amend-after-push] BLOQUEADO: tentativa de --amend em commit ja pushado.

O commit atual (HEAD) ja existe em: ${PUSHED_TO}

Regra: nunca reescrever historico publicado. Faca um NOVO commit em vez disso.

Excecao: se voce TEM CERTEZA que ninguem mais usa essa branch e quer mesmo reescrever,
execute com confirmacao explicita e force-with-lease consciente (autorizacao do usuario obrigatoria).
EOF
  exit 2
fi

exit 0
