#!/usr/bin/env node
/**
 * test/hooks-confirmation-extra.test.js — testa patterns novos de
 * block-confirmation-questions.js adicionados em T-104 (C5).
 *
 * Decomposicao: PRD-003 → US-112 → T-104 (C5).
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'block-confirmation-questions.js');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function run(response) {
  const input = JSON.stringify({ response });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  let decision = null;
  try { decision = JSON.parse(r.stdout || '{}').decision; } catch { /* */ }
  return { exit: r.status, decision };
}

console.log('\nhooks-confirmation-extra: patterns novos T-104 (C5)\n');

// Pattern novo 1: "confirma/aceita/tudo certo?"
const novos1 = [
  'Confirma que posso seguir com a refatoracao?',
  'Aceita esse caminho que escolhi?',
  'Tudo certo ai pra eu continuar?',
  'Tudo bem se eu aplicar essa mudanca?',
];
for (const f of novos1) {
  const r = run(f);
  check(`novo 1 — "${f.slice(0, 40)}..." → block`, r.decision === 'block', `decision=${r.decision}`);
}

// Pattern novo 2: "vou X?"
const novos2 = [
  'Vou prosseguir com a implementacao?',
  'Vou aplicar a mudanca?',
  'Vou seguir esse caminho?',
  'Vou continuar?',
];
for (const f of novos2) {
  const r = run(f);
  check(`novo 2 — "${f.slice(0, 40)}..." → block`, r.decision === 'block', `decision=${r.decision}`);
}

// Regressao: padroes antigos continuam pegando
{
  const r = run('Quer que eu faca essa correcao agora?');
  check('regressao 1: "quer que eu faca" continua bloqueando', r.decision === 'block');
}
{
  const r = run('Posso aplicar essa mudanca?');
  check('regressao 2: "posso aplicar" continua bloqueando', r.decision === 'block');
}

// Legitimo (nao bloquear)
{
  const r = run('Fiz a correcao e validei. Esta funcionando.');
  check('legitimo 1: declaracao sem pergunta → libera', r.decision !== 'block', `decision=${r.decision}`);
}
{
  const r = run('Tudo certo aqui — segui em frente.');
  check('legitimo 2: "tudo certo" SEM ponto de interrogacao → libera', r.decision !== 'block', `decision=${r.decision}`);
}

// Excecao legitima: pergunta de confirmacao sobre operacao destrutiva libera
{
  const r = run('Vou rodar git push --force agora — confirma?');
  check('excecao 1: pergunta sobre git push --force libera (destrutivo)', r.decision !== 'block', `decision=${r.decision}`);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
