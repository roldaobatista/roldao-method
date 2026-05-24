#!/usr/bin/env node
// statusline.js — status line ROLDAO-METHOD (port Node do statusline.sh).
// Recebe JSON via stdin do Claude Code, imprime linha unica no stdout.
//
// Formato: 📍 v<X.Y.Z> · 🤖 <modelo> · 🌿 <branch>[ · 📌 <story>][ · 🛡️ <N>] · 👤 <agente>

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function readStdinSync() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function tryJson(s) { try { return JSON.parse(s); } catch { return {}; } }

const PROJDIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const RUNTIME = path.join(PROJDIR, '.claude', '.runtime');

const input = tryJson(readStdinSync());

// --- Modelo ativo ---
const modelo = (input.model && input.model.display_name) || '?';

// --- Versão do framework ---
let versao = '?';
const pkg = path.join(PROJDIR, 'package.json');
if (fs.existsSync(pkg)) {
  try { versao = JSON.parse(fs.readFileSync(pkg, 'utf8')).version || '?'; } catch { /* skip */ }
}

// --- Branch git ---
let branch = '—';
try {
  branch = execFileSync('git', ['-C', PROJDIR, 'branch', '--show-current'], {
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 2000,
  }).toString().trim() || '—';
} catch { /* fora de repo git */ }

// --- Agente ativo (ultimo marker -done-) ---
const AGENT_MAP = {
  maestro:            '🎼 Maestro',
  analista:           '🔎 Mariana',
  'gerente-produto':  '📋 Sofia',
  'ux-designer':      '🎨 Lia',
  'tech-lead':        '🏛️ Rafael',
  investigador:       '🔬 Detetive',
  'dev-senior':       '💻 Bruno',
  'dba-dados':        '🗄️ Helena',
  'devops-infra':     '🚀 Lucas',
  revisor:            '✅ Inês',
  'auditor-seguranca':'🛡️ Caio',
  'auditor-qualidade':'🧪 Julia',
  'auditor-produto':  '🎯 Pedro',
  'fiscal-br':        '🧾 Dona Marta',
  'tech-writer':      '📝 Camila',
};

let agente = '—';
if (fs.existsSync(RUNTIME)) {
  try {
    const entries = fs.readdirSync(RUNTIME)
      .filter((n) => /-done-/.test(n))
      .map((n) => ({ n, m: fs.statSync(path.join(RUNTIME, n)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (entries.length > 0) {
      const slug = entries[0].n.replace(/-done-.*$/, '');
      agente = AGENT_MAP[slug] || slug;
    }
  } catch { /* skip */ }
}

// --- Story ativa ---
let story = '';
if (fs.existsSync(RUNTIME)) {
  try {
    const entries = fs.readdirSync(RUNTIME)
      .filter((n) => n.startsWith('feature-active-'))
      .map((n) => ({ n, m: fs.statSync(path.join(RUNTIME, n)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (entries.length > 0) {
      const content = fs.readFileSync(path.join(RUNTIME, entries[0].n), 'utf8').slice(0, 12);
      story = ` · 📌 ${content}`;
    }
  } catch { /* skip */ }
}

// --- Metricas: contagem de blocks do dia ---
let shield = '';
const metricsFile = path.join(RUNTIME, 'metrics.jsonl');
if (fs.existsSync(metricsFile)) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const txt = fs.readFileSync(metricsFile, 'utf8');
    const count = (txt.match(new RegExp(`"ts":"${hoje}`, 'g')) || []).length;
    if (count > 0) shield = ` · 🛡️ ${count}`;
  } catch { /* skip */ }
}

process.stdout.write(`📍 v${versao} · 🤖 ${modelo} · 🌿 ${branch}${story}${shield} · 👤 ${agente}`);
