#!/usr/bin/env node
/**
 * test/hooks-state-equivalence.test.js — paridade .sh ↔ .js dos hooks que
 * dependem de STATE (markers em .claude/.runtime/, repo git, docs/stories/).
 *
 * Diferenca pro test/hooks-equivalence.test.js: aqui criamos workspace temp
 * com estrutura completa do projeto antes de rodar o hook. Cada cenario
 * monta o state, roda hook .sh e .js, compara exit code.
 *
 * Cobertura: caminhos de BLOQUEIO real que exigem markers/repo (cobrindo o
 * que hooks-equivalence so cobria com exit 0 — sem state).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOKS_DIR_REL = 'templates/.claude/hooks';

function hasBash() {
  try { execFileSync('bash', ['--version'], { stdio: 'pipe' }); return true; } catch { return false; }
}

if (!hasBash()) {
  console.log('SKIP hooks-state-equivalence: bash não encontrado.');
  process.exit(0);
}

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

// Cria workspace temp com estrutura de projeto ROLDAO.
function setupWorkspace() {
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-hooks-state-'));
  fs.mkdirSync(path.join(ws, '.claude', '.runtime'), { recursive: true });
  fs.mkdirSync(path.join(ws, 'docs', 'stories'), { recursive: true });
  fs.mkdirSync(path.join(ws, 'docs', 'readiness'), { recursive: true });
  fs.mkdirSync(path.join(ws, 'docs', 'decisions'), { recursive: true });
  // session-hash persistido pra hooks gerarem mesmo marker
  fs.writeFileSync(path.join(ws, '.claude', '.runtime', '.session-hash'), 'testhash\n');
  return ws;
}

function cleanWorkspace(ws) {
  try { fs.rmSync(ws, { recursive: true, force: true }); } catch {}
}

function writeMarker(ws, name, content = '') {
  fs.writeFileSync(path.join(ws, '.claude', '.runtime', name), content);
}

// Roda hook com CLAUDE_PROJECT_DIR=workspace + input via arquivo temp.
// Path do input convertido pra unix-style pra Git Bash em Windows.
function runHookInWorkspace(file, input, ws) {
  const isShell = file.endsWith('.sh');
  const hookPath = `${HOOKS_DIR_REL}/${file}`;
  const inputFile = path.join(ws, `.input-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(inputFile, String(input));
  const inputArg = inputFile.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '/$1');
  const wsArg = ws.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '/$1');
  const cmd = isShell
    ? `CLAUDE_PROJECT_DIR='${wsArg}' bash '${hookPath}' < '${inputArg}'`
    : `CLAUDE_PROJECT_DIR='${wsArg}' node '${hookPath}' < '${inputArg}'`;
  const r = spawnSync('bash', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, cwd: ROOT });
  try { fs.unlinkSync(inputFile); } catch {}
  return { exit: r.status, stdout: (r.stdout || '').toString(), stderr: (r.stderr || '').toString() };
}

function pairWithState(label, hook, input, ws) {
  const sh = runHookInWorkspace(`${hook}.sh`, input, ws);
  const js = runHookInWorkspace(`${hook}.js`, input, ws);
  check(`${hook}: ${label}`,
    sh.exit === js.exit,
    `sh.exit=${sh.exit} js.exit=${js.exit} sh.stderr="${(sh.stderr || '').slice(0, 100)}" js.stderr="${(js.stderr || '').slice(0, 100)}"`);
}

console.log('\nhooks-state-equivalence: .sh vs .js (com state em workspace temp)\n');

// ============================================================================
// require-investigador-before-fix
// ============================================================================
{
  const ws = setupWorkspace();
  // Sem marker bug-trigger: hook nao se aplica, libera
  pairWithState('sem bug-trigger libera', 'require-investigador-before-fix',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  // Com bug-trigger sem investigator-invoked: bloqueia
  writeMarker(ws, 'bug-trigger-testhash');
  pairWithState('bug-trigger sem invoked bloqueia',
    'require-investigador-before-fix',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  // Com investigator-invoked: libera
  writeMarker(ws, 'investigator-invoked-testhash');
  pairWithState('bug-trigger + invoked libera',
    'require-investigador-before-fix',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// require-readiness-before-feature
// ============================================================================
{
  const ws = setupWorkspace();
  // Sem feature-active: libera
  pairWithState('sem feature-active libera', 'require-readiness-before-feature',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  // Com feature-active sem readiness: bloqueia
  writeMarker(ws, 'feature-active-testhash', 'US-001');
  pairWithState('feature ativa sem readiness bloqueia',
    'require-readiness-before-feature',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  // Com readiness-passed: libera
  writeMarker(ws, 'readiness-passed-testhash');
  pairWithState('feature + readiness libera',
    'require-readiness-before-feature',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// require-agent-sequence-before-dev
// ============================================================================
{
  const ws = setupWorkspace();
  pairWithState('sem feature libera', 'require-agent-sequence-before-dev',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  writeMarker(ws, 'feature-active-testhash', 'US-001');
  pairWithState('feature ativa sem sofia/detetive bloqueia',
    'require-agent-sequence-before-dev',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  writeMarker(ws, 'sofia-done-testhash');
  writeMarker(ws, 'detetive-done-testhash');
  writeMarker(ws, 'rafael-skipped-testhash');
  pairWithState('todos markers presentes libera',
    'require-agent-sequence-before-dev',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// require-checkpoint-before-merge
// ============================================================================
{
  const ws = setupWorkspace();
  pairWithState('sem feature libera commit', 'require-checkpoint-before-merge',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  writeMarker(ws, 'feature-active-testhash', 'US-001');
  pairWithState('feature sem checkpoint bloqueia commit',
    'require-checkpoint-before-merge',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  pairWithState('docs: prefixo libera mesmo com feature',
    'require-checkpoint-before-merge',
    JSON.stringify({ tool_input: { command: 'git commit -m "docs: ajusta README"' } }), ws);
  writeMarker(ws, 'checkpoint-done-testhash');
  pairWithState('com checkpoint libera',
    'require-checkpoint-before-merge',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// require-auditors-pass-before-commit
// ============================================================================
{
  const ws = setupWorkspace();
  pairWithState('sem feature libera', 'require-auditors-pass-before-commit',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  writeMarker(ws, 'feature-active-testhash', 'US-001');
  pairWithState('feature sem auditores bloqueia',
    'require-auditors-pass-before-commit',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  // Com 1 auditor blocked: bloqueia
  writeMarker(ws, 'auditor-seg-pass-testhash');
  writeMarker(ws, 'auditor-qual-pass-testhash');
  writeMarker(ws, 'auditor-prod-blocked-testhash');
  pairWithState('1 auditor blocked bloqueia',
    'require-auditors-pass-before-commit',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  // Todos pass: libera
  fs.unlinkSync(path.join(ws, '.claude', '.runtime', 'auditor-prod-blocked-testhash'));
  writeMarker(ws, 'auditor-prod-pass-testhash');
  pairWithState('3 auditores pass libera',
    'require-auditors-pass-before-commit',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: x"' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// validate-story-dependencies
// ============================================================================
{
  const ws = setupWorkspace();
  pairWithState('sem feature libera', 'validate-story-dependencies',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  // Cria stories sintéticas
  fs.writeFileSync(path.join(ws, 'docs', 'stories', 'US-001-base.md'), '---\nid: US-001\nstatus: draft\n---\n# US-001\n');
  fs.writeFileSync(path.join(ws, 'docs', 'stories', 'US-002-dep.md'), '---\nid: US-002\nstatus: draft\ndepende-de: [US-001]\n---\n# US-002\n');
  writeMarker(ws, 'feature-active-testhash', 'US-002');
  pairWithState('US-001 draft bloqueia US-002',
    'validate-story-dependencies',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  // Atualiza US-001 pra entregue
  fs.writeFileSync(path.join(ws, 'docs', 'stories', 'US-001-base.md'), '---\nid: US-001\nstatus: entregue\n---\n# US-001\n');
  // Limpa marker de cache deps-checked
  try { fs.unlinkSync(path.join(ws, '.claude', '.runtime', 'deps-checked-testhash')); } catch {}
  pairWithState('US-001 entregue libera US-002',
    'validate-story-dependencies',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// validate-quick-dev-scope
// ============================================================================
{
  const ws = setupWorkspace();
  pairWithState('sem quick-dev libera', 'validate-quick-dev-scope',
    JSON.stringify({ tool_input: { file_path: '/proj/src/x.ts' } }), ws);
  writeMarker(ws, 'quick-dev-active-testhash');
  // 1 arquivo: ok
  pairWithState('quick-dev 1 arquivo libera', 'validate-quick-dev-scope',
    JSON.stringify({ tool_input: { file_path: '/proj/src/a.ts' } }), ws);
  pairWithState('quick-dev 2o arquivo libera', 'validate-quick-dev-scope',
    JSON.stringify({ tool_input: { file_path: '/proj/src/b.ts' } }), ws);
  pairWithState('quick-dev 3o arquivo libera', 'validate-quick-dev-scope',
    JSON.stringify({ tool_input: { file_path: '/proj/src/c.ts' } }), ws);
  // 4o arquivo: bloqueia
  pairWithState('quick-dev 4o arquivo bloqueia', 'validate-quick-dev-scope',
    JSON.stringify({ tool_input: { file_path: '/proj/src/d.ts' } }), ws);
  // Dominio sensivel sempre bloqueia
  cleanWorkspace(ws);
  const ws2 = setupWorkspace();
  writeMarker(ws2, 'quick-dev-active-testhash');
  pairWithState('quick-dev em arquivo fiscal bloqueia',
    'validate-quick-dev-scope',
    JSON.stringify({ tool_input: { file_path: '/proj/src/nfe-emit.ts' } }), ws2);
  cleanWorkspace(ws2);
}

// ============================================================================
// commit-message-validator (com feature-active)
// ============================================================================
{
  const ws = setupWorkspace();
  writeMarker(ws, 'feature-active-testhash', 'US-001');
  pairWithState('feat sem T-NNN em sessao ativa bloqueia',
    'commit-message-validator',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: nova tela"' } }), ws);
  pairWithState('feat com T-NNN em sessao ativa libera',
    'commit-message-validator',
    JSON.stringify({ tool_input: { command: 'git commit -m "feat: nova tela (T-001)"' } }), ws);
  pairWithState('docs: em sessao ativa libera (sem T-NNN)',
    'commit-message-validator',
    JSON.stringify({ tool_input: { command: 'git commit -m "docs: ajusta README"' } }), ws);
  cleanWorkspace(ws);
}

// ============================================================================
// enforce-pipeline-completion (Stop hook, JSON decision:block)
// ============================================================================
{
  const ws = setupWorkspace();
  // Sem feature: libera Stop normalmente
  const noFeature = runHookInWorkspace('enforce-pipeline-completion.sh', '{}', ws);
  const noFeatureJs = runHookInWorkspace('enforce-pipeline-completion.js', '{}', ws);
  check('enforce-pipeline: sem feature exit 0 + sem decision',
    noFeature.exit === 0 && noFeatureJs.exit === 0 &&
    !noFeature.stdout.includes('decision') && !noFeatureJs.stdout.includes('decision'));

  // Com feature ativa + sofia + sem checkpoint: bloqueia (JSON)
  writeMarker(ws, 'feature-active-testhash', 'US-001');
  writeMarker(ws, 'sofia-done-testhash');
  const blockedSh = runHookInWorkspace('enforce-pipeline-completion.sh', '{}', ws);
  const blockedJs = runHookInWorkspace('enforce-pipeline-completion.js', '{}', ws);
  check('enforce-pipeline: feature+sofia sem checkpoint emite decision:block (ambos)',
    blockedSh.stdout.includes('"decision":"block"') &&
    blockedJs.stdout.includes('"decision":"block"'));

  // Com checkpoint: libera
  writeMarker(ws, 'checkpoint-done-testhash');
  const cleanSh = runHookInWorkspace('enforce-pipeline-completion.sh', '{}', ws);
  const cleanJs = runHookInWorkspace('enforce-pipeline-completion.js', '{}', ws);
  check('enforce-pipeline: com checkpoint libera (ambos)',
    !cleanSh.stdout.includes('decision') && !cleanJs.stdout.includes('decision'));

  cleanWorkspace(ws);
}

// ============================================================================
// regra-zero-reminder (UserPromptSubmit, cria marker + injeta texto)
// ============================================================================
{
  const ws = setupWorkspace();
  // Prompt com bug: deve criar marker bug-trigger-testhash em ambos
  const promptBug = JSON.stringify({ prompt: 'O sistema esta com bug — nao salva o pedido' });
  const shRun = runHookInWorkspace('regra-zero-reminder.sh', promptBug, ws);
  // Verifica marker criado pelo .sh
  const shMarker = fs.existsSync(path.join(ws, '.claude', '.runtime', 'bug-trigger-testhash'));
  // Limpa marker pra testar .js do zero
  try { fs.unlinkSync(path.join(ws, '.claude', '.runtime', 'bug-trigger-testhash')); } catch {}
  const jsRun = runHookInWorkspace('regra-zero-reminder.js', promptBug, ws);
  const jsMarker = fs.existsSync(path.join(ws, '.claude', '.runtime', 'bug-trigger-testhash'));
  check('regra-zero: ambos criam marker bug-trigger', shMarker && jsMarker);
  check('regra-zero: ambos saem 0', shRun.exit === 0 && jsRun.exit === 0);
  cleanWorkspace(ws);
}

console.log(`\nhooks-state-equivalence: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
