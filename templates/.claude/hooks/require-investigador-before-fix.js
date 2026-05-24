#!/usr/bin/env node
// require-investigador-before-fix.js — exige investigador antes de Edit/Write em codigo
// quando o prompt original mencionou bug (REGRA #0).
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart)$/;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const markBug = path.join(projdir, '.claude', '.runtime', `bug-trigger-${sess}`);
  const markInv = path.join(projdir, '.claude', '.runtime', `investigator-invoked-${sess}`);

  if (!fs.existsSync(markBug)) process.exit(0);
  if (fs.existsSync(markInv)) process.exit(0);

  process.stderr.write(`[require-investigador-before-fix] Bloqueei Edit/Write em codigo de negocio.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n`);
  process.stderr.write(`Motivo: o pedido inicial falou de bug/comportamento errado e o Detetive\n`);
  process.stderr.write(`(investigador) ainda nao rodou. Mexer no codigo agora vira fix-no-sintoma\n`);
  process.stderr.write(`(REGRA #0 — INV-006).\n\n`);
  process.stderr.write(`Como destravar: rode /investigar ou /bug primeiro — o Detetive le banco/log/\n`);
  process.stderr.write(`payload, identifica causa raiz e libera a edicao.\n\n`);
  process.stderr.write(`Bypass (so se o usuario autorizar): touch ${markInv}\n`);
  recordMetric('block', 'require-investigador-before-fix', `edit em ${filePath} sem investigador`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-investigador-before-fix] erro interno: ${err.message}\n`);
  process.exit(2);
});
