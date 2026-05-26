// test/session-relay-threshold.test.js
// US-117 T-117-3 — calculo de threshold (bytes -> tokens -> decisao).

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
    fn();
    console.log(`  OK  ${name}`);
    pass++;
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
    fail++;
  }
}

console.log('US-117 / session-relay — threshold');

t('bytesToTokens com default 1/3.7 — 3700 bytes ~ 1000 tokens', () => {
  const tokens = lib.bytesToTokens(3700);
  // 3700 / 3.7 = 1000
  assert.ok(Math.abs(tokens - 1000) <= 1, `esperado ~1000, veio ${tokens}`);
});

t('bytesToTokens com tokensPerByte custom', () => {
  // 10 bytes * 0.5 = 5 tokens
  assert.strictEqual(lib.bytesToTokens(10, 0.5), 5);
});

t('bytesToTokens com input invalido vira 0', () => {
  assert.strictEqual(lib.bytesToTokens(NaN), 0);
  assert.strictEqual(lib.bytesToTokens(-1), 0);
  assert.strictEqual(lib.bytesToTokens('abc'), 0);
});

t('measureUsage le tamanho real do arquivo', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-meas-'));
  const f = path.join(tmp, 'transcript.jsonl');
  const buf = 'x'.repeat(37000);
  fs.writeFileSync(f, buf);
  const u = lib.measureUsage({ file: f });
  assert.strictEqual(u.bytes, 37000);
  // 37000 / 3.7 = 10000
  assert.ok(Math.abs(u.tokens - 10000) <= 5, `tokens veio ${u.tokens}`);
  fs.rmSync(tmp, { recursive: true, force: true });
});

t('measureUsage retorna null se arquivo nao existe', () => {
  const u = lib.measureUsage({ file: '/arquivo/que/nao/existe.jsonl' });
  assert.strictEqual(u, null);
});

t('shouldCheckpoint dispara quando passa do threshold', () => {
  assert.strictEqual(lib.shouldCheckpoint({ tokens: 500001, bytes: 0 }, 500000), true);
  assert.strictEqual(lib.shouldCheckpoint({ tokens: 500000, bytes: 0 }, 500000), true);
  assert.strictEqual(lib.shouldCheckpoint({ tokens: 499999, bytes: 0 }, 500000), false);
});

t('shouldCheckpoint usa default 500_000 quando threshold nao informado', () => {
  assert.strictEqual(lib.shouldCheckpoint({ tokens: 500000 }), true);
  assert.strictEqual(lib.shouldCheckpoint({ tokens: 100 }), false);
});

t('shouldCheckpoint nunca dispara com usage null', () => {
  assert.strictEqual(lib.shouldCheckpoint(null, 1), false);
});

t('parseFlags --threshold sobrescreve default', () => {
  const f = lib.parseFlags(['--threshold', '100000']);
  assert.strictEqual(f.threshold, 100000);
});

t('parseFlags --threshold-percent converte de % pra tokens (base 1M)', () => {
  const f = lib.parseFlags(['--threshold-percent', '25']);
  assert.strictEqual(f.threshold, 250000);
});

t('parseFlags --check-interval converte segundos -> ms', () => {
  const f = lib.parseFlags(['--check-interval', '60']);
  assert.strictEqual(f.checkIntervalMs, 60000);
});

t('parseFlags --check-interval respeita chao de 5s', () => {
  const f = lib.parseFlags(['--check-interval', '1']);
  assert.strictEqual(f.checkIntervalMs, 5000);
});

t('parseFlags --tokens-per-byte inverte pro lib (3.7 -> 1/3.7)', () => {
  const f = lib.parseFlags(['--tokens-per-byte', '3.7']);
  assert.ok(Math.abs(f.tokensPerByte - (1 / 3.7)) < 1e-9);
});

t('parseFlags --dry-run e --quiet sao boolean', () => {
  const f = lib.parseFlags(['--dry-run', '--quiet']);
  assert.strictEqual(f.dryRun, true);
  assert.strictEqual(f.quiet, true);
});

t('parseFlags --claude-bin captura caminho custom', () => {
  const f = lib.parseFlags(['--claude-bin', '/usr/local/bin/claude-beta']);
  assert.strictEqual(f.claudeBin, '/usr/local/bin/claude-beta');
});

// RESS-002 da Ines (etapa 5/7): valores invalidos viram warning, nao silencio.
t('parseFlags --threshold abc gera warning e mantem default', () => {
  const f = lib.parseFlags(['--threshold', 'abc']);
  assert.strictEqual(f.threshold, undefined);
  assert.ok(Array.isArray(f._warnings) && f._warnings.length === 1);
  assert.ok(f._warnings[0].includes('threshold'));
});

t('parseFlags --threshold-percent 150 (fora da faixa) vira warning', () => {
  const f = lib.parseFlags(['--threshold-percent', '150']);
  assert.strictEqual(f.threshold, undefined);
  assert.ok(f._warnings && f._warnings.length === 1);
});

t('parseFlags --check-interval -5 (negativo) vira warning', () => {
  const f = lib.parseFlags(['--check-interval', '-5']);
  assert.strictEqual(f.checkIntervalMs, undefined);
  assert.ok(f._warnings && f._warnings.length === 1);
});

t('parseFlags --tokens-per-byte 0 (zero) vira warning', () => {
  const f = lib.parseFlags(['--tokens-per-byte', '0']);
  assert.strictEqual(f.tokensPerByte, undefined);
  assert.ok(f._warnings && f._warnings.length === 1);
});

t('parseFlags acumula multiplos warnings de flags ruins', () => {
  const f = lib.parseFlags(['--threshold', 'x', '--check-interval', 'y', '--tokens-per-byte', 'z']);
  assert.ok(f._warnings && f._warnings.length === 3, `esperava 3 warnings, veio ${f._warnings && f._warnings.length}`);
});

console.log(`\n${pass} OK / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
