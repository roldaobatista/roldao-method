#!/usr/bin/env node
// validate-test-pyramid.js — bloqueia criacao de E2E sem unit tests no mesmo modulo.
// Hook PreToolUse, matcher: Write|Edit. TST-001, TST-002.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, recordMetric } = require('./_lib.js');

const E2E_PATH_RE = /e2e\/|e2e-tests\/|end-to-end\/|\.e2e\.|playwright\/|cypress\/integration\//;
const E2E_DIR_RE = /\/(e2e|e2e-tests|end-to-end|playwright|cypress|cypress\/integration)$/;
const UNSAFE_PATH_RE = /\.\.|^\/|^[A-Za-z]:\\/;

const UNIT_TEST_EXTS = new Set([
  '.test.js', '.test.ts', '.test.jsx', '.test.tsx',
  '.spec.js', '.spec.ts', '.spec.jsx', '.spec.tsx',
]);

function hasUnitTestExt(file) {
  for (const ext of UNIT_TEST_EXTS) {
    if (file.endsWith(ext)) return true;
  }
  return /^test_.*\.py$/.test(file) || /_test\.py$/.test(file) || /_test\.go$/.test(file);
}

function isE2EFile(file) {
  return /\.e2e\./.test(file) || /(\/|\\)(e2e|cypress|playwright)(\/|\\)/.test(file);
}

function walkDir(dir, onFile) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Pula e2e/ e e2e-tests/ ao contar unit tests
      if (/^(e2e|e2e-tests)$/.test(e.name)) continue;
      walkDir(full, onFile);
    } else if (e.isFile()) {
      onFile(full);
    }
  }
}

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (!E2E_PATH_RE.test(filePath)) process.exit(0);

  // Identifica modulo: sobe um nivel se MODULE_DIR termina em /e2e, /cypress, etc.
  let moduleDir = path.dirname(filePath);
  if (E2E_DIR_RE.test(moduleDir)) moduleDir = path.dirname(moduleDir);

  // Sanitizacao: rejeita .., path absoluto/windows
  if (UNSAFE_PATH_RE.test(moduleDir)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }

  const absModule = path.join(projdir, moduleDir);

  let unitCount = 0;
  let e2eCount = 0;
  if (fs.existsSync(absModule)) {
    walkDir(absModule, (file) => {
      if (hasUnitTestExt(path.basename(file))) unitCount++;
      if (isE2EFile(file)) e2eCount++;
    });
  }

  if (unitCount === 0 && e2eCount <= 5) {
    // Override: arquivo de marker libera primeiro E2E em projeto greenfield.
    const allowMarker = path.join(projdir, '.claude', '.runtime', 'allow-e2e-first');
    if (fs.existsSync(allowMarker)) process.exit(0);

    process.stderr.write(`[validate-test-pyramid] BLOQUEADO: criacao de teste E2E sem unit tests no modulo.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write(`Modulo: ${moduleDir}\n`);
    process.stderr.write(`Unit tests no modulo: ${unitCount}\n`);
    process.stderr.write(`E2E tests no modulo: ${e2eCount} (sendo criado mais um)\n\n`);
    process.stderr.write(`Regra: TST-001 + TST-002. E2E e lento, fragil, caro de manter. Sem unit cobrindo\n`);
    process.stderr.write(`casos de borda da logica, E2E vira teste de fumaca caro que nao da feedback util.\n\n`);
    process.stderr.write(`Piramide saudavel:\n`);
    process.stderr.write(`  - Muitos unit tests (rapidos, isolados)\n`);
    process.stderr.write(`  - Alguns integration tests\n`);
    process.stderr.write(`  - Poucos E2E (smoke tests do happy path)\n\n`);
    process.stderr.write(`Acao recomendada:\n`);
    process.stderr.write(`  1. Antes de adicionar E2E, escreva unit tests cobrindo logica de borda do modulo.\n`);
    process.stderr.write(`  2. Se ja tem unit suficiente mas hooks nao detectou, configure pasta esperada\n`);
    process.stderr.write(`     (este hook procura *.test.ts, *.spec.ts, test_*.py, etc).\n\n`);
    process.stderr.write(`Excecao: se este E2E e o primeiro teste do projeto greenfield, autorize a abertura.\n`);
    process.stderr.write(`[INSTRUCAO PRO AGENTE CLAUDE — voce, usuario nao-programador, NAO precisa executar\n`);
    process.stderr.write(` isso manualmente; o agente sabe quando aplicar:]\n`);
    process.stderr.write(`  mkdir -p ${projdir}/.claude/.runtime && touch ${projdir}/.claude/.runtime/allow-e2e-first\n`);
    recordMetric('block', 'validate-test-pyramid', `unit=${unitCount} e2e=${e2eCount}`);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[validate-test-pyramid] erro interno: ${err.message}\n`);
  process.exit(2);
});
