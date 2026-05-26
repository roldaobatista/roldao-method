// test/session-relay-checkpoint-trigger.test.js
// US-117 T-117-4, T-117-5, T-117-6 — disparo de /checkpoint, espera de snapshot, encerramento.

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');

const lib = require('../bin/lib/session-relay.js');

let pass = 0;
let fail = 0;
function t(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(() => { console.log(`  OK  ${name}`); pass++; })
              .catch((e) => { console.error(`  FAIL  ${name}\n        ${e.message}`); fail++; });
    }
    console.log(`  OK  ${name}`);
    pass++;
    return Promise.resolve();
  } catch (e) {
    console.error(`  FAIL  ${name}\n        ${e.message}`);
    fail++;
    return Promise.resolve();
  }
}

function makeFakeChild() {
  const ee = new EventEmitter();
  let written = '';
  ee.stdin = { write: (s) => { written += s; return true; } };
  ee.killed = false;
  ee.exitCode = null;
  ee.kill = (sig) => {
    ee.lastSignal = sig;
    ee.exitCode = 0;
    setImmediate(() => ee.emit('exit', 0));
  };
  Object.defineProperty(ee, 'written', { get: () => written });
  return ee;
}

(async () => {
  console.log('US-117 / session-relay — checkpoint trigger + snapshot wait + close');

  await t('triggerCheckpoint escreve /checkpoint\\n no stdin do filho', () => {
    const child = makeFakeChild();
    const ok = lib.triggerCheckpoint(child);
    assert.strictEqual(ok, true);
    assert.strictEqual(child.written, '/checkpoint\n');
  });

  await t('triggerCheckpoint em dry-run nao toca stdin', () => {
    const child = makeFakeChild();
    let logged = '';
    const ok = lib.triggerCheckpoint(child, { dryRun: true, log: (m) => { logged = m; } });
    assert.strictEqual(ok, true);
    assert.strictEqual(child.written, '');
    assert.ok(logged.includes('dry-run'));
  });

  await t('triggerCheckpoint retorna false se filho killed', () => {
    const child = makeFakeChild();
    child.killed = true;
    assert.strictEqual(lib.triggerCheckpoint(child), false);
  });

  await t('snapshotMtime retorna 0 se snapshot nao existe', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-snap-'));
    fs.mkdirSync(path.join(tmp, '.claude', '.runtime'), { recursive: true });
    assert.strictEqual(lib.snapshotMtime(tmp), 0);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  await t('snapshotMtime le mtime real quando snapshot existe', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-snap-'));
    fs.mkdirSync(path.join(tmp, '.claude', '.runtime'), { recursive: true });
    const snap = path.join(tmp, '.claude', '.runtime', 'session-snapshot.md');
    fs.writeFileSync(snap, 'snap');
    const m = lib.snapshotMtime(tmp);
    assert.ok(m > 0);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  await t('waitForSnapshot detecta atualizacao em mtime', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-wait-'));
    fs.mkdirSync(path.join(tmp, '.claude', '.runtime'), { recursive: true });
    const baselineMs = 0;
    const snap = path.join(tmp, '.claude', '.runtime', 'session-snapshot.md');
    // Cria depois de 100ms — simula SessionEnd
    setTimeout(() => fs.writeFileSync(snap, 'snap'), 50);
    const detected = await lib.waitForSnapshot({
      projectDir: tmp,
      baselineMs,
      timeoutMs: 2000,
      pollMs: 25,
      log: () => {},
    });
    assert.strictEqual(detected, true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  await t('waitForSnapshot retorna false em timeout', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-wait-to-'));
    fs.mkdirSync(path.join(tmp, '.claude', '.runtime'), { recursive: true });
    const detected = await lib.waitForSnapshot({
      projectDir: tmp,
      baselineMs: Date.now() + 999999, // exige mtime no futuro
      timeoutMs: 100,
      pollMs: 20,
      log: () => {},
    });
    assert.strictEqual(detected, false);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  await t('closeSession manda SIGTERM e detecta exit', async () => {
    const child = makeFakeChild();
    const result = await lib.closeSession(child, { timeoutMs: 500, log: () => {} });
    assert.strictEqual(result.exited, true);
    assert.strictEqual(result.signal, 'SIGTERM');
  });

  await t('closeSession com filho ja morto retorna exited true sem sinal', async () => {
    const child = makeFakeChild();
    child.exitCode = 0;
    const result = await lib.closeSession(child, { timeoutMs: 50, log: () => {} });
    assert.strictEqual(result.exited, true);
  });

  console.log(`\n${pass} OK / ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
