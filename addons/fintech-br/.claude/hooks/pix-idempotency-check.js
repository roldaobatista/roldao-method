#!/usr/bin/env node
// pix-idempotency-check.js — bloqueia criacao de cobranca Pix sem defesa contra
// duplicacao (PIX-001 + PIX-003 do core / PIX-EXT-001).
//
// Hook PreToolUse, matcher: Write|Edit.
//
// Auditoria 2026-05-25 (regra #29): PIX-001 e PIX-003 estavam so na doutrina
// do agente pix-arch — sem detector. Dupla cobranca / dupla devolucao Pix
// e a falha #1 de fintech BR; precisa hook real.
//
// PIX-001: idempotencia por TxId. Combinar 3 camadas:
//   1. TxId deterministico (hash do pedido)
//   2. Idempotency-Key (header HTTP)
//   3. UNIQUE no banco (txid coluna)
//
// PIX-003: EndToEndId persistido em coluna indexada (idealmente UNIQUE).
// Matching por nome+valor e proibido — pivot unico de conciliacao e o
// EndToEndId (e2e).

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
// So dispara em arquivo cujo path sugere fluxo Pix
const PIX_PATH_RE = /pix|cobranca|cob|pagamento|payment/i;

// Indicios fortes de criacao de cobranca Pix:
//   - chamada a POST /cob, /cobv (Bacen DICT)
//   - funcao criarCobranca, criar_cob, createPixCharge, createCob
//   - schema EMV com pix1.bcb.gov.br
const CRIACAO_COBRANCA_RE = /(POST\s+["'`]\/cobv?\b|criarCobranca|criar_cob|createPixCharge|createCob|pixCobrancaCriar|pix_cobranca_criar|cobv?\.criar|pix\.cobranca|pix1\.bcb\.gov\.br)/i;

// Idempotency-Key (header HTTP de retry-safe)
const IDEMPOTENCY_KEY_RE = /idempotency[-_]?key|x-idempotency|x[-_]request[-_]id/i;

// TxId deterministico OU UNIQUE no banco
// TxId deterministico = hash do pedido (sha256/md5 + pedido_id)
const TXID_DETERMINISTICO_RE = /(txid\s*=\s*(crypto\.|hashlib|hashes\.|md5|sha[12]?56|sha1|deriva))|(txid_hash|txid_pedido|generateTxId|gerarTxId)/i;
// UNIQUE no schema (migration ou CREATE TABLE proximo)
const UNIQUE_DB_RE = /UNIQUE\s*\(\s*txid|UNIQUE\s+INDEX[^,;]*txid|@@unique\(\[.*txid|unique:\s*\[?["']txid|txid.*\bunique\b/i;

// Lock distribuido pra prevenir corrida
const LOCK_RE = /redis\.(?:lock|SET\s+NX|setnx)|distributed[-_]?lock|advisory[-_]?lock|SELECT\s+FOR\s+UPDATE/i;

// EndToEndId persistido em coluna indexada (PIX-003)
const E2E_PERSISTENCIA_RE = /(endtoendid|end_to_end_id|e2eid|e2e_id)/i;
const E2E_INDICE_RE = /(INDEX|UNIQUE|@@index|@@unique|@unique|index:).*\b(endtoendid|end_to_end_id|e2eid|e2e_id)/i;
// Anti-padrao PIX-003: matching por nome+valor (proibido — usa-se e2e)
const MATCHING_NOME_VALOR_RE = /(WHERE\s+(payer_?name|nome_?pagador)\s*=.*AND\s+(valor|amount|value)\s*=)|match.*by.*(name|nome).*value/i;

const EXCEPTION_RE = /PIX-001-exception|PIX-003-exception|PIX-EXT-001-exception/;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);
  if (!PIX_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);
  if (EXCEPTION_RE.test(content)) process.exit(0);

  const violations = [];

  // Cenario 1: criacao de cobranca sem nenhuma defesa de idempotencia
  if (CRIACAO_COBRANCA_RE.test(content)) {
    const temIdempotencyKey = IDEMPOTENCY_KEY_RE.test(content);
    const temTxIdDeterministico = TXID_DETERMINISTICO_RE.test(content);
    const temUnique = UNIQUE_DB_RE.test(content);
    const temLock = LOCK_RE.test(content);
    // Exige pelo menos 2 das 4 camadas (PIX-001: combinar camadas)
    const camadas = [temIdempotencyKey, temTxIdDeterministico, temUnique, temLock].filter(Boolean).length;
    if (camadas < 2) {
      violations.push(
        `[PIX-001] criacao de cobranca Pix sem defesa suficiente contra duplicacao. ` +
        `Encontrado: ${camadas}/4 camadas (Idempotency-Key, TxId deterministico, UNIQUE(txid), lock distribuido). ` +
        `Combinar pelo menos 2.`
      );
    }
  }

  // Cenario 2: matching por nome+valor (anti-padrao PIX-003)
  if (MATCHING_NOME_VALOR_RE.test(content)) {
    violations.push(
      `[PIX-003] matching de Pix por nome+valor detectado. Use EndToEndId — pivot unico de conciliacao. ` +
      `Matching por nome e proibido (nome pode mudar entre PSPs).`
    );
  }

  // Cenario 3: EndToEndId persistido sem indice (PIX-003)
  if (E2E_PERSISTENCIA_RE.test(content) && /CREATE\s+TABLE|@@map|@db\.|migration|schema/i.test(content)) {
    if (!E2E_INDICE_RE.test(content)) {
      violations.push(
        `[PIX-003] coluna EndToEndId encontrada em schema sem indice declarado. ` +
        `Adicione INDEX ou UNIQUE — sem indice a conciliacao financeira fica O(N).`
      );
    }
  }

  if (violations.length === 0) process.exit(0);

  process.stderr.write(`[pix-idempotency-check] BLOQUEADO: cobranca Pix sem defesa contra duplicacao.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes:\n`);
  for (const v of violations) process.stderr.write(`  - ${v}\n`);
  process.stderr.write(`\nPor que importa:\n`);
  process.stderr.write(`  Pix duplicado = dupla cobranca do cliente OU dupla devolucao da empresa.\n`);
  process.stderr.write(`  E a falha #1 de fintech BR. PIX-001 + PIX-003 do core (REGRAS-INEGOCIAVEIS.md)\n`);
  process.stderr.write(`  exigem combinacao de camadas — qualquer 1 sozinha falha sob carga.\n\n`);
  process.stderr.write(`Como corrigir (idempotencia):\n\n`);
  process.stderr.write(`  // 1. TxId deterministico (mesmo pedido = mesmo TxId)\n`);
  process.stderr.write(`  const txid = crypto.createHash('sha256')\n`);
  process.stderr.write(`    .update(pedido.id + pedido.valor + cliente.cpf)\n`);
  process.stderr.write(`    .digest('hex').slice(0, 25);\n\n`);
  process.stderr.write(`  // 2. Header Idempotency-Key na chamada ao PSP\n`);
  process.stderr.write(`  headers: { 'Idempotency-Key': txid, ... }\n\n`);
  process.stderr.write(`  // 3. UNIQUE no banco\n`);
  process.stderr.write(`  CREATE UNIQUE INDEX idx_pix_txid ON pix_cobrancas (txid);\n\n`);
  process.stderr.write(`  // 4. (opcional) lock distribuido (Redis SETNX) pra corrida em alta carga\n\n`);
  process.stderr.write(`Para EndToEndId (PIX-003):\n`);
  process.stderr.write(`  CREATE UNIQUE INDEX idx_pix_e2e ON pix_recebimentos (endtoendid);\n`);
  process.stderr.write(`  // matching por e2e, NUNCA por nome+valor\n\n`);
  process.stderr.write(`Excecao no arquivo (use com aval do auditor-seguranca):\n`);
  process.stderr.write(`  // PIX-001-exception: <razao tecnica>\n`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[pix-idempotency-check] erro interno: ${err.message}\n`);
  process.exit(2);
});
