#!/usr/bin/env node
/**
 * test/hooks-auditors-pass.test.js — testes adversariais do require-auditors-pass-before-commit.js
 *
 * Cobre os 6 cenarios do ADR-020:
 *  1. marker vazio       → block (state=empty)
 *  2. JSON valido + sha  → pass
 *  3. JSON com sha errado→ block (state=stale)
 *  4. campo faltando     → block (state=missing-field)
 *  5. JSON malformado    → block (state=malformed)
 *  6. marker vazio + LEGACY=1 → pass com warning
 *
 * Decomposicao: PRD-003 → US-111 → T-001 (B1) → este teste prova INV-AGENT-004.
 *
 * Cenarios montam um repo git temporario completo (init + commit inicial + feature marker)
 * pra disparar o hook. Cada cenario isolado em diretorio proprio.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'require-auditors-pass-before-commit.js');
const SESS = 'testehash';

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

// Cria repo git temporario com .claude/.runtime/ e marker de feature ativa.
function setupRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditors-test-'));
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

  // Cria mudanca pendente pra gerar diff nao-vazio
  fs.writeFileSync(path.join(dir, 'mudanca.txt'), 'mudanca pendente\n');

  return { dir, runtime };
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
}

function getDiffSha(dir) {
  const crypto = require('crypto');
  const diff = spawnSync('git', ['-C', dir, 'diff', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
  return crypto.createHash('sha256').update(diff).digest('hex');
}

function runHook(dir, legacy = false) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  if (legacy) env.ROLDAO_METHOD_LEGACY_MARKERS = '1';
  else delete env.ROLDAO_METHOD_LEGACY_MARKERS;
  const input = JSON.stringify({ tool_input: { command: 'git commit -m "feat(T-001): teste"' } });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

function writeMarkers(runtime, contents) {
  // contents = { seg, qual, prod } — cada valor e string a escrever (ou null pra nao criar)
  for (const k of ['seg', 'qual', 'prod']) {
    const p = path.join(runtime, `auditor-${k}-pass-${SESS}`);
    if (contents[k] === null) { try { fs.unlinkSync(p); } catch {} continue; }
    fs.writeFileSync(p, contents[k]);
  }
}

console.log('\nhooks-auditors-pass: testes adversariais do require-auditors-pass-before-commit.js (ADR-020)\n');

// ---------------------------------------------------------------------------
// Cenario 0 (controle): sem feature-active → exit 0 (não dispara)
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  fs.unlinkSync(path.join(runtime, `feature-active-${SESS}`));
  const r = runHook(dir);
  check('cenario 0: sem feature-active → exit 0', r.exit === 0, `exit=${r.exit}`);
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 1: marker vazio → block (state=empty), stderr menciona "VAZIO"
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  writeMarkers(runtime, { seg: '', qual: '', prod: '' });
  const r = runHook(dir);
  check('cenario 1a: marker vazio → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 1b: stderr menciona VAZIO', /VAZIO/.test(r.stderr), `stderr nao tem VAZIO: ${r.stderr.slice(0, 200)}`);
  check('cenario 1c: stderr NAO ensina touch', !/touch\s+["'][^"']*auditor-\w+-pass/.test(r.stderr), 'stderr ainda ensina touch como bypass');
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 2: JSON valido + audit_sha correto → exit 0 (pass)
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  const sha = getDiffSha(dir);
  const validMarker = (agent) => JSON.stringify({
    session: SESS,
    agent,
    audit_sha: sha,
    timestamp: new Date().toISOString(),
    lido_de: ['mudanca.txt'],
  });
  writeMarkers(runtime, {
    seg: validMarker('auditor-seguranca'),
    qual: validMarker('auditor-qualidade'),
    prod: validMarker('auditor-produto'),
  });
  const r = runHook(dir);
  check('cenario 2: 3 markers JSON validos + sha correto → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 3: JSON valido mas audit_sha errado → block (state=stale)
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  const shaErrado = 'a'.repeat(64);
  const staleMarker = (agent) => JSON.stringify({
    session: SESS,
    agent,
    audit_sha: shaErrado,
    timestamp: new Date().toISOString(),
    lido_de: ['mudanca.txt'],
  });
  writeMarkers(runtime, {
    seg: staleMarker('auditor-seguranca'),
    qual: staleMarker('auditor-qualidade'),
    prod: staleMarker('auditor-produto'),
  });
  const r = runHook(dir);
  check('cenario 3a: audit_sha errado → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 3b: stderr menciona STALE', /STALE/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 4: campo faltando (sem audit_sha) → block (state=missing-field)
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  const incompleto = JSON.stringify({
    session: SESS,
    agent: 'auditor-seguranca',
    // audit_sha faltando
    timestamp: new Date().toISOString(),
    lido_de: ['mudanca.txt'],
  });
  writeMarkers(runtime, { seg: incompleto, qual: incompleto, prod: incompleto });
  const r = runHook(dir);
  check('cenario 4a: campo audit_sha faltando → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 4b: stderr menciona INCOMPLETO', /INCOMPLETO/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  check('cenario 4c: stderr lista campo faltando', /audit_sha/.test(r.stderr), `stderr nao lista audit_sha`);
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 5: JSON malformado → block (state=malformed)
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  writeMarkers(runtime, { seg: '{nao eh json', qual: 'nada', prod: '[invalido' });
  const r = runHook(dir);
  check('cenario 5a: JSON malformado → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 5b: stderr menciona MALFORMADO', /MALFORMADO/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 6: marker vazio + LEGACY=1 → exit 0 com warning
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  writeMarkers(runtime, { seg: '', qual: '', prod: '' });
  const r = runHook(dir, true /* legacy */);
  check('cenario 6a: marker vazio + LEGACY=1 → exit 0', r.exit === 0, `exit=${r.exit}, stderr="${r.stderr.slice(0, 200)}"`);
  check('cenario 6b: stderr emite AVISO', /AVISO/.test(r.stderr), 'stderr nao emite AVISO de legacy');
  check('cenario 6c: stderr menciona v2.2.0', /v2\.2\.0/.test(r.stderr), 'stderr nao menciona v2.2.0');
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 7 (controle): marker ausente (missing) → block
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  // Nao escreve markers
  const r = runHook(dir);
  check('cenario 7: marker ausente → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 7b: stderr menciona "nao rodaram"', /nao rodaram/i.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

// ---------------------------------------------------------------------------
// Cenario 8: marker blocked → block (precedencia sobre pass marker valido)
// ---------------------------------------------------------------------------
{
  const { dir, runtime } = setupRepo();
  const sha = getDiffSha(dir);
  const valid = JSON.stringify({ session: SESS, agent: 'auditor-seguranca', audit_sha: sha, timestamp: '2026-01-01T00:00:00Z', lido_de: ['x'] });
  writeMarkers(runtime, { seg: valid, qual: valid, prod: valid });
  fs.writeFileSync(path.join(runtime, `auditor-seg-blocked-${SESS}`), 'bloqueado por motivo X');
  const r = runHook(dir);
  check('cenario 8a: blocked + pass valido → exit 2 (blocked vence)', r.exit === 2, `exit=${r.exit}`);
  check('cenario 8b: stderr menciona BLOQUEARAM', /BLOQUEARAM/.test(r.stderr), `stderr: ${r.stderr.slice(0, 200)}`);
  cleanup(dir);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
