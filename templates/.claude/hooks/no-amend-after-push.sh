#!/usr/bin/env bash
# no-amend-after-push.sh — bloqueia git commit --amend se o ultimo commit ja foi pushado.
# Hook PreToolUse, matcher: Bash.
# Regra do CLAUDE.md global: "sempre criar NOVO commit, nunca amend de commit ja pushado".

set -u

INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

case "$CMD" in
  *"git commit"*--amend*|*"git commit --amend"*) ;;
  *) exit 0 ;;
esac

# Verifica se o ultimo commit ja foi pushado
# Se HEAD esta em qualquer branch remoto, e push-ado.
PUSHED=$(git branch -r --contains HEAD 2>/dev/null | head -n1)

if [ -n "$PUSHED" ]; then
  cat >&2 <<EOF
[no-amend-after-push] BLOQUEADO: tentativa de --amend em commit ja pushado.

O commit atual (HEAD) ja existe em branch remoto: ${PUSHED}

Regra: nunca reescrever historico publicado. Faca um NOVO commit em vez disso.

Excecao: se voce TEM CERTEZA que ninguem mais usa essa branch e quer mesmo reescrever,
execute com confirmacao explicita e force-with-lease consciente (autorizacao do usuario obrigatoria).
EOF
  exit 2
fi

exit 0
