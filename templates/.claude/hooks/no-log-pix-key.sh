#!/usr/bin/env bash
# no-log-pix-key.sh — bloqueia chave Pix em texto puro em log/print/console.
# Hook PreToolUse, matcher: Write|Edit.
# PIX-004 + LGPD-001/004 — chave Pix e dado pessoal. Log nunca deve vazar chave em
# texto puro. Mascarar (***@***, ***.***.***-99, +55***********).

set -uo pipefail
INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/no-log-pix.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Nao se aplica a configs, docs, fixtures de teste (la chave fake e ok)
case "$FILE_PATH" in
  *.env*|*.example*|*README*|*.md|*docs/*) exit 0 ;;
  */test/*|*/tests/*|*/__tests__/*|*/spec/*|*/specs/*|*/e2e/*) exit 0 ;;
  *.test.*|*.spec.*|*.e2e.*) exit 0 ;;
  */fixtures/*|*/mocks/*|*/__mocks__/*) exit 0 ;;
  *.json|*.yml|*.yaml) exit 0 ;;  # configs declarativas — auditor manual revisa
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

# Padroes de comando de log + variavel/literal que parece chave Pix
# Detecta: console.log/print/logger.* com cpf|cnpj|pix|chave|key|email|telefone|phone
VIOLATIONS=()
LINE_NUM=0
while IFS= read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))
  # ignora comentarios
  trimmed=$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//')
  case "$trimmed" in
    //*|\#*|/\**|\**) continue ;;
  esac

  # Detecta chamada de log com variavel que parece chave Pix sem mascaramento
  if printf '%s\n' "$line" | grep -qiE '(console\.(log|info|debug|warn|error)|logger\.|log\.(info|debug|warn|error)|print\(|println|fmt\.Print|System\.out)'; then
    if printf '%s\n' "$line" | grep -qiE '(pix[_-]?key|chave[_-]?pix|cpf|cnpj|endtoendid|e2eid|txid)'; then
      # Excecoes: se ja tem mascaramento ou helper
      if printf '%s\n' "$line" | grep -qiE '(mascarar|mask|redact|\*\*\*|PIX-004-exception)'; then
        continue
      fi
      VIOLATIONS+=("linha $LINE_NUM: $line")
    fi
  fi
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[no-log-pix-key] BLOQUEADO: chave Pix em log sem mascaramento.

Arquivo: $FILE_PATH

Violacoes encontradas:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: PIX-004 + LGPD-001/004 — chave Pix e dado pessoal. Log nunca pode
vazar chave em texto puro. Mascarar antes de logar.

Correto:
  console.log('Pix recebido:', mascararChavePix(chave));
  // ou: logger.info('Pix recebido', { chave_mascarada: mask(chave) });

Helper disponivel na skill validar-pix (mascararChavePix).

Excecao justificada (raro, ex: log interno com retencao curta + criptografia):
adicione na mesma linha:
  // PIX-004-exception: <razao>
EOF
  exit 2
fi

exit 0
