#!/usr/bin/env bash
# anti-mascaramento.sh — bloqueia padrões que mascaram erro/teste falho.
# Hook PreToolUse, matcher: Write|Edit.
# TST-001, INV-006.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/anti-mask.$$"
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

if [ ! -s "$TMPF" ]; then
  exit 0
fi

# Padrões de mascaramento que requerem justificativa visível na MESMA linha
# (comentário "TST-001-exception: <razão>" libera).
PATTERNS=(
  '@ts-ignore'
  '@ts-nocheck'
  '// eslint-disable'
  '/\* eslint-disable'
  '# noqa[^:]'
  '# type: ignore[^[]'
  '@SuppressWarnings'
  'assertTrue\(true\)'
  'assertEquals\(1,[[:space:]]*1\)'
  'expect\(true\)\.toBe\(true\)'
  '\.skip\('
  '\.todo\('
  '@Disabled'
  '\|\|[[:space:]]*true[[:space:]]*$'
  '--no-verify'
  '--skip-tests'
  '--ignore-errors'
  '--silent'
  '--quiet'
  'pytest\.skip'
)

VIOLATIONS=()
while IFS= read -r line || [ -n "$line" ]; do
  for pat in "${PATTERNS[@]}"; do
    if printf '%s\n' "$line" | grep -qE -- "$pat"; then
      # Permitir se mesma linha tem justificativa explícita
      if printf '%s\n' "$line" | grep -qE 'TST-001-exception|justificativa-mascaramento'; then
        continue
      fi
      VIOLATIONS+=("$pat  →  $line")
    fi
  done
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[anti-mascaramento] BLOQUEADO: padrão de mascaramento detectado.

Arquivo: $FILE_PATH

Violações encontradas:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: TST-001 — nunca mascarar teste/erro que falha.

Se o teste falha, o problema está no SISTEMA. Corrija o código, não esconda o erro.

Exceção: se MESMO assim você precisa do mascaramento (e é justificável), adicione comentário na mesma linha:
  // TST-001-exception: <razão clara e específica>
EOF
  exit 2
fi

exit 0
