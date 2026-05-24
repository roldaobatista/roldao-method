#!/usr/bin/env node
// statusline.js — status line ROLDAO-METHOD (port Node do statusline.sh).
// Recebe JSON via stdin do Claude Code, imprime linha unica no stdout.
//
// Formato: 📍 v<X.Y.Z> · 🤖 <modelo> · 🌿 <branch>[ · 📌 <story>][ · 📊 <ctx%>][ · 🛡️ <N>] · 👤 <agente>

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
  'auditor-qualidade':'🧪 Júlia',
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

// --- Porcentagem de contexto usado (le transcript_path da ultima msg assistant) ---
let contexto = '';
const ANSI = {
  reset: '\x1b[0m',
  amarelo: '\x1b[33m',
  vermelho: '\x1b[31m',
  vermelhoBold: '\x1b[1;31m',
};

function lerUltimosBytes(filepath, maxBytes = 256 * 1024) {
  try {
    const stats = fs.statSync(filepath);
    const size = stats.size;
    if (size === 0) return '';
    const start = Math.max(0, size - maxBytes);
    const len = size - start;
    const buf = Buffer.alloc(len);
    const fd = fs.openSync(filepath, 'r');
    try { fs.readSync(fd, buf, 0, len, start); } finally { fs.closeSync(fd); }
    return buf.toString('utf8');
  } catch { return ''; }
}

function limiteContexto(modelId) {
  // Opus 4.7 [1m] header tem 1M. Demais ficam em 200k.
  if (modelId && /\[1m\]/i.test(modelId)) return 1_000_000;
  return 200_000;
}

const transcriptPath = input.transcript_path;
if (transcriptPath && fs.existsSync(transcriptPath)) {
  const tail = lerUltimosBytes(transcriptPath);
  const linhas = tail.split('\n');
  // Itera reverso ate achar mensagem assistant com usage
  for (let i = linhas.length - 1; i >= 0; i--) {
    const linha = linhas[i].trim();
    if (!linha || !linha.startsWith('{')) continue;
    try {
      const ev = JSON.parse(linha);
      const u = ev?.message?.usage;
      if (u && (u.input_tokens != null || u.cache_read_input_tokens != null)) {
        const tokens = (u.input_tokens || 0)
          + (u.cache_read_input_tokens || 0)
          + (u.cache_creation_input_tokens || 0);
        const limite = limiteContexto(input.model && input.model.id);
        const pct = Math.round((tokens / limite) * 100);
        let cor = '';
        let suffix = '';
        if (pct >= 90) { cor = ANSI.vermelhoBold; suffix = '!'; }
        else if (pct >= 75) cor = ANSI.vermelho;
        else if (pct >= 50) cor = ANSI.amarelo;
        contexto = ` · ${cor}📊 ${pct}%${suffix}${cor ? ANSI.reset : ''}`;
        break;
      }
    } catch { /* linha incompleta, continua */ }
  }
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

process.stdout.write(`📍 v${versao} · 🤖 ${modelo} · 🌿 ${branch}${story}${contexto}${shield} · 👤 ${agente}`);
