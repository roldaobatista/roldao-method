#!/usr/bin/env node
// no-log-pix-key.js — bloqueia chave Pix em texto puro em log/print/console.
// Hook PreToolUse, matcher: Write|Edit. PIX-004 + LGPD-001/004.

const { readStdinJson, recordMetric, normalizeFilePath } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.env|\.example|README|\.md$|\/docs\/|\/test\/|\/tests\/|\/__tests__\/|\/spec\/|\/specs\/|\/e2e\/|\.test\.|\.spec\.|\.e2e\.|\/fixtures\/|\/mocks\/|\/__mocks__\/|\.json$|\.ya?ml$/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift)$/;
const COMMENT_LINE_RE = /^\s*(\/\/|#|\/\*|\*)/;
const LOG_CALL_RE = /console\.(log|info|debug|warn|error)|logger\.|log\.(info|debug|warn|error)|print\(|println|fmt\.Print|System\.out/i;
const PIX_VARS_RE = /pix[_-]?key|chave[_-]?pix|cpf|cnpj|endtoendid|e2eid|txid/i;
const MASKING_RE = /mascarar|mask|redact|\*\*\*|PIX-004-exception/i;

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const violations = [];
  String(content).split(/\r?\n/).forEach((line, i) => {
    if (COMMENT_LINE_RE.test(line)) return;
    if (!LOG_CALL_RE.test(line)) return;
    if (!PIX_VARS_RE.test(line)) return;
    if (MASKING_RE.test(line)) return;
    violations.push(`linha ${i + 1}: ${line}`);
  });

  if (violations.length > 0) {
    process.stderr.write(`[no-log-pix-key] BLOQUEADO: chave Pix em log sem mascaramento.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes encontradas:\n`);
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.stderr.write(`\nRegra: PIX-004 + LGPD-001/004 — chave Pix e dado pessoal. Log nunca pode\n`);
    process.stderr.write(`vazar chave em texto puro. Mascarar antes de logar.\n\n`);
    process.stderr.write(`Correto:\n`);
    process.stderr.write(`  console.log('Pix recebido:', mascararChavePix(chave));\n`);
    process.stderr.write(`  // ou: logger.info('Pix recebido', { chave_mascarada: mask(chave) });\n\n`);
    process.stderr.write(`Helper disponivel na skill validar-pix (mascararChavePix).\n\n`);
    process.stderr.write(`Excecao justificada (raro, ex: log interno com retencao curta + criptografia):\n`);
    process.stderr.write(`adicione na mesma linha:\n  // PIX-004-exception: <razao>\n`);
    recordMetric('block', 'no-log-pix-key', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[no-log-pix-key] erro interno: ${err.message}\n`);
  process.exit(2);
});
