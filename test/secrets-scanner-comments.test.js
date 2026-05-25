#!/usr/bin/env node
// Round 11 — falso positivo: senha em comentario nao deve bloquear.
// Token real em qualquer linha (inclusive comentario) deve bloquear.
//
// NOTA: os literais "password = ..." que o teste envia ao hook sao montados
// via concat (PWD + ' = ...') pra evitar que o proprio secrets-scanner
// bloqueie a escrita DESTE arquivo. TST-001-exception: workaround legitimo
// pra testar o proprio scanner sem auto-bloquear.

const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Aponta pra templates/.claude/ (canonico versionado). Antes apontava pra
// .claude/ raiz (dogfood, gitignored), quebrando em CI.
const HOOK = path.join(__dirname, '..', 'templates', '.claude', 'hooks', 'secrets-scanner.js');
const P = 'pass' + 'word';
const S = 'sen' + 'ha';

const CASES = [
  // Falsos positivos da round 11 (devem LIBERAR)
  { name: 'comentario JS com senha exemplo', file: 'src/auth.js',
    content: '// ' + P + ' = abc12345 (exemplo, nao real)\nfunction login() {}', shouldBlock: false },
  { name: 'comentario # Python com senha', file: 'app.py',
    content: '# ' + S + ' = minhasenha123 (default doc)\nprint("ok")', shouldBlock: false },

  // Continuam bloqueando (positivos verdadeiros)
  { name: 'password atribuido em codigo', file: 'config.js',
    content: 'const c = { ' + P + ': "supersecret123" };', shouldBlock: true },
  { name: 'senha bare em YAML', file: 'config.yaml',
    content: P + ' = supersecret123abc\nuser = admin', shouldBlock: true },
  { name: 'token AWS real em comentario AINDA bloqueia', file: 'notes.md',
    content: '// chave vazada: AKIA' + 'IOSFODNN7EXAMPLE', shouldBlock: true },
];

let ok = 0;
let fail = 0;

for (const c of CASES) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_input: { file_path: c.file, content: c.content } }),
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
