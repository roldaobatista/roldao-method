#!/usr/bin/env node
/**
 * evals/runner.js — runner property-based pros .eval.json deste projeto.
 *
 * Não chama LLM. Valida o DOC do agente (fonte de comportamento) contra
 * critérios estáticos: presença de padrão, ausência de jargão, alinhamento
 * com hook de bloqueio.
 *
 * Uso:
 *   node evals/runner.js evals/agent-behavior/devops-dba-comportamento.eval.json
 *
 * Saída: relatório PT-BR + exit 0 (todos critérios passam) ou exit 1 (algum falha).
 *
 * Origem: US-114 T-013/T-014 (F5/F6).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function checkPadraoPresente(alvo, padrao) {
  const file = path.join(ROOT, alvo);
  if (!fs.existsSync(file)) return { ok: false, motivo: `arquivo não existe: ${alvo}` };
  const conteudo = fs.readFileSync(file, 'utf8');
  const re = new RegExp(padrao, 'm');
  return re.test(conteudo)
    ? { ok: true }
    : { ok: false, motivo: `padrão "${padrao}" não encontrado em ${alvo}` };
}

function checkPadraoAusente(alvo, padrao) {
  const file = path.join(ROOT, alvo);
  if (!fs.existsSync(file)) return { ok: false, motivo: `arquivo não existe: ${alvo}` };
  const conteudo = fs.readFileSync(file, 'utf8');
  const re = new RegExp(padrao, 'm');
  return re.test(conteudo)
    ? { ok: false, motivo: `padrão "${padrao}" aparece em ${alvo} mas não deveria` }
    : { ok: true };
}

function checkHookBloqueia(alvo, hookPath, esperado) {
  const fileFull = path.join(ROOT, alvo);
  const hookFull = path.join(ROOT, hookPath);
  if (!fs.existsSync(fileFull)) return { ok: false, motivo: `arquivo não existe: ${alvo}` };
  if (!fs.existsSync(hookFull)) return { ok: false, motivo: `hook não existe: ${hookPath}` };

  const conteudo = fs.readFileSync(fileFull, 'utf8');
  const input = JSON.stringify({ tool_input: { content: conteudo, file_path: alvo } });
  const r = spawnSync('node', [hookFull], {
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
    env: { ...process.env, ROLDAO_SKIP_METRICS: '1' },
  });

  if (esperado === 'exit-0') {
    return r.status === 0
      ? { ok: true }
      : { ok: false, motivo: `hook bloqueou ${alvo} (exit ${r.status}): ${(r.stderr || '').toString().slice(0, 200)}` };
  }
  if (esperado === 'exit-2') {
    return r.status === 2
      ? { ok: true }
      : { ok: false, motivo: `hook NÃO bloqueou ${alvo} (esperado exit 2, veio ${r.status})` };
  }
  return { ok: false, motivo: `esperado inválido: ${esperado}` };
}

function rodarCriterio(criterio) {
  const resultados = [];
  for (const alvo of criterio.alvos) {
    let resultado;
    if (criterio.tipo === 'presenca-padrao' || criterio.tipo === 'regex-presente') {
      resultado = checkPadraoPresente(alvo, criterio.padrao);
    } else if (criterio.tipo === 'regex-ausente') {
      resultado = checkPadraoAusente(alvo, criterio.padrao);
    } else if (criterio.tipo === 'hook-bloqueia') {
      resultado = checkHookBloqueia(alvo, criterio.hook, criterio.esperado);
    } else {
      resultado = { ok: false, motivo: `tipo desconhecido: ${criterio.tipo}` };
    }
    resultados.push({ alvo, ...resultado });
  }
  return resultados;
}

function main() {
  const evalFile = process.argv[2];
  if (!evalFile) {
    console.error('Uso: node evals/runner.js <arquivo.eval.json>');
    process.exit(2);
  }
  const evalFull = path.resolve(evalFile);
  if (!fs.existsSync(evalFull)) {
    console.error(`Arquivo não encontrado: ${evalFile}`);
    process.exit(2);
  }
  let evalDef;
  try {
    evalDef = JSON.parse(fs.readFileSync(evalFull, 'utf8'));
  } catch (e) {
    console.error(`JSON inválido em ${evalFile}: ${e.message}`);
    process.exit(2);
  }

  console.log(`\n=== Eval: ${evalDef.name} ===`);
  console.log(`Origem: ${evalDef.origem || '(não especificada)'}`);
  console.log(`Descrição: ${evalDef.descricao || '(sem descrição)'}\n`);

  let passou = 0;
  let falhou = 0;

  for (const criterio of evalDef.criterios || []) {
    const resultados = rodarCriterio(criterio);
    const todosOk = resultados.every((r) => r.ok);
    if (todosOk) {
      console.log(`  OK   [${criterio.id}] ${criterio.descricao}`);
      passou++;
    } else {
      console.log(`  FAIL [${criterio.id}] ${criterio.descricao}`);
      for (const r of resultados.filter((x) => !x.ok)) {
        console.log(`         - ${r.alvo}: ${r.motivo}`);
      }
      falhou++;
    }
  }

  console.log('');
  console.log(`Total: ${passou + falhou}  |  OK: ${passou}  |  FAIL: ${falhou}`);
  process.exit(falhou > 0 ? 1 : 0);
}

main();
