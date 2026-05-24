#!/usr/bin/env node
// block-todo-without-issue.js — barra TODO/FIXME/XXX/HACK sem referencia rastreavel.
// Hook PreToolUse, matcher: Write|Edit. INV-004.

const { readStdinJson, recordMetric } = require('./_lib.js');

const SKIP_PATH_RE = /\.md$|\.mdx$|CHANGELOG|\.txt$/;
const TODO_RE = /\b(TODO|FIXME|XXX|HACK)\b/;
const ID_RE = /(#[0-9]+|US-[0-9]+|T-[0-9]+|AC-[0-9]+|INV-[0-9]+|SEC-[0-9]+|TST-[0-9]+|LGPD-[0-9]+|FISCAL-[0-9]+|ADR-[0-9]+)/;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (SKIP_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const violations = [];
  String(content).split(/\r?\n/).forEach((line, i) => {
    if (TODO_RE.test(line) && !ID_RE.test(line)) {
      violations.push(`L${i + 1}: ${line}`);
    }
  });

  if (violations.length > 0) {
    process.stderr.write(`[block-todo-without-issue] BLOQUEADO: TODO/FIXME/XXX/HACK sem ID rastreavel.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes encontradas:\n`);
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.stderr.write(`\nRegra: INV-004 — IDs rastreaveis.\n\n`);
    process.stderr.write(`TODO sem rastro vira divida invisivel. Adicione referencia:\n`);
    process.stderr.write(`  // TODO(#123): descricao\n`);
    process.stderr.write(`  // FIXME(US-042): explicacao\n`);
    process.stderr.write(`  // HACK(T-007): contexto\n\n`);
    process.stderr.write(`IDs aceitos: #N, US-N, T-N, AC-N, INV-N, SEC-N, TST-N, LGPD-N, FISCAL-N, ADR-N.\n`);
    recordMetric('block', 'block-todo-without-issue', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[block-todo-without-issue] erro interno: ${err.message}\n`);
  process.exit(2);
});
