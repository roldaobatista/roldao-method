#!/usr/bin/env node
/**
 * test/lib-next-id.test.js — testa o helper next-id (T-301 / E1).
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LIB = path.join(ROOT, 'templates', '.claude', 'lib', 'next-id.js');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function setupProjeto() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'next-id-test-'));
  process.env.CLAUDE_PROJECT_DIR = dir;
  return dir;
}

function clearReq() {
  delete require.cache[LIB];
}

console.log('\nlib-next-id: helper E1 / T-301\n');

// Cenario 1: pasta vazia → primeiro ID = NNN-001
{
  const dir = setupProjeto();
  fs.mkdirSync(path.join(dir, 'docs/stories'), { recursive: true });
  clearReq();
  const { nextId } = require(LIB);
  check('1a: US em pasta vazia → US-001', nextId('US') === 'US-001');
  check('1b: EP em pasta vazia → EP-001', nextId('EP') === 'EP-001');
}

// Cenario 2: ja existem arquivos → proximo = max+1
{
  const dir = setupProjeto();
  fs.mkdirSync(path.join(dir, 'docs/stories'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs/epicos'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs/decisions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs/stories/US-101-x.md'), '');
  fs.writeFileSync(path.join(dir, 'docs/stories/US-110-y.md'), '');
  fs.writeFileSync(path.join(dir, 'docs/stories/US-116-z.md'), '');
  fs.writeFileSync(path.join(dir, 'docs/epicos/EP-002-aaa.md'), '');
  fs.writeFileSync(path.join(dir, 'docs/decisions/ADR-018-bbb.md'), '');
  fs.writeFileSync(path.join(dir, 'docs/decisions/ADR-021-ccc.md'), '');
  clearReq();
  const { nextId } = require(LIB);
  check('2a: US com max=116 → US-117', nextId('US') === 'US-117');
  check('2b: EP com max=2 → EP-003', nextId('EP') === 'EP-003');
  check('2c: ADR com max=21 → ADR-022', nextId('ADR') === 'ADR-022');
}

// Cenario 3: CHK usa data + slug
{
  clearReq();
  const { nextId } = require(LIB);
  const hoje = new Date().toISOString().slice(0, 10);
  check('3a: CHK default → CHK-AAAA-MM-DD-walkthrough',
    nextId('CHK') === `CHK-${hoje}-walkthrough`);
  check('3b: CHK com slug → CHK-AAAA-MM-DD-pix-cobranca',
    nextId('CHK', { slug: 'pix-cobranca' }) === `CHK-${hoje}-pix-cobranca`);
}

// Cenario 4: T-NNN dentro de arquivo de story
{
  const dir = setupProjeto();
  fs.mkdirSync(path.join(dir, 'docs/stories'), { recursive: true });
  const story = path.join(dir, 'docs/stories/US-200-teste.md');
  fs.writeFileSync(story, `# US-200

## Tasks
- T-001: faz X
- T-002: faz Y
- T-015: faz Z
`);
  clearReq();
  const { nextId } = require(LIB);
  check('4a: T-NNN dentro de story → T-016', nextId('T', { dentroDeArquivo: story }) === 'T-016');
}

// Cenario 5: pad customizado
{
  const dir = setupProjeto();
  fs.mkdirSync(path.join(dir, 'docs/decisions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs/decisions/ADR-0099-x.md'), '');
  clearReq();
  const { nextId } = require(LIB);
  check('5: ADR com pad=4 → ADR-0100', nextId('ADR', { pad: 4 }) === 'ADR-0100');
}

// Cenario 6: tipo invalido lanca erro
{
  clearReq();
  const { nextId } = require(LIB);
  let lancou = false;
  try { nextId('XYZ'); } catch { lancou = true; }
  check('6: tipo invalido → throw', lancou);
}

// Cenario 7: T sem dentroDeArquivo lanca erro
{
  clearReq();
  const { nextId } = require(LIB);
  let lancou = false;
  try { nextId('T'); } catch { lancou = true; }
  check('7: T sem dentroDeArquivo → throw', lancou);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
