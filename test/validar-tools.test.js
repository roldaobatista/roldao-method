#!/usr/bin/env node
// validar-tools.test.js — smoke test pros validadores em tools/*.js.
// Garante que regressao nos validadores nao passa silenciosa no CI.
// Roda os 4 validadores no repositorio atual; falha duro se algum retornar exit != 0.

'use strict';

const { execSync } = require('child_process');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

const VALIDADORES = [
  'tools/validar-templates.js',
  'tools/validar-ids-rastreaveis.js',
  'tools/validar-cobertura-hooks.js',
  'tools/sincronizar-claude-md.js',
];

let ok = 0;
let fail = 0;

for (const v of VALIDADORES) {
  const full = path.join(REPO, v);
  try {
    execSync(`node "${full}"`, { stdio: 'pipe', cwd: REPO });
    console.log(`OK   ${v}`);
    ok++;
  } catch (e) {
    console.error(`FAIL ${v}`);
    console.error('STDOUT:', e.stdout && e.stdout.toString());
    console.error('STDERR:', e.stderr && e.stderr.toString());
    fail++;
  }
}

console.log(`\nTotal validadores: ${VALIDADORES.length}  |  OK: ${ok}  |  FAIL: ${fail}`);
if (fail > 0) process.exit(1);
