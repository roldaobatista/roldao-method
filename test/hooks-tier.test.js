#!/usr/bin/env node
/**
 * test/hooks-tier.test.js — enforce-tier-ceremony.js (Fabrica fase 2).
 *
 * Tier 3+: subida (git push / deploy) exige checklist-release mais novo que a
 * classificacao. Tier 4: exige tambem o marker dono-aprovou-* (AskUserQuestion).
 * Sem marker de tier, o hook nao interfere (fluxo antigo intacto).
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK_NAME = 'enforce-tier-ceremony';
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'enforce-tier-ceremony.js');
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

function setup(tier) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tier-test-'));
  const runtime = path.join(dir, '.claude', '.runtime');
  fs.mkdirSync(runtime, { recursive: true });
  fs.writeFileSync(path.join(runtime, '.session-hash'), SESS + '\n');
  if (tier !== null) {
    fs.writeFileSync(
      path.join(runtime, `tier-active-${SESS}`),
      JSON.stringify({ tier, pedido: 'teste', timestamp: '2026-08-17T00:00:00Z' }),
    );
  }
  return { dir, runtime };
}

function run(dir, command) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_input: { command } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir, ROLDAO_SKIP_METRICS: '1' },
    encoding: 'utf8',
    timeout: 15000,
  });
  return r.status;
}

function escreveChecklist(dir) {
  const d = path.join(dir, 'docs', 'fabrica');
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'checklist-release-2026-08-17-teste.md'), '# ok\n');
}

console.log('\nhooks-tier: enforce-tier-ceremony (Fabrica fase 2)\n');

{
  const { dir } = setup(null);
  check('sem marker de tier → nao interfere no push', run(dir, 'git push origin main') === 0);
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  const { dir } = setup(2);
  check(
    'tier 2 → push livre (cerimonia padrao do /feature cuida)',
    run(dir, 'git push origin main') === 0,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  const { dir } = setup(3);
  check('tier 3 sem checklist → BLOQUEIA push', run(dir, 'git push origin main') === 2);
  check(
    'tier 3 sem checklist → commit local segue livre',
    run(dir, 'git commit -m "feat: x"') === 0,
  );
  escreveChecklist(dir);
  check('tier 3 com checklist novo → libera push', run(dir, 'git push origin main') === 0);
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  const { dir, runtime } = setup(4);
  escreveChecklist(dir);
  check(
    'tier 4 com checklist mas SEM aval do dono → BLOQUEIA',
    run(dir, 'git push origin main') === 2,
  );
  fs.writeFileSync(path.join(runtime, `dono-aprovou-${SESS}`), ''); // touch vazio nao vale
  check(
    'tier 4 com marker de aval VAZIO (touch) → BLOQUEIA',
    run(dir, 'git push origin main') === 2,
  );
  fs.writeFileSync(
    path.join(runtime, `dono-aprovou-${SESS}`),
    JSON.stringify({ aprovado_em: '2026-08-17T12:00:00Z', pedido: 'teste' }),
  );
  check('tier 4 com checklist + aval real → libera', run(dir, 'git push origin main') === 0);
  check(
    'tier 4: deploy (npx vercel) tambem exige — ok com aval',
    run(dir, 'npx vercel deploy') === 0,
  );
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  const { dir } = setup(4);
  check('tier 4: deploy sem cerimonia → BLOQUEIA', run(dir, 'flyctl deploy') === 2);
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\nTotal: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
