#!/usr/bin/env node
// next-id.js — helper unico que descobre o proximo ID rastreavel (INV-004)
// por tipo (US, EP, T, ADR, PRD, CHK) escaneando docs/ do projeto.
//
// T-301 (E1) / PRD-003 US-114.
//
// Uso programatico:
//   const { nextId } = require('./lib/next-id.js');
//   const id = nextId('US'); // -> 'US-117'
//   const id = nextId('ADR', { pad: 4 }); // -> 'ADR-0022'
//
// Uso CLI (debug):
//   node .claude/lib/next-id.js US
//   node .claude/lib/next-id.js EP
//   node .claude/lib/next-id.js ADR

const fs = require('fs');
const path = require('path');

const CONFIG = {
  US:  { pasta: 'docs/stories',   pad: 3 },
  EP:  { pasta: 'docs/epicos',    pad: 3 },
  PRD: { pasta: 'docs/prd',       pad: 3 },
  ADR: { pasta: 'docs/decisions', pad: 3 },
  CHK: { pasta: 'docs/checkpoints', pad: 0 }, // CHK usa data, nao numero
  T:   { pasta: null, pad: 3 }, // T-NNN e local por story — caller informa o conteudo
};

function projdir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

// nextId — retorna proximo ID disponivel pra tipo.
// Tipo T exige opts.dentroDeArquivo (path absoluto do .md da story) — escaneia
// o conteudo desse arquivo procurando `T-NNN`.
function nextId(tipo, opts = {}) {
  const t = String(tipo).toUpperCase();
  const cfg = CONFIG[t];
  if (!cfg) throw new Error(`next-id: tipo desconhecido '${tipo}'. Validos: ${Object.keys(CONFIG).join(', ')}`);

  const pad = opts.pad !== undefined ? opts.pad : cfg.pad;

  if (t === 'T') {
    if (!opts.dentroDeArquivo) throw new Error(`next-id: tipo T exige opts.dentroDeArquivo (path da story)`);
    return _nextTaskNoArquivo(opts.dentroDeArquivo, pad);
  }

  if (t === 'CHK') {
    const data = new Date().toISOString().slice(0, 10);
    const slug = opts.slug || 'walkthrough';
    return `CHK-${data}-${slug}`;
  }

  return _nextNoDiretorio(cfg.pasta, t, pad);
}

function _nextNoDiretorio(pastaRelativa, prefixo, pad) {
  const dir = path.join(projdir(), pastaRelativa);
  let max = 0;
  try {
    const arquivos = fs.readdirSync(dir);
    const re = new RegExp(`^${prefixo}-(\\d+)`);
    for (const f of arquivos) {
      const m = f.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  } catch { /* pasta nao existe = comeca em 001 */ }
  const proximo = max + 1;
  return `${prefixo}-${String(proximo).padStart(pad, '0')}`;
}

function _nextTaskNoArquivo(filepath, pad) {
  let max = 0;
  try {
    const conteudo = fs.readFileSync(filepath, 'utf8');
    const matches = conteudo.match(/\bT-(\d+)\b/g) || [];
    for (const m of matches) {
      const n = parseInt(m.slice(2), 10);
      if (n > max) max = n;
    }
  } catch { /* arquivo nao existe = T-001 */ }
  const proximo = max + 1;
  return `T-${String(proximo).padStart(pad, '0')}`;
}

module.exports = { nextId };

// CLI: node next-id.js <tipo> [--pad N]
if (require.main === module) {
  const tipo = process.argv[2];
  if (!tipo) {
    console.error('Uso: node next-id.js <US|EP|PRD|ADR|CHK> [--pad N]');
    process.exit(1);
  }
  const padArg = process.argv.indexOf('--pad');
  const opts = {};
  if (padArg !== -1) opts.pad = parseInt(process.argv[padArg + 1], 10);
  try {
    console.log(nextId(tipo, opts));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
