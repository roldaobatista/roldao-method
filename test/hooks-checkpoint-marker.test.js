#!/usr/bin/env node
/**
 * test/hooks-checkpoint-marker.test.js — testes adversariais do require-checkpoint-before-merge.js
 *
 * Cobre os 7 estados de validacao do marker de checkpoint:
 *  1. missing       → block
 *  2. ok (JSON canonico + CHK em disco + sha bate) → pass
 *  3. empty         → block (LEGACY=1 → pass com warning)
 *  4. malformed     → block
 *  5. missing-field → block
 *  6. file-not-found (CHK fantasma) → block
 *  7. stale (audit_sha != diff atual) → block
 *
 * Decomposicao: PRD-003 → US-111 → T-002 (B2) → este teste prova INV-AGENT-004.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'require-checkpoint-before-merge.js');
const SESS = 'testehash';

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function setupRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'checkpoint-test-'));
  spawnSync('git', ['init', '-q', dir], { stdio: 'ignore' });
  spawnSync('git', ['-C', dir, 'config', 'user.email', 'test@example.com'], { stdio: 'ignore' });
  spawnSync('git', ['-C', dir, 'config', 'user.name', 'Test'], { stdio: 'ignore' });
  spawnSync('git', ['-C', dir, 'config', 'commit.gpgsign', 'false'], { stdio: 'ignore' });
  fs.writeFileSync(path.join(dir, 'README.md'), '# t\n');
  spawnSync('git', ['-C', dir, 'add', '.'], { stdio: 'ignore' });
  spawnSync('git', ['-C', dir, 'commit', '-q', '-m', 'init'], { stdio: 'ignore' });

  const runtime = path.join(dir, '.claude', '.runtime');
  fs.mkdirSync(runtime, { recursive: true });
  fs.writeFileSync(path.join(runtime, '.session-hash'), SESS + '\n');
  fs.writeFileSync(path.join(runtime, `feature-active-${SESS}`), 'US-111 teste\n');

  // Mudança pendente pra gerar diff não-vazio
  fs.writeFileSync(path.join(dir, 'mudanca.txt'), 'mudanca pendente\n');

  return { dir, runtime };
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
}

function getDiffSha(dir) {
  const diff = spawnSync('git', ['-C', dir, 'diff', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
  return crypto.createHash('sha256').update(diff).digest('hex');
}

function runHook(dir, legacy = false) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  if (legacy) env.ROLDAO_METHOD_LEGACY_MARKERS = '1';
  else delete env.ROLDAO_METHOD_LEGACY_MARKERS;
  const input = JSON.stringify({ tool_input: { command: 'git commit -m "feat(T-002): teste"' } });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

function writeChkFile(dir, slug = 'teste') {
  const chkRel = `docs/checkpoints/CHK-2026-05-24-${slug}.md`;
  const chkAbs = path.join(dir, chkRel);
  fs.mkdirSync(path.dirname(chkAbs), { recursive: true });
  fs.writeFileSync(chkAbs, `# Checkpoint ${slug}\n\n## Proposito\nTeste.\n`);
  return chkRel;
}

function writeMarker(runtime, content) {
  fs.writeFileSync(path.join(runtime, `checkpoint-done-${SESS}`), content);
}

console.log('\nhooks-checkpoint-marker: testes adversariais do require-checkpoint-before-merge.js\n');

// Cenario 0 (controle): sem feature-active → exit 0
{
  const { dir, runtime } = setupRepo();
  fs.unlinkSync(path.join(runtime, `feature-active-${SESS}`));
  const r = runHook(dir);
  check('cenario 0: sem feature-active → exit 0', r.exit === 0, `exit=${r.exit}`);
  cleanup(dir);
}

// Cenario 1: missing → block
{
  const { dir } = setupRepo();
  const r = runHook(dir);
  check('cenario 1a: marker ausente → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 1b: stderr menciona AUSENTE', /AUSENTE/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 2: ok (JSON canonico + CHK em disco + sha correto) → pass
{
  const { dir, runtime } = setupRepo();
  const chkRel = writeChkFile(dir);
  const sha = getDiffSha(dir);
  writeMarker(runtime, JSON.stringify({
    session: SESS,
    checkpoint_path: chkRel,
    audit_sha: sha,
    timestamp: '2026-05-24T12:00:00Z',
    us: 'US-111',
  }));
  const r = runHook(dir);
  check('cenario 2: JSON canonico + CHK + sha correto → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  cleanup(dir);
}

// Cenario 3: empty → block + stderr nao ensina touch
{
  const { dir, runtime } = setupRepo();
  writeMarker(runtime, '');
  const r = runHook(dir);
  check('cenario 3a: marker vazio → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 3b: stderr menciona VAZIO', /VAZIO/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  check('cenario 3c: stderr NAO ensina touch como bypass', !/touch\s+["'][^"']*checkpoint-done/.test(r.stderr), 'stderr ainda ensina touch');
  cleanup(dir);
}

// Cenario 4: malformed → block
{
  const { dir, runtime } = setupRepo();
  writeMarker(runtime, '{nao eh json');
  const r = runHook(dir);
  check('cenario 4a: JSON malformado → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 4b: stderr menciona MALFORMADO', /MALFORMADO/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 5: missing-field (sem audit_sha) → block
{
  const { dir, runtime } = setupRepo();
  const chkRel = writeChkFile(dir);
  writeMarker(runtime, JSON.stringify({
    session: SESS,
    checkpoint_path: chkRel,
    // audit_sha faltando
    timestamp: '2026-05-24T12:00:00Z',
    us: 'US-111',
  }));
  const r = runHook(dir);
  check('cenario 5a: campo audit_sha faltando → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 5b: stderr menciona INCOMPLETO', /INCOMPLETO/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  check('cenario 5c: stderr lista audit_sha como faltando', /audit_sha/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 6: file-not-found (CHK fantasma) → block
{
  const { dir, runtime } = setupRepo();
  const sha = getDiffSha(dir);
  writeMarker(runtime, JSON.stringify({
    session: SESS,
    checkpoint_path: 'docs/checkpoints/CHK-2026-05-24-fantasma.md',
    audit_sha: sha,
    timestamp: '2026-05-24T12:00:00Z',
    us: 'US-111',
  }));
  const r = runHook(dir);
  check('cenario 6a: CHK aponta pra arquivo fantasma → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 6b: stderr menciona FANTASMA', /FANTASMA/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 7: stale (audit_sha != diff atual) → block
{
  const { dir, runtime } = setupRepo();
  const chkRel = writeChkFile(dir);
  writeMarker(runtime, JSON.stringify({
    session: SESS,
    checkpoint_path: chkRel,
    audit_sha: 'a'.repeat(64), // sha errado
    timestamp: '2026-05-24T12:00:00Z',
    us: 'US-111',
  }));
  const r = runHook(dir);
  check('cenario 7a: audit_sha errado → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 7b: stderr menciona STALE', /STALE/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// Cenario 8: empty + LEGACY=1 → pass com warning
{
  const { dir, runtime } = setupRepo();
  writeMarker(runtime, '');
  const r = runHook(dir, true /* legacy */);
  check('cenario 8a: marker vazio + LEGACY=1 → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  check('cenario 8b: stderr emite AVISO', /AVISO/.test(r.stderr), 'stderr nao emite AVISO de legacy');
  check('cenario 8c: stderr menciona v2.2.0', /v2\.2\.0/.test(r.stderr), 'stderr nao menciona v2.2.0');
  cleanup(dir);
}

// Cenario 9: skip prefix → exit 0 (mesmo sem marker)
{
  const { dir } = setupRepo();
  const input = JSON.stringify({ tool_input: { command: 'git commit -m "docs: ajuste readme"' } });
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  check('cenario 9: prefixo docs: pula hook → exit 0', r.status === 0, `exit=${r.status}`);
  cleanup(dir);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
