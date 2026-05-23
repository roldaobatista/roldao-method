#!/usr/bin/env bash
# require-readiness-before-feature.sh — exige /readiness aprovado antes de Edit/Write
# em codigo de negocio quando ha sessao de /feature ativa.
# Hook PreToolUse, matcher: Write|Edit.
#
# Estrategia (gemea de require-investigador-before-fix.sh):
# - /feature etapa 0 cria 2 markers: feature-active-<sess> e readiness-passed-<sess>.
# - Esse hook bloqueia se feature-active existe mas readiness-passed NAO existe.
# - Adicionalmente, le o frontmatter de docs/readiness/EP-NNN-status.md
#   apontado pelo marker feature-active (formato: "US-NNN" no conteudo) e
#   valida que `status: PRONTO`.

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

# So aplica a codigo de negocio (nao docs, nao testes, nao config, nao runtime)
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
MARK_READINESS="$PROJDIR/.claude/.runtime/readiness-passed-${SESSION_HASH}"

# Se nao ha sessao de /feature ativa, esse hook nao se aplica
[ -f "$MARK_FEATURE" ] || exit 0

# Se ja passou pelo gate na sessao, libera
[ -f "$MARK_READINESS" ] && exit 0

# Tenta ler a US-NNN do marker e buscar o status real do epico
US_ID=$(head -1 "$MARK_FEATURE" 2>/dev/null | perl -ne 'print $1 if /\b(US-\d+)\b/')

EP_HINT=""
STATUS_HINT=""
if [ -n "$US_ID" ]; then
  STORY_FILE=$(find "$PROJDIR/docs/stories" -maxdepth 1 -name "${US_ID}-*.md" 2>/dev/null | head -1)
  if [ -n "$STORY_FILE" ] && [ -f "$STORY_FILE" ]; then
    EP_HINT=$(perl -ne 'print $1 if /^epico:\s*(EP-\d+)/' "$STORY_FILE" | head -1)
    if [ -n "$EP_HINT" ]; then
      STATUS_FILE="$PROJDIR/docs/readiness/${EP_HINT}-status.md"
      if [ -f "$STATUS_FILE" ]; then
        STATUS_HINT=$(perl -ne 'print $1 if /^status:\s*(\w+)/' "$STATUS_FILE" | head -1)
        if [ "$STATUS_HINT" = "PRONTO" ]; then
          # Status verde — cria marker e libera
          mkdir -p "$PROJDIR/.claude/.runtime"
          touch "$MARK_READINESS"
          exit 0
        fi
      fi
    fi
  fi
fi

cat >&2 <<EOF
[require-readiness-before-feature] BLOQUEADO: tentativa de Edit/Write em codigo
de negocio sem readiness aprovado.

Arquivo: $FILE_PATH
Story alvo: ${US_ID:-(nao identificada)}
Epico: ${EP_HINT:-(nao identificado)}
Status atual: ${STATUS_HINT:-(arquivo de status nao existe)}

ANTES de implementar feature, rode:
  /readiness ${EP_HINT:-EP-NNN}

Isso gera docs/readiness/${EP_HINT:-EP-NNN}-status.md com status: PRONTO.

Se voce ja rodou /readiness e o status esta PRONTO, talvez o marker de sessao
nao foi criado. Force liberacao manual (sob sua responsabilidade):
  mkdir -p "$PROJDIR/.claude/.runtime" && touch "$MARK_READINESS"

Aplica regras: INV-001, INV-002 (spec gera codigo — sem spec readiness, sem codigo).
EOF
exit 2
