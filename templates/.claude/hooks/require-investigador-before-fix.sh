#!/usr/bin/env bash
# require-investigador-before-fix.sh — exige investigador antes de Edit/Write em codigo
# quando o prompt original mencionou bug (REGRA #0).
# Hook PreToolUse, matcher: Write|Edit.
#
# Estrategia: usa arquivo de marcador em /tmp criado pelo regra-zero-reminder.sh
# quando o prompt inicial dispara gatilho de bug. Se marcador existe E ainda nao houve
# invocacao do subagente 'investigador' (registrado em outro marcador), bloqueia.

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

# So aplica a codigo de negocio (nao docs, nao testes, nao config)
case "$FILE_PATH" in
  *.md|*docs/*|*README*|*CHANGELOG*|*ROADMAP*) exit 0 ;;
  *test/*|*tests/*|*spec/*|*specs/*|*.test.*|*.spec.*) exit 0 ;;
  *.json|*.yaml|*.yml|*.toml|*.ini|*.env*) exit 0 ;;
  *.sh|*.ps1|*.bat) exit 0 ;;
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs|*.swift|*.dart) ;;
  *) exit 0 ;;
esac

# Marcadores no diretorio do projeto (Claude define CLAUDE_PROJECT_DIR)
PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
MARK_BUG="$PROJDIR/.claude/.runtime/bug-trigger-${SESSION_HASH}"
MARK_INV="$PROJDIR/.claude/.runtime/investigator-invoked-${SESSION_HASH}"

# Se nao ha marcador de bug, nao se aplica
[ -f "$MARK_BUG" ] || exit 0

# Se investigador ja foi invocado, libera
[ -f "$MARK_INV" ] && exit 0

cat >&2 <<EOF
[require-investigador-before-fix] BLOQUEADO: tentativa de mudar codigo de negocio
SEM ter rodado o agente 'investigador' (Detetive 🔬) antes — REGRA #0.

Arquivo: $FILE_PATH

POR QUE: o prompt inicial mencionou bug/comportamento errado. Mudar codigo sem ler
o estado real (banco, log, payload) reproduz o erro classico: corrigir o sintoma
em vez da causa.

O QUE FAZER:
  1. Rode o agente 'investigador' agora — ele le os dados reais e te diz onde
     esta a causa raiz.
  2. Apos a investigacao, o proprio investigador grava o marcador e libera o
     proximo Edit/Write.

Detalhes: docs/COMO-FUNCIONA.md secao "REGRA #0" e workflow '/bug'.

Override manual (so com autorizacao explicita do usuario nao-tecnico):
  mkdir -p "$PROJDIR/.claude/.runtime" && touch "$MARK_INV"

Aplica regras: INV-006, INV-AGENT-002, INV-AGENT-004.
EOF
exit 2
