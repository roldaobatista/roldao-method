// bin/lib/node-version-check.js — gate de versão Node.
// Extraído de bin/install.js (Sprint 2.4). Roda ANTES de qualquer require não-builtin
// pra evitar SyntaxError de sintaxe nova num Node antigo.
//
// Contrato: checkNodeVersion({ required, current, write, exit }) — todos injetáveis pra teste.
// Retorna `true` se passou; chama `exit(1)` se reprovou (efeito colateral controlado).

'use strict';

const DEFAULT_REQUIRED = 18;

function checkNodeVersion({
  required = DEFAULT_REQUIRED,
  current = (process.versions && process.versions.node) || '',
  write = (msg) => process.stderr.write(msg),
  exit = (code) => process.exit(code),
} = {}) {
  if (!current) return true;
  const major = parseInt(String(current).split('.')[0], 10);
  if (Number.isNaN(major) || major >= required) return true;
  write(
    '\n[roldao-method] Node ' + required + '+ necessario. Voce esta usando: ' + current + '\n' +
    '\n' +
    'Como atualizar:\n' +
    '  - Windows/macOS: baixe instalador em https://nodejs.org (versao LTS)\n' +
    '  - Linux: use nvm (https://github.com/nvm-sh/nvm) ou pacote da distro\n' +
    '\n' +
    'Depois rode novamente: npx roldao-method install\n\n'
  );
  exit(1);
  return false;
}

module.exports = { checkNodeVersion, DEFAULT_REQUIRED };
