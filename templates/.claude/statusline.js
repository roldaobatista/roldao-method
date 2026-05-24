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

// --- Story ativa + etapa do pipeline (T-205 / D5) ---
// Detecta modo ativo (FT, PRD, BROWNFIELD, AR) e conta etapas concluidas.
let story = '';
let etapa = '';
const MODE_TOTAL_ETAPAS = { 'feature-active': 7, 'prd-active': 6, 'brownfield-active': 4, 'ar-active': 2, 'bug-active': 4 };
const MODE_ETAPAS = {
  'feature-active': ['sofia-done', 'detetive-done', 'rafael-done', 'rafael-skipped', 'bruno-done', 'ines-done', 'revisor-done', 'auditor-seg-pass', 'auditor-qual-pass', 'auditor-prod-pass', 'checkpoint-done'],
  'prd-active': ['analista-done', 'pm-prd-done', 'tech-lead-done', 'ux-done', 'ux-skipped', 'decomp-done'],
  'brownfield-active': ['inventario-done', 'tech-lead-done', 'pm-onboarding-done', 'audit-seg-done'],
  'ar-active': ['inventario-done', 'auditor-seg-pass', 'auditor-qual-pass', 'auditor-prod-pass'],
  'bug-active': ['detetive-done', 'bruno-done', 'revisor-done', 'auditor-seg-pass', 'auditor-qual-pass', 'auditor-prod-pass'],
};
if (fs.existsSync(RUNTIME)) {
  try {
    const files = fs.readdirSync(RUNTIME);
    // Acha modo ativo mais recente (so 1 esperado por sessao normalmente)
    let modoAtivo = null;
    let mtimeMaisRecente = 0;
    for (const prefixo of Object.keys(MODE_TOTAL_ETAPAS)) {
      const candidatos = files.filter((n) => n.startsWith(`${prefixo}-`));
      for (const c of candidatos) {
        try {
          const m = fs.statSync(path.join(RUNTIME, c)).mtimeMs;
          if (m > mtimeMaisRecente) { mtimeMaisRecente = m; modoAtivo = { prefixo, file: c }; }
        } catch { /* skip */ }
      }
    }
    if (modoAtivo) {
      // Le 12 chars do conteudo pra mostrar US-NNN
      const content = fs.readFileSync(path.join(RUNTIME, modoAtivo.file), 'utf8').slice(0, 12).trim();
      if (content) story = ` · 📌 ${content}`;
      // Conta etapas concluidas do modo ativo
      const sessHash = modoAtivo.file.slice(modoAtivo.prefixo.length + 1);
      const etapasDoModo = MODE_ETAPAS[modoAtivo.prefixo] || [];
      const concluidas = etapasDoModo.filter((e) => files.includes(`${e}-${sessHash}`)).length;
      const total = MODE_TOTAL_ETAPAS[modoAtivo.prefixo];
      // Cap em total (etapa pode contar duplo se houver ux-done + ux-skipped raro)
      const N = Math.min(concluidas, total);
      etapa = ` · 🔁 ${N}/${total}`;
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

// T-402 (H2 + H3): respeita NO_COLOR + TERM=dumb + fallback emoji em terminal
// que nao suporta UTF-8.
const NO_COLOR = process.env.NO_COLOR === '1' || process.env.FORCE_COLOR === '0';
const DUMB_TERM = process.env.TERM === 'dumb' || process.env.NO_EMOJI === '1';

// Se DUMB_TERM: troca emojis por equivalente texto.
// Convertemos so os emojis usados nesta linha — sem dep externa.
function plainText(s) {
  if (!DUMB_TERM) return s;
  return s
    .replace(/📍/g, '[v]')
    .replace(/🤖/g, '[modelo]')
    .replace(/🌿/g, '[branch]')
    .replace(/📌/g, '[story]')
    .replace(/🔁/g, '[etapa]')
    .replace(/📊/g, '[ctx]')
    .replace(/🛡️/g, '[bloqueios]')
    .replace(/🛡/g, '[bloqueios]')
    .replace(/👤/g, '[agente]')
    .replace(/·/g, '|');
}

// Se NO_COLOR ou DUMB_TERM: remove sequencias ANSI dos componentes.
function stripAnsi(s) {
  if (!NO_COLOR && !DUMB_TERM) return s;
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

const linha = `📍 v${versao} · 🤖 ${modelo} · 🌿 ${branch}${story}${etapa}${contexto}${shield} · 👤 ${agente}`;
process.stdout.write(plainText(stripAnsi(linha)));
