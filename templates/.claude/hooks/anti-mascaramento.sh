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
  '# noqa'
  '# type:[[:space:]]*ignore'
  '@SuppressWarnings'
  'assertTrue\(true\)'
  'assertEquals\(1,[[:space:]]*1\)'
  'expect\(true\)\.toBe\(true\)'
  '\.skip\('
  '\bxit\('
  '\bfit\('
  '\bfdescribe\('
  'pytest\.mark\.skip'
  '\.todo\('
  '@Disabled'
  '\|\|[[:space:]]*true([[:space:]]*($|;|#|&|\|))'
  '--no-verify'
  '--skip-tests'
  '--ignore-errors'
  '--silent'
  '--quiet'
  'pytest\.skip'
)

# Varredura em passada única (O(arquivo), não O(linhas×padrões)): junta todos
# os padrões num só regex e roda um grep sobre o arquivo inteiro. Antes era
# 1 subprocesso de grep por linha por padrão — 200KB numa linha levava ~10s.
COMBINED=$(IFS='|'; printf '%s' "${PATTERNS[*]}")

VIOLATIONS=()
while IFS= read -r line || [ -n "$line" ]; do
  # Linha tem justificativa explícita COM razão? (palavra-mágica sem razão não libera)
  if printf '%s\n' "$line" | grep -qiE 'TST-001-exception:[[:space:]]*[^[:space:]]+'; then
    continue
  fi
  VIOLATIONS+=("$line")
done < <(grep -niE -- "$COMBINED" "$TMPF" || true)

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  MAX=3
  cat >&2 <<EOF
[anti-mascaramento] Bloqueei a escrita: padrao de mascaramento detectado.

Arquivo: $FILE_PATH

Violacoes (mostrando ate $MAX):
EOF
  i=0
  for v in "${VIOLATIONS[@]}"; do
    [ "$i" -ge "$MAX" ] && break
    printf '  - %s\n' "$v" >&2
    i=$((i+1))
  done
  if [ "${#VIOLATIONS[@]}" -gt "$MAX" ]; then
    printf '  (... e mais %d ocorrencia(s))\n' "$((${#VIOLATIONS[@]} - MAX))" >&2
  fi
  cat >&2 <<EOF

Por que: teste mascarado = bug silencioso. O teste falhou porque o CODIGO
esta errado — esconder o erro nao corrige nada, so atrasa a descoberta.
Corrija o codigo, nao o teste.

Excecao com prazo (use so se for inevitavel):
  // TST-001-exception: <razao + prazo, ex: "API externa fora ate 2026-05-25">

Regra: TST-001.
EOF
  exit 2
fi

exit 0
