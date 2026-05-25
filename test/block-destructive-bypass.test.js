#!/usr/bin/env node
// Teste regressivo dos bypasses detectados na auditoria 10-agentes (round 11).
// Cada caso deve BLOQUEAR (exit 2).

const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Aponta pra templates/.claude/ (canonico versionado). Antes apontava pra
// .claude/ da raiz (dogfood, gitignored), o que quebrava o teste em CI/clone
// limpo onde a raiz nao existe.
const HOOK = path.join(__dirname, '..', 'templates', '.claude', 'hooks', 'block-destructive.js');

const CASES = [
  // Bypass por backslash escape
  { name: 'rm via backslash (r\\m -rf /etc)', cmd: 'r\\m -rf /etc', shouldBlock: true },
  { name: 'rm via backslash em path (r\\m -rf ~)', cmd: 'r\\m -rf ~', shouldBlock: true },
  // Bypass por quote vazia (string concat shell)
  { name: 'rm via quote vazia (r""m -rf /etc)', cmd: 'r""m -rf /etc', shouldBlock: true },
  { name: 'rm via single quote (r\'\'m -rf /etc)', cmd: "r''m -rf /etc", shouldBlock: true },
  // Bypass por base64+pipe
  { name: 'base64 -d | bash', cmd: 'echo cm0gLXJmIC8K | base64 -d | bash', shouldBlock: true },
  { name: 'base64 --decode | sh', cmd: 'echo foo | base64 --decode | sh', shouldBlock: true },
  // Bypass por pipe genérico (vazado de scripts opacos)
  { name: 'cat script | bash', cmd: 'cat /tmp/script.sh | bash', shouldBlock: true },

  // Casos LEGÍTIMOS (não pode bloquear)
  { name: 'rm -rf node_modules (whitelist)', cmd: 'rm -rf node_modules', shouldBlock: false },
  { name: 'rm -rf dist coverage (whitelist múltipla)', cmd: 'rm -rf dist coverage', shouldBlock: false },
  { name: 'ls -la (benigno)', cmd: 'ls -la', shouldBlock: false },
  { name: 'git status (benigno)', cmd: 'git status', shouldBlock: false },
];

let ok = 0;
let fail = 0;

for (const c of CASES) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_input: { command: c.cmd } }),
    encoding: 'utf8',
  });
  const blocked = r.status === 2;
  const pass = blocked === c.shouldBlock;
  if (pass) {
    ok++;
    console.log(`OK   ${c.name} -> ${blocked ? 'bloqueado' : 'liberado'}`);
  } else {
    fail++;
    console.log(`FAIL ${c.name} -> esperava ${c.shouldBlock ? 'bloquear' : 'liberar'}, ${blocked ? 'bloqueou' : 'liberou'}`);
    console.log(`     stderr: ${(r.stderr || '').split('\n')[0]}`);
  }
}

console.log(`\nTotal: OK: ${ok} FAIL: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
