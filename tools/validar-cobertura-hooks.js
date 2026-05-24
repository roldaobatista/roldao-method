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
const SUITES = [
  path.join(ROOT, 'test', 'hooks-node-only.test.js'),
];

const IGNORE = new Set([
  '_lib.js',
  'auto-format-on-write.js',
  'session-snapshot.js',
  'session-snapshot-restore.js',
  'subagent-handoff-audit.js',
  'regra-zero-reminder.js',
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
  for (const hook of todos) {
    const name = hook.replace(/\.js$/, '');
    // Cada hook deve aparecer pelo menos uma vez em alguma suite (string literal).
    const re = new RegExp(`['"]${name.replace(/[.-]/g, '\\$&')}['"]`);
    if (!re.test(allTestText)) {
      semCaso.push(hook);
    }
  }

  console.log(`[validar-cobertura-hooks] hooks bloqueadores: ${todos.length}`);
  console.log(`[validar-cobertura-hooks] hooks com pelo menos 1 cenario: ${todos.length - semCaso.length}`);
  console.log(`[validar-cobertura-hooks] ignorados (helpers/lifecycle): ${[...IGNORE].join(', ')}`);

  if (semCaso.length === 0) {
    console.log('[validar-cobertura-hooks] OK — todos os hooks bloqueadores tem cenario de teste.');
    process.exit(0);
  }

  console.error('');
  console.error('[validar-cobertura-hooks] FALHA — hooks sem cenario correspondente:');
  for (const hook of semCaso) {
    console.error(`  - ${hook}`);
  }
  console.error('');
  console.error('Como resolver: adicione pair(...) em uma das suites:');
  for (const s of SUITES) console.error(`  - ${path.relative(ROOT, s)}`);
  console.error('Veja docs/EXTENDENDO/hook.md.');
  process.exit(1);
}

main();
