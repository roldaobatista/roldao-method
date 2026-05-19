#!/usr/bin/env node
/**
 * tools/validar-templates.js
 * Auditoria interna do framework antes de publicar:
 * - todo agente tem frontmatter completo (name, description, model OR tools)
 * - todo command tem frontmatter (description)
 * - todo hook .sh tem shebang bash
 * - todo skill tem SKILL.md valido + arquivos referenciados existem
 * - todo template .specify tem frontmatter (tipo)
 * - settings.json e JSON valido + referencia hooks que existem
 * - package.json e consistente
 * - versao bate entre package.json, README (badge) e topo do CHANGELOG
 * - contagem minima por diretorio (anti falso-verde)
 *
 * Exit 0 = tudo OK; exit 1 = falhas; exit 2 = erro fatal de execucao.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES = path.join(ROOT, 'templates');

const issues = [];
const okCount = { agents: 0, commands: 0, hooks: 0, skills: 0, specTemplates: 0 };

function fail(msg) { issues.push(msg); }

function readFrontmatter(file) {
  // Normaliza CRLF (checkout Windows) e BOM antes de casar o frontmatter,
  // senao o regex `^---\n` falha e da falso "sem frontmatter".
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const obj = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) obj[kv[1]] = kv[2].trim();
  }
  return obj;
}

function listDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

// Agents
const agentsDir = path.join(TEMPLATES, '.claude/agents');
for (const file of listDir(agentsDir)) {
  if (!file.endsWith('.md')) continue;
  const fm = readFrontmatter(path.join(agentsDir, file));
  if (!fm) { fail(`agent sem frontmatter: ${file}`); continue; }
  if (!fm.name) fail(`agent sem name: ${file}`);
  if (!fm.description) fail(`agent sem description: ${file}`);
  if (!fm.tools && !fm.model) fail(`agent sem tools nem model: ${file}`);
  okCount.agents++;
}

// Commands
const cmdsDir = path.join(TEMPLATES, '.claude/commands');
for (const file of listDir(cmdsDir)) {
  if (!file.endsWith('.md')) continue;
  const fm = readFrontmatter(path.join(cmdsDir, file));
  if (!fm) { fail(`command sem frontmatter: ${file}`); continue; }
  if (!fm.description) fail(`command sem description: ${file}`);
  okCount.commands++;
}

// Hooks
const hooksDir = path.join(TEMPLATES, '.claude/hooks');
for (const file of listDir(hooksDir)) {
  if (!file.endsWith('.sh')) continue;
  const full = path.join(hooksDir, file);
  const first = fs.readFileSync(full, 'utf8').split('\n')[0];
  if (!first.startsWith('#!')) fail(`hook sem shebang: ${file}`);
  if (!first.includes('bash')) fail(`hook sem bash no shebang: ${file}`);
  okCount.hooks++;
}

// Skills
const skillsDir = path.join(TEMPLATES, '.claude/skills');
for (const skill of listDir(skillsDir)) {
  const skillPath = path.join(skillsDir, skill);
  if (!fs.statSync(skillPath).isDirectory()) continue;
  const skillMd = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMd)) { fail(`skill sem SKILL.md: ${skill}`); continue; }
  const fm = readFrontmatter(skillMd);
  if (!fm) { fail(`skill sem frontmatter: ${skill}`); continue; }
  if (!fm.name) fail(`skill sem name: ${skill}`);
  if (!fm.description) fail(`skill sem description: ${skill}`);
  // arquivos referenciados em ${CLAUDE_SKILL_DIR} devem existir
  const text = fs.readFileSync(skillMd, 'utf8');
  const refs = text.match(/\$\{CLAUDE_SKILL_DIR\}\/([^\s`'")]+)/g) || [];
  for (const ref of refs) {
    const rel = ref.replace('${CLAUDE_SKILL_DIR}/', '');
    if (!fs.existsSync(path.join(skillPath, rel))) {
      fail(`skill ${skill} referencia arquivo inexistente: ${rel}`);
    }
  }
  okCount.skills++;
}

// Spec templates
const specDir = path.join(TEMPLATES, '.specify/templates');
for (const file of listDir(specDir)) {
  if (!file.endsWith('.md') || file === 'README.md') continue;
  const fm = readFrontmatter(path.join(specDir, file));
  if (!fm) { fail(`spec template sem frontmatter: ${file}`); continue; }
  if (!fm.tipo) fail(`spec template sem tipo: ${file}`);
  okCount.specTemplates++;
}

// settings.json
try {
  const settings = JSON.parse(fs.readFileSync(path.join(TEMPLATES, '.claude/settings.json'), 'utf8'));
  const hookCmds = JSON.stringify(settings.hooks || {});
  const matches = hookCmds.match(/\.claude\/hooks\/[\w\-_]+\.sh/g) || [];
  const unique = [...new Set(matches.map((m) => m.replace('.claude/hooks/', '')))];
  for (const h of unique) {
    if (!fs.existsSync(path.join(hooksDir, h))) {
      fail(`settings.json referencia hook inexistente: ${h}`);
    }
  }
} catch (e) {
  fail(`settings.json invalido: ${e.message}`);
}

// Addons — schema do addon.yaml
const ADDONS_DIR = path.join(ROOT, 'addons');
const ADDON_REQUIRED = ['name', 'version', 'description', 'license', 'status'];
for (const addon of listDir(ADDONS_DIR)) {
  const addonYaml = path.join(ADDONS_DIR, addon, 'addon.yaml');
  if (!fs.existsSync(addonYaml)) continue;
  const text = fs.readFileSync(addonYaml, 'utf8');
  // Bloqueia chave legada `provides:` — padrao oficial e `provoca:`
  if (/^provides:/m.test(text)) {
    fail(`addon ${addon}: usa 'provides:' (legado). Renomeie para 'provoca:'.`);
  }
  if (!/^provoca:/m.test(text)) {
    fail(`addon ${addon}: faltando bloco 'provoca:' (agents/hooks/skills/commands/templates).`);
  }
  for (const field of ADDON_REQUIRED) {
    const re = new RegExp(`^${field}:\\s*\\S`, 'm');
    if (!re.test(text)) fail(`addon ${addon}: campo '${field}' ausente ou vazio em addon.yaml`);
  }
}

// package.json
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  for (const k of ['name', 'version', 'license', 'bin', 'files']) {
    if (!pkg[k]) fail(`package.json sem campo ${k}`);
  }
  if (pkg.bin && pkg.bin['roldao-method']) {
    const binFile = path.join(ROOT, pkg.bin['roldao-method']);
    if (!fs.existsSync(binFile)) fail(`bin nao encontrado: ${binFile}`);
  }
  // Consistencia de versao: package.json x README badge x topo do CHANGELOG.
  // Foi exatamente o gap que deixou o README congelado em 0.12.0 ir pra producao.
  const ver = pkg.version;
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const badge = readme.match(/badge\/vers%C3%A3o-([0-9]+\.[0-9]+\.[0-9]+)|badge\/versão-([0-9]+\.[0-9]+\.[0-9]+)/);
  const badgeVer = badge ? (badge[1] || badge[2]) : null;
  if (badgeVer && badgeVer !== ver) {
    fail(`versao dessincronizada: package.json=${ver} mas badge do README=${badgeVer}`);
  }
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  const clTop = changelog.match(/##\s*\[([0-9]+\.[0-9]+\.[0-9]+)\]/);
  if (clTop && clTop[1] !== ver) {
    fail(`versao dessincronizada: package.json=${ver} mas topo do CHANGELOG=${clTop[1]}`);
  }
  // plugin.json e .continue/config.yaml tambem carregam versao — ja driftaram
  // (0.13.0 enquanto tudo subiu pra 0.13.1) porque ninguem os checava.
  try {
    const plug = JSON.parse(fs.readFileSync(path.join(TEMPLATES, '.claude-plugin/plugin.json'), 'utf8'));
    if (plug.version && plug.version !== ver) {
      fail(`versao dessincronizada: package.json=${ver} mas plugin.json=${plug.version}`);
    }
  } catch (e) { fail(`plugin.json invalido: ${e.message}`); }
  const contYml = fs.readFileSync(path.join(TEMPLATES, '.continue/config.yaml'), 'utf8');
  const contVer = contYml.match(/^version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+)/m);
  if (contVer && contVer[1] !== ver) {
    fail(`versao dessincronizada: package.json=${ver} mas .continue/config.yaml=${contVer[1]}`);
  }

  // PORTAO doc-vs-codigo: a `description` do package.json e a vitrine no npm.
  // As contagens ali eram strings manuais — foi assim que plugin.json driftou.
  // Agora qualquer divergencia entre o que a vitrine afirma e a arvore real
  // BLOQUEIA (exit 1), fechando a classe inteira de bug.
  const addonsSkills = listDir(ADDONS_DIR).reduce((n, a) => {
    const sd = path.join(ADDONS_DIR, a, '.claude/skills');
    return n + listDir(sd).filter((x) => {
      try { return fs.statSync(path.join(sd, x)).isDirectory(); } catch { return false; }
    }).length;
  }, 0);
  const blockingHooks = listDir(hooksDir).filter((f) =>
    f.endsWith('.sh') && !/^_/.test(f) &&
    /\bexit 2(?!\d)/.test(fs.readFileSync(path.join(hooksDir, f), 'utf8'))).length;
  const addonCount = listDir(ADDONS_DIR).filter((a) =>
    fs.existsSync(path.join(ADDONS_DIR, a, 'addon.yaml'))).length;
  const real = {
    agentes: okCount.agents,
    'hooks bloqueadores': blockingHooks,
    workflows: okCount.commands,
    'skills BR': okCount.skills + addonsSkills,
    addons: addonCount,
  };
  const desc = pkg.description || '';
  for (const [label, count] of Object.entries(real)) {
    const m = desc.match(new RegExp(`(\\d+)\\s+${label.replace(/ /g, '\\s+')}`, 'i'));
    if (!m) {
      fail(`package.json description nao declara "${label}" (esperado: ${count})`);
    } else if (Number(m[1]) !== count) {
      fail(`description diz "${m[1]} ${label}" mas a arvore real tem ${count}`);
    }
  }
} catch (e) {
  fail(`package.json invalido: ${e.message}`);
}

// Paridade de adapters — CLAUDE.md/AGENTS.md sao o par-fonte (CLAUDE importa
// AGENTS via @AGENTS.md), os demais sao resumos derivados mantidos a mao.
// Sem gate, um adapter derivado pode perder a regra central a cada release
// sem ninguem ver. Exige que TODOS existam e que os derivados carreguem
// REGRA #0 + o conceito "executar, nao passar pro usuario".
const SOURCE_ADAPTERS = ['CLAUDE.md', 'AGENTS.md'];
const DERIVED_ADAPTERS = [
  'GEMINI.md',
  '.cursor/rules/roldao-method.mdc',
  '.windsurf/rules/roldao-method.md',
  '.clinerules',
  '.roorules',
  '.codex/instructions.md',
  '.continue/config.yaml',
  '.aider.conf.yml',
];
for (const a of [...SOURCE_ADAPTERS, ...DERIVED_ADAPTERS]) {
  if (!fs.existsSync(path.join(TEMPLATES, a))) fail(`adapter ausente: templates/${a}`);
}
const reRegra0 = /regra\s*#?\s*0/i;
const reExecutar = /INV-AGENT-006|executar.*n[ãa]o.*passar|quer que eu/i;
for (const a of DERIVED_ADAPTERS) {
  const f = path.join(TEMPLATES, a);
  if (!fs.existsSync(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (!reRegra0.test(t)) fail(`adapter ${a}: drift — perdeu REGRA #0`);
  if (!reExecutar.test(t)) fail(`adapter ${a}: drift — perdeu "executar, não passar pro usuário"`);
}

// Relatorio
console.log(`agents:        ${okCount.agents}`);
console.log(`commands:      ${okCount.commands}`);
console.log(`hooks:         ${okCount.hooks}`);
console.log(`skills:        ${okCount.skills}`);
console.log(`spec templates:${okCount.specTemplates}`);
console.log('');

// Minimos esperados: se um diretorio inteiro sumir, listDir retorna [] e a
// validacao passaria com zero arquivos. Travar contagem minima evita esse falso-verde.
const MINIMOS = { agents: 12, commands: 22, hooks: 26, skills: 8, specTemplates: 12 };
for (const [k, min] of Object.entries(MINIMOS)) {
  if (okCount[k] < min) {
    issues.push(`contagem de ${k} abaixo do minimo: ${okCount[k]} < ${min} (diretorio faltando?)`);
  }
}

if (issues.length === 0) {
  console.log('OK — todos os templates validados.');
  process.exit(0);
}
console.log(`${issues.length} problema(s):`);
for (const i of issues) console.log(`  - ${i}`);
process.exit(1);
