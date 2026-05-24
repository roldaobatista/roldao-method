#!/usr/bin/env node
/**
 * test/hooks-node-only.test.js — roda os 26 hooks .js DIRETO (sem bash).
 *
 * Diferenca de hooks-equivalence.test.js: NAO compara com .sh, so valida que
 * cada hook .js executa em Node puro e retorna exit code esperado pra cenarios
 * basicos. Cobre o cenario "dev Windows puro sem Git Bash" — o objetivo
 * central do EP-001 (PRD-001 caminho A).
 *
 * Funciona em qualquer plataforma com Node 18+ (Linux, macOS, Windows
 * com/sem bash). Job CI windows-no-bash usa este teste exclusivamente.
 */

// Hooks chamam recordMetric quando bloqueiam — esta env var evita poluir
// metrics.jsonl com bloqueios provocados de proposito pelos testes.
process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOKS_DIR = path.join(ROOT, 'templates', '.claude', 'hooks');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

// Roda hook .js direto com node + stdin
function runJsHook(hookName, input) {
  const hookPath = path.join(HOOKS_DIR, `${hookName}.js`);
  const r = spawnSync('node', [hookPath], {
    input: String(input),
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
  });
  return { exit: r.status, stdout: (r.stdout || '').toString(), stderr: (r.stderr || '').toString() };
}

function assertExit(label, hookName, input, expectedExit) {
  const r = runJsHook(hookName, input);
  check(label, r.exit === expectedExit, `expected exit=${expectedExit}, got=${r.exit}, stderr="${r.stderr.slice(0, 100)}"`);
}

function assertBlockDecision(label, hookName, input) {
  const r = runJsHook(hookName, input);
  check(label,
    r.exit === 0 && /["']?decision["']?:\s*["']?block["']?/.test(r.stdout),
    `expected JSON decision:block, got exit=${r.exit} stdout="${r.stdout.slice(0, 100)}"`);
}

console.log('\nhooks-node-only: testa hooks .js puros sem dependencia bash\n');

// ============================================================================
// Hooks que existem e devem rodar sem crash
// ============================================================================
const ALL_HOOKS = [
  'block-destructive',
  'no-amend-after-push',
  'secrets-scanner',
  'block-secrets-in-commit-message',
  'anti-mascaramento',
  'block-mock-in-integration',
  'no-test-data-in-fixtures',
  'validate-test-pyramid',
  'no-hardcoded-env-urls',
  'fiscal-br-validator',
  'no-log-pix-key',
  'lgpd-base-legal-reminder',
  'enforce-pipeline-completion',
  'require-investigador-before-fix',
  'require-readiness-before-feature',
  'require-agent-sequence-before-dev',
  'require-checkpoint-before-merge',
  'require-auditors-pass-before-commit',
  'validate-quick-dev-scope',
  'validate-story-dependencies',
  'validate-story-approvals',
  'commit-message-validator',
  'auto-format-on-write',
  'context-budget',
  'session-snapshot',
  'session-snapshot-restore',
  'subagent-handoff-audit',
  'paths-frontmatter-validator',
  'block-todo-without-issue',
  'block-jargon-pt-br',
  'block-confirmation-questions',
  'mcp-validator',
  'regra-zero-reminder',
];

// Smoke: cada hook .js existe e arranca sem crash em input minimo
for (const h of ALL_HOOKS) {
  const file = path.join(HOOKS_DIR, `${h}.js`);
  if (!fs.existsSync(file)) {
    fail++;
    console.log(`  FAIL ${h}: .js nao existe em ${file}`);
    continue;
  }
  // node --check valida sintaxe sem rodar
  const syn = spawnSync('node', ['--check', file], { stdio: 'pipe' });
  if (syn.status !== 0) {
    fail++;
    console.log(`  FAIL ${h}: sintaxe invalida — ${(syn.stderr || '').toString().slice(0, 200)}`);
    continue;
  }
  pass++;
  console.log(`  OK   ${h}: existe + sintaxe OK`);
}

// ============================================================================
// Comportamento de bloqueio (sem state ativo — basta input)
// ============================================================================

// block-destructive
assertExit('block-destructive: rm -rf / bloqueia', 'block-destructive',
  JSON.stringify({ tool_input: { command: 'rm -rf /' } }), 2);
assertExit('block-destructive: ls libera', 'block-destructive',
  JSON.stringify({ tool_input: { command: 'ls -la' } }), 0);
assertExit('block-destructive: rm -rf node_modules whitelist libera', 'block-destructive',
  JSON.stringify({ tool_input: { command: 'rm -rf node_modules' } }), 0);

// secrets-scanner
assertExit('secrets-scanner: .env bloqueia', 'secrets-scanner',
  JSON.stringify({ tool_input: { file_path: '/proj/.env', content: 'X=1' } }), 2);
assertExit('secrets-scanner: AKIA em conteudo bloqueia', 'secrets-scanner',
  JSON.stringify({ tool_input: { file_path: '/proj/cfg.js', content: 'const k = "AKIAIOSFODNN7EXAMPLE";' } }), 2);
assertExit('secrets-scanner: .env.example libera (path)', 'secrets-scanner',
  JSON.stringify({ tool_input: { file_path: '/proj/.env.example', content: 'API_KEY=fake' } }), 0);

// block-secrets-in-commit-message
assertExit('commit-msg-secrets: AKIA bloqueia', 'block-secrets-in-commit-message',
  JSON.stringify({ tool_input: { command: 'git commit -m "fix: AKIAIOSFODNN7EXAMPLE"' } }), 2);
assertExit('commit-msg-secrets: msg limpa libera', 'block-secrets-in-commit-message',
  JSON.stringify({ tool_input: { command: 'git commit -m "fix: ajusta validacao"' } }), 0);

// anti-mascaramento
assertExit('anti-mask: ts-ignore bloqueia', 'anti-mascaramento',
  JSON.stringify({ tool_input: { file_path: '/proj/a.ts', content: '// @ts-' + 'ignore\nfoo();' } }), 2);
assertExit('anti-mask: codigo limpo libera', 'anti-mascaramento',
  JSON.stringify({ tool_input: { file_path: '/proj/a.ts', content: 'export const x = 1;' } }), 0);

// block-mock-in-integration
assertExit('mock-integ: jest.mock em /integration/ bloqueia', 'block-mock-in-integration',
  JSON.stringify({ tool_input: { file_path: '/proj/tests/integration/x.test.js', content: 'jest.mock("./db");' } }), 2);
assertExit('mock-integ: jest.mock fora libera', 'block-mock-in-integration',
  JSON.stringify({ tool_input: { file_path: '/proj/tests/unit/x.test.js', content: 'jest.mock("./db");' } }), 0);

// no-test-data-in-fixtures
assertExit('fixtures: gmail bloqueia', 'no-test-data-in-fixtures',
  JSON.stringify({ tool_input: { file_path: '/proj/fixtures/users.json', content: '"email": "joao@gmail.com"' } }), 2);
assertExit('fixtures: example.com libera', 'no-test-data-in-fixtures',
  JSON.stringify({ tool_input: { file_path: '/proj/fixtures/users.json', content: '"email": "joao@example.com"' } }), 0);

// no-hardcoded-env-urls
assertExit('urls: SEFAZ hardcoded bloqueia', 'no-hardcoded-env-urls',
  JSON.stringify({ tool_input: { file_path: '/proj/src/sefaz.ts', content: 'fetch("https://nfe.fazenda.sp.gov.br/x");' } }), 2);
// Auditoria 10-agentes 2ª passada 2026-05-24: fallback `|| 'URL'` agora BLOQUEIA
// (era o vetor real de SEC-005 violado). Apenas SEC-005-exception libera.
assertExit('urls: fallback || URL bloqueia (vetor SEC-005 real)', 'no-hardcoded-env-urls',
  JSON.stringify({ tool_input: { file_path: '/proj/src/sefaz.ts', content: 'fetch(process.env.SEFAZ_URL || "https://nfe.fazenda.sp.gov.br/x");' } }), 2);
assertExit('urls: process.env puro (sem fallback hardcoded) libera', 'no-hardcoded-env-urls',
  JSON.stringify({ tool_input: { file_path: '/proj/src/sefaz.ts', content: 'fetch(process.env.SEFAZ_URL);' } }), 0);
assertExit('urls: SEC-005-exception libera', 'no-hardcoded-env-urls',
  JSON.stringify({ tool_input: { file_path: '/proj/src/sefaz.ts', content: 'const URL = "https://nfe.fazenda.sp.gov.br/x"; // SEC-005-exception: URL canonica documentada na RFC interna' } }), 0);

// fiscal-br-validator
assertExit('fiscal: tpAmb=1 hardcoded bloqueia', 'fiscal-br-validator',
  JSON.stringify({ tool_input: { file_path: '/proj/src/nfe.ts', content: 'const tpAmb = 1;' } }), 2);
assertExit('fiscal: tpAmb com env libera', 'fiscal-br-validator',
  JSON.stringify({ tool_input: { file_path: '/proj/src/nfe.ts', content: 'const tpAmb = process.env.SEFAZ_TPAMB;' } }), 0);

// no-log-pix-key
assertExit('pix-log: console.log cpf bloqueia', 'no-log-pix-key',
  JSON.stringify({ tool_input: { file_path: '/proj/src/pix.ts', content: 'console.log("cpf:", cpf);' } }), 2);
assertExit('pix-log: com mask libera', 'no-log-pix-key',
  JSON.stringify({ tool_input: { file_path: '/proj/src/pix.ts', content: 'console.log("cpf:", mask(cpf));' } }), 0);

// paths-frontmatter-validator
assertExit('frontmatter: sem header bloqueia', 'paths-frontmatter-validator',
  JSON.stringify({ tool_input: { file_path: '/proj/docs/x.md', content: '# Titulo' } }), 2);

// block-todo-without-issue
assertExit('todo: sem id bloqueia', 'block-todo-without-issue',
  JSON.stringify({ tool_input: { file_path: '/proj/src/x.js', content: '// TODO refactor depois' } }), 2);
assertExit('todo: com US-NNN libera', 'block-todo-without-issue',
  JSON.stringify({ tool_input: { file_path: '/proj/src/x.js', content: '// TODO(US-042): doc' } }), 0);

// validate-story-approvals
assertExit('story-approvals: entregue sem aprovacoes bloqueia', 'validate-story-approvals',
  JSON.stringify({ tool_input: { file_path: '/proj/docs/stories/US-001-x.md', content: 'id: US-001\nstatus: entregue' } }), 2);

// commit-message-validator (sem state)
assertExit('commit-msg: tipo invalido bloqueia', 'commit-message-validator',
  JSON.stringify({ tool_input: { command: 'git commit -m "wip: trabalho"' } }), 2);
assertExit('commit-msg: msg valida libera', 'commit-message-validator',
  JSON.stringify({ tool_input: { command: 'git commit -m "fix: ajusta validacao"' } }), 0);

console.log(`\nhooks-node-only: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
