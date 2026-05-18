#!/usr/bin/env bash
# validate-tef-flow.sh — alerta sobre TEF sem CONFIRMACAO ou PAN em texto puro.
# Hook PreToolUse, matcher: Write|Edit.
# PDV-002.

set -u

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

# So aplica a codigo de TEF/PDV
case "$FILE_PATH" in
  *tef*|*TEF*|*pdv*|*PDV*|*pagamento*|*payment*) ;;
  *.md|*docs/*|*test*|*spec*) exit 0 ;;
  *) exit 0 ;;
esac

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/tef-flow.$$"
trap 'rm -f "$TMPF"' EXIT

printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
' > "$TMPF" 2>/dev/null

[ -s "$TMPF" ] || exit 0

# Detectar PAN (numero cartao) em texto puro
# Padrao: 13-19 digitos seguidos perto de palavras de cartao
PAN_HITS=$(grep -nE '\b[0-9]{13,19}\b' "$TMPF" | head -n5 || true)
if [ -n "$PAN_HITS" ]; then
  # verificar contexto: aparece com "card", "pan", "cartao", "credito", "debito"?
  if grep -iE '(card|pan|cartao|credit|debit|number|numero)' "$TMPF" > /dev/null; then
    cat >&2 <<EOF
[validate-tef-flow] BLOQUEADO: numero de cartao (PAN) em texto puro detectado.

Arquivo: $FILE_PATH

PAN aparente:
$PAN_HITS

Regra: PDV-002. PAN nunca em codigo/log/cupom/banco. Use SEMPRE token do gateway:
  - Stone: tid
  - Cielo: tid
  - Rede: tid
  - GetNet: tid
  - PagSeguro: paymentId

Cupom imprime so ultimos 4 digitos: **** 1234.

Excecao: //PDV-002-exception: <razao> + aprovacao security review.
EOF
    exit 2
  fi
fi

# Verificar TEF sem CONFIRMACAO
WARNINGS=()
if grep -qiE '(start|init|iniciar)[[:space:]]*(transac|tef|payment)' "$TMPF"; then
  if ! grep -qiE 'confirma|CONFIRMACAO|confirm[[:space:]]*payment|capture' "$TMPF"; then
    WARNINGS+=("TEF iniciado mas nao parece ter passo de CONFIRMACAO. Sem CONFIRMACAO, gateway pode desfazer pagamento.")
  fi
fi

# Verificar tratamento de PENDING
if grep -qiE 'PENDING|pendente|aguardando' "$TMPF"; then
  if ! grep -qiE 'reconcil|consultar.{0,20}pending|resolver.{0,20}pendent' "$TMPF"; then
    WARNINGS+=("Status PENDING detectado mas sem reconciliacao. Implemente consulta de pendentes no startup.")
  fi
fi

if [ "${#WARNINGS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[validate-tef-flow] AVISO: fluxo TEF incompleto.

Arquivo: $FILE_PATH

EOF
  for w in "${WARNINGS[@]}"; do
    printf '  - %s\n' "$w" >&2
  done
  cat >&2 <<EOF

Fluxo correto TEF:
  1. Iniciar transacao -> gateway responde TID + PENDING
  2. Cliente paga
  3. Gateway confirma (APPROVED ou DECLINED)
  4. CONFIRMACAO no nosso lado -> registra TID
  5. Se cair entre 2-4: status PENDING
  6. Startup seguinte: consulta gateway pelos PENDING -> resolve
EOF
  # Aviso, nao bloqueio
fi

exit 0
