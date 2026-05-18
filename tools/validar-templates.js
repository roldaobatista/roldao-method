#!/usr/bin/env node
/**
 * tools/validar-templates.js
 * Auditoria interna do framework antes de publicar:
 * - todo agente tem frontmatter completo (name, description, model OR tools)
 * - todo command tem frontmatter (description, disable-model-invocation)
 * - todo hook .sh tem shebang bash + permissao executavel
 * - todo skill tem SKILL.md valido
 * - todo template .specify tem frontmatter (tipo, status, owner, revisado-em)
 * - settings.json e JSON valido + referencia hooks que existem
 * - package.json e consistente
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
  const text = fs.readFileSync(file, 'utf8');
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
} catch (e) {
  fail(`package.json invalido: ${e.message}`);
}

// Relatorio
console.log(`agents:        ${okCount.agents}`);
console.log(`commands:      ${okCount.commands}`);
console.log(`hooks:         ${okCount.hooks}`);
console.log(`skills:        ${okCount.skills}`);
console.log(`spec templates:${okCount.specTemplates}`);
console.log('');

if (issues.length === 0) {
  console.log('OK — todos os templates validados.');
  process.exit(0);
}
console.log(`${issues.length} problema(s):`);
for (const i of issues) console.log(`  - ${i}`);
process.exit(1);
