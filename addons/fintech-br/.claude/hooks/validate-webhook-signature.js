#!/usr/bin/env node
// validate-webhook-signature.js — bloqueia handler de webhook sem validacao HMAC.
// Hook PreToolUse, matcher: Write|Edit. PIX-EXT-002.
// Port v1.0.1 — Node puro, sem dependencia de bash/perl.

function readStdinJson() {
  return new Promise((resolve) => {
    let raw = '';
    if (process.stdin.isTTY) { resolve({}); return; }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { raw += c; });
    process.stdin.on('end', () => {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php)$/;
const WEBHOOK_PATH_RE = /webhook|Webhook|pix|Pix|callback|hook/;

const HANDLER_RE = /app\.post|router\.post|@app\.route.*POST|def webhook|fastapi.*post|router\.add.*POST/i;
const PAYMENT_RE = /pix|payment|pagamento|webhook|hook|callback/i;
const HMAC_RE = /verify.*signature|validate.*signature|hmac|verifyHMAC|verify_hmac|crypto\.createHmac|crypto\.timingSafeEqual|hmac\.compare|constant_time_compare/i;
const EXCEPTION_RE = /PIX-EXT-002-exception|SEC-WEBHOOK-exception/;
const MTLS_RE = /mtls|client_cert|x-forwarded-for.*whitelist|ip_whitelist|allowed_ips/i;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);
  if (!WEBHOOK_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  if (!HANDLER_RE.test(content)) process.exit(0);
  if (!PAYMENT_RE.test(content)) process.exit(0);
  if (HMAC_RE.test(content)) process.exit(0);
  if (EXCEPTION_RE.test(content)) process.exit(0);
  if (MTLS_RE.test(content)) process.exit(0);

  process.stderr.write(`[validate-webhook-signature] BLOQUEADO: handler de webhook sem validacao de assinatura.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n\n`);
  process.stderr.write(`Detectada rota POST com palavra-chave de pagamento (pix/payment/webhook/callback),\n`);
  process.stderr.write(`mas nao foi encontrada validacao de assinatura HMAC ou mTLS no handler.\n\n`);
  process.stderr.write(`Regra: PIX-EXT-002 — webhook que dispara acao financeira (Pix recebido, devolucao,\n`);
  process.stderr.write(`status) DEVE validar a assinatura na primeira linha. Sem isso, qualquer um pode\n`);
  process.stderr.write(`forjar pedido e marcar Pix como pago.\n\n`);
  process.stderr.write(`Como corrigir:\n\n`);
  process.stderr.write(`  // PIX-EXT-002: validar assinatura HMAC primeiro\n`);
  process.stderr.write(`  const signature = req.headers['x-signature'];\n`);
  process.stderr.write(`  const expected = crypto\n`);
  process.stderr.write(`    .createHmac('sha256', process.env.WEBHOOK_SECRET)\n`);
  process.stderr.write(`    .update(JSON.stringify(req.body))\n`);
  process.stderr.write(`    .digest('hex');\n\n`);
  process.stderr.write(`  // timingSafeEqual lanca RangeError se os buffers tiverem tamanhos diferentes\n`);
  process.stderr.write(`  // (header ausente/malformado vira erro 500 e vira oraculo de timing). Compare\n`);
  process.stderr.write(`  // o tamanho ANTES e proteja com try/catch.\n`);
  process.stderr.write(`  const sigBuf = Buffer.from(String(signature || ''), 'hex');\n`);
  process.stderr.write(`  const expBuf = Buffer.from(expected, 'hex');\n`);
  process.stderr.write(`  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {\n`);
  process.stderr.write(`    return res.status(401).send();\n`);
  process.stderr.write(`  }\n\n`);
  process.stderr.write(`  // ... resto do handler\n\n`);
  process.stderr.write(`Alternativas aceitas: mTLS com certificado cliente, IP whitelist do PSP.\n\n`);
  process.stderr.write(`Excecao na primeira linha do arquivo (use com aval do auditor-seguranca):\n`);
  process.stderr.write(`  // PIX-EXT-002-exception: <razao tecnica>\n`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[validate-webhook-signature] erro interno: ${err.message}\n`);
  process.exit(2);
});
