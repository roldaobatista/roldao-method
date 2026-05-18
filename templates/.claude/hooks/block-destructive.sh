#!/usr/bin/env bash
# block-destructive.sh — bloqueia comandos destrutivos no Bash tool.
# Hook PreToolUse, matcher: Bash.
# SEC-002, INV-AGENT-005.
#
# Parser perl -MJSON::PP pra suportar Windows Git Bash (sem jq).

set -u

INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

if [ -z "$CMD" ]; then
  exit 0
fi

# Padrões destrutivos
PATTERNS=(
  'rm[[:space:]]+-rf[[:space:]]'
  'rm[[:space:]]+-fr[[:space:]]'
  'rm[[:space:]]+-r[[:space:]]+/'
  'rm[[:space:]]+-f[[:space:]]+/'
  'git[[:space:]]+push.*--force'
  'git[[:space:]]+push.*-f[[:space:]]'
  'git[[:space:]]+push.*[[:space:]]-f$'
  'git[[:space:]]+push.*--force-with-lease'
  'git[[:space:]]+reset[[:space:]]+--hard'
  'git[[:space:]]+clean[[:space:]]+-fd'
  'git[[:space:]]+branch[[:space:]]+-D'
  'chmod[[:space:]]+777'
  'mkfs\.'
  'dd[[:space:]]+if='
  'curl.*\|[[:space:]]*(bash|sh)'
  'wget.*\|[[:space:]]*(bash|sh)'
  'DROP[[:space:]]+TABLE'
  'TRUNCATE[[:space:]]+TABLE'
  'DROP[[:space:]]+DATABASE'
  '--no-verify'
  '--skip-tests'
  '--skip-hooks'
)

for pat in "${PATTERNS[@]}"; do
  if printf '%s\n' "$CMD" | grep -qiE -- "$pat"; then
    cat >&2 <<EOF
[block-destructive] BLOQUEADO: comando contém padrão destrutivo.

Comando: $CMD
Padrão detectado: $pat

Regras aplicadas: SEC-002, INV-AGENT-005.

Operações irreversíveis exigem confirmação explícita do usuário.
Se este comando é necessário e intencional, pause e peça confirmação.
EOF
    exit 2
  fi
done

exit 0
