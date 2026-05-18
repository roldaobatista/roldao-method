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

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
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

RUNTIME_DIR=$(safe_runtime_dir "$PROJDIR")
FILES_LOG="$RUNTIME_DIR/quick-dev-files-${SESSION_HASH}"

# Normaliza path (resolve barras invertidas/duplicadas — Windows + Unix).
# Usa perl que aceita qualquer caractere incluindo espacos no input.
NORM_PATH=$(printf '%s' "$FILE_PATH" | perl -pe 's|\\|/|g; s|/+|/|g')

# Conta unicos ANTES de adicionar; e checa se o arquivo atual ja estava la.
# Usa perl pra evitar pitfalls de grep/sort com paths com espaco/aspas.
COUNTS=$(NORM="$NORM_PATH" perl -e '
  my $target = $ENV{NORM};
  my %seen;
  my $exists = 0;
  if (open(my $fh, "<", $ARGV[0])) {
    while (my $line = <$fh>) {
      chomp $line;
      next if $line eq "";
      $seen{$line} = 1;
      $exists = 1 if $line eq $target;
    }
    close $fh;
  }
  my $unique_before = scalar(keys %seen);
  my $unique_after  = exists $seen{$target} ? $unique_before : $unique_before + 1;
  print "$unique_before $unique_after $exists\n";
' "$FILES_LOG" 2>/dev/null)

UNIQUE_BEFORE=$(printf '%s' "$COUNTS" | awk '{print $1+0}')
UNIQUE_AFTER=$(printf '%s' "$COUNTS" | awk '{print $2+0}')
ALREADY_IN_LOG=$(printf '%s' "$COUNTS" | awk '{print $3+0}')

# Se ja estava no log, nao escala — registra mesmo assim para idempotencia.
if [ "$ALREADY_IN_LOG" -eq 1 ]; then
  exit 0
fi

LIMIT=3
if [ "$UNIQUE_AFTER" -le "$LIMIT" ]; then
  printf '%s\n' "$NORM_PATH" >> "$FILES_LOG"
  exit 0
fi

# Estourou — NAO adiciona o novo (mantem log intacto) e bloqueia.

cat >&2 <<EOF
[validate-quick-dev-scope] BLOQUEADO: /quick-dev ja tocou $LIMIT arquivos
de codigo de negocio. Tentativa de tocar o $((LIMIT+1))o arquivo:

  $FILE_PATH

Arquivos ja modificados nesta sessao /quick-dev:
EOF
perl -ne 'chomp; next if $_ eq ""; print "  - $_\n" unless $seen{$_}++' "$FILES_LOG" >&2
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
