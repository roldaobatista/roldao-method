#!/usr/bin/env bash
# block-todo-without-issue.sh — barra TODO/FIXME/XXX sem referencia rastreavel.
# Hook PreToolUse, matcher: Write|Edit.
# INV-004 — IDs rastreaveis.

set -uo pipefail
INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/todo-id.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Pular arquivos de doc/markdown (TODO em doc geralmente e checklist)
case "$FILE_PATH" in
  *.md|*.mdx|*CHANGELOG*|*.txt) exit 0 ;;
esac

printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $content = $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
  print $content;
' > "$TMPF" 2>/dev/null

if [ ! -s "$TMPF" ]; then
  exit 0
fi

VIOLATIONS=()
LINE_NUM=0
while IFS= read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))
  # Detecta TODO/FIXME/XXX/HACK
  if printf '%s\n' "$line" | grep -qE '\b(TODO|FIXME|XXX|HACK)\b'; then
    # Aceita se na mesma linha tem ID rastreavel (#NNN, US-NNN, T-NNN, INV-NNN, etc.)
    if printf '%s\n' "$line" | grep -qE '(#[0-9]+|US-[0-9]+|T-[0-9]+|AC-[0-9]+|INV-[0-9]+|SEC-[0-9]+|TST-[0-9]+|LGPD-[0-9]+|FISCAL-[0-9]+|ADR-[0-9]+)'; then
      continue
    fi
    VIOLATIONS+=("L$LINE_NUM: $line")
  fi
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[block-todo-without-issue] BLOQUEADO: TODO/FIXME/XXX/HACK sem ID rastreavel.

Arquivo: $FILE_PATH

Violacoes encontradas:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: INV-004 — IDs rastreaveis.

TODO sem rastro vira divida invisivel. Adicione referencia:
  // TODO(#123): descricao
  // FIXME(US-042): explicacao
  // HACK(T-007): contexto

IDs aceitos: #N, US-N, T-N, AC-N, INV-N, SEC-N, TST-N, LGPD-N, FISCAL-N, ADR-N.
EOF
  exit 2
fi

exit 0
