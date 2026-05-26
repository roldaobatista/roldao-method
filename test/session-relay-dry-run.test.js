// test/session-relay-dry-run.test.js
// US-117 T-117-9 — flag --dry-run roda ciclo simulado sem spawn real.
// Integra: runRelay com dryRun=true completa 1 iteracao sem abrir Claude real.

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

(async () => {
  console.log('US-117 / session-relay — dry-run integrado');

  await t('runRelay com dryRun=true completa 1 iteracao sem spawn real', async () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-dry-home-'));
    const tmpProj = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-dry-proj-'));
    fs.mkdirSync(path.join(tmpProj, '.claude', '.runtime'), { recursive: true });
    // Cria transcript fake gigante pra disparar threshold imediatamente
    const projDir = path.join(tmpHome, '.claude', 'projects', lib.encodeCwd(tmpProj));
    fs.mkdirSync(projDir, { recursive: true });
    const transcript = path.join(projDir, 'fake-session.jsonl');
    fs.writeFileSync(transcript, 'x'.repeat(4_000_000)); // ~1.08M tokens com default

    const messages = [];
    const log = (m) => messages.push(m);

    // Simula SessionEnd criando snapshot DURANTE o waitForSnapshot — setTimeout
    // dispara em 100ms, ANTES do timeout de espera default (5min).
    const snapPath = path.join(tmpProj, '.claude', '.runtime', 'session-snapshot.md');
    setTimeout(() => fs.writeFileSync(snapPath, 'simulado-iter1'), 100);

    const result = await lib.runRelay({
      threshold: 100_000,
      checkIntervalMs: 5000,
      claudeBin: 'claude',
      cwd: tmpProj,
      dryRun: true,
      projectDir: tmpProj,
      homeDir: tmpHome,
      log,
      maxIterations: 1,
    });

    assert.strictEqual(result.iterations, 1);
    const joined = messages.join('\n');
    assert.ok(joined.includes('abri o Claude'), 'devia abrir');
    assert.ok(joined.includes('vigiando a conversa') || joined.includes('AVISO'), 'devia vigiar ou avisar');
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProj, { recursive: true, force: true });
  });

  await t('runRelay dryRun gera snapshot detection mesmo sem Claude real', async () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-dry-home2-'));
    const tmpProj = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-dry-proj2-'));
    fs.mkdirSync(path.join(tmpProj, '.claude', '.runtime'), { recursive: true });
    const projDir = path.join(tmpHome, '.claude', 'projects', lib.encodeCwd(tmpProj));
    fs.mkdirSync(projDir, { recursive: true });
    fs.writeFileSync(path.join(projDir, 'fake.jsonl'), 'x'.repeat(4_000_000));

    // Cria snapshot ANTES do threshold disparar → waitForSnapshot vai detectar imediatamente
    // (na sequencia real, hook SessionEnd cria; aqui simulamos com setTimeout)
    const snapPath = path.join(tmpProj, '.claude', '.runtime', 'session-snapshot.md');
    setTimeout(() => fs.writeFileSync(snapPath, 'simulado'), 200);

    const messages = [];
    const result = await lib.runRelay({
      threshold: 100_000,
      checkIntervalMs: 5000,
      cwd: tmpProj,
      dryRun: true,
      projectDir: tmpProj,
      homeDir: tmpHome,
      log: (m) => messages.push(m),
      maxIterations: 1,
    });

    assert.strictEqual(result.iterations, 1);
    const joined = messages.join('\n');
    // Mensagem chave (AC-117-7): "passou da metade da memoria"
    assert.ok(joined.includes('passou da metade') || joined.includes('vou pedir'),
      'devia avisar Roldao em PT-BR sobre o checkpoint:\n' + joined);
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProj, { recursive: true, force: true });
  });

  console.log(`\n${pass} OK / ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
