#!/usr/bin/env bash
# no-hardcoded-env-urls.sh — bloqueia URL/host de servico externo hardcoded.
# Hook PreToolUse, matcher: Write|Edit.
# SEC-005 — URLs/hosts de producao sempre via variavel de ambiente, nunca hardcoded.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/no-hardcoded.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Nao se aplica a configs declarativas (variaveis de ambiente vivem aqui)
case "$FILE_PATH" in
  *.env*|*config*.example*|*.example*|*README*|*.md|*docs/*) exit 0 ;;
  *test*|*spec*|*fixture*|*mock*) exit 0 ;;
esac

# So aplica a codigo
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs|*.swift) ;;
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

# Dominios sensiveis BR + globais que NUNCA devem ser hardcoded
SENSITIVE_DOMAINS=(
  'api\.sefaz\.[a-z]+\.gov\.br'
  'nfe\.fazenda\.gov\.br'
  'homologacao\.nfe\.fazenda\.gov\.br'
  'producao\.nfe\.fazenda\.gov\.br'
  'pix\.bcb\.gov\.br'
  'matls-api\.bcb\.gov\.br'
  'api\.openfinancebrasil\.org\.br'
  'esocial\.gov\.br'
  'webservices\.nfe\.[a-z]+\.gov\.br'
  'gov\.br/receita'
  'api\.stripe\.com'
  'api\.openai\.com'
  'api\.anthropic\.com'
  'api\.pagar\.me'
  'api\.asaas\.com'
  'api\.mercadopago\.com'
  'api\.pagseguro\.uol\.com\.br'
  'gerencianet\.com\.br'
)

VIOLATIONS=()
LINE_NUM=0
while IFS= read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))
  # ignora comentarios
  trimmed=$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//')
  case "$trimmed" in
    //*|\#*|/\**|\**) continue ;;
  esac
  for dom in "${SENSITIVE_DOMAINS[@]}"; do
    if printf '%s\n' "$line" | grep -qE "https?://$dom"; then
      if printf '%s\n' "$line" | grep -qE 'SEC-005-exception|env\.|process\.env|os\.environ|getenv|ENV\[|Deno\.env'; then
        continue
      fi
      VIOLATIONS+=("linha $LINE_NUM: $dom  ->  $line")
    fi
  done
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[no-hardcoded-env-urls] BLOQUEADO: URL de servico externo hardcoded.

Arquivo: $FILE_PATH

Violacoes encontradas:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: SEC-005 — URLs de servicos externos (SEFAZ, Pix, gateways, APIs pagas)
SEMPRE vem de variavel de ambiente, nunca hardcoded.

Por que:
  - Voce nao pode trocar URL sem deploy (homologacao vs producao).
  - Voce arrisca chamar producao em ambiente de teste.
  - Voce esconde dependencia externa do operador de infra.

Correto:
  const SEFAZ_URL = process.env.SEFAZ_URL;
  if (!SEFAZ_URL) throw new Error('SEFAZ_URL nao configurada');

Excecao: se MESMO assim e necessario (ex: URL canonica imutavel publicada em RFC),
adicione na mesma linha:
  // SEC-005-exception: <razao>
EOF
  exit 2
fi

exit 0
