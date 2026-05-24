#!/usr/bin/env node
/**
 * test/hooks-session-cleanup.test.js — testa que session-cleanup remove
 * markers efemeros da sessao atual sem tocar em markers de outras sessoes.
 *
 * Decomposicao: PRD-003 → US-111 → T-011 (G3).
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'session-cleanup.js');
const SESS = 'sessatual';

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function setupRuntime() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-cleanup-test-'));
  const runtime = path.join(dir, '.claude', '.runtime');
  fs.mkdirSync(runtime, { recursive: true });
  fs.writeFileSync(path.join(runtime, '.session-hash'), SESS + '\n');
  return { dir, runtime };
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}

function runHook(dir) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  const input = JSON.stringify({});
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

console.log('\nhooks-session-cleanup: limpa markers efemeros da sessao atual (T-011)\n');

// Cenario 1: markers efemeros da sessao atual sao removidos
{
  const { dir, runtime } = setupRuntime();
  fs.writeFileSync(path.join(runtime, `bug-trigger-${SESS}`), '');
  fs.writeFileSync(path.join(runtime, `bug-active-${SESS}`), '');
  fs.writeFileSync(path.join(runtime, `feature-active-${SESS}`), '');
  fs.writeFileSync(path.join(runtime, `auditor-seg-pass-${SESS}`), '{}');
  fs.writeFileSync(path.join(runtime, `checkpoint-done-${SESS}`), '{}');

  const r = runHook(dir);
  check('cenario 1a: hook executa sem erro', r.exit === 0, `exit=${r.exit}`);
  check('cenario 1b: bug-trigger removido', !fs.existsSync(path.join(runtime, `bug-trigger-${SESS}`)));
  check('cenario 1c: bug-active removido', !fs.existsSync(path.join(runtime, `bug-active-${SESS}`)));
  check('cenario 1d: feature-active removido', !fs.existsSync(path.join(runtime, `feature-active-${SESS}`)));
  check('cenario 1e: auditor-seg-pass removido', !fs.existsSync(path.join(runtime, `auditor-seg-pass-${SESS}`)));
  check('cenario 1f: checkpoint-done removido', !fs.existsSync(path.join(runtime, `checkpoint-done-${SESS}`)));
  cleanup(dir);
}

// Cenario 2: markers de OUTRAS sessoes NAO sao tocados
{
  const { dir, runtime } = setupRuntime();
  fs.writeFileSync(path.join(runtime, `bug-active-${SESS}`), '');
  fs.writeFileSync(path.join(runtime, 'bug-active-outraSessao'), '');
  fs.writeFileSync(path.join(runtime, 'feature-active-paralela123'), '');

  runHook(dir);
  check('cenario 2a: marker sessao atual removido', !fs.existsSync(path.join(runtime, `bug-active-${SESS}`)));
  check('cenario 2b: bug-active-outraSessao PRESERVADO', fs.existsSync(path.join(runtime, 'bug-active-outraSessao')));
  check('cenario 2c: feature-active-paralela123 PRESERVADO', fs.existsSync(path.join(runtime, 'feature-active-paralela123')));
  cleanup(dir);
}

// Cenario 3: arquivos persistentes NAO sao apagados
{
  const { dir, runtime } = setupRuntime();
  fs.writeFileSync(path.join(runtime, 'investigation-bug-001.json'), '{}');
  fs.writeFileSync(path.join(runtime, 'metrics.jsonl'), '');
  fs.writeFileSync(path.join(runtime, 'session-snapshot.md'), '# snap');
  fs.writeFileSync(path.join(runtime, 'session-state.json'), '{}');
  fs.writeFileSync(path.join(runtime, 'audit-inventory.json'), '{}');

  runHook(dir);
  check('cenario 3a: investigation-*.json PRESERVADO', fs.existsSync(path.join(runtime, 'investigation-bug-001.json')));
  check('cenario 3b: metrics.jsonl PRESERVADO', fs.existsSync(path.join(runtime, 'metrics.jsonl')));
  check('cenario 3c: session-snapshot.md PRESERVADO', fs.existsSync(path.join(runtime, 'session-snapshot.md')));
  check('cenario 3d: session-state.json PRESERVADO', fs.existsSync(path.join(runtime, 'session-state.json')));
  check('cenario 3e: audit-inventory.json PRESERVADO', fs.existsSync(path.join(runtime, 'audit-inventory.json')));
  check('cenario 3f: .session-hash PRESERVADO', fs.existsSync(path.join(runtime, '.session-hash')));
  cleanup(dir);
}

// Cenario 4: runtime vazio nao quebra
{
  const { dir } = setupRuntime();
  const r = runHook(dir);
  check('cenario 4: runtime vazio → exit 0', r.exit === 0, `exit=${r.exit}`);
  cleanup(dir);
}

// Cenario 5: runtime ausente nao quebra
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-runtime-'));
  const r = runHook(dir);
  check('cenario 5: sem .claude/.runtime → exit 0', r.exit === 0, `exit=${r.exit}`);
  cleanup(dir);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
