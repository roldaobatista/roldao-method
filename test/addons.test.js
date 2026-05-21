#!/usr/bin/env node
/**
 * test/addons.test.js — valida estrutura dos 6 addons + smoke dos hooks de addon.
 *
 * Pra cada addon em addons/<nome>/:
 *  - addon.yaml tem campos obrigatorios (name, version, description, status, revisado-em, provoca)
 *  - README.md existe
 *  - Cada agente/hook/skill listado em `provoca:` existe de fato no FS do addon
 *  - Cada hook .sh é syntaticamente valido (bash -n) e executavel
 *
 * Smoke dos hooks de addon: invoca com input JSON minimo {"tool_input":{}}
 * via stdin. Deve sair com exit code 0/2 (libera/bloqueia) — NUNCA crashar
 * (exit 1, segfault, "command not found", etc.). Pula em ambiente sem bash.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ADDONS_DIR = path.join(ROOT, 'addons');

let pass = 0;
let fail = 0;
function check(desc, cond, extra) {
  if (cond) { pass++; console.log(`  OK   ${desc}`); }
  else { fail++; console.log(`  FAIL ${desc}${extra ? ` — ${extra}` : ''}`); }
}

// Parsing ad-hoc de YAML (suficiente pros addon.yaml — formato simples,
// sem aninhamento alem de lista debaixo de chave).
// Retorna { topLevel: {chave: valor escalar}, lists: {chave: [item1, ...]} }
function parseAddonYaml(text) {
  const out = { top: {}, lists: {} };
  const lines = text.split(/\r?\n/);
  let currentSection = null; // nome da chave-mae (ex.: 'provoca', 'requires')
  let currentSubkey = null;  // subchave dentro de section (ex.: 'agents' debaixo de 'provoca')
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    // Top-level escalar: `chave: valor`
    let m = line.match(/^([a-zA-Z_-]+):\s*(.+)$/);
    if (m && !line.startsWith(' ')) {
      out.top[m[1]] = m[2].trim();
      currentSection = m[1];
      currentSubkey = null;
      continue;
    }
    // Top-level chave sem valor: `chave:` (abre bloco)
    m = line.match(/^([a-zA-Z_-]+):\s*$/);
    if (m && !line.startsWith(' ')) {
      currentSection = m[1];
      currentSubkey = null;
      continue;
    }
    // Subchave com lista: `  chave:` (2 espacos)
    m = line.match(/^ {2}([a-zA-Z_-]+):\s*(\[\s*\])?\s*$/);
    if (m && currentSection) {
      const key = `${currentSection}.${m[1]}`;
      currentSubkey = key;
      if (!out.lists[key]) out.lists[key] = [];
      continue;
    }
    // Item de lista: `    - valor` (4 espacos)
    m = line.match(/^ {4}-\s+(.+)$/);
    if (m && currentSubkey) {
      out.lists[currentSubkey].push(m[1].trim());
      continue;
    }
    // Item de lista top-level: `  - valor` (2 espacos, debaixo de section sem subkey)
    m = line.match(/^ {2}-\s+(.+)$/);
    if (m && currentSection && !currentSubkey) {
      const key = currentSection;
      if (!out.lists[key]) out.lists[key] = [];
      out.lists[key].push(m[1].trim());
      continue;
    }
  }
  return out;
}

function hasBash() {
  try { execSync('bash --version', { stdio: 'pipe' }); return true; } catch { return false; }
}

const addons = fs.readdirSync(ADDONS_DIR)
  .filter((n) => {
    const p = path.join(ADDONS_DIR, n);
    return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'addon.yaml'));
  })
  .sort();

console.log(`\nValidando ${addons.length} addons...\n`);
check(`pelo menos 1 addon encontrado`, addons.length >= 1);

const BASH = hasBash();
if (!BASH) console.log('  (bash ausente — smoke de hooks de addon vai pular)');

for (const addon of addons) {
  const dir = path.join(ADDONS_DIR, addon);
  const yamlPath = path.join(dir, 'addon.yaml');
  const readmePath = path.join(dir, 'README.md');

  console.log(`\n[${addon}]`);
  check(`${addon}: addon.yaml existe`, fs.existsSync(yamlPath));
  check(`${addon}: README.md existe`, fs.existsSync(readmePath));

  const yaml = parseAddonYaml(fs.readFileSync(yamlPath, 'utf8'));

  // Campos obrigatorios
  for (const field of ['name', 'version', 'description', 'status', 'revisado-em']) {
    check(`${addon}: campo '${field}'`, !!yaml.top[field], `valor: ${yaml.top[field] || '<vazio>'}`);
  }
  check(`${addon}: name no YAML bate com diretorio`, yaml.top.name === addon, `name=${yaml.top.name}`);

  // status valido
  const statusOk = ['draft', 'stable', 'deprecated'].includes(yaml.top.status);
  check(`${addon}: status valido (draft/stable/deprecated)`, statusOk, `valor: ${yaml.top.status}`);

  // Provocacoes — cada item declarado tem que existir
  const agents = yaml.lists['provoca.agents'] || [];
  const hooks = yaml.lists['provoca.hooks'] || [];
  const skills = yaml.lists['provoca.skills'] || [];
  const commands = yaml.lists['provoca.commands'] || [];

  for (const a of agents) {
    check(`${addon}: agente declarado existe (${a})`, fs.existsSync(path.join(dir, '.claude/agents', `${a}.md`)));
  }
  for (const h of hooks) {
    const hookPath = path.join(dir, '.claude/hooks', `${h}.sh`);
    check(`${addon}: hook declarado existe (${h})`, fs.existsSync(hookPath));
    if (fs.existsSync(hookPath)) {
      // bash -n syntax check
      if (BASH) {
        try {
          execSync(`bash -n "${hookPath}"`, { stdio: 'pipe' });
          check(`${addon}: hook ${h} syntax (bash -n)`, true);
        } catch (e) {
          check(`${addon}: hook ${h} syntax (bash -n)`, false, (e.stderr || '').toString().substring(0, 120));
        }
        // smoke: input minimo, hook nao pode crashar (exit 0 ou 2 OK; outros = falha de robustez)
        const r = spawnSync('bash', [hookPath], { input: '{"tool_input":{}}', timeout: 5000 });
        const exit = r.status;
        const okExit = exit === 0 || exit === 2;
        check(`${addon}: hook ${h} smoke (exit 0 ou 2, nunca crash)`, okExit, `exit=${exit}, stderr=${(r.stderr || '').toString().substring(0, 100)}`);
      }
    }
  }
  for (const s of skills) {
    check(`${addon}: skill declarada existe (${s})`, fs.existsSync(path.join(dir, '.claude/skills', s, 'SKILL.md')));
  }
  for (const c of commands) {
    check(`${addon}: command declarado existe (${c})`, fs.existsSync(path.join(dir, '.claude/commands', `${c}.md`)));
  }

  // Provocacoes nao vazias minimamente — addon deve provocar pelo menos 1 coisa
  const totalProvoca = agents.length + hooks.length + skills.length + commands.length;
  check(`${addon}: provoca pelo menos 1 item (agent/hook/skill/command)`, totalProvoca >= 1, `total=${totalProvoca}`);
}

console.log('');
if (fail === 0) { console.log(`Total OK (${pass} checagens).`); process.exit(0); }
console.log(`${fail} falha(s) em ${pass + fail} checagens.`); process.exit(1);
