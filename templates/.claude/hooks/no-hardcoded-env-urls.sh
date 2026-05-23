#!/usr/bin/env bash
# no-hardcoded-env-urls.sh — bloqueia URL/host de servico externo hardcoded.
# Hook PreToolUse, matcher: Write|Edit.
# SEC-005 — URLs/hosts de producao sempre via variavel de ambiente, nunca hardcoded.

set -uo pipefail
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
esac
# Exclusao de testes ancorada em SEGMENTO do path — antes "*test*" pegava
# `src/integrations/test_sefaz_client.ts` (codigo de producao com "test" no nome)
# e desativava o bloqueio. Agora so vale pra arquivo claramente em pasta de teste.
case "$FILE_PATH" in
  */test/*|*/tests/*|*/__tests__/*|*/spec/*|*/specs/*|*/e2e/*|*/cypress/*|*/playwright/*) exit 0 ;;
  *.test.*|*.spec.*|*.e2e.*) exit 0 ;;
  */fixtures/*|*/mocks/*|*/__mocks__/*) exit 0 ;;
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
  # SEFAZ federal + regex generica pra SEFAZ regional (SP, RS, MG, PR, BA, etc) — Fiscal/Pix A3
  'api\.sefaz\.[a-z]+\.gov\.br'
  'nfe\.fazenda\.[a-z]+\.gov\.br'
  'nfe\.fazenda\.gov\.br'
  'homologacao\.nfe\.fazenda\.gov\.br'
  'producao\.nfe\.fazenda\.gov\.br'
  'webservices\.nfe\.[a-z]+\.gov\.br'
  # Contingencia SVC-AN / SVC-RS (FISCAL-004)
  'svc-an\.[a-z]+\.gov\.br'
  'svc-rs\.[a-z]+\.gov\.br'
  # Bacen / Pix / Open Finance
  'pix\.bcb\.gov\.br'
  'matls-api\.bcb\.gov\.br'
  'api\.openfinancebrasil\.org\.br'
  # eSocial / Receita
  'esocial\.gov\.br'
  'gov\.br/receita'
  # Gateways + APIs pagas
  'api\.stripe\.com'
  'api\.openai\.com'
  'api\.anthropic\.com'
  'api\.pagar\.me'
  'api\.asaas\.com'
  'api\.mercadopago\.com'
  'api\.pagseguro\.uol\.com\.br'
  'gerencianet\.com\.br'
  # Sandboxes de BaaS — chamar sandbox de teste em codigo de producao tambem e bug
  'sandbox\.(asaas|pagarme|stripe|mercadopago|gerencianet|stark|efi)\.com'
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
