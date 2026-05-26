#!/usr/bin/env node
/**
 * resolver-template.js — resolve template/checklist/data com precedencia override.
 *
 * Implementa o mecanismo prometido em ADR-003 / AGENTS.md §9 /
 * `.claude/rules/roldao-method.md` ("Precedencia de template/checklist/KB"):
 *
 *   1. Existe `.specify/overrides/<area>/<nome>`? → usa esse.
 *   2. Senao → usa `.specify/<area>/<nome>` (oficial do framework).
 *
 * Override NUNCA burla `REGRAS-INEGOCIAVEIS.md` — hook nao le override.
 * Override e SEMPRE preservado por `npx roldao-method update`.
 *
 * Uso como CLI:
 *   node .specify/scripts/resolver-template.js templates prd.md
 *     → imprime caminho absoluto resolvido (ex: .specify/overrides/templates/prd.md
 *       se houver override, senao .specify/templates/prd.md).
 *
 *   node .specify/scripts/resolver-template.js --list templates
 *     → lista todos os nomes disponiveis (uniao de overrides/ + core), com
 *       marcacao `[override]` quando override esta vencendo o core.
 *
 * Uso como lib:
 *   const { resolveTemplate, listTemplates } = require('./resolver-template.js');
 *   const caminho = resolveTemplate('templates', 'prd.md');
 *   const todos   = listTemplates('templates'); // [{nome, caminho, override:bool}]
 *
 * Exit codes:
 *   0  resolvido com sucesso (override OU core)
 *   1  nao existe nem em overrides/ nem em core
 *   2  argumentos invalidos
 */
'use strict';

const fs = require('fs');
const path = require('path');

const AREAS_VALIDAS = new Set(['templates', 'checklists', 'data', 'schemas', 'memory']);

function findSpecifyRoot(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, '.specify'))) {
      return path.join(dir, '.specify');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function resolveTemplate(area, nome, opts) {
  if (!AREAS_VALIDAS.has(area)) {
    throw new Error(`area invalida: ${area}. Use uma de: ${[...AREAS_VALIDAS].join(', ')}`);
  }
  if (!nome || typeof nome !== 'string') {
    throw new Error('nome do arquivo e obrigatorio');
  }
  const specifyRoot = (opts && opts.specifyRoot) || findSpecifyRoot();
  if (!specifyRoot) throw new Error('.specify/ nao encontrado a partir do CWD');

  const override = path.join(specifyRoot, 'overrides', area, nome);
  const core = path.join(specifyRoot, area, nome);

  if (fs.existsSync(override)) return override;
  if (fs.existsSync(core)) return core;
  return null;
}

function listTemplates(area, opts) {
  if (!AREAS_VALIDAS.has(area)) {
    throw new Error(`area invalida: ${area}`);
  }
  const specifyRoot = (opts && opts.specifyRoot) || findSpecifyRoot();
  if (!specifyRoot) throw new Error('.specify/ nao encontrado a partir do CWD');

  const overrideDir = path.join(specifyRoot, 'overrides', area);
  const coreDir = path.join(specifyRoot, area);

  const overrides = fs.existsSync(overrideDir)
    ? fs.readdirSync(overrideDir).filter((f) => !f.startsWith('.') && f !== 'README.md')
    : [];
  const cores = fs.existsSync(coreDir)
    ? fs.readdirSync(coreDir).filter((f) => !f.startsWith('.'))
    : [];

  const nomes = new Set([...overrides, ...cores]);
  return [...nomes].sort().map((nome) => {
    const override = overrides.includes(nome);
    return {
      nome,
      caminho: override ? path.join(overrideDir, nome) : path.join(coreDir, nome),
      override,
    };
  });
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`resolver-template.js — resolve template com precedencia override.

Uso:
  node .specify/scripts/resolver-template.js <area> <nome>
      Devolve o caminho efetivo (override vence core).
  node .specify/scripts/resolver-template.js --list <area>
      Lista nomes disponiveis (overrides/ + core), marcando overrides.

Areas: ${[...AREAS_VALIDAS].join(', ')}

Exemplos:
  node .specify/scripts/resolver-template.js templates prd.md
  node .specify/scripts/resolver-template.js --list checklists
`);
    process.exit(args.length === 0 ? 2 : 0);
  }

  try {
    if (args[0] === '--list') {
      const area = args[1];
      if (!area) {
        process.stderr.write('uso: --list <area>\n');
        process.exit(2);
      }
      const itens = listTemplates(area);
      for (const it of itens) {
        process.stdout.write(`${it.nome}${it.override ? ' [override]' : ''}\n`);
      }
      process.exit(0);
    }

    const [area, nome] = args;
    const caminho = resolveTemplate(area, nome);
    if (!caminho) {
      process.stderr.write(`nao encontrado: ${area}/${nome} (nem em overrides/ nem em core)\n`);
      process.exit(1);
    }
    process.stdout.write(caminho + '\n');
    process.exit(0);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exit(2);
  }
}

module.exports = { resolveTemplate, listTemplates, findSpecifyRoot, AREAS_VALIDAS };

if (require.main === module) main();
