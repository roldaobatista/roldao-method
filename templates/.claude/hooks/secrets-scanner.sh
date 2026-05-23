#!/usr/bin/env bash
# secrets-scanner.sh — bloqueia escrita de arquivos com segredos.
# Hook PreToolUse, matcher: Write|Edit.
# SEC-001.

set -uo pipefail
# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/secrets-scan.$$"
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

# Fail-closed parcial: se o parser falhou mas ha input, ainda escaneia o
# conteudo cru (um segredo num Write com JSON quebrado nao pode passar).
if [ ! -s "$TMPF" ] && [ -n "$INPUT" ]; then
  printf '%s' "$INPUT" > "$TMPF"
fi

# Permitir arquivos de exemplo/template explícitos (pula SO a checagem de path,
# nunca a de conteudo — segredo real em .env.example continua bloqueado).
ALLOWED_SUFFIXES='\.(example|sample|template|tpl|dist)$'
SKIP_PATH_CHECK=""

if [ -z "$FILE_PATH" ]; then
  # Sem path: nao da pra checar caminho proibido, mas conteudo ainda e escaneado.
  if [ ! -s "$TMPF" ]; then
    exit 0
  fi
  SKIP_PATH_CHECK=1
elif printf '%s\n' "$FILE_PATH" | grep -qE -- "$ALLOWED_SUFFIXES"; then
  SKIP_PATH_CHECK=1
fi

# Caminhos proibidos
BLOCKED_PATHS=(
  '\.env$'
  '\.env\.(local|production|prod|dev|staging|stg|secret)$'
  '/secrets/'
  'credentials\.json$'
  '\.pem$'
  '\.key$'
  'id_rsa'
  'id_ed25519'
  '\.p12$'
  '\.pfx$'
)

if [ -z "$SKIP_PATH_CHECK" ]; then
  for pat in "${BLOCKED_PATHS[@]}"; do
    if printf '%s\n' "$FILE_PATH" | grep -qE -- "$pat"; then
      cat >&2 <<EOF
[secrets-scanner] BLOQUEADO: tentativa de escrever arquivo sensível.

Arquivo: $FILE_PATH
Padrão: $pat

Regra: SEC-001 — nunca versionar segredos.
Use variável de ambiente ou cofre (vault). Se for arquivo de EXEMPLO, use sufixo .example (ex: .env.example).
EOF
      record_metric block secrets-scanner "filename: $pat"
      exit 2
    fi
  done
fi

# Padrões de segredo dentro do conteúdo: lista canônica compartilhada
# (_lib.sh) + senha inline literal específica deste hook (exige aspas).
CONTENT_PATTERNS=()
while IFS= read -r _p; do
  [ -n "$_p" ] && CONTENT_PATTERNS+=("$_p")
done < <(secret_token_patterns)
CONTENT_PATTERNS+=('(password|passwd|senha)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"' ]{6,}')
# Variante sem aspas (Python, YAML, .env, conf): `password = abc123def` (Segurança A3).
# Exige >=6 chars no valor pra evitar pegar `password = a` em testes de string.
CONTENT_PATTERNS+=('(^|[[:space:]])(password|passwd|senha)[[:space:]]*[:=][[:space:]]*[A-Za-z0-9_+/=!@#$%^&*-]{8,}([[:space:]]|$)')

for pat in "${CONTENT_PATTERNS[@]}"; do
  if grep -qE -- "$pat" "$TMPF"; then
    cat >&2 <<EOF
[secrets-scanner] BLOQUEADO: conteúdo contém possível segredo.

Arquivo destino: $FILE_PATH
Padrão detectado: $pat

Regra: SEC-001. Se este valor é exemplo/placeholder, substitua por valor obviamente fake (ex: "AKIA-EXAMPLE-DO-NOT-USE").
EOF
    record_metric block secrets-scanner "content: $pat"
    exit 2
  fi
done

exit 0
