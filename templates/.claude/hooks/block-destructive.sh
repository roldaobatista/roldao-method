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

# Fail-closed: se o parser falhou (JSON invalido/encoding) mas ha input, NAO
# libera silenciosamente — escaneia o INPUT cru. So sai 0 se realmente vazio.
if [ -z "$CMD" ]; then
  if [ -n "$INPUT" ]; then
    CMD="$INPUT"
  else
    exit 0
  fi
fi

# Padrões destrutivos
# NOTA SEC-002: 'git push --force-with-lease' (sem '=value') E PERMITIDO — e o caminho
# seguro recomendado pelo proprio git pra rebase de feature branch privada. Bloqueamos
# apenas '--force' cru, '-f' isolado e variantes ':<ref>' / '--delete'. Force-with-lease
# verifica que o ref remoto nao mudou — opera so se a expectativa local bater.
PATTERNS=(
  'rm[[:space:]]+-[A-Za-z]*r[A-Za-z]*f'
  'rm[[:space:]]+-[A-Za-z]*f[A-Za-z]*r'
  'rm[[:space:]]+-[A-Za-z]*r([[:space:]]|$)'
  'rm[[:space:]]+-[fr][A-Za-z]*[[:space:]]*[-./~"'"'"'$*]'
  'rm[[:space:]]+.*--recursive'
  'rm[[:space:]]+.*--force'
  'rm[[:space:]]+.*--no-preserve-root'
  'find[[:space:]]+.*-delete'
  'find[[:space:]]+.*-exec[[:space:]]+rm'
  '[[:space:]]shred[[:space:]]'
  ':\(\)[[:space:]]*\{[[:space:]]*:[[:space:]]*\|[[:space:]]*:'
  'git[[:space:]]+push.*--force([[:space:]]|$)'
  'git[[:space:]]+push.*-f[[:space:]]'
  'git[[:space:]]+push.*[[:space:]]-f$'
  'git[[:space:]]+push.*--delete'
  'git[[:space:]]+push[[:space:]]+[^|]*[[:space:]]:[A-Za-z]'
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
