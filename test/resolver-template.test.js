#!/usr/bin/env node
/**
 * resolver-template.test.js — testa precedencia override → core do
 * mecanismo `.specify/overrides/` (ADR-003).
 *
 * Garante que:
 *   1. Existe override → resolveTemplate retorna o override.
 *   2. So existe core → retorna o core.
 *   3. Nao existe nenhum → retorna null.
 *   4. listTemplates marca [override] corretamente.
 *   5. Area invalida lanca erro.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { resolveTemplate, listTemplates, AREAS_VALIDAS } = require('../.specify/scripts/resolver-template.js');

let okCount = 0;
let failCount = 0;

function ok(msg) {
  okCount++;
  console.log(`  OK   ${msg}`);
}

function fail(msg, detail) {
  failCount++;
  console.log(`  FAIL ${msg}${detail ? '\n         ' + detail : ''}`);
}

function assertEq(actual, expected, msg) {
  if (actual === expected) ok(msg);
  else fail(msg, `esperado=${expected} atual=${actual}`);
}

function makeSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-test-'));
  const specifyRoot = path.join(root, '.specify');
  fs.mkdirSync(path.join(specifyRoot, 'templates'), { recursive: true });
  fs.mkdirSync(path.join(specifyRoot, 'overrides', 'templates'), { recursive: true });
  fs.mkdirSync(path.join(specifyRoot, 'checklists'), { recursive: true });
  return { root, specifyRoot };
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('resolver-template — precedencia override (ADR-003)');

// 1. Override vence core
{
  const { root, specifyRoot } = makeSandbox();
  fs.writeFileSync(path.join(specifyRoot, 'templates', 'prd.md'), 'core');
  fs.writeFileSync(path.join(specifyRoot, 'overrides', 'templates', 'prd.md'), 'override');
  const resolvido = resolveTemplate('templates', 'prd.md', { specifyRoot });
  const conteudo = fs.readFileSync(resolvido, 'utf8');
  assertEq(conteudo, 'override', 'override vence core quando ambos existem');
  cleanup(root);
}

// 2. Sem override, usa core
{
  const { root, specifyRoot } = makeSandbox();
  fs.writeFileSync(path.join(specifyRoot, 'templates', 'story.md'), 'core-story');
  const resolvido = resolveTemplate('templates', 'story.md', { specifyRoot });
  const conteudo = fs.readFileSync(resolvido, 'utf8');
  assertEq(conteudo, 'core-story', 'sem override, retorna core');
  cleanup(root);
}

// 3. Sem nada, retorna null
{
  const { root, specifyRoot } = makeSandbox();
  const resolvido = resolveTemplate('templates', 'inexistente.md', { specifyRoot });
  assertEq(resolvido, null, 'sem override nem core, retorna null');
  cleanup(root);
}

// 4. listTemplates marca override corretamente
{
  const { root, specifyRoot } = makeSandbox();
  fs.writeFileSync(path.join(specifyRoot, 'templates', 'a.md'), 'core-a');
  fs.writeFileSync(path.join(specifyRoot, 'templates', 'b.md'), 'core-b');
  fs.writeFileSync(path.join(specifyRoot, 'overrides', 'templates', 'a.md'), 'override-a');
  // 'c.md' so existe em overrides
  fs.writeFileSync(path.join(specifyRoot, 'overrides', 'templates', 'c.md'), 'override-c');
  const itens = listTemplates('templates', { specifyRoot });
  const mapa = Object.fromEntries(itens.map((it) => [it.nome, it.override]));
  assertEq(mapa['a.md'], true, 'listTemplates: a.md marcado como override (ambos)');
  assertEq(mapa['b.md'], false, 'listTemplates: b.md nao marcado como override (so core)');
  assertEq(mapa['c.md'], true, 'listTemplates: c.md marcado como override (so override)');
  assertEq(itens.length, 3, 'listTemplates: uniao de overrides + core (sem duplicar)');
  cleanup(root);
}

// 5. Area invalida
{
  let lancou = false;
  try {
    resolveTemplate('arquivos-aleatorios', 'foo.md', { specifyRoot: '/tmp/nada' });
  } catch (e) {
    lancou = true;
  }
  assertEq(lancou, true, 'area invalida lanca erro');
}

// 6. AREAS_VALIDAS expoe contrato
assertEq(AREAS_VALIDAS.has('templates'), true, 'AREAS_VALIDAS contem templates');
assertEq(AREAS_VALIDAS.has('checklists'), true, 'AREAS_VALIDAS contem checklists');
assertEq(AREAS_VALIDAS.has('data'), true, 'AREAS_VALIDAS contem data');

// 7. Nome obrigatorio
{
  let lancou = false;
  try {
    resolveTemplate('templates', '', { specifyRoot: '/tmp/nada' });
  } catch (e) {
    lancou = true;
  }
  assertEq(lancou, true, 'nome vazio lanca erro');
}

console.log(`\nTotal: OK: ${okCount} FAIL: ${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
