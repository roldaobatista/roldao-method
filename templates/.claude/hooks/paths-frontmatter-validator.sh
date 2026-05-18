#!/usr/bin/env bash
# paths-frontmatter-validator.sh — exige frontmatter em docs novos da pasta docs/.
# Hook PreToolUse, matcher: Write|Edit.
# INV-004 — IDs rastreáveis + convenção de docs.

set -u

INPUT=$(cat)

PARSED=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $path = $json->{tool_input}->{file_path} // "";
  my $content = $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
  $content =~ s/\r//g;
  $content =~ s/\n/\\n/g;
  print "$path\n$content";
' 2>/dev/null)

FILE_PATH=$(echo "$PARSED" | head -n1)
CONTENT=$(echo "$PARSED" | tail -n+2)

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
  README.md|INDICE.md|CONVENCOES-DOC.md)
    exit 0
    ;;
esac

# Se já existe (Edit), checar se já tem frontmatter no arquivo atual.
if [ -f "$FILE_PATH" ]; then
  if head -n 1 "$FILE_PATH" | grep -qE '^---'; then
    exit 0
  fi
fi

# Para Write/Edit, validar que o novo conteúdo começa com frontmatter.
FIRST_LINE=$(echo -e "$CONTENT" | head -n1)

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
  if ! echo -e "$CONTENT" | head -n 15 | grep -qE "^${field}:"; then
    echo "[paths-frontmatter-validator] AVISO: frontmatter sem campo obrigatório '$field' em $FILE_PATH" >&2
    exit 2
  fi
done

exit 0
