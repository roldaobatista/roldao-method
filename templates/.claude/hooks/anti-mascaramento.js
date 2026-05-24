#!/usr/bin/env node
// anti-mascaramento.js — bloqueia padroes que mascaram erro/teste falho.
// Hook PreToolUse, matcher: Write|Edit. TST-001, INV-006.
//
// T-004 (B4 + J6 + J7): xdescribe adicionado a TOKEN_RAW. Padroes
// adicionais (if(false)/if(0), teste comentado, return precoce em it())
// disparam SOMENTE em arquivos de teste, pra evitar falso positivo em
// codigo de producao com feature flag.
//
// Decomposicao: PRD-003 → US-111 → T-004.

const { readStdinJson, recordMetric } = require('./_lib.js');

// Tokens potencialmente auto-acionados montados via concat split.
// (cada um separado pra evitar o proprio hook detectar a string literal aqui)
const TS_IGNORE = '@' + 'ts-ignore';
const TS_NOCHECK = '@' + 'ts-nocheck';
const ESLINT_DISABLE = '/' + '/ eslint-disable';
const ESLINT_DISABLE_BLOCK = '/' + '\\* eslint-disable';
const NOQA = '#' + ' noqa';
const TYPE_IGNORE = '#' + ' type:\\s*ignore';
const SUPPRESS = '@' + 'SuppressWarnings';
const DISABLED = '@' + 'Disabled';

const TOKEN_RAW = [
  TS_IGNORE,
  TS_NOCHECK,
  ESLINT_DISABLE,
  ESLINT_DISABLE_BLOCK,
  NOQA,
  TYPE_IGNORE,
  SUPPRESS,
  'assertTrue\\(true\\)',
  'assertEquals\\(1,\\s*1\\)',
  'expect\\(true\\)\\.toBe\\(true\\)',
  '\\.skip\\(',
  '\\bxit\\(',
  '\\bfit\\(',
  '\\bxdescribe\\(',   // T-004 (B4): adicionado — TST-001 lista este token explicitamente
  '\\bfdescribe\\(',
  'pytest\\.mark\\.skip',
  '\\.todo\\(',
  DISABLED,
  '\\|\\|\\s*true(\\s*($|;|#|&|\\|))',
  '--' + 'no-verify',
  '--' + 'skip-tests',
  '--' + 'ignore-errors',
  'pytest\\.skip',
];

// Padroes que disparam APENAS em arquivos de teste (T-004 / J6 + J7).
// Em codigo de producao, `if (false)` pode ser feature flag legitima.
// Em codigo de teste, `if (false)` deixa bloco de teste morto silenciosamente.
// Padroes ancorados em INICIO DE LINHA (^\s*) pra evitar falso positivo
// quando aparecem dentro de string literal/template (testes do proprio hook).
const TEST_ONLY_RAW = [
  // J6 — bloco morto: if (false) { ... }, if (0) { ... } no comeco da linha
  '^\\s*if\\s*\\(\\s*(false|0)\\s*\\)\\s*\\{',
  // J6 — teste comentado: linha comeca com // ou /* anulando chamada it/describe/test
  '^\\s*/' + '/\\s*(it|describe|test)\\(',
  '^\\s*/' + '\\*\\s*(it|describe|test)\\(',
  // J7 — return precoce em it()/test() arrow no inicio da linha
  '^\\s*\\b(it|test)\\(\\s*[\'"`][^\'"`]+[\'"`]\\s*,\\s*(async\\s*)?\\(\\s*\\)\\s*=>\\s*\\{\\s*return\\b',
  // J7 — variante function() em vez de arrow
  '^\\s*\\b(it|test)\\(\\s*[\'"`][^\'"`]+[\'"`]\\s*,\\s*(async\\s+)?function\\s*\\([^)]*\\)\\s*\\{\\s*return\\b',
];

const COMBINED_RE = new RegExp(TOKEN_RAW.join('|'), 'i');
const TEST_ONLY_RE = new RegExp(TEST_ONLY_RAW.join('|'), 'i');
const EXCEPTION_RE = /TST-001-exception:\s*\S+/i;
const TEST_PATH_RE = /(^|\/)(test|tests|spec|specs|__tests__)\/|\.(test|spec)\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart)$|_test\.(go|py)$/i;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const isTestFile = TEST_PATH_RE.test(filePath);

  const lines = String(content).split(/\r?\n/);
  const violations = [];
  lines.forEach((line, idx) => {
    let hit = false;
    if (COMBINED_RE.test(line)) hit = true;
    else if (isTestFile && TEST_ONLY_RE.test(line)) hit = true;
    if (!hit) return;
    if (EXCEPTION_RE.test(line)) return;
    violations.push(`${idx + 1}:${line}`);
  });

  if (violations.length > 0) {
    const MAX = 3;
    process.stderr.write(`[anti-mascaramento] BLOQUEADO: padrão de mascaramento detectado.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n`);
    if (isTestFile) process.stderr.write(`Tipo: arquivo de teste (regras adicionais aplicam — T-004)\n`);
    process.stderr.write(`\nViolações (mostrando até ${MAX}):\n`);
    for (let i = 0; i < Math.min(MAX, violations.length); i++) {
      process.stderr.write(`  - ${violations[i]}\n`);
    }
    if (violations.length > MAX) {
      process.stderr.write(`  (... e mais ${violations.length - MAX} ocorrência(s))\n`);
    }
    process.stderr.write(`\nPor que: teste mascarado = bug silencioso. O teste falhou porque o CÓDIGO\n`);
    process.stderr.write(`está errado — esconder o erro não corrige nada, só atrasa a descoberta.\n`);
    process.stderr.write(`Corrija o código, não o teste.\n\n`);
    if (isTestFile) {
      process.stderr.write(`Em arquivos de teste tambem proibidos (T-004 / J6+J7):\n`);
      process.stderr.write(`  - if (false) / if (0): bloco de teste morto\n`);
      process.stderr.write(`  - chamada de teste anulada por comentario: anula assertion\n`);
      process.stderr.write(`  - it('x', () => { return; ...}): return precoce pula expect\n\n`);
    }
    process.stderr.write(`Exceção com prazo (use só se for inevitável):\n`);
    process.stderr.write(`  // TST-001-exception: <razão + prazo, ex: "API externa fora até 2026-05-25">\n\n`);
    process.stderr.write(`Regra: TST-001.\n`);
    process.stderr.write(`Ver: REGRAS-INEGOCIAVEIS.md#tst-001\n`);
    recordMetric('block', 'anti-mascaramento', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[anti-mascaramento] erro interno: ${err.message}\n`);
  process.exit(2);
});
