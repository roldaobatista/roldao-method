#!/usr/bin/env node
// paths-frontmatter-validator.js — exige frontmatter em docs novos da pasta docs/.
// Hook PreToolUse, matcher: Write|Edit. INV-004.

const path = require('path');
const { readStdinJson, recordMetric } = require('./_lib.js');

const DOC_MD_RE = /docs\/.*\.(md|MD)$/;
const CANONICAL_NAMES = new Set(['README.md', 'INDICE.md', 'CONVENCOES-DOC.md', 'QUICKSTART.md', 'PUBLICAR.md']);

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (!DOC_MD_RE.test(filePath)) process.exit(0);

  const base = path.basename(filePath);
  if (CANONICAL_NAMES.has(base)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  // Strip BOM + linhas em branco iniciais antes de exigir '---'
  let cleaned = String(content).replace(/^﻿/, '');
  const firstNonBlank = cleaned.split(/\r?\n/).find((l) => l.trim() !== '');

  if (firstNonBlank !== '---') {
    process.stderr.write(`[paths-frontmatter-validator] BLOQUEADO: doc em docs/ deve começar com frontmatter.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nFormato esperado no topo:\n---\nowner: <responsável>\nrevisado-em: YYYY-MM-DD\nstatus: draft | stable | deprecated\n---\n\n`);
    process.stderr.write(`Regra: INV-004 — IDs rastreáveis + convenção de docs.\n`);
    recordMetric('block', 'paths-frontmatter-validator', `frontmatter ausente em ${filePath}`);
    process.exit(2);
  }

  // Extrai bloco de frontmatter (entre 1o e 2o ---)
  const fmBlock = (cleaned.replace(/^\s*\n/, '').match(/^---\s*\n([\s\S]*?)\n---/) || [, ''])[1];

  for (const field of ['owner', 'revisado-em', 'status']) {
    const re = new RegExp(`^${field}:`, 'm');
    if (!re.test(fmBlock)) {
      process.stderr.write(`[paths-frontmatter-validator] BLOQUEADO: frontmatter sem campo obrigatório '${field}' em ${filePath}\n`);
      recordMetric('block', 'paths-frontmatter-validator', `campo '${field}' ausente em ${filePath}`);
      process.exit(2);
    }
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[paths-frontmatter-validator] erro interno: ${err.message}\n`);
  process.exit(2);
});
