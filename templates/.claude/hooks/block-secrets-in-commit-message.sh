#!/usr/bin/env bash
# block-secrets-in-commit-message.sh — bloqueia secret na MENSAGEM de commit.
# Hook PreToolUse, matcher: Bash.
# SEC-001 (estende secrets-scanner que so olha Write/Edit).

set -u

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

# Extrai mensagem de -m / heredoc / --message
MSG=$(printf '%s\n' "$CMD" | perl -ne '
  if (/-m\s+(["\x27])(.*?)\1/s) { print $2; exit }
  if (/--message[=\s]+(["\x27])(.*?)\1/s) { print $2; exit }
  if (/<<\s*\x27?(\w+)\x27?\s*\n(.*?)\n\1/s) { print $2; exit }
')

[ -z "$MSG" ] && exit 0

# Padroes de segredo no texto da mensagem
PATTERNS=(
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN[[:space:]]+[A-Z]+[[:space:]]+(PRIVATE[[:space:]]+)?KEY-----'
  'sk-[A-Za-z0-9]{32,}'
  'sk-ant-(api[0-9]{2}-)?[A-Za-z0-9_-]{32,}'
  'ghp_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]{82}'
  'xox[baprs]-[A-Za-z0-9-]{10,}'
  'AIza[0-9A-Za-z_-]{35}'
  'glpat-[A-Za-z0-9_-]{20}'
  # Bearer tokens longos
  'Bearer[[:space:]]+[A-Za-z0-9._-]{40,}'
  # Senhas inline
  'password[[:space:]]*[:=][[:space:]]*[^[:space:]]{6,}'
  'senha[[:space:]]*[:=][[:space:]]*[^[:space:]]{6,}'
)

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
