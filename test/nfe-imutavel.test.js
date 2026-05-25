#!/usr/bin/env node
// Testes do hook nfe-imutavel.js (FISCAL-001).

const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Aponta pra templates/.claude/ (canonico versionado). Antes apontava pra
// .claude/ raiz (dogfood, gitignored), quebrando em CI.
const HOOK = path.join(__dirname, '..', 'templates', '.claude', 'hooks', 'nfe-imutavel.js');

function call(input) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
}

const CASES = [
  // BLOQUEAR
  { name: 'Bash UPDATE em nfe_emitida', shouldBlock: true,
    input: { tool_name: 'Bash', tool_input: { command: 'sqlite3 db "UPDATE nfe_emitida SET status=\'cancelada\' WHERE id=1"' } } },
  { name: 'Bash DELETE FROM notas_fiscais_emitidas', shouldBlock: true,
    input: { tool_name: 'Bash', tool_input: { command: 'psql -c "DELETE FROM notas_fiscais_emitidas WHERE id=5"' } } },
  { name: 'Write XML em pasta emitidas/', shouldBlock: true,
    input: { tool_name: 'Write', tool_input: { file_path: 'data/nfe/emitidas/35200714200166000187550010000000071123456789.xml', content: '<doc/>' } } },
  { name: 'Write XML cujo nome tem 44 digitos (chave)', shouldBlock: true,
    input: { tool_name: 'Write', tool_input: { file_path: 'data/35200714200166000187550010000000071123456789-nfe.xml', content: '<doc/>' } } },
  { name: 'Edit migration com UPDATE nfse_emitida', shouldBlock: true,
    input: { tool_name: 'Edit', tool_input: { file_path: 'migrations/V2.sql', new_string: 'UPDATE nfse_emitida SET total=0;' } } },

  // LIBERAR
  { name: 'Bash SELECT em nfe_emitida (leitura ok)', shouldBlock: false,
    input: { tool_name: 'Bash', tool_input: { command: 'psql -c "SELECT * FROM nfe_emitida LIMIT 10"' } } },
  { name: 'Write XML em pasta rascunho/', shouldBlock: false,
    input: { tool_name: 'Write', tool_input: { file_path: 'data/nfe/rascunho/pedido-123.xml', content: '<doc/>' } } },
  { name: 'Edit handler sem SQL', shouldBlock: false,
    input: { tool_name: 'Edit', tool_input: { file_path: 'src/handler.ts', new_string: 'export function handle() { return 1; }' } } },
  { name: 'Bash UPDATE em outra tabela (clientes)', shouldBlock: false,
    input: { tool_name: 'Bash', tool_input: { command: 'psql -c "UPDATE clientes SET nome=\'X\'"' } } },
  { name: 'Exception explicita libera', shouldBlock: false,
    input: { tool_name: 'Bash', tool_input: { command: '# FISCAL-001-exception: ADR-042 autoriza correcao\nUPDATE nfe_emitida SET serie=2' } } },
];

let ok = 0, fail = 0;
for (const c of CASES) {
  const r = call(c.input);
  const blocked = r.status === 2;
  const pass = blocked === c.shouldBlock;
  if (pass) { ok++; console.log(`OK   ${c.name} -> ${blocked ? 'bloqueado' : 'liberado'}`); }
  else { fail++; console.log(`FAIL ${c.name} -> esperava ${c.shouldBlock ? 'bloquear' : 'liberar'}, ${blocked ? 'bloqueou' : 'liberou'}`); console.log(`     stderr: ${(r.stderr || '').split('\n')[0]}`); }
}
console.log(`\nTotal: OK: ${ok} FAIL: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
