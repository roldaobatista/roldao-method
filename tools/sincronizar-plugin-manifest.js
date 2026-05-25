#!/usr/bin/env node
/**
 * sincronizar-plugin-manifest.js — mantem `.claude-plugin/plugin.json`
 * em paridade com o filesystem real (agents/, commands/, skills/, addons/).
 *
 * Por que existe: plugin.json era atualizado a mao e divergia de package.json
 * em versao + contagens. Achado da auditoria 10-agentes round 11
 * (2026-05-25). Agora: este script le tudo do disco e regrava plugin.json.
 *
 * Uso:
 *   node tools/sincronizar-plugin-manifest.js          # aplica
 *   node tools/sincronizar-plugin-manifest.js --check  # falha se ja sincronizado
 *
 * Rodar em `npm test` pra impedir regressao.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN_FILE = path.join(ROOT, '.claude-plugin', 'plugin.json');
const PKG_FILE = path.join(ROOT, 'package.json');
const AGENTS_DIR = path.join(ROOT, 'templates', '.claude', 'agents');
const COMMANDS_DIR = path.join(ROOT, 'templates', '.claude', 'commands');
const SKILLS_DIR = path.join(ROOT, 'templates', '.claude', 'skills');
const ADDONS_DIR = path.join(ROOT, 'addons');

const HOMEPAGE = 'https://github.com/roldaobatista/roldao-method';

function listMd(dir, ignored = []) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !ignored.includes(f))
    .sort();
}

function listSkillDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => fs.existsSync(path.join(dir, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort();
}

function listAddons(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => fs.existsSync(path.join(dir, e.name, 'README.md')))
    .map((e) => e.name)
    .sort();
}

function buildManifest() {
  const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
  const agents = listMd(AGENTS_DIR, ['MAPA-VISUAL.md', 'PERSONAS.md']);
  const commands = listMd(COMMANDS_DIR);
  const skills = listSkillDirs(SKILLS_DIR);
  const addons = listAddons(ADDONS_DIR);

  // Contagens reais pra description
  const hooksDir = path.join(ROOT, 'templates', '.claude', 'hooks');
  const hooksTotal = fs.existsSync(hooksDir)
    ? fs.readdirSync(hooksDir).filter((f) => f.endsWith('.js') || f.endsWith('.sh')).length
    : 0;

  // Conta skills em addons pra description
  let addonSkills = 0;
  for (const a of addons) {
    const ad = path.join(ADDONS_DIR, a, '.claude', 'skills');
    if (!fs.existsSync(ad)) continue;
    addonSkills += fs
      .readdirSync(ad, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(ad, e.name, 'SKILL.md'))).length;
  }

  return {
    $schema: 'https://json.schemastore.org/claude-code-plugin.json',
    name: 'roldao-method',
    version: pkg.version,
    description: `Framework de desenvolvimento ágil assistido por IA em português brasileiro. ${agents.length} agentes, ${hooksTotal} hooks Node puros (bloqueadores + soft warnings + lifecycle), ${commands.length} workflows, ${skills.length} skills BR core + ${addonSkills} em addons = ${skills.length + addonSkills} skills, ${addons.length} addons BR. Para Claude Code, Cursor, Windsurf, Cline, Roo, Aider, Gemini CLI, Codex CLI.`,
    author: 'Roldão Batista',
    homepage: HOMEPAGE,
    license: 'MIT',
    keywords: ['pt-br', 'brazil', 'lgpd', 'nfe', 'pix', 'fiscal', 'agile', 'spec-driven', 'agents', 'hooks'],
    agents: agents.map((a) => `agents/${a}`),
    commands: commands.map((c) => `commands/${c}`),
    skills: skills.map((s) => `skills/${s}`),
    hooks: 'hooks/',
    settings: 'settings.json',
    requires: {
      'claude-code': '>=2.0.0',
      platform: ['win32-gitbash', 'darwin', 'linux'],
    },
    addons: addons.map((name) => ({
      name,
      url: `${HOMEPAGE}/tree/main/addons/${name}`,
    })),
  };
}

function main() {
  const check = process.argv.includes('--check');
  const quiet = process.argv.includes('--quiet');

  const generated = buildManifest();
  const generatedStr = JSON.stringify(generated, null, 2) + '\n';
  const current = fs.existsSync(PLUGIN_FILE) ? fs.readFileSync(PLUGIN_FILE, 'utf8') : '';

  if (current === generatedStr) {
    if (!quiet) console.log('[sincronizar-plugin-manifest] OK — plugin.json já em paridade.');
    process.exit(0);
  }

  if (check) {
    console.error('[sincronizar-plugin-manifest] FAIL — plugin.json fora de paridade com filesystem.');
    console.error('Rode: node tools/sincronizar-plugin-manifest.js');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(PLUGIN_FILE), { recursive: true });
  fs.writeFileSync(PLUGIN_FILE, generatedStr, 'utf8');
  console.log(
    `[sincronizar-plugin-manifest] regravado: ${generated.agents.length} agentes, ` +
      `${generated.commands.length} commands, ${generated.skills.length} skills, ` +
      `${generated.addons.length} addons, v${generated.version}.`,
  );
}

main();
