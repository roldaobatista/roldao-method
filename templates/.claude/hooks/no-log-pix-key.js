#!/usr/bin/env node
// no-log-pix-key.js — bloqueia chave Pix em texto puro em log/print/console.
// Hook PreToolUse, matcher: Write|Edit. PIX-004 + LGPD-001/004.

const { readStdinJson, recordMetric, normalizeFilePath } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.env|\.example|README|\.md$|\/docs\/|\/test\/|\/tests\/|\/__tests__\/|\/spec\/|\/specs\/|\/e2e\/|\.test\.|\.spec\.|\.e2e\.|\/fixtures\/|\/mocks\/|\/__mocks__\/|\.json$|\.ya?ml$/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift)$/;
const COMMENT_LINE_RE = /^\s*(\/\/|#|\/\*|\*)/;
const LOG_CALL_RE = /console\.(log|info|debug|warn|error)|logger\.|log\.(info|debug|warn|error)|print\(|println|fmt\.Print|System\.out/i;
// Detecta por nome de variavel (cobertura legada — pode ser renomeada pra escapar).
const PIX_VARS_RE = /pix[_-]?key|chave[_-]?pix|cpf|cnpj|endtoendid|e2eid|txid/i;
// Detecta por VALOR em string literal dentro do log — auditoria 2026-05-25
// (hook #4): renomear variavel pra `doc`/`id`/`e2e` escapava do PIX_VARS_RE.
// Agora pega padrao do dado no proprio log mesmo com nome neutro.
//  - CPF formatado: 000.000.000-00
//  - CPF cru entre aspas: '00000000000' (string literal de exatamente 11 digitos)
//  - CNPJ formatado: 00.000.000/0000-00
//  - Email em string literal
//  - EndToEndId Pix (formato E + 8 ISPB + AAMMDDHHMM + 11 alfanum = 32 chars)
//  - UUID v4 (chave Pix aleatoria)
const PIX_VALUE_RE = new RegExp(
  '\\b\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}\\b' +                          // CPF formatado
  '|["\']\\d{11}["\']' +                                              // CPF cru com aspas
  '|\\b\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}\\b' +                  // CNPJ formatado
  '|["\'][A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}["\']' +     // email com aspas
  '|\\bE[0-9A-F]{31}\\b' +                                            // EndToEndId Pix
  '|\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b', // UUID
  'i'
);
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
    if (MASKING_RE.test(line)) return;
    // Casa se houver nome de variavel suspeito OU valor literal com padrao de dado pessoal
    if (!PIX_VARS_RE.test(line) && !PIX_VALUE_RE.test(line)) return;
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
