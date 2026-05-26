// test/session-relay-detect-transcript.test.js
// US-117 T-117-2 — discovery do transcript .jsonl da sessao ativa.

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

// Helper: cria sandbox temporario simulando ~/.claude/projects/<cwd-encoded>/
function makeSandbox() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-test-'));
  const cwd = 'C:/projetos/exemplo';
  const projDir = path.join(home, '.claude', 'projects', 'C--projetos-exemplo');
  fs.mkdirSync(projDir, { recursive: true });
  return { home, cwd, projDir };
}

console.log('US-117 / session-relay — discovery de transcript');

t('encodeCwd substitui :, \\, / por -', () => {
  assert.strictEqual(lib.encodeCwd('C:/projetos/roldao-method'), 'C--projetos-roldao-method');
  assert.strictEqual(lib.encodeCwd('C:\\projetos\\foo'), 'C--projetos-foo');
  assert.strictEqual(lib.encodeCwd('/home/user/proj'), '-home-user-proj');
});

t('projectsDirFor monta caminho ~/.claude/projects/<encoded>', () => {
  const p = lib.projectsDirFor('C:/foo', '/fake-home');
  assert.strictEqual(p, path.join('/fake-home', '.claude', 'projects', 'C--foo'));
});

t('listRootJsonl retorna vazio se dir nao existe', () => {
  assert.deepStrictEqual(lib.listRootJsonl('/dir/que/nao/existe'), []);
});

t('listRootJsonl lista .jsonl no nivel raiz e ignora subagents/', () => {
  const { projDir, home } = makeSandbox();
  fs.writeFileSync(path.join(projDir, 'aaa.jsonl'), '{}\n');
  fs.writeFileSync(path.join(projDir, 'bbb.jsonl'), '{}\n');
  fs.writeFileSync(path.join(projDir, 'ccc.txt'), 'nao-jsonl');
  fs.mkdirSync(path.join(projDir, 'subagents'));
  fs.writeFileSync(path.join(projDir, 'subagents', 'sub.jsonl'), '{}\n');
  const out = lib.listRootJsonl(projDir);
  assert.strictEqual(out.length, 2, 'devia listar so 2 .jsonl do raiz');
  const names = out.map((x) => path.basename(x.file)).sort();
  assert.deepStrictEqual(names, ['aaa.jsonl', 'bbb.jsonl']);
  fs.rmSync(home, { recursive: true, force: true });
});

t('discoverTranscript prefere arquivo com sessionId direto', () => {
  const { projDir, cwd, home } = makeSandbox();
  fs.writeFileSync(path.join(projDir, 'aaa.jsonl'), '{}\n');
  // sleep curto pra garantir mtime diferente
  const newer = path.join(projDir, 'session-abc.jsonl');
  fs.writeFileSync(newer, '{}\n');
  const t1 = lib.discoverTranscript({ cwd, sessionId: 'session-abc', homeDir: home });
  assert.ok(t1, 'devia achar transcript');
  assert.strictEqual(path.basename(t1.file), 'session-abc.jsonl');
  fs.rmSync(home, { recursive: true, force: true });
});

t('discoverTranscript fallback pega o mais recente quando nao tem sessionId', () => {
  const { projDir, cwd, home } = makeSandbox();
  fs.writeFileSync(path.join(projDir, 'aaa.jsonl'), '{}\n');
  fs.writeFileSync(path.join(projDir, 'bbb.jsonl'), '{}\n');
  // Forca mtime de bbb mais recente
  const future = Date.now() / 1000 + 1000;
  fs.utimesSync(path.join(projDir, 'bbb.jsonl'), future, future);
  const t1 = lib.discoverTranscript({ cwd, homeDir: home });
  assert.ok(t1);
  assert.strictEqual(path.basename(t1.file), 'bbb.jsonl');
  fs.rmSync(home, { recursive: true, force: true });
});

t('discoverTranscript retorna null se nada existe', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'relay-empty-'));
  const t1 = lib.discoverTranscript({ cwd: '/foo', homeDir: home });
  assert.strictEqual(t1, null);
  fs.rmSync(home, { recursive: true, force: true });
});

console.log(`\n${pass} OK / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
