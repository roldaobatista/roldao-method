#!/usr/bin/env node
/**
 * test/hooks-gates-header.test.js — isencao docs:/chore:/ci: dos gates ancorada
 * no CABECALHO da mensagem do commit.
 *
 * Auditoria 2026-08-17: require-auditors-pass-before-commit,
 * require-checkpoint-before-merge e require-postmortem-after-hotfix testavam o
 * prefixo de isencao contra o COMANDO INTEIRO. Bypasses reais confirmados:
 *   git commit -m "feat: nova funcao ver docs: guia"   → gate pulado
 *   git push origin main # ci: ok                       → gate pulado
 *   git commit -m "feat(x): corrige build: pipeline"    → gate pulado
 * Este teste fixa o comportamento correto e o helper commitHeaderFromCommand.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOKS = path.join(ROOT, 'templates', '.claude', 'hooks');
const AUDITORS = path.join(HOOKS, 'require-auditors-pass-before-commit.js');
const CHECKPOINT = path.join(HOOKS, 'require-checkpoint-before-merge.js');
const POSTMORTEM = path.join(HOOKS, 'require-postmortem-after-hotfix.js');
const { commitHeaderFromCommand } = require(path.join(HOOKS, '_lib.js'));
const SESS = 'testehash';

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) {
    pass++;
    console.log(`  OK   ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`);
  }
}

function setupRepo(markerName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gates-header-'));
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
  fs.writeFileSync(path.join(runtime, `${markerName}-${SESS}`), 'US-111 teste\n');
  fs.writeFileSync(path.join(dir, 'mudanca.txt'), 'mudanca pendente\n');
  return dir;
}

function runHook(hook, dir, command) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' };
  const input = JSON.stringify({ tool_input: { command } });
  const r = spawnSync('node', [hook], {
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
    timeout: 15000,
  });
  return r.status;
}

console.log('\nhooks-gates-header: isencao por prefixo so no cabecalho da mensagem\n');

// ---------------------------------------------------------------------------
// commitHeaderFromCommand (helper)
// ---------------------------------------------------------------------------
check(
  'helper: extrai header de -m "..."',
  commitHeaderFromCommand('git commit -m "feat: x"') === 'feat: x',
);
check(
  'helper: primeira linha apenas (corpo fora)',
  commitHeaderFromCommand('git commit -m "docs: guia\ncorpo"') === 'docs: guia',
);
check(
  'helper: git push sem commit → vazio',
  commitHeaderFromCommand('git push origin main # ci: ok') === '',
);
check('helper: comando vazio → vazio', commitHeaderFromCommand('') === '');

// ---------------------------------------------------------------------------
// require-auditors-pass-before-commit (feature-active armado)
// ---------------------------------------------------------------------------
{
  const dir = setupRepo('feature-active');
  check(
    'auditors: feat sem aprovacao → bloqueia (controle)',
    runHook(AUDITORS, dir, 'git commit -m "feat: nova funcao"') === 2,
  );
  check(
    'auditors: bypass por sufixo "ver docs:" → AGORA bloqueia',
    runHook(AUDITORS, dir, 'git commit -m "feat: nova funcao ver docs: guia"') === 2,
  );
  check(
    'auditors: git push com comentario "# ci: ok" → AGORA bloqueia',
    runHook(AUDITORS, dir, 'git push origin main # ci: ok') === 2,
  );
  check(
    'auditors: "feat(x): corrige build: pipeline" → AGORA bloqueia',
    runHook(AUDITORS, dir, 'git commit -m "feat(x): corrige build: pipeline"') === 2,
  );
  check(
    'auditors: docs: no CABECALHO → isenta (legitimo)',
    runHook(AUDITORS, dir, 'git commit -m "docs: atualiza guia"') === 0,
  );
  check(
    'auditors: chore(deps): no cabecalho → isenta (escopo ok)',
    runHook(AUDITORS, dir, 'git commit -m "chore(deps): bump prettier"') === 0,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// require-checkpoint-before-merge (feature-active armado)
// ---------------------------------------------------------------------------
{
  const dir = setupRepo('feature-active');
  check(
    'checkpoint: feat sem checkpoint → bloqueia (controle)',
    runHook(CHECKPOINT, dir, 'git commit -m "feat: nova funcao"') === 2,
  );
  check(
    'checkpoint: bypass por sufixo "ver docs:" → AGORA bloqueia',
    runHook(CHECKPOINT, dir, 'git commit -m "feat: nova funcao ver docs: guia"') === 2,
  );
  check(
    'checkpoint: docs: no cabecalho → isenta',
    runHook(CHECKPOINT, dir, 'git commit -m "docs: atualiza guia"') === 0,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// require-postmortem-after-hotfix (needs-postmortem vencido > 48h)
// ---------------------------------------------------------------------------
{
  const dir = setupRepo('feature-active');
  const runtime = path.join(dir, '.claude', '.runtime');
  const marker = path.join(runtime, `needs-postmortem-${SESS}`);
  fs.writeFileSync(marker, 'INC teste\n');
  const velho = Date.now() / 1000 - 72 * 3600; // 72h atras
  fs.utimesSync(marker, velho, velho);
  check(
    'postmortem: feat sob marker vencido → bloqueia (controle)',
    runHook(POSTMORTEM, dir, 'git commit -m "feat: nova funcao"') === 2,
  );
  check(
    'postmortem: bypass por sufixo "ver docs:" → AGORA bloqueia',
    runHook(POSTMORTEM, dir, 'git commit -m "feat: corrige ver docs: guia"') === 2,
  );
  check(
    'postmortem: docs: no cabecalho → isenta (fechar o ciclo)',
    runHook(POSTMORTEM, dir, 'git commit -m "docs: escreve postmortem INC-001"') === 0,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\nTotal: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
