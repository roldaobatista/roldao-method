#!/usr/bin/env node
/**
 * test/hooks-anti-mascaramento-extra.test.js — testes adversariais dos padroes
 * novos adicionados em T-004 (B4 + J6 + J7).
 *
 * B4 — token x-describe adicionado a TOKEN_RAW (vigente em qualquer arquivo)
 * J6 — if(false)/if(0), teste comentado, ambos so em arquivos de teste
 * J7 — return precoce em it()/test() so em arquivos de teste
 *
 * Strings que contem tokens detectados pelo proprio hook sao montadas via
 * concat pra nao acionar o hook quando ESTE arquivo for escrito/escaneado.
 *
 * Decomposicao: PRD-003 → US-111 → T-004.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'anti-mascaramento.js');

// Montagem via concat pra evitar o hook acionar em ESTE source ao escrever.
const XIT = 'x' + 'it';
const FIT = 'f' + 'it';
const XDESCRIBE = 'x' + 'describe';
const FDESCRIBE = 'f' + 'describe';
const DOT_SKIP = '.s' + 'kip';
const EXPECT_TRUE_TOBE = 'expe' + 'ct(true).t' + 'oBe(true)';

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function run(filePath, content) {
  const input = JSON.stringify({ tool_input: { file_path: filePath, content } });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

console.log('\nhooks-anti-mascaramento-extra: padroes novos T-004 (B4 + J6 + J7)\n');

// ============================================================================
// B4 — token x-describe vigente em qualquer arquivo
// ============================================================================

{
  const r = run('/tmp/financeiro.test.js', `${XDESCRIBE}('financeiro', () => { it('soma', () => {}); });`);
  check('B4.1: token x-describe em teste -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  const r = run('/tmp/x.test.js', `\n${XDESCRIBE}('algo', () => {});\n`);
  check('B4.2: token x-describe em linha propria -> block', r.exit === 2, `exit=${r.exit}`);
}

// ============================================================================
// J6 — if(false)/if(0) so em arquivos de teste (no INICIO da linha)
// ============================================================================

{
  const content = `it('algo', () => {\n  if (false) {\n    ${EXPECT_TRUE_TOBE};\n  }\n});`;
  const r = run('/tmp/x.test.js', content);
  check('J6.1: if(false) no inicio de linha em teste -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  const content = `it('algo', () => {\n  if (0) {\n    return;\n  }\n});`;
  const r = run('/tmp/x.test.js', content);
  check('J6.2: if(0) em teste -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  // Codigo de prod (nao .test/.spec) — if(false) PASSA (pode ser feature flag)
  const r = run('/tmp/src/featureflag.js', `if (false) {\n  console.log('feature desligada');\n}`);
  check('J6.3: if(false) em codigo de prod -> pass (feature flag)', r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 100)}`);
}

// ============================================================================
// J6 — teste comentado so em arquivos de teste (linha COMECA com // ou /*)
// ============================================================================

{
  const r = run('/tmp/x.test.js', `// it('vai falhar', () => {});`);
  check('J6.4: chamada it() comentada (linha comeca com //) em teste -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  const r = run('/tmp/x.spec.js', `/* describe('grupo', () => {}); */`);
  check('J6.5: describe() em comentario de bloco em teste -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  // Comentario "use it() pra testar" em codigo de prod — nao bloqueia
  const r = run('/tmp/src/x.js', `// use it() pra testar este modulo`);
  // Em codigo de prod, padrao TEST_ONLY nao roda — passa
  check('J6.6: comentario com "it()" em codigo de prod -> pass', r.exit === 0, `exit=${r.exit}`);
}

{
  // Em arquivo de teste, string literal no meio da linha NAO casa (anchored ^)
  const r = run('/tmp/x.test.js', `const msg = "no fim da linha: it('teste')";`);
  check('J6.7: string literal com "it(" no meio da linha -> pass', r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 100)}`);
}

// ============================================================================
// J7 — return precoce so em arquivos de teste
// ============================================================================

{
  const r = run('/tmp/x.test.js', `it('algo', () => { return; });`);
  check('J7.1: it com return precoce arrow -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  // Limitacao deliberada: regex casa por linha — return na mesma linha do test()
  const r = run('/tmp/x.test.js', `test('algo', async () => { return; await api(); });`);
  check('J7.2: test async com return precoce na mesma linha -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  const r = run('/tmp/x.test.js', `it('algo', function() { return; });`);
  check('J7.3: it com function() e return precoce -> block', r.exit === 2, `exit=${r.exit}`);
}

{
  // it com return de promise (uso legitimo)
  const r = run('/tmp/x.test.js', `it('algo', () => promise().then(r => r));`);
  check('J7.4: it com return implicito de promise (uso legitimo) -> pass', r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 100)}`);
}

// ============================================================================
// Controle: regressao — padroes existentes continuam pegando
// ============================================================================

{
  const r = run('/tmp/x.test.js', `it${DOT_SKIP}('algo', () => {});`);
  check('controle 1: token ponto-skip continua bloqueando', r.exit === 2, `exit=${r.exit}`);
}

{
  const r = run('/tmp/x.test.js', `${XIT}('algo', () => {});`);
  check('controle 2: token x-it continua bloqueando', r.exit === 2, `exit=${r.exit}`);
}

{
  const r = run('/tmp/x.test.js', `${EXPECT_TRUE_TOBE};`);
  check('controle 3: assertion tautologica continua bloqueando', r.exit === 2, `exit=${r.exit}`);
}

{
  // TST-001-exception em comentario na mesma linha — passa
  const r = run('/tmp/x.test.js', `it${DOT_SKIP}('algo'); // TST-001-exception: API externa fora ate 2026-05-25`);
  check('controle 4: TST-001-exception continua liberando', r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 100)}`);
}

{
  const r = run('/tmp/x.test.js', `${FDESCRIBE}('focado', () => {});`);
  check('controle 5: token f-describe continua bloqueando', r.exit === 2, `exit=${r.exit}`);
}

{
  const r = run('/tmp/x.test.js', `${FIT}('focado', () => {});`);
  check('controle 6: token f-it continua bloqueando', r.exit === 2, `exit=${r.exit}`);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
