#!/usr/bin/env node
// context-budget.js — avisa quando AGENTS.md / CLAUDE.md crescem alem do limite.
// Hook SessionStart. INV-005.

const fs = require('fs');
const path = require('path');
const { sanitizeProjdir } = require('./_lib.js');

const AGENTS_LIMIT = 200;
const CLAUDE_LIMIT = 150;

function lineCount(file) {
  try { return fs.readFileSync(file, 'utf8').split(/\r?\n/).length - 1; }
  catch { return 0; }
}

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const agents = path.join(projdir, 'AGENTS.md');
  const claude = path.join(projdir, 'CLAUDE.md');
  if (fs.existsSync(agents)) {
    const n = lineCount(agents);
    if (n > AGENTS_LIMIT) {
      process.stderr.write(`[context-budget] AGENTS.md tem ${n} linhas (limite: ${AGENTS_LIMIT}). Consolide ou extraia conteúdo pra ADR/doc específico.\n`);
    }
  }
  if (fs.existsSync(claude)) {
    const n = lineCount(claude);
    if (n > CLAUDE_LIMIT) {
      process.stderr.write(`[context-budget] CLAUDE.md tem ${n} linhas (limite: ${CLAUDE_LIMIT}). Mova conteúdo de produto pra AGENTS.md.\n`);
    }
  }
  process.exit(0);
})().catch(() => process.exit(0));
