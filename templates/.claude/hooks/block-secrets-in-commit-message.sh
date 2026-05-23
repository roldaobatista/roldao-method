#!/usr/bin/env bash
# block-secrets-in-commit-message.sh — bloqueia secret na MENSAGEM de commit.
# Hook PreToolUse, matcher: Bash.
# SEC-001 (estende secrets-scanner que so olha Write/Edit).

set -uo pipefail
# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

case "$CMD" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

# Extrai TODAS as mensagens de -m/--message (git concatena multiplos -m) + heredoc.
MSG=$(printf '%s' "$CMD" | perl -e '
  local $/; my $c = <STDIN>;
  my @parts;
  while ($c =~ /-m\s+(["\x27])(.*?)\1/sg)              { push @parts, $2 }
  while ($c =~ /--message[=\s]+(["\x27])(.*?)\1/sg)    { push @parts, $2 }
  if ($c =~ /<<\s*\x27?(\w+)\x27?\s*\n(.*?)\n\1/s)     { push @parts, $2 }
  print join("\n", @parts);
')

# Fail-closed: se nao deu pra extrair a mensagem (commit via -F/--file, editor,
# ou parsing falhou), NAO libera silenciosamente — escaneia o comando inteiro.
# Um segredo passado por `git commit -F leak.txt` ou `--file` ainda aparece se
# o caminho/conteudo estiver no comando; e protege contra bypass do parser.
if [ -z "$MSG" ]; then
  MSG="$CMD"
fi

# Padroes de segredo no texto: lista canônica compartilhada (_lib.sh) +
# senha inline (na mensagem de commit não exige aspas — contexto difere
# do secrets-scanner, por isso esta regra fica aqui).
PATTERNS=()
while IFS= read -r _p; do
  [ -n "$_p" ] && PATTERNS+=("$_p")
done < <(secret_token_patterns)
PATTERNS+=('password[[:space:]]*[:=][[:space:]]*[^[:space:]]{6,}')
PATTERNS+=('senha[[:space:]]*[:=][[:space:]]*[^[:space:]]{6,}')

for pat in "${PATTERNS[@]}"; do
  if printf '%s\n' "$MSG" | grep -qE -- "$pat"; then
    cat >&2 <<EOF
[block-secrets-in-commit-message] BLOQUEADO: mensagem de commit contem possivel segredo.

Mensagem: $MSG
Padrao detectado: $pat

Regra: SEC-001. Mensagem de commit fica em log publico (git log, GitHub, code review).
Nunca colocar chave, token, senha, certificado.

Se for parte do contexto da feature, descreva sem o valor literal:
  "fix: rotaciona chave AWS por exposicao em log" (NAO: "fix: chave AKIA... rotacionada")
EOF
    exit 2
  fi
done

exit 0
