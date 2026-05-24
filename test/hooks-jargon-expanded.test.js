#!/usr/bin/env node
/**
 * test/hooks-jargon-expanded.test.js — testes adversariais dos termos
 * adicionados em T-009 (F1) ao block-jargon-pt-br.js.
 *
 * Decomposicao: PRD-003 → US-111 → T-009.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'block-jargon-pt-br.js');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function run(response) {
  const input = JSON.stringify({ response });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  const stdout = (r.stdout || '').toString();
  let decision = null;
  try {
    if (stdout) decision = JSON.parse(stdout).decision;
  } catch { /* nao e json valido */ }
  return { exit: r.status, decision, stdout };
}

console.log('\nhooks-jargon-expanded: termos novos T-009 (F1)\n');

// ============================================================================
// Termos novos da tabela traduzir-jargao bloqueiam
// ============================================================================
const TERMOS_NOVOS = [
  { termo: 'mock',         frase: 'usei mock pra testar essa parte' },
  { termo: 'fixture',      frase: 'criei fixture pros dados de teste' },
  { termo: 'migration',    frase: 'rodei a migration no banco' },
  { termo: 'backend',      frase: 'a logica esta no backend' },
  { termo: 'frontend',     frase: 'a tela do frontend mostra erro' },
  { termo: 'webhook',      frase: 'o webhook do gateway dispara aqui' },
  { termo: 'payload',      frase: 'o payload chegou vazio' },
  { termo: 'cache',        frase: 'limpei o cache do servidor' },
  { termo: 'hotfix',       frase: 'mandei um hotfix pra producao' },
  { termo: 'pipeline',     frase: 'o pipeline travou no ultimo passo' },
  { termo: 'stack trace',  frase: 'olhei o stack trace e achei' },
  { termo: 'amend',        frase: 'fiz amend no commit' },
];

for (const { termo, frase } of TERMOS_NOVOS) {
  const r = run(frase);
  check(`T-009.${termo}: "${frase}" → block`,
    r.decision === 'block',
    `decision=${r.decision}, stdout=${r.stdout.slice(0, 100)}`);
}

// ============================================================================
// Termos existentes continuam bloqueando (regressao)
// ============================================================================
{
  const r = run('Fiz commit das alteracoes');
  check('regressao 1: commit continua bloqueando', r.decision === 'block', `decision=${r.decision}`);
}
{
  const r = run('Vou fazer deploy agora');
  check('regressao 2: deploy continua bloqueando', r.decision === 'block', `decision=${r.decision}`);
}

// ============================================================================
// Texto leigo legitimo NAO bloqueia
// ============================================================================
{
  const r = run('Salvei a correcao no sistema. Esta funcionando, validei.');
  check('legitimo 1: texto totalmente em PT-BR → libera',
    r.decision !== 'block',
    `decision=${r.decision}, stdout=${r.stdout.slice(0, 100)}`);
}
{
  const r = run('A funcionalidade esta no servidor e responde com mensagem clara.');
  check('legitimo 2: "servidor" + "funcionalidade" → libera',
    r.decision !== 'block',
    `decision=${r.decision}`);
}

// ============================================================================
// Bloco de codigo (markdown) NAO conta — termo dentro de ``` libera
// ============================================================================
{
  const r = run('Olhe o exemplo:\n```js\nconst mock = require("jest").mock;\n```\nIsso e um exemplo.');
  check('codigo 1: "mock" dentro de bloco de codigo → libera',
    r.decision !== 'block',
    `decision=${r.decision}, stdout=${r.stdout.slice(0, 100)}`);
}

// ============================================================================
// Traducao inline NAO bloqueia (parenteses explicativos)
// ============================================================================
{
  const r = run('Apaguei o cache (memoria rapida do servidor que guarda resultados).');
  check('explicado 1: termo seguido de parenteses traduzindo → libera',
    r.decision !== 'block',
    `decision=${r.decision}`);
}

// ============================================================================
// Tabela atualizada de traducao na mensagem de erro
// ============================================================================
{
  const r = run('usei mock para teste');
  const reason = r.stdout ? (JSON.parse(r.stdout).reason || '') : '';
  check('mensagem 1: tabela inclui mock/fixture', /mock\/fixture/.test(reason), `reason: ${reason.slice(0, 200)}`);
  check('mensagem 2: tabela inclui webhook', /webhook/.test(reason));
  check('mensagem 3: tabela inclui hotfix', /hotfix/.test(reason));
  check('mensagem 4: tabela inclui pipeline', /pipeline/.test(reason));
  check('mensagem 5: tabela inclui stack trace', /stack trace/.test(reason));
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
