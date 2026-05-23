#!/usr/bin/env node
// anti-mascaramento.js — bloqueia padroes que mascaram erro/teste falho.
// Hook PreToolUse, matcher: Write|Edit. TST-001, INV-006.
//
// Port Node do anti-mascaramento.sh (EP-001/US-104). Mesma lista de 21
// padroes; mesma excecao TST-001-exception na mesma linha; mesmo limite
// de 3 violacoes mostradas em stderr.

const { readStdinJson, recordMetric } = require('./_lib.js');

// Padroes de mascaramento. Tokens literais (--no-verify, --skip-tests) montados
// via concat pra nao acionar o proprio hook quando escaneia este source.
const TOKEN_RAW = [
  '@ts-ignore',
  '@ts-nocheck',
  '// eslint-disable',
  '/\\* eslint-disable',
  '# noqa',
  '# type:\\s*ignore',
  '@SuppressWarnings',
  'assertTrue\\(true\\)',
  'assertEquals\\(1,\\s*1\\)',
  'expect\\(true\\)\\.toBe\\(true\\)',
  '\\.skip\\(',
  '\\bxit\\(',
  '\\bfit\\(',
  '\\bfdescribe\\(',
  'pytest\\.mark\\.skip',
  '\\.todo\\(',
  '@Disabled',
  '\\|\\|\\s*true(\\s*($|;|#|&|\\|))',
  '--' + 'no-verify',
  '--' + 'skip-tests',
  '--' + 'ignore-errors',
  'pytest\\.skip',
];

const COMBINED_RE = new RegExp(TOKEN_RAW.join('|'), 'i');
const EXCEPTION_RE = /TST-001-exception:\s*\S+/i;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const lines = String(content).split(/\r?\n/);
  const violations = [];
  lines.forEach((line, idx) => {
    if (!COMBINED_RE.test(line)) return;
    if (EXCEPTION_RE.test(line)) return;
    violations.push(`${idx + 1}:${line}`);
  });

  if (violations.length > 0) {
    const MAX = 3;
    process.stderr.write(`[anti-mascaramento] Bloqueei a escrita: padrao de mascaramento detectado.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\n`);
    process.stderr.write(`Violacoes (mostrando ate ${MAX}):\n`);
    for (let i = 0; i < Math.min(MAX, violations.length); i++) {
      process.stderr.write(`  - ${violations[i]}\n`);
    }
    if (violations.length > MAX) {
      process.stderr.write(`  (... e mais ${violations.length - MAX} ocorrencia(s))\n`);
    }
    process.stderr.write(`\nPor que: teste mascarado = bug silencioso. O teste falhou porque o CODIGO\n`);
    process.stderr.write(`esta errado — esconder o erro nao corrige nada, so atrasa a descoberta.\n`);
    process.stderr.write(`Corrija o codigo, nao o teste.\n\n`);
    process.stderr.write(`Excecao com prazo (use so se for inevitavel):\n`);
    process.stderr.write(`  // TST-001-exception: <razao + prazo, ex: "API externa fora ate 2026-05-25">\n\n`);
    process.stderr.write(`Regra: TST-001.\n`);
    recordMetric('block', 'anti-mascaramento', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[anti-mascaramento] erro interno: ${err.message}\n`);
  process.exit(2);
});
