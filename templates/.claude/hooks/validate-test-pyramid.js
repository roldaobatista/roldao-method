#!/usr/bin/env node
// validate-test-pyramid.js — bloqueia criacao de E2E sem unit tests no mesmo modulo.
// Hook PreToolUse, matcher: Write|Edit. TST-001, TST-002.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, recordMetric, normalizeFilePath } = require('./_lib.js');

const E2E_PATH_RE = /e2e\/|e2e-tests\/|end-to-end\/|\.e2e\.|playwright\/|cypress\/integration\//;
const E2E_DIR_RE = /\/(e2e|e2e-tests|end-to-end|playwright|cypress|cypress\/integration)$/;
// UNSAFE: so path traversal explicito. Path absoluto NAO e mais rejeitado aqui —
// o Claude Code SEMPRE manda file_path absoluto (auditoria 2026-08-17: a regex
// antiga rejeitava justamente o unico formato que chega na pratica, deixando o
// hook inerte). Absoluto agora e relativizado ao projeto antes desta checagem;
// so sobra ".." pra barrar.
const UNSAFE_PATH_RE = /\.\./;
const ABS_PATH_RE = /^\/|^[A-Za-z]:\//;

const UNIT_TEST_EXTS = new Set([
  '.test.js',
  '.test.ts',
  '.test.jsx',
  '.test.tsx',
  '.spec.js',
  '.spec.ts',
  '.spec.jsx',
  '.spec.tsx',
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
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
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

// Contrato do _dispatcher (ADR-033): retorna exit code, nunca chama process.exit.
async function runHook(input) {
  const rawFilePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!rawFilePath) return 0;

  let projdir;
  try {
    projdir = sanitizeProjdir();
  } catch {
    return 2;
  }
  const projdirNorm = normalizeFilePath(projdir);

  // Claude Code SEMPRE manda file_path absoluto. Relativiza ao projeto ANTES
  // de validar, em vez de rejeitar absoluto de cara (o bug que deixava o hook
  // inerte). Usa path.posix pois tudo ja esta normalizado com `/`.
  let filePath = rawFilePath;
  if (ABS_PATH_RE.test(rawFilePath)) {
    const rel = normalizeFilePath(path.posix.relative(projdirNorm, rawFilePath));
    // Fora do projeto (sobe diretorio ou e path absoluto de outro drive) — ignora.
    if (rel.startsWith('..') || ABS_PATH_RE.test(rel)) return 0;
    filePath = rel;
  }

  if (!E2E_PATH_RE.test(filePath)) return 0;

  // Identifica modulo: sobe um nivel se MODULE_DIR termina em /e2e, /cypress, etc.
  let moduleDir = normalizeFilePath(path.dirname(filePath));
  if (E2E_DIR_RE.test(moduleDir)) moduleDir = path.dirname(moduleDir);

  // Sanitizacao: rejeita traversal explicito (moduleDir ja e relativo ao projeto aqui).
  if (UNSAFE_PATH_RE.test(moduleDir)) return 0;

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
    if (fs.existsSync(allowMarker)) return 0;

    process.stderr.write(
      `[validate-test-pyramid] BLOQUEADO: criacao de teste E2E sem unit tests no modulo.\n\n`,
    );
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write(`Modulo: ${moduleDir}\n`);
    process.stderr.write(`Unit tests no modulo: ${unitCount}\n`);
    process.stderr.write(`E2E tests no modulo: ${e2eCount} (sendo criado mais um)\n\n`);
    process.stderr.write(
      `Regra: TST-001 + TST-002. E2E e lento, fragil, caro de manter. Sem unit cobrindo\n`,
    );
    process.stderr.write(
      `casos de borda da logica, E2E vira teste de fumaca caro que nao da feedback util.\n\n`,
    );
    process.stderr.write(`Piramide saudavel:\n`);
    process.stderr.write(`  - Muitos unit tests (rapidos, isolados)\n`);
    process.stderr.write(`  - Alguns integration tests\n`);
    process.stderr.write(`  - Poucos E2E (smoke tests do happy path)\n\n`);
    process.stderr.write(`Acao recomendada:\n`);
    process.stderr.write(
      `  1. Antes de adicionar E2E, escreva unit tests cobrindo logica de borda do modulo.\n`,
    );
    process.stderr.write(
      `  2. Se ja tem unit suficiente mas hooks nao detectou, configure pasta esperada\n`,
    );
    process.stderr.write(`     (este hook procura *.test.ts, *.spec.ts, test_*.py, etc).\n\n`);
    process.stderr.write(
      `Excecao: se este E2E e o primeiro teste do projeto greenfield, autorize a abertura.\n`,
    );
    process.stderr.write(
      `[INSTRUCAO PRO AGENTE CLAUDE — voce, usuario nao-programador, NAO precisa executar\n`,
    );
    process.stderr.write(` isso manualmente; o agente sabe quando aplicar:]\n`);
    process.stderr.write(
      `  mkdir -p ${projdir}/.claude/.runtime && touch ${projdir}/.claude/.runtime/allow-e2e-first\n`,
    );
    recordMetric('block', 'validate-test-pyramid', `unit=${unitCount} e2e=${e2eCount}`);
    return 2;
  }

  return 0;
}

module.exports = { runHook, onErrorExit: 2 };

if (require.main === module) {
  (async () => {
    process.exit(await runHook(await readStdinJson()));
  })().catch((err) => {
    process.stderr.write(`[validate-test-pyramid] erro interno: ${err.message}\n`);
    process.exit(2);
  });
}
