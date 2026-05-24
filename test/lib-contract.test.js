#!/usr/bin/env node
/**
 * test/lib-contract.test.js — valida contrato publico de _lib.js (ADR-017).
 *
 * As 10 funcoes listadas em ADR-017 sao API publica consumida pelos addons.
 * Refactor interno do framework NAO pode quebrar nem assinatura nem
 * comportamento minimo dessas funcoes — qualquer mudanca aqui exige MAJOR
 * (ver ADR-016 politica SemVer).
 *
 * Cobre 3 dimensoes:
 *   1. Funcao existe e e callable.
 *   2. Aceita tipos documentados sem throw inesperado.
 *   3. Comportamento minimo (smoke — nao testa equivalencia byte-a-byte,
 *      isso fica em hooks-node-only).
 *
 * Roda em Node puro. Sem dependencia externa.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, 'templates', '.claude', 'hooks', '_lib.js');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

// ---------------------------------------------------------------------------
// Dimensao 1: existencia das 10 funcoes publicas
// ---------------------------------------------------------------------------
console.log('\n[contrato _lib.js] Dimensao 1 — 10 funcoes publicas existem');

const lib = require(LIB);

const PUBLIC_API = [
  'sanitizeProjdir',
  'sanitizeSessionHash',
  'safeRuntimeDir',
  'safeTmpfile',
  'secretTokenPatterns',
  'secretTokenRegexes',
  'posixToJsRegex',
  'hookBlockHeader',
  'recordMetric',
  'readStdinJson',
];

for (const name of PUBLIC_API) {
  check(`${name} existe`, name in lib);
  check(`${name} e funcao`, typeof lib[name] === 'function');
}

// ---------------------------------------------------------------------------
// Dimensao 2: assinaturas aceitam tipos documentados sem throw inesperado
// ---------------------------------------------------------------------------
console.log('\n[contrato _lib.js] Dimensao 2 — assinaturas documentadas funcionam');

// sanitizeProjdir(candidate?) — aceita opcional, falha em "..", aceita CWD
try {
  const r = lib.sanitizeProjdir(ROOT);
  check('sanitizeProjdir(absoluto) retorna string', typeof r === 'string' && r.length > 0);
} catch (e) {
  check('sanitizeProjdir(absoluto) nao lanca', false, e.message);
}

try {
  lib.sanitizeProjdir('../traversal');
  check('sanitizeProjdir(".." traversal) lanca', false, 'deveria ter lancado');
} catch {
  check('sanitizeProjdir(".." traversal) lanca', true);
}

try {
  lib.sanitizeProjdir('relativo/sem/barra');
  check('sanitizeProjdir(relativo) lanca', false, 'deveria ter lancado');
} catch {
  check('sanitizeProjdir(relativo) lanca', true);
}

// sanitizeSessionHash(raw?, projdir?) — strip pra [a-zA-Z0-9], retorna string
const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-contract-'));
try {
  const h = lib.sanitizeSessionHash('abc-123/xyz', tmpdir);
  check('sanitizeSessionHash strip nao-alnum', typeof h === 'string' && /^[a-zA-Z0-9]+$/.test(h));
  const h2 = lib.sanitizeSessionHash(undefined, tmpdir);
  check('sanitizeSessionHash sem raw retorna string', typeof h2 === 'string' && h2.length > 0);

  // safeRuntimeDir(projdir) — cria .claude/.runtime e retorna path
  const rt = lib.safeRuntimeDir(tmpdir);
  check('safeRuntimeDir cria pasta', fs.existsSync(rt));
  check('safeRuntimeDir retorna .claude/.runtime', rt.endsWith(path.join('.claude', '.runtime')));

  try {
    lib.safeRuntimeDir();
    check('safeRuntimeDir() sem projdir lanca', false, 'deveria ter lancado');
  } catch {
    check('safeRuntimeDir() sem projdir lanca', true);
  }
} finally {
  try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch { /* best-effort */ }
}

// safeTmpfile(prefix?) — cria arquivo tmp, retorna path
const tmpfile = lib.safeTmpfile('contract-test');
check('safeTmpfile cria arquivo', fs.existsSync(tmpfile));
check('safeTmpfile retorna path string', typeof tmpfile === 'string');
try { fs.unlinkSync(tmpfile); } catch { /* best-effort */ }

// secretTokenPatterns() — retorna array de strings
const patterns = lib.secretTokenPatterns();
check('secretTokenPatterns retorna array', Array.isArray(patterns));
check('secretTokenPatterns tem >= 10 entradas', patterns.length >= 10);
check('secretTokenPatterns entradas sao strings', patterns.every((p) => typeof p === 'string'));

// secretTokenRegexes() — retorna array de RegExp
const regexes = lib.secretTokenRegexes();
check('secretTokenRegexes retorna array', Array.isArray(regexes));
check('secretTokenRegexes entradas sao RegExp', regexes.every((r) => r instanceof RegExp));
check('secretTokenRegexes mesmo tamanho que patterns', regexes.length === patterns.length);

// posixToJsRegex(pattern, flags?) — converte POSIX ERE pra RegExp JS
const re1 = lib.posixToJsRegex('foo[[:space:]]bar');
check('posixToJsRegex retorna RegExp', re1 instanceof RegExp);
check('posixToJsRegex converte [[:space:]] pra \\s', re1.test('foo bar'));

const re2 = lib.posixToJsRegex('AKIA[[:alnum:]]{4}', 'i');
check('posixToJsRegex aceita flags', re2.flags.includes('i'));
check('posixToJsRegex converte [[:alnum:]]', re2.test('AKIAxyz1'));

// hookBlockHeader(name, reason) — escreve em stderr (smoke — checa que nao lanca)
const stderrOriginal = process.stderr.write.bind(process.stderr);
let stderrCaptured = '';
process.stderr.write = (chunk) => { stderrCaptured += String(chunk); return true; };
try {
  lib.hookBlockHeader('test-hook', 'razao de teste');
  check('hookBlockHeader nao lanca', true);
  check('hookBlockHeader escreve em stderr', stderrCaptured.includes('test-hook') && stderrCaptured.includes('BLOQUEADO'));
} catch (e) {
  check('hookBlockHeader nao lanca', false, e.message);
} finally {
  process.stderr.write = stderrOriginal;
}

// recordMetric(kind, label, reason?) — silencioso, nao lanca
try {
  lib.recordMetric('test', 'lib-contract', 'smoke do contrato');
  check('recordMetric com 3 args nao lanca', true);
  lib.recordMetric('test', 'lib-contract');
  check('recordMetric com 2 args nao lanca', true);
} catch (e) {
  check('recordMetric nao lanca', false, e.message);
}

// readStdinJson() — em TTY (sem pipe), resolve {} rapido
(async () => {
  console.log('\n[contrato _lib.js] Dimensao 3 — comportamento minimo');

  const before = Date.now();
  const r = await lib.readStdinJson();
  const elapsed = Date.now() - before;
  // Em TTY (este teste), retorna {} imediato. Sem TTY, leria stdin.
  // Aceitamos qualquer objeto retornado dentro de timeout razoavel.
  check('readStdinJson resolve em <500ms (TTY)', elapsed < 500);
  check('readStdinJson retorna objeto', typeof r === 'object' && r !== null);

  // ---------------------------------------------------------------------------
  // Resumo
  // ---------------------------------------------------------------------------
  console.log(`\nTotal: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}`);
  if (fail > 0) {
    console.error('\nCONTRATO QUEBRADO. ADR-017 promete estabilidade nessas funcoes.');
    console.error('Se mudanca for intencional: e MAJOR (ADR-016). Atualize ADR-017 + CHANGELOG.');
    process.exit(1);
  }
  process.exit(0);
})();
