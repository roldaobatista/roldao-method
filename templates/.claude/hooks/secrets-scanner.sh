#!/usr/bin/env bash
# secrets-scanner.sh — bloqueia escrita de arquivos com segredos.
# Hook PreToolUse, matcher: Write|Edit.
# SEC-001.

set -u

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

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Permitir arquivos de exemplo/template explícitos
ALLOWED_SUFFIXES='\.(example|sample|template|tpl|dist)$'
SKIP_PATH_CHECK=""

if printf '%s\n' "$FILE_PATH" | grep -qE -- "$ALLOWED_SUFFIXES"; then
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
      exit 2
    fi
  done
fi

# Padrões de segredo dentro do conteúdo
CONTENT_PATTERNS=(
  'AKIA[0-9A-Z]{16}'                              # AWS Access Key
  'aws_secret_access_key[[:space:]]*=[[:space:]]*[A-Za-z0-9/+=]{40}'
  '-----BEGIN[[:space:]]+[A-Z]+[[:space:]]+(PRIVATE[[:space:]]+)?KEY-----'
  '-----BEGIN[[:space:]]+PRIVATE[[:space:]]+KEY-----'
  'sk-[A-Za-z0-9]{32,}'                           # OpenAI-style
  'sk-ant-(api[0-9]{2}-)?[A-Za-z0-9_-]{32,}'      # Anthropic (cobre sk-ant-api03-...)
  'ghp_[A-Za-z0-9]{36}'                           # GitHub PAT
  'github_pat_[A-Za-z0-9_]{82}'                   # GitHub PAT fine-grained
  'xox[baprs]-[A-Za-z0-9-]{10,}'                  # Slack
  'AIza[0-9A-Za-z_-]{35}'                         # Google API
  'sk_live_[0-9a-zA-Z]{16,}'                      # Stripe live key
  'rk_live_[0-9a-zA-Z]{16,}'                      # Stripe restricted live key
  'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'  # JWT (header.payload.sig)
)

for pat in "${CONTENT_PATTERNS[@]}"; do
  if grep -qE -- "$pat" "$TMPF"; then
    cat >&2 <<EOF
[secrets-scanner] BLOQUEADO: conteúdo contém possível segredo.

Arquivo destino: $FILE_PATH
Padrão detectado: $pat

Regra: SEC-001. Se este valor é exemplo/placeholder, substitua por valor obviamente fake (ex: "AKIA-EXAMPLE-DO-NOT-USE").
EOF
    exit 2
  fi
done

exit 0
