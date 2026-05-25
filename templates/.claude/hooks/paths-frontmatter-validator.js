#!/usr/bin/env node
// paths-frontmatter-validator.js — exige frontmatter em docs novos da pasta docs/.
// Hook PreToolUse, matcher: Write|Edit. INV-004.

const path = require('path');
const { readStdinJson, recordMetric, normalizeFilePath } = require('./_lib.js');

const DOC_MD_RE = /docs\/.*\.(md|MD)$/;
const CANONICAL_NAMES = new Set(['README.md', 'INDICE.md', 'CONVENCOES-DOC.md', 'QUICKSTART.md', 'PUBLICAR.md']);

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
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
    process.stderr.write(`[BLOQUEIO] [paths-frontmatter-validator] documento na pasta docs/ precisa de cabecalho de identificacao no topo.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write(`Efeito: arquivo nao foi salvo.\n`);
    process.stderr.write(`Causa: faltam 3 linhas no topo dizendo quem e o dono, quando foi revisado e o status (rascunho/estavel).\n\n`);
    process.stderr.write(`Proximo passo: cole isso na linha 1 do arquivo (entre os tres tracos):\n\n`);
    process.stderr.write(`---\n`);
    process.stderr.write(`owner: <seu nome>\n`);
    process.stderr.write(`revisado-em: 2026-MM-DD\n`);
    process.stderr.write(`status: draft   # ou stable, ou deprecated\n`);
    process.stderr.write(`---\n\n`);
    process.stderr.write(`Por que: agente que abre o documento meses depois precisa saber se ainda vale.\n`);
    process.stderr.write(`Regra: INV-004 (IDs rastreaveis + convencao de docs).\n`);
    recordMetric('block', 'paths-frontmatter-validator', `cabecalho ausente em ${filePath}`);
    process.exit(2);
  }

  // Extrai bloco de cabecalho de identificacao (entre 1o e 2o ---)
  const fmBlock = (cleaned.replace(/^\s*\n/, '').match(/^---\s*\n([\s\S]*?)\n---/) || [, ''])[1];

  for (const field of ['owner', 'revisado-em', 'status']) {
    const re = new RegExp(`^${field}:`, 'm');
    if (!re.test(fmBlock)) {
      process.stderr.write(`[BLOQUEIO] [paths-frontmatter-validator] cabecalho do documento sem campo obrigatorio '${field}' em ${filePath}\n`);
      process.stderr.write(`Adicione a linha "${field}: <valor>" dentro do bloco entre os tres tracos no topo.\n`);
      recordMetric('block', 'paths-frontmatter-validator', `campo '${field}' ausente em ${filePath}`);
      process.exit(2);
    }
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[paths-frontmatter-validator] erro interno: ${err.message}\n`);
  process.exit(2);
});
