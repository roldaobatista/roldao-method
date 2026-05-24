// bin/lib/user-owned.js — arquivos que NUNCA são sobrescritos por `update`.
// Extraído de bin/install.js (Sprint 2.4) pra ter um único ponto canônico.
//
// Contrato: USER_OWNED é um Set imutável. Use isUserOwned(relPath) pra checar.
// Inclui também a regra "tudo dentro de .specify/overrides/ é do usuário"
// que antes vivia espalhada em bin/install.js.
//
// Auditoria 10-agentes 3ª passada 2026-05-24: adicionado CUSTOMIZABLE_DIRS pra
// arquivos em .claude/{agents,commands,hooks,skills,output-styles} onde o
// usuário comumente customiza. Não sao USER_OWNED por padrão (precisam atualizar
// quando vier melhoria do framework), mas update grava backup datado e marca
// como CUSTOMIZADO quando o hash difere do template original.

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

// Pastas onde o usuário costuma customizar (editar agente, hook, command, skill).
// Hash diferente do template = customização local. Update vai sobrescrever mas
// SEMPRE cria backup datado em vez de .bak simples, e marca como CUSTOMIZADO
// no resumo pro usuário saber que algo dele foi mexido.
const CUSTOMIZABLE_PREFIXES = [
  '.claude/agents/',
  '.claude/commands/',
  '.claude/hooks/',
  '.claude/skills/',
  '.claude/output-styles/',
  '.claude/rules/',
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

function isCustomizable(relPath) {
  const norm = normalizeRel(relPath);
  return CUSTOMIZABLE_PREFIXES.some((p) => norm.startsWith(p));
}

module.exports = { USER_OWNED, USER_OWNED_PREFIXES, CUSTOMIZABLE_PREFIXES, isUserOwned, isCustomizable };
