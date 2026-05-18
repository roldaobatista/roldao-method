#!/usr/bin/env bash
# validate-webhook-signature.sh — bloqueia handler de webhook sem validacao de assinatura.
# Hook PreToolUse, matcher: Write|Edit.
# PIX-EXT-002 — webhook Pix valida assinatura HMAC na primeira linha do handler.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/webhook-sig.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# So aplica a codigo
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php) ;;
  *) exit 0 ;;
esac

# So aplica a arquivos que tem cara de webhook
case "$FILE_PATH" in
  *webhook*|*Webhook*|*pix*|*Pix*|*callback*|*hook*) ;;
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

# Detecta handler de webhook (rota POST + processamento de pagamento)
if ! grep -qiE '(app\.post|router\.post|@app\.route.*POST|def webhook|fastapi.*post|router\.add.*POST)' "$TMPF"; then
  exit 0
fi

# Se a rota POST tem palavras-chave de pagamento mas nao tem verificacao de assinatura, bloquear
if ! grep -qiE '(pix|payment|pagamento|webhook|hook|callback)' "$TMPF"; then
  exit 0
fi

# Tem assinatura sendo validada?
if grep -qiE '(verify.*signature|validate.*signature|hmac|verifyHMAC|verify_hmac|crypto\.createHmac|crypto\.timingSafeEqual|hmac\.compare|constant_time_compare)' "$TMPF"; then
  exit 0
fi

# Tem excecao explicita?
if grep -qE 'PIX-EXT-002-exception|SEC-WEBHOOK-exception' "$TMPF"; then
  exit 0
fi

# Tem mTLS / IP whitelist (alternativa aceitavel)?
if grep -qiE '(mtls|client_cert|x-forwarded-for.*whitelist|ip_whitelist|allowed_ips)' "$TMPF"; then
  exit 0
fi

cat >&2 <<EOF
[validate-webhook-signature] BLOQUEADO: handler de webhook sem validacao de assinatura.

Arquivo: $FILE_PATH

Detectada rota POST com palavra-chave de pagamento (pix/payment/webhook/callback),
mas nao foi encontrada validacao de assinatura HMAC ou mTLS no handler.

Regra: PIX-EXT-002 — webhook que dispara acao financeira (Pix recebido, devolucao,
status) DEVE validar a assinatura na primeira linha. Sem isso, qualquer um pode
forjar pedido e marcar Pix como pago.

Como corrigir:

  // PIX-EXT-002: validar assinatura HMAC primeiro
  const signature = req.headers['x-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send();
  }

  // ... resto do handler

Alternativas aceitas: mTLS com certificado cliente, IP whitelist do PSP.

Excecao na primeira linha do arquivo (use com aval do auditor-seguranca):
  // PIX-EXT-002-exception: <razao tecnica>
EOF
exit 2
