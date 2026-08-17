#!/usr/bin/env node
/**
 * test/hooks-dispatcher.test.js — _dispatcher.js (ADR-033).
 *
 * O dispatcher roda um GRUPO de hooks num único processo node (antes: 22
 * processos por Write/Edit). Garante: ordem preservada, bloqueio propaga,
 * hook sem contrato roda em fallback (subprocesso), erro isolado respeita a
 * política onErrorExit do hook, grupo desconhecido falha visível.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOKS = path.join(ROOT, 'templates', '.claude', 'hooks');
const DISPATCHER_NAME = '_dispatcher';
const DISPATCHER = path.join(HOOKS, '_dispatcher.js');

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

function runDispatcher(grupo, payload, env = {}) {
  const r = spawnSync(process.execPath, [DISPATCHER, grupo], {
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 120000,
    env: { ...process.env, ROLDAO_SKIP_METRICS: '1', ...env },
  });
  return { exit: r.status, stderr: r.stderr || '', stdout: r.stdout || '' };
}

console.log('\nhooks-dispatcher: grupo de hooks num processo só (ADR-033)\n');

// Grupos declarados existem e todos os hooks referenciados existem em disco
const grupos = JSON.parse(fs.readFileSync(path.join(HOOKS, '_dispatcher-groups.json'), 'utf8'));
for (const g of ['pre-write', 'post-write', 'pre-bash']) {
  check(`grupo ${g} declarado`, Array.isArray(grupos[g]) && grupos[g].length > 0);
  const faltando = (grupos[g] || []).filter((h) => !fs.existsSync(path.join(HOOKS, `${h}.js`)));
  check(`grupo ${g}: todos os hooks existem`, faltando.length === 0, faltando.join(', '));
}

// Espelha o settings: todo hook que o settings antigo listava nos 3 matchers
// precisa estar em algum grupo (fonte única não pode divergir do produto).
{
  const settingsRaw = fs.readFileSync(
    path.join(ROOT, 'templates', '.claude', 'settings.json'),
    'utf8',
  );
  check(
    'settings usa _dispatcher nos grupos quentes',
    settingsRaw.includes('_dispatcher.js\\" pre-write') &&
      settingsRaw.includes('_dispatcher.js\\" pre-bash') &&
      settingsRaw.includes('_dispatcher.js\\" post-write'),
  );
}

// Payload inocente libera nos 3 grupos
{
  const inocente = { tool_input: { file_path: 'C:/proj/src/inocente.nada', content: 'x' } };
  check('pre-write inocente → 0', runDispatcher('pre-write', inocente).exit === 0);
  check('post-write inocente → 0', runDispatcher('post-write', inocente).exit === 0);
  const cmd = { tool_input: { command: 'ls -la' } };
  check('pre-bash inocente → 0', runDispatcher('pre-bash', cmd).exit === 0);
}

// Bloqueio propaga (primeiro hook que reprova encerra o grupo)
{
  const destrutivo = { tool_input: { command: 'git push --force origin main' } };
  const r = runDispatcher('pre-bash', destrutivo);
  check('pre-bash destrutivo → 2', r.exit === 2, `exit=${r.exit}`);
  check('mensagem do bloqueador aparece', /block-destructive/.test(r.stderr));
}

// Grupo desconhecido: falha visível, não liberação silenciosa
{
  const r = runDispatcher('grupo-fantasma', { tool_input: {} });
  check('grupo desconhecido → 2 com aviso', r.exit === 2 && /desconhecido/.test(r.stderr));
}

// Fallback: hook sem contrato runHook roda como subprocesso e ainda bloqueia
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'disp-fallback-'));
  const legacyHook = path.join(HOOKS, '_tmp-legacy-fallback-test.js');
  const legacyGroups = path.join(HOOKS, '_dispatcher-groups.json');
  const original = fs.readFileSync(legacyGroups, 'utf8');
  try {
    fs.writeFileSync(
      legacyHook,
      `#!/usr/bin/env node
(async () => {
  let raw='';process.stdin.setEncoding('utf8');
  process.stdin.on('data',(c)=>raw+=c);
  process.stdin.on('end',()=>{
    const i=JSON.parse(raw);
    if ((i.tool_input||{}).command === 'legacy-bloqueia') { process.stderr.write('legacy block\\n'); process.exit(2); }
    process.exit(0);
  });
})();
`,
    );
    const g = JSON.parse(original);
    g['teste-fallback'] = ['_tmp-legacy-fallback-test'];
    fs.writeFileSync(legacyGroups, JSON.stringify(g, null, 2));
    const rBlock = runDispatcher('teste-fallback', { tool_input: { command: 'legacy-bloqueia' } });
    check('fallback subprocesso: bloqueio propaga', rBlock.exit === 2, `exit=${rBlock.exit}`);
    const rOk = runDispatcher('teste-fallback', { tool_input: { command: 'ok' } });
    check('fallback subprocesso: liberação propaga', rOk.exit === 0);
  } finally {
    fs.writeFileSync(legacyGroups, original);
    try {
      fs.unlinkSync(legacyHook);
    } catch {}
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// Erro em hook respeita onErrorExit (soft não derruba o grupo)
{
  const legacyGroups = path.join(HOOKS, '_dispatcher-groups.json');
  const original = fs.readFileSync(legacyGroups, 'utf8');
  const softHook = path.join(HOOKS, '_tmp-soft-erro-test.js');
  const hardHook = path.join(HOOKS, '_tmp-hard-erro-test.js');
  try {
    fs.writeFileSync(
      softHook,
      `async function runHook(){ throw new Error('boom soft'); }
module.exports = { runHook, onErrorExit: 0 };
`,
    );
    fs.writeFileSync(
      hardHook,
      `async function runHook(){ throw new Error('boom hard'); }
module.exports = { runHook, onErrorExit: 2 };
`,
    );
    const g = JSON.parse(original);
    g['teste-erro-soft'] = ['_tmp-soft-erro-test'];
    g['teste-erro-hard'] = ['_tmp-hard-erro-test'];
    fs.writeFileSync(legacyGroups, JSON.stringify(g, null, 2));
    check(
      'erro em hook soft (onErrorExit 0) → grupo segue e libera',
      runDispatcher('teste-erro-soft', {}).exit === 0,
    );
    check(
      'erro em hook bloqueador (onErrorExit 2) → fail-closed',
      runDispatcher('teste-erro-hard', {}).exit === 2,
    );
  } finally {
    fs.writeFileSync(legacyGroups, original);
    for (const f of [softHook, hardHook])
      try {
        fs.unlinkSync(f);
      } catch {}
  }
}

console.log(`\nTotal: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
