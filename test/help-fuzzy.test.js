#!/usr/bin/env node
/**
 * test/help-fuzzy.test.js — valida busca fuzzy em PT-BR no `roldao-method help`.
 *
 * AC-115-4 (PRD-003 / US-115): `npx roldao-method help "<frase em PT-BR>"`
 * casa frase com slash commands de templates/.claude/commands/ e retorna
 * top 3 com `/<comando>` + descricao.
 *
 * Cobre 5 cenarios obrigatorios + 1 vazio + 1 sem casamento.
 */

process.env.ROLDAO_SKIP_METRICS = '1';
process.env.NO_COLOR = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'install.js');

let pass = 0;
let fail = 0;

function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function rodaCliHelp(...args) {
  const r = spawnSync(process.execPath, [CLI, 'help', ...args], { encoding: 'utf8' });
  return { stdout: r.stdout || '', stderr: r.stderr || '', code: r.status };
}

console.log('test/help-fuzzy.test.js — busca fuzzy em PT-BR no help (AC-115-4)\n');

// 5 cenarios obrigatorios — query PT-BR -> comando esperado NO TOPO
const cenarios = [
  { query: 'preciso reportar bug',     esperado: '/bug' },
  { query: 'iniciar projeto novo',     esperado: '/inicio' },
  { query: 'fechar versao',            esperado: '/release' },
  { query: 'feature nova',             esperado: '/feature' },
  { query: 'adotar legado',            esperado: '/brownfield' },
];

for (const { query, esperado } of cenarios) {
  const r = rodaCliHelp(query);
  // Primeira linha que comeca com `  /<comando>` apos o cabecalho de resultados
  const linhas = r.stdout.split('\n').map((l) => l.trimEnd());
  const idxResultados = linhas.findIndex((l) => l.includes('Comandos do Claude Code que casam'));
  const primeiroComando = linhas
    .slice(idxResultados + 1)
    .find((l) => l.match(/^  \/[a-z-]+$/i));
  check(
    `query '${query}' -> ${esperado} no topo`,
    primeiroComando === `  ${esperado}`,
    `obteve: ${primeiroComando || '(sem resultado)'}`,
  );
}

// Cenario sem casamento — query absurda devolve mensagem amigavel
{
  const r = rodaCliHelp('xyzzyplugh123');
  check(
    `query absurda devolve mensagem amigavel`,
    r.stdout.includes('nao achei comando que case'),
    `stdout='${r.stdout.slice(0, 200)}'`,
  );
}

// Cenario vazio (so `help` sem argumento) — cai no help completo
{
  const r = rodaCliHelp();
  check(
    `help sem argumento mostra lista completa`,
    r.stdout.includes('npx roldao-method install') && r.stdout.includes('Addons disponiveis'),
    `stdout sem 'install' ou 'Addons disponiveis'`,
  );
}

// Cenario que confirma que keyword especifica do PT-BR funciona
{
  const r = rodaCliHelp('urgente cliente parado');
  const linhas = r.stdout.split('\n').map((l) => l.trimEnd());
  const primeiro = linhas.find((l) => l.match(/^  \/[a-z-]+$/i));
  check(
    `query 'urgente cliente parado' -> /hotfix no topo`,
    primeiro === '  /hotfix',
    `obteve: ${primeiro || '(sem resultado)'}`,
  );
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
