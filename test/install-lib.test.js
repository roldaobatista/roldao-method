#!/usr/bin/env node
/**
 * test/install-lib.test.js — testes unitários dos módulos extraídos de bin/install.js
 * (Sprint 2.4 da auditoria 10-agentes). Cobre colors, user-owned, node-version-check.
 *
 * Cada módulo é puro/injetável — não roda I/O nem toca o filesystem real.
 */
'use strict';

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { makeColors, ANSI } = require(path.join(ROOT, 'bin', 'lib', 'colors'));
const { USER_OWNED, isUserOwned } = require(path.join(ROOT, 'bin', 'lib', 'user-owned'));
const { checkNodeVersion } = require(path.join(ROOT, 'bin', 'lib', 'node-version-check'));

let pass = 0;
let fail = 0;
function it(label, fn) {
  try {
    fn();
    pass++;
    console.log(`  OK   ${label}`);
  } catch (err) {
    fail++;
    console.log(`  FAIL ${label}\n         ${err.message}`);
  }
}

// --- colors ----------------------------------------------------------------
it('colors: TTY + sem NO_COLOR → cores ativas', () => {
  const c = makeColors({ noColor: false, isTTY: true });
  assert.strictEqual(c.green, ANSI.green);
  assert.strictEqual(c.reset, ANSI.reset);
});
it('colors: noColor=true zera todas as cores', () => {
  const c = makeColors({ noColor: true, isTTY: true });
  assert.strictEqual(c.green, '');
  assert.strictEqual(c.reset, '');
  assert.strictEqual(c.bold, '');
});
it('colors: sem TTY zera todas as cores (pipe/CI sem TTY)', () => {
  const c = makeColors({ noColor: false, isTTY: false });
  assert.strictEqual(c.green, '');
  assert.strictEqual(c.cyan, '');
});
it('colors: chamada sem args não explode (defaults seguros)', () => {
  const c = makeColors();
  assert.strictEqual(c.green, '');
});

// --- user-owned ------------------------------------------------------------
it('user-owned: USER_OWNED inclui contratos canônicos', () => {
  assert.ok(USER_OWNED.has('AGENTS.md'), 'AGENTS.md ausente');
  assert.ok(USER_OWNED.has('CLAUDE.md'), 'CLAUDE.md ausente');
  assert.ok(USER_OWNED.has('REGRAS-INEGOCIAVEIS.md'), 'REGRAS-INEGOCIAVEIS.md ausente');
  assert.ok(USER_OWNED.has('.specify/memory/constitution.md'), 'constitution.md ausente');
});
it('user-owned: isUserOwned reconhece contratos exatos', () => {
  assert.strictEqual(isUserOwned('AGENTS.md'), true);
  assert.strictEqual(isUserOwned('CLAUDE.md'), true);
  assert.strictEqual(isUserOwned('CLAUDE.local.md'), true);
});
it('user-owned: isUserOwned protege tudo dentro de .specify/overrides/', () => {
  assert.strictEqual(isUserOwned('.specify/overrides/checklists/release-readiness.md'), true);
  assert.strictEqual(isUserOwned('.specify/overrides/data/empresas.md'), true);
});
it('user-owned: isUserOwned rejeita arquivos do framework', () => {
  assert.strictEqual(isUserOwned('.claude/agents/dev-senior.md'), false);
  assert.strictEqual(isUserOwned('.specify/templates/prd.md'), false);
  assert.strictEqual(isUserOwned('README.md'), false);
});
it('user-owned: isUserOwned normaliza separador Windows (\\)', () => {
  assert.strictEqual(isUserOwned('.specify\\overrides\\checklists\\foo.md'), true);
});

// --- node-version-check ----------------------------------------------------
it('node-version-check: Node 20 passa (≥18)', () => {
  let exited = null;
  const ok = checkNodeVersion({
    required: 18,
    current: '20.10.0',
    write: () => {},
    exit: (code) => { exited = code; },
  });
  assert.strictEqual(ok, true);
  assert.strictEqual(exited, null, 'não deveria ter saído');
});
it('node-version-check: Node 16 reprova e chama exit(1)', () => {
  let exited = null;
  let stderr = '';
  checkNodeVersion({
    required: 18,
    current: '16.20.0',
    write: (msg) => { stderr += msg; },
    exit: (code) => { exited = code; },
  });
  assert.strictEqual(exited, 1);
  assert.ok(stderr.includes('Node 18+'), 'stderr deveria mencionar Node 18+');
  assert.ok(stderr.includes('https://nodejs.org'), 'stderr deveria orientar usuário');
});
it('node-version-check: versão vazia (process.versions ausente) não trava', () => {
  let exited = null;
  const ok = checkNodeVersion({
    current: '',
    write: () => {},
    exit: (code) => { exited = code; },
  });
  assert.strictEqual(ok, true);
  assert.strictEqual(exited, null);
});

console.log('');
console.log(`Total: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
