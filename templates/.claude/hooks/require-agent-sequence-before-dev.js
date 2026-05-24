#!/usr/bin/env node
// require-agent-sequence-before-dev.js — exige Sofia, Detetive e (condicional) Rafael
// antes de Edit/Write em codigo de negocio durante /feature.
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$|\.claude\/\.runtime\//;
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
  const runtime = path.join(projdir, '.claude', '.runtime');
  const m = (name) => path.join(runtime, `${name}-${sess}`);

  if (!fs.existsSync(m('feature-active'))) process.exit(0);

  const missing = [];
  if (!fs.existsSync(m('sofia-done'))) missing.push('rodar /feature → Sofia (define o que entregar)');
  if (!fs.existsSync(m('detetive-done'))) missing.push('rodar /feature → Detetive (le o codigo atual antes de mexer)');
  if (!fs.existsSync(m('rafael-done')) && !fs.existsSync(m('rafael-skipped'))) {
    missing.push('rodar /feature → Rafael (so se houver decisao arquitetural; senao crie rafael-skipped)');
  }

  if (missing.length === 0) process.exit(0);

  process.stderr.write(`[require-agent-sequence-before-dev] Bloqueei Edit/Write em codigo de negocio.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n`);
  process.stderr.write(`Motivo: voce esta no /feature mas pulou etapas obrigatorias.\n\nFalta:\n`);
  for (const item of missing) process.stderr.write(`  - ${item}\n`);
  process.stderr.write(`\nComo destravar: volte ao /feature em ordem. Sem isso o codigo sai sem AC testavel\n`);
  process.stderr.write(`ou trata sintoma em vez de causa raiz (REGRA #0). Regras: INV-AGENT-005/006.\n`);
  recordMetric('block', 'require-agent-sequence-before-dev', `etapas faltando: ${missing.length}`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-agent-sequence-before-dev] erro interno: ${err.message}\n`);
  process.exit(2);
});
