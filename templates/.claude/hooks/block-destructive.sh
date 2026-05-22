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

# Whitelist de alvos seguros pra `rm -rf` — artefatos locais regeneraveis.
# Auditoria 10-agentes (2026-05-22): bloqueador falso-positivo em `rm -rf node_modules`
# obrigava dev a sair do agente pra limpar build. Lista mantida curta: so paths que
# QUALQUER projeto JS/TS/Python/Go/Rust/Java regera deterministicamente.
SAFE_RM_TARGETS='node_modules|\.next|\.nuxt|dist|build|out|target|\.cache|\.parcel-cache|\.turbo|\.vite|\.svelte-kit|coverage|\.pytest_cache|__pycache__|\.mypy_cache|\.tox|\.ruff_cache|venv|\.venv|\.idea|\.vscode/\.cache'

# Se for `rm -rf <whitelist>` puro (1 alvo, sem traversal, sem $HOME), libera.
# Padrao: `rm -rf node_modules`, `rm -rf ./dist`, `rm -rf "./build"` etc.
# Continua bloqueando: `rm -rf ~`, `rm -rf /`, `rm -rf node_modules ../algo`.
RM_TARGET=$(printf '%s' "$CMD" | perl -ne '
  if (/^\s*rm\s+-[a-zA-Z]*[rf][a-zA-Z]*\s+(.+?)\s*$/) {
    my $t = $1;
    $t =~ s/^["'\'']//; $t =~ s/["'\'']$//;
    print $t;
  }
' 2>/dev/null)
if [ -n "$RM_TARGET" ]; then
  # Recusa se tem espaço (multi-alvo), traversal, ou path absoluto/home perigoso
  case "$RM_TARGET" in
    *' '*|*'..'*|'/'|'~'|'~/'*|'$HOME'*|'/etc'*|'/usr'*|'/var'*|'/home'*) ;;
    *)
      # Strip leading ./ pra comparar com whitelist
      _t="${RM_TARGET#./}"
      if printf '%s' "$_t" | grep -qE "^($SAFE_RM_TARGETS)/?$"; then
        # Alvo regeneravel — libera silenciosamente.
        exit 0
      fi
      ;;
  esac
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
