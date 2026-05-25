#!/usr/bin/env node
/**
 * tools/validar-cobertura-hooks.js
 *
 * Verifica que todo hook bloqueador em templates/.claude/hooks/*.js aparece
 * em pelo menos 1 cenario na suite Node-only oficial pos v1.0:
 *   - test/hooks-node-only.test.js
 *
 * Ignorados (helpers / lifecycle sem retorno bloqueador):
 *   - _lib.js (infra)
 *   - auto-format-on-write.js (PostToolUse, formatador, nao bloqueia)
 *   - session-snapshot.js, session-snapshot-restore.js (lifecycle)
 *   - subagent-handoff-audit.js (SubagentStop, soft-warning)
 *   - regra-zero-reminder.js (UserPromptSubmit, injeta texto)
 *
 * Exit 0 = cobertura OK; exit 1 = hooks sem caso de teste.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOOKS_DIR = path.join(ROOT, 'templates', '.claude', 'hooks');
// Auditoria 2026-05-25 (regra #41): antes lia so hooks-node-only.test.js. Suites
// dedicadas (hooks-auditors-pass, hooks-checkpoint-marker, audit-sha-story, etc.)
// ficavam de fora — cobertura era subdeclarada. Agora scaneia tudo em test/.
const TEST_DIR = path.join(ROOT, 'test');
const SUITES = fs.existsSync(TEST_DIR)
  ? fs.readdirSync(TEST_DIR)
      .filter((f) => f.endsWith('.test.js'))
      .map((f) => path.join(TEST_DIR, f))
  : [];

const IGNORE = new Set([
  '_lib.js',
  'auto-format-on-write.js',
  'auto-frontmatter.js',                              // PreToolUse soft warning (sempre exit 0)
  'context-budget.js',                                // UserPromptSubmit (warning informativo)
  'session-snapshot.js',
  'session-snapshot-restore.js',
  'session-cleanup.js',                               // SessionEnd lifecycle
  'subagent-handoff-audit.js',
  'suggest-addon-on-keywords.js',                     // SessionStart best-effort
  'regra-zero-reminder.js',
  'lgpd-base-legal-reminder.js',                      // PreToolUse soft warning (LGPD-001/007)
  'lgpd-esquecimento-reminder.js',                    // PostToolUse soft warning (LGPD-002)
  'lgpd-minimizacao-reminder.js',                     // PostToolUse soft warning (LGPD-003)
  'lgpd-transferencia-internacional-reminder.js',     // PostToolUse soft warning (LGPD-005)
  'lgpd-trilha-auditoria-reminder.js',                // PostToolUse soft warning (LGPD-004)
  'lgpd-dpo-canal-reminder.js',                       // PostToolUse soft warning (LGPD-009)
]);

function main() {
  if (!fs.existsSync(HOOKS_DIR)) {
    console.error(`[validar-cobertura-hooks] diretorio nao existe: ${HOOKS_DIR}`);
    process.exit(2);
  }
  for (const s of SUITES) {
    if (!fs.existsSync(s)) {
      console.error(`[validar-cobertura-hooks] suite ausente: ${s}`);
      process.exit(2);
    }
  }

  const allTestText = SUITES.map((s) => fs.readFileSync(s, 'utf8')).join('\n');

  const todos = fs
    .readdirSync(HOOKS_DIR)
    .filter((f) => f.endsWith('.js') && !IGNORE.has(f));

  const semCaso = [];
  const semChamadaReal = [];
  for (const hook of todos) {
    const name = hook.replace(/\.js$/, '');
    // Cada hook deve aparecer pelo menos uma vez em alguma suite (string literal).
    const re = new RegExp(`['"]${name.replace(/[.-]/g, '\\$&')}['"]`);
    if (!re.test(allTestText)) {
      semCaso.push(hook);
      continue;
    }
    // Endurecimento (auditoria 2026-05-25, regra #41): exigir chamada REAL ao
    // hook (assertExit/assertBlockDecision/runHook/spawnSync/path .js), nao so
    // string literal solta em comentario. Antes uma string num comentario contava.
    const escName = name.replace(/[.-]/g, '\\$&');
    const patternsReais = [
      // helpers globais da suite hooks-node-only
      new RegExp(`assertExit\\s*\\([^)]*['"]${escName}['"]`),
      new RegExp(`assertBlockDecision\\s*\\([^)]*['"]${escName}['"]`),
      // helpers locais em suites dedicadas (runHook, runJsHook, etc.)
      new RegExp(`(run|spawn|exec)[A-Za-z]*\\s*\\([^)]*['"]${escName}['"]`),
      new RegExp(`spawnSync\\s*\\(\\s*['"]node['"][^)]*${escName}\\.js`),
      // referencia direta ao caminho do .js
      new RegExp(`${escName}\\.js['"]`),
    ];
    if (!patternsReais.some((re) => re.test(allTestText))) {
      semChamadaReal.push(hook);
    }
  }

  console.log(`[validar-cobertura-hooks] hooks bloqueadores: ${todos.length}`);
  console.log(`[validar-cobertura-hooks] hooks com pelo menos 1 cenario: ${todos.length - semCaso.length}`);
  console.log(`[validar-cobertura-hooks] ignorados (helpers/lifecycle): ${[...IGNORE].join(', ')}`);

  if (semCaso.length === 0 && semChamadaReal.length === 0) {
    console.log('[validar-cobertura-hooks] OK — todos os hooks bloqueadores tem cenario E chamada real (assertExit/assertBlockDecision).');
    process.exit(0);
  }

  if (semCaso.length > 0) {
    console.error('');
    console.error('[validar-cobertura-hooks] FALHA — hooks sem nenhuma mencao na suite:');
    for (const hook of semCaso) console.error(`  - ${hook}`);
  }
  if (semChamadaReal.length > 0) {
    console.error('');
    console.error('[validar-cobertura-hooks] FALHA — hooks mencionados mas SEM assertExit/assertBlockDecision real:');
    for (const hook of semChamadaReal) console.error(`  - ${hook}`);
    console.error('  (auditoria 2026-05-25: literal solta em comentario nao conta como cobertura)');
  }
  console.error('');
  console.error('Como resolver: adicione assertExit(...) ou assertBlockDecision(...) em uma das suites:');
  for (const s of SUITES) console.error(`  - ${path.relative(ROOT, s)}`);
  console.error('Veja docs/EXTENDENDO/hook.md.');
  process.exit(1);
}

main();
