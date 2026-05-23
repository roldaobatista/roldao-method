#!/usr/bin/env bash
# validate-story-dependencies.sh — recusa avancar /feature em US-NNN se alguma
# dependencia declarada em `depende-de:` ainda nao foi entregue.
# Hook PreToolUse, matcher: Write|Edit.
#
# Estrategia:
# - Le marker feature-active-<sess> pra saber qual US-NNN esta ativa.
# - Abre docs/stories/US-NNN-*.md, le frontmatter `depende-de: [US-001, US-002]`.
# - Pra cada US dependente, abre o arquivo e verifica se `status: entregue` (ou done).
# - Se alguma dependencia nao entregue, bloqueia com exit 2.
# - So roda em arquivos de codigo de negocio.

set -uo pipefail
# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

case "$FILE_PATH" in
  *.md|*docs/*|*README*|*CHANGELOG*|*ROADMAP*) exit 0 ;;
  *test/*|*tests/*|*spec/*|*specs/*|*.test.*|*.spec.*) exit 0 ;;
  *.json|*.yaml|*.yml|*.toml|*.ini|*.env*) exit 0 ;;
  *.sh|*.ps1|*.bat) exit 0 ;;
  *.claude/.runtime/*) exit 0 ;;
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs|*.swift|*.dart) ;;
  *) exit 0 ;;
esac

PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
MARK_FEATURE="$PROJDIR/.claude/.runtime/feature-active-${SESSION_HASH}"
MARK_DEPS_OK="$PROJDIR/.claude/.runtime/deps-checked-${SESSION_HASH}"

# Se nao ha /feature ativa, nao se aplica
[ -f "$MARK_FEATURE" ] || exit 0

# Se ja validou nesta sessao, nao re-valida (ganho de performance)
[ -f "$MARK_DEPS_OK" ] && exit 0

US_ID=$(head -1 "$MARK_FEATURE" 2>/dev/null | perl -ne 'print $1 if /\b(US-\d+)\b/')
[ -z "$US_ID" ] && exit 0

STORY_FILE=$(find "$PROJDIR/docs/stories" -maxdepth 1 -name "${US_ID}-*.md" 2>/dev/null | head -1)
[ -z "$STORY_FILE" ] || [ ! -f "$STORY_FILE" ] && exit 0

# Extrai lista do campo depende-de (formato: [US-001, US-002] ou - US-001 multiline)
DEPS=$(perl -ne '
  if (/^depende-de:\s*\[(.*?)\]/) { my $l = $1; $l =~ s/\s+//g; print join("\n", split(/,/, $l)); print "\n"; exit }
  if (/^depende-de:\s*$/) { $in = 1; next }
  if ($in && /^\s+-\s+(US-\d+)/) { print "$1\n"; next }
  if ($in && /^\S/) { exit }
' "$STORY_FILE" | grep -E '^US-[0-9]+$')

# Sem deps declaradas → libera
if [ -z "$DEPS" ]; then
  mkdir -p "$PROJDIR/.claude/.runtime"
  touch "$MARK_DEPS_OK"
  exit 0
fi

# Pra cada dep, valida status
BLOCKERS=""
while IFS= read -r DEP; do
  [ -z "$DEP" ] && continue
  DEP_FILE=$(find "$PROJDIR/docs/stories" -maxdepth 1 -name "${DEP}-*.md" 2>/dev/null | head -1)
  if [ -z "$DEP_FILE" ] || [ ! -f "$DEP_FILE" ]; then
    BLOCKERS="${BLOCKERS}  - ${DEP}: arquivo nao encontrado em docs/stories/\n"
    continue
  fi
  DEP_STATUS=$(perl -ne 'print $1 if /^status:\s*(\S+)/' "$DEP_FILE" | head -1)
  case "$DEP_STATUS" in
    entregue|done|concluida|completed) ;;
    *) BLOCKERS="${BLOCKERS}  - ${DEP}: status atual = '${DEP_STATUS:-desconhecido}' (precisa: entregue/done)\n" ;;
  esac
done <<< "$DEPS"

if [ -z "$BLOCKERS" ]; then
  mkdir -p "$PROJDIR/.claude/.runtime"
  touch "$MARK_DEPS_OK"
  exit 0
fi

printf '[validate-story-dependencies] BLOQUEADO: %s tem dependencias nao entregues.\n\n' "$US_ID" >&2
printf 'Arquivo alvo: %s\n' "$FILE_PATH" >&2
printf 'Story em /feature: %s\n' "$US_ID" >&2
printf 'Story file: %s\n\n' "$STORY_FILE" >&2
printf 'Dependencias bloqueando:\n' >&2
printf '%b' "$BLOCKERS" >&2
printf '\nFinalize as US dependentes (status: entregue) antes de iniciar %s.\n' "$US_ID" >&2
printf 'Ou ajuste o campo `depende-de:` no frontmatter se a dependencia mudou.\n\n' >&2
printf 'Aplica regra: INV-004 (cadeia rastreavel) + sequenciamento de sprint.\n' >&2
exit 2
