#!/usr/bin/env bash
# paths-frontmatter-validator.sh — exige frontmatter em docs novos da pasta docs/.
# Hook PreToolUse, matcher: Write|Edit.
# INV-004 — IDs rastreáveis + convenção de docs.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/frontmatter.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $content = $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
  print $content;
' > "$TMPF" 2>/dev/null

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Aplica só a markdown dentro de docs/
case "$FILE_PATH" in
  *docs/*.md|*docs/*.MD)
    ;;
  *)
    exit 0
    ;;
esac

# Pular arquivos canônicos
case "$(basename "$FILE_PATH")" in
  README.md|INDICE.md|CONVENCOES-DOC.md|QUICKSTART.md|PUBLICAR.md)
    exit 0
    ;;
esac

# Validar SEMPRE o conteúdo novo (não confiar no arquivo no disco).
# Ignora BOM UTF-8 e linhas em branco iniciais antes de exigir o "---"
# (editor que insere newline/BOM no topo não deve gerar falso positivo).
FIRST_LINE=$(perl -e '
  local $/; my $c = <STDIN>;
  $c =~ s/^\x{EF}\x{BB}\x{BF}//;   # BOM
  for my $l (split /\n/, $c) { next if $l =~ /^\s*$/; print $l; last }
' < "$TMPF")

if [ "$FIRST_LINE" != "---" ]; then
  cat >&2 <<EOF
[paths-frontmatter-validator] AVISO: doc em docs/ deve começar com frontmatter.

Arquivo: $FILE_PATH

Formato esperado no topo:
---
owner: <responsável>
revisado-em: YYYY-MM-DD
status: draft | stable | deprecated
---

Regra: INV-004 — IDs rastreáveis + convenção de docs.
EOF
  exit 2
fi

# Validar campos mínimos
for field in owner revisado-em status; do
  if ! head -n 15 "$TMPF" | grep -qE "^${field}:"; then
    echo "[paths-frontmatter-validator] AVISO: frontmatter sem campo obrigatório '$field' em $FILE_PATH" >&2
    exit 2
  fi
done

exit 0
