#!/usr/bin/env bash
# validate-quick-dev-scope.sh — impede que /quick-dev vire /feature disfarcado.
# Hook PreToolUse, matcher: Write|Edit.
#
# Resolve gap auditado em 2026-05-18 (auditor 9/10):
# Limite "<=3 arquivos, <=50 linhas" era so checklist visual — agora e mecanico.
#
# Estrategia: enquanto /quick-dev ativo (marker quick-dev-active-<sess>), conta
# arquivos UNICOS de codigo de negocio tocados. Se passar de 3, bloqueia e sugere /feature.

set -u

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

PROJDIR="${CLAUDE_PROJECT_DIR:-$PWD}"
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | perl -pe 'chomp; tr/a-zA-Z0-9//cd;')
MARK_QD="$PROJDIR/.claude/.runtime/quick-dev-active-${SESSION_HASH}"

# So se aplica quando /quick-dev esta ativo
[ -f "$MARK_QD" ] || exit 0

# Conta como "arquivo tocado" so codigo de negocio + frontend + estilo (o que escala mudanca)
case "$FILE_PATH" in
  *test/*|*tests/*|*spec/*|*specs/*|*.test.*|*.spec.*) exit 0 ;;
  *.claude/.runtime/*|*docs/*|*CHANGELOG*|*ROADMAP*) exit 0 ;;
  *.js|*.jsx|*.ts|*.tsx|*.vue|*.svelte|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs|*.swift|*.dart) ;;
  *.css|*.scss|*.sass|*.less|*.html|*.hbs|*.ejs|*.pug) ;;
  *) exit 0 ;;
esac

FILES_LOG="$PROJDIR/.claude/.runtime/quick-dev-files-${SESSION_HASH}"
mkdir -p "$PROJDIR/.claude/.runtime" 2>/dev/null

# Normaliza path (resolve relativos para comparacao consistente)
NORM_PATH=$(printf '%s' "$FILE_PATH" | perl -pe 's|\\|/|g; s|/+|/|g')

# Adiciona ao log (dedup depois)
printf '%s\n' "$NORM_PATH" >> "$FILES_LOG"

# Conta unicos
UNIQUE_COUNT=$(sort -u "$FILES_LOG" 2>/dev/null | grep -c .)

# Se o arquivo atual ja estava no log, nao escalou — libera
EXISTING_BEFORE=$(grep -cFx -- "$NORM_PATH" "$FILES_LOG" 2>/dev/null || echo 0)
if [ "$EXISTING_BEFORE" -gt 1 ]; then
  exit 0
fi

# Limite: 3 arquivos unicos
LIMIT=3
if [ "$UNIQUE_COUNT" -le "$LIMIT" ]; then
  exit 0
fi

# Estourou — remove o ultimo (ainda nao foi escrito) e bloqueia
TMP=$(mktemp)
head -n -1 "$FILES_LOG" > "$TMP" 2>/dev/null && mv "$TMP" "$FILES_LOG"

cat >&2 <<EOF
[validate-quick-dev-scope] BLOQUEADO: /quick-dev ja tocou $LIMIT arquivos
de codigo de negocio. Tentativa de tocar o $((LIMIT+1))o arquivo:

  $FILE_PATH

Arquivos ja modificados nesta sessao /quick-dev:
EOF
sort -u "$FILES_LOG" | sed 's|^|  - |' >&2
cat >&2 <<EOF

Limite de /quick-dev: <=3 arquivos de codigo, <=50 linhas de diff.

A mudanca ESCALOU — nao e mais trivial. Aborte e suba para /feature:
  1. Encerre /quick-dev: rm "$MARK_QD"
  2. Rode: /feature <descricao>
  3. /feature passa pelo pipeline completo (Sofia → Detetive → Rafael → Dev → Revisor → Auditores)

Se voce TEM CERTEZA que ainda e trivial (ex: 3 arquivos de cor da marca + 1
arquivo de constante), force libercao explicita:
  rm "$FILES_LOG"

Mas isso e o caminho que o framework chama de "erosao silenciosa".

Aplica: /quick-dev.md (cheklist obrigatorio), INV-AGENT-005.
EOF
exit 2
