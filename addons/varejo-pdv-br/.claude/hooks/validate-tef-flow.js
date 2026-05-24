#!/usr/bin/env node
// validate-tef-flow.js — bloqueia PAN em texto puro + avisa fluxo TEF incompleto.
// Hook PreToolUse, matcher: Write|Edit. PDV-002.

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

const TEF_PATH_RE = /tef|TEF|pdv|PDV|pagamento|payment/;
const EXCLUDED_PATH_RE = /\.md$|\/docs\/|test|spec/;
const PAN_RE = /\b\d{13,19}\b/g;
const CARD_CTX_RE = /card|pan|cartao|credit|debit|number|numero/i;
const TEF_START_RE = /(start|init|iniciar)\s*(transac|tef|payment)/i;
const TEF_CONFIRM_RE = /confirma|CONFIRMACAO|confirm\s*payment|capture/i;
const PENDING_RE = /PENDING|pendente|aguardando/i;
const RECONCILE_RE = /reconcil|consultar.{0,20}pending|resolver.{0,20}pendent/i;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!TEF_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  // PAN em texto puro com contexto de cartao = BLOQUEIO
  const lines = String(content).split(/\r?\n/);
  const panHits = [];
  lines.forEach((line, i) => {
    const matches = line.match(PAN_RE);
    if (matches) {
      for (const m of matches) panHits.push(`${i + 1}:${line}`);
    }
  });

  if (panHits.length > 0 && CARD_CTX_RE.test(content)) {
    process.stderr.write(`[validate-tef-flow] BLOQUEADO: numero de cartao (PAN) em texto puro detectado.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nPAN aparente:\n`);
    for (const h of panHits.slice(0, 5)) process.stderr.write(`${h}\n`);
    process.stderr.write(`\nRegra: PDV-002. PAN nunca em codigo/log/cupom/banco. Use SEMPRE token do gateway:\n`);
    process.stderr.write(`  - Stone: tid\n`);
    process.stderr.write(`  - Cielo: tid\n`);
    process.stderr.write(`  - Rede: tid\n`);
    process.stderr.write(`  - GetNet: tid\n`);
    process.stderr.write(`  - PagSeguro: paymentId\n\n`);
    process.stderr.write(`Cupom imprime so ultimos 4 digitos: **** 1234.\n\n`);
    process.stderr.write(`Excecao: //PDV-002-exception: <razao> + aprovacao security review.\n`);
    process.exit(2);
  }

  // TEF sem CONFIRMACAO ou PENDING sem reconcil = AVISO (nao bloqueia)
  const warnings = [];
  if (TEF_START_RE.test(content) && !TEF_CONFIRM_RE.test(content)) {
    warnings.push("TEF iniciado mas nao parece ter passo de CONFIRMACAO. Sem CONFIRMACAO, gateway pode desfazer pagamento.");
  }
  if (PENDING_RE.test(content) && !RECONCILE_RE.test(content)) {
    warnings.push("Status PENDING detectado mas sem reconciliacao. Implemente consulta de pendentes no startup.");
  }

  if (warnings.length > 0) {
    process.stderr.write(`[validate-tef-flow] AVISO: fluxo TEF incompleto.\n\nArquivo: ${filePath}\n\n`);
    for (const w of warnings) process.stderr.write(`  - ${w}\n`);
    process.stderr.write(`\nFluxo correto TEF:\n`);
    process.stderr.write(`  1. Iniciar transacao -> gateway responde TID + PENDING\n`);
    process.stderr.write(`  2. Cliente paga\n`);
    process.stderr.write(`  3. Gateway confirma (APPROVED ou DECLINED)\n`);
    process.stderr.write(`  4. CONFIRMACAO no nosso lado -> registra TID\n`);
    process.stderr.write(`  5. Se cair entre 2-4: status PENDING\n`);
    process.stderr.write(`  6. Startup seguinte: consulta gateway pelos PENDING -> resolve\n`);
    // Aviso, nao bloqueio
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[validate-tef-flow] erro interno: ${err.message}\n`);
  process.exit(2);
});
