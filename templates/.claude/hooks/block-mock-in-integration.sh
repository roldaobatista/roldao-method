#!/usr/bin/env bash
# block-mock-in-integration.sh — bloqueia mock em arquivos de integration/e2e.
# Hook PreToolUse, matcher: Write|Edit.
# TST-003 — nao testar com mock o que vai pra producao real.

set -uo pipefail
INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/no-mock.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Aplica apenas se path indica integration/e2e
case "$FILE_PATH" in
  *integration*|*e2e*|*end-to-end*|*spec/integration*|*test/integration*|*tests/integration*) ;;
  *) exit 0 ;;
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

MOCK_PATTERNS=(
  'vi\.mock\('
  'jest\.mock\('
  'sinon\.stub'
  'sinon\.mock'
  'unittest\.mock'
  'from unittest\.mock'
  'Mockito\.when'
  'Mockito\.mock'
  '@MockBean'
  'mock\s*=\s*Mock\('
  'patch\(["'\'']'
)

VIOLATIONS=()
while IFS= read -r line || [ -n "$line" ]; do
  for pat in "${MOCK_PATTERNS[@]}"; do
    if printf '%s\n' "$line" | grep -qE -- "$pat"; then
      if printf '%s\n' "$line" | grep -qE 'TST-003-exception|justificativa-mock'; then
        continue
      fi
      VIOLATIONS+=("$pat  ->  $line")
    fi
  done
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[block-mock-in-integration] BLOQUEADO: mock detectado em teste de integracao/E2E.

Arquivo: $FILE_PATH

Violacoes encontradas:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: TST-003 — nao testar com mock o que vai pra producao real.

Integration/E2E test que mocka tudo nao testa a integracao. Use:
  - banco de teste real (Docker, fixture, transaction rollback)
  - ambiente de homologacao da SEFAZ/RFB para teste fiscal
  - sandbox do gateway de pagamento

Excecao: se MESMO assim precisa do mock (timeout extremo, terceiro fora do ar),
adicione na mesma linha:
  // TST-003-exception: <razao clara>
EOF
  exit 2
fi

exit 0
