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
const { USER_OWNED, isUserOwned, isCustomizable } = require(path.join(ROOT, 'bin', 'lib', 'user-owned'));
const { checkNodeVersion } = require(path.join(ROOT, 'bin', 'lib', 'node-version-check'));
const { makeGlyphs, UNICODE, ASCII } = require(path.join(ROOT, 'bin', 'lib', 'glyphs'));
const { validarCPF } = require(path.join(ROOT, 'bin', 'lib', 'demo'));
const snapshotLib = require(path.join(ROOT, 'bin', 'lib', 'snapshot'));
const fs = require('fs');
const os = require('os');

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

// --- user-owned: isCustomizable -------------------------------------------
it('user-owned: isCustomizable reconhece agentes/commands/hooks/skills', () => {
  assert.strictEqual(isCustomizable('.claude/agents/dev-senior.md'), true);
  assert.strictEqual(isCustomizable('.claude/commands/feature.md'), true);
  assert.strictEqual(isCustomizable('.claude/hooks/block-destructive.js'), true);
  assert.strictEqual(isCustomizable('.claude/skills/validar-pix/SKILL.md'), true);
});
it('user-owned: isCustomizable rejeita raiz e contratos', () => {
  assert.strictEqual(isCustomizable('AGENTS.md'), false);
  assert.strictEqual(isCustomizable('.claude/settings.json'), false);
  assert.strictEqual(isCustomizable('README.md'), false);
});

// --- glyphs ---------------------------------------------------------------
it('glyphs: unicode default tem caracteres Unicode', () => {
  const g = makeGlyphs();
  assert.strictEqual(g.ok, UNICODE.ok);
  assert.strictEqual(g.box.tl, '╔');
});
it('glyphs: noUnicode=true retorna ASCII puro', () => {
  const g = makeGlyphs({ noUnicode: true });
  assert.strictEqual(g.ok, ASCII.ok);
  assert.strictEqual(g.box.tl, '+');
  // Garante que nenhum glifo tem char > 127
  for (const k of ['ok', 'err', 'warn', 'info', 'arrow', 'bullet']) {
    for (const ch of g[k]) assert.ok(ch.charCodeAt(0) < 128, `${k} tem char nao-ASCII: ${ch}`);
  }
});

// --- demo.validarCPF ------------------------------------------------------
it('demo: validarCPF reprova CPF com todos digitos iguais', () => {
  assert.strictEqual(validarCPF('111.111.111-11').ok, false);
  assert.strictEqual(validarCPF('000.000.000-00').ok, false);
});
it('demo: validarCPF aceita CPF valido', () => {
  // 123.456.789-09 é o canônico de teste (TST-004).
  assert.strictEqual(validarCPF('123.456.789-09').ok, true);
  assert.strictEqual(validarCPF('12345678909').ok, true);
});
it('demo: validarCPF reprova tamanho errado', () => {
  assert.strictEqual(validarCPF('123').ok, false);
  assert.strictEqual(validarCPF('').ok, false);
});

// --- snapshot lifecycle ---------------------------------------------------
it('snapshot: createSnapshot + recordFile + restoreSnapshot ciclo completo', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-snap-'));
  try {
    const original = 'conteudo original\n';
    const modificado = 'conteudo NOVO depois do update\n';
    const arq = path.join(tmp, 'arquivo.txt');
    fs.writeFileSync(arq, original);

    const snapId = snapshotLib.createSnapshot({ cwd: tmp, fromVersion: '1.0.0', toVersion: '1.0.1' });
    assert.ok(snapId, 'snapshot deveria ter id');

    snapshotLib.recordFile(snapId, tmp, 'arquivo.txt', 'updated');

    // Simula o update sobrescrevendo
    fs.writeFileSync(arq, modificado);
    assert.strictEqual(fs.readFileSync(arq, 'utf8'), modificado);

    // Restaura
    const res = snapshotLib.restoreSnapshot(tmp, snapId);
    assert.strictEqual(res.errors.length, 0, `erros: ${res.errors.join('; ')}`);
    assert.strictEqual(res.restored, 1);
    assert.strictEqual(fs.readFileSync(arq, 'utf8'), original);

    // listSnapshots vê o snapshot
    const list = snapshotLib.listSnapshots(tmp);
    assert.ok(list.length >= 1);
    assert.strictEqual(list[0].id, snapId);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
it('snapshot: arquivo criado pelo update (existed=false) e removido no rollback', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-snap-'));
  try {
    const snapId = snapshotLib.createSnapshot({ cwd: tmp, fromVersion: '1.0.0', toVersion: '1.0.1' });
    // Registra ANTES de criar (arquivo ainda nao existia)
    snapshotLib.recordFile(snapId, tmp, 'novo.txt', 'created');
    // Update cria
    fs.writeFileSync(path.join(tmp, 'novo.txt'), 'novo conteudo');
    // Rollback deve apagar
    const res = snapshotLib.restoreSnapshot(tmp, snapId);
    assert.strictEqual(res.restored, 1);
    assert.strictEqual(fs.existsSync(path.join(tmp, 'novo.txt')), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log('');
console.log(`Total: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
