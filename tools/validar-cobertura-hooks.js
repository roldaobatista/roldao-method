#!/usr/bin/env node
/**
 * tools/validar-cobertura-hooks.js
 *
 * Verifica que todo hook bloqueador em templates/.claude/hooks/*.sh aparece
 * em pelo menos 1 `run_case` do _test-runner.sh.
 *
 * Ignorados (helpers / lifecycle sem retorno bloqueador):
 *   - _lib.sh, _test-runner.sh
 *   - auto-format-on-write.sh (PostToolUse, formatador, nao bloqueia)
 *   - session-snapshot.sh, session-snapshot-restore.sh (PreCompact/Session*)
 *   - subagent-handoff-audit.sh (SubagentStop, soft-warning)
 *   - regra-zero-reminder.sh (UserPromptSubmit, injeta texto)
 *
 * Exit 0 = cobertura OK; exit 1 = hooks sem caso de teste.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOOKS_DIR = path.join(ROOT, 'templates', '.claude', 'hooks');
const TEST_RUNNER = path.join(HOOKS_DIR, '_test-runner.sh');

const IGNORE = new Set([
  '_lib.sh',
  '_test-runner.sh',
  'auto-format-on-write.sh',
  'session-snapshot.sh',
  'session-snapshot-restore.sh',
  'subagent-handoff-audit.sh',
  'regra-zero-reminder.sh',
]);

function main() {
  if (!fs.existsSync(HOOKS_DIR)) {
    console.error(`[validar-cobertura-hooks] diretorio nao existe: ${HOOKS_DIR}`);
    process.exit(2);
  }
  if (!fs.existsSync(TEST_RUNNER)) {
    console.error(`[validar-cobertura-hooks] _test-runner.sh nao existe`);
    process.exit(2);
  }

  const runner = fs.readFileSync(TEST_RUNNER, 'utf8');
  const todos = fs
    .readdirSync(HOOKS_DIR)
    .filter((f) => f.endsWith('.sh') && !IGNORE.has(f));

  const sem_caso = [];
  for (const hook of todos) {
    // Hook tem teste se aparece em pelo menos 1 destes padroes:
    //   - run_case "..." "<hook>.sh" ...   (helper padrao)
    //   - bash "$HOOKS_DIR/<hook>.sh"      (teste com setup customizado)
    const nomeEscape = hook.replace(/[.]/g, '\\.');
    const padraoRunCase = new RegExp(`run_case\\s+"[^"]*"\\s+"${nomeEscape}"`);
    const padraoBashHooksDir = new RegExp(`HOOKS_DIR[^"]*${nomeEscape}`);
    if (!padraoRunCase.test(runner) && !padraoBashHooksDir.test(runner)) {
      sem_caso.push(hook);
    }
  }

  console.log(`[validar-cobertura-hooks] hooks bloqueadores: ${todos.length}`);
  console.log(`[validar-cobertura-hooks] hooks com pelo menos 1 run_case: ${todos.length - sem_caso.length}`);
  console.log(`[validar-cobertura-hooks] ignorados (helpers/lifecycle): ${[...IGNORE].join(', ')}`);

  if (sem_caso.length === 0) {
    console.log('[validar-cobertura-hooks] OK — todos os hooks bloqueadores tem caso de teste.');
    process.exit(0);
  }

  console.error('');
  console.error('[validar-cobertura-hooks] FALHA — hooks sem run_case correspondente:');
  for (const hook of sem_caso) {
    console.error(`  - ${hook}`);
  }
  console.error('');
  console.error('Como resolver: adicione run_case em templates/.claude/hooks/_test-runner.sh.');
  console.error('Veja docs/EXTENDENDO/hook.md (secao "Adicione caso de teste") pra esqueleto.');
  process.exit(1);
}

main();
