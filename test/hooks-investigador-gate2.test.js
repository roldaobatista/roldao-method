#!/usr/bin/env node
/**
 * test/hooks-investigador-gate2.test.js — testes adversariais do GATE 2 de
 * require-investigador-before-fix.js (T-003 / B3).
 *
 * GATE 2 valida shape de investigation-*.json:
 *  - JSON parseavel
 *  - "lido" e array nao-vazio
 *  - "achado" tem >= 20 chars
 *  - "achado" nao contem palavra de bypass
 *  - elementos de "lido" nao contem palavra de bypass
 *
 * Decomposicao: PRD-003 → US-111 → T-003 (B3).
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'require-investigador-before-fix.js');
const SESS = 'testehash';

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

// Setup: cria runtime com bug-trigger, investigator-invoked e bug-active.
// O hook so dispara GATE 2 quando bug-active existe.
function setupRuntime(opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'invgate2-test-'));
  const runtime = path.join(dir, '.claude', '.runtime');
  fs.mkdirSync(runtime, { recursive: true });
  fs.writeFileSync(path.join(runtime, '.session-hash'), SESS + '\n');
  fs.writeFileSync(path.join(runtime, `bug-trigger-${SESS}`), '');
  fs.writeFileSync(path.join(runtime, `investigator-invoked-${SESS}`), '');
  if (opts.bugActive !== false) {
    fs.writeFileSync(path.join(runtime, `bug-active-${SESS}`), '');
  }
  return { dir, runtime };
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
}

function runHook(dir, legacy = false) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  if (legacy) env.ROLDAO_METHOD_LEGACY_MARKERS = '1';
  else delete env.ROLDAO_METHOD_LEGACY_MARKERS;
  // Hook so dispara em Edit/Write de arquivo de codigo
  const input = JSON.stringify({ tool_input: { file_path: path.join(dir, 'src/calculo.js') } });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

function writeInvJson(runtime, ref, content) {
  fs.writeFileSync(path.join(runtime, `investigation-${ref}.json`), content);
}

console.log('\nhooks-investigador-gate2: testes adversariais do GATE 2 (T-003 / B3)\n');

// Cenario 0 (controle): sem bug-active → GATE 2 pula → exit 0
{
  const { dir } = setupRuntime({ bugActive: false });
  const r = runHook(dir);
  check('cenario 0: sem bug-active → exit 0 (pula GATE 2)', r.exit === 0, `exit=${r.exit}`);
  cleanup(dir);
}

// Cenario 1: sem investigation-*.json → block (GATE 2.1)
{
  const { dir } = setupRuntime();
  const r = runHook(dir);
  check('cenario 1a: bug-active + sem investigation-*.json → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 1b: stderr menciona "prova mecânica"', /prova mec[aâ]nica/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 2: JSON canonico valido → pass
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'bug-001', JSON.stringify({
    ref: 'bug-001',
    lido: ['src/calculo.js:42', 'SELECT * FROM pedidos WHERE id=15'],
    achado: 'O calculo do total estava somando o frete duas vezes quando o cliente eh PJ.',
  }));
  const r = runHook(dir);
  check('cenario 2: JSON canonico valido → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  cleanup(dir);
}

// Cenario 3: JSON vazio → block (state=empty)
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'vazio', '');
  const r = runHook(dir);
  check('cenario 3a: investigation vazio → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 3b: stderr menciona shape valido', /shape v[aá]lido/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 4: JSON malformado → block
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'malformado', '{quebrado');
  const r = runHook(dir);
  check('cenario 4a: JSON malformado → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 4b: stderr menciona estado=malformed', /estado=malformed/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 5: lido nao e array → block
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'lido-str', JSON.stringify({
    lido: 'string em vez de array',
    achado: 'A descricao do problema esta aqui com muitos caracteres pra passar',
  }));
  const r = runHook(dir);
  check('cenario 5: lido nao-array → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 5b: stderr menciona lido-not-array', /estado=lido-not-array/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 6: lido vazio → block
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'lido-vazio', JSON.stringify({
    lido: [],
    achado: 'A descricao do problema esta aqui com muitos caracteres pra passar',
  }));
  const r = runHook(dir);
  check('cenario 6: lido vazio → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 6b: stderr menciona lido-empty', /estado=lido-empty/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 7: achado curto (< 20 chars) → block
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'curto', JSON.stringify({
    lido: ['src/x.js:10'],
    achado: 'curto',
  }));
  const r = runHook(dir);
  check('cenario 7: achado curto → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 7b: stderr menciona achado-curto', /estado=achado-curto/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 8: achado contem "trivial" → block
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'trivial', JSON.stringify({
    lido: ['src/x.js:10'],
    achado: 'Mudanca trivial em layout, sem impacto em comportamento ou logica.',
  }));
  const r = runHook(dir);
  check('cenario 8a: achado contem "trivial" → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 8b: stderr menciona achado-bypass', /estado=achado-bypass/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 9: lido contem "bypass" → block
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'bypass', JSON.stringify({
    lido: ['bypass: confiei no usuario'],
    achado: 'Causa raiz identificada apos analise profunda no banco e no log.',
  }));
  const r = runHook(dir);
  check('cenario 9a: lido com "bypass" → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 9b: stderr menciona achado-bypass', /estado=achado-bypass/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 10: JSON vazio + LEGACY=1 → pass com warning
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'legacy', '');
  const r = runHook(dir, true /* legacy */);
  check('cenario 10a: JSON vazio + LEGACY=1 → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  check('cenario 10b: stderr emite AVISO', /AVISO/.test(r.stderr), 'stderr nao emite AVISO de legacy');
  cleanup(dir);
}

// Cenario 11: 2 JSONs — 1 valido + 1 invalido → pass (basta 1 valido)
{
  const { dir, runtime } = setupRuntime();
  writeInvJson(runtime, 'inv1', '');
  writeInvJson(runtime, 'inv2', JSON.stringify({
    ref: 'bug-002',
    lido: ['src/y.js:5'],
    achado: 'Outro bug investigado de verdade com bastante detalhe descrito aqui.',
  }));
  const r = runHook(dir);
  check('cenario 11: 1 invalido + 1 valido → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  cleanup(dir);
}

// Cenario 12 (controle): arquivo .md → exit 0 (excluido)
{
  const { dir } = setupRuntime();
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  const input = JSON.stringify({ tool_input: { file_path: path.join(dir, 'docs/x.md') } });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  check('cenario 12: arquivo .md → exit 0', r.status === 0, `exit=${r.status}`);
  cleanup(dir);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
