// bin/lib/user-owned.js — arquivos que NUNCA são sobrescritos por `update`.
// Extraído de bin/install.js (Sprint 2.4) pra ter um único ponto canônico.
//
// Contrato: USER_OWNED é um Set imutável. Use isUserOwned(relPath) pra checar.
// Inclui também a regra "tudo dentro de .specify/overrides/ é do usuário"
// que antes vivia espalhada em bin/install.js.

'use strict';

const USER_OWNED = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'CLAUDE.local.md',
  'REGRAS-INEGOCIAVEIS.md',
  '.specify/memory/constitution.md',
  '.claude/settings.local.json',
  '.mcp.json',
  '.claude/.runtime',
]);

// Caminhos com prefixo: todo conteúdo dentro deles pertence ao usuário.
const USER_OWNED_PREFIXES = [
  '.specify/overrides/',
];

function normalizeRel(relPath) {
  return String(relPath).replace(/\\/g, '/').replace(/^\.\//, '');
}

function isUserOwned(relPath) {
  const norm = normalizeRel(relPath);
  if (USER_OWNED.has(norm)) return true;
  for (const prefix of USER_OWNED_PREFIXES) {
    if (norm === prefix.replace(/\/$/, '') || norm.startsWith(prefix)) return true;
  }
  return false;
}

module.exports = { USER_OWNED, USER_OWNED_PREFIXES, isUserOwned };
