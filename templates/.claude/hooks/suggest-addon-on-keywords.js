#!/usr/bin/env node
// suggest-addon-on-keywords.js — SessionStart hook que detecta termos BR no repo
// e sugere addon relevante. Best-effort, nao bloqueia.
//
// T-305 (E5) / PRD-003 US-114.
//
// Mapeamento keyword → addon (so registra UM por sessao em
// .claude/.runtime/addon-suggested-${SESS} pra nao repetir).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { sanitizeProjdir, sanitizeSessionHash, gitSafeEnv } = require('./_lib.js');

const SUGESTOES = [
  {
    addon: 'fiscal-br-completo',
    descricao: 'NF-e, NFC-e, NFS-e nacional (ABRASF), CT-e, MDF-e, Reforma Tributaria (LC 214/2025), split payment, obrigacao acessoria mensal',
    // FISCAL-006/007/008/009/010 — keywords expandidas na auditoria 2026-05-25
    // para cobrir transporte (CT-e/MDF-e/transportadora/frota), obrigacao acessoria
    // (SPED Fiscal, ECF, ECD, REINF), NFS-e padrao nacional (ABRASF) e Reforma
    // Tributaria (CBS/IBS/imposto seletivo/split payment).
    keywords: /\b(nfe?|nfse?|nfce?|cte?|mdfe?|sped(?:_fiscal|_contribuicoes)?|ecf|ecd|sefaz|abrasf|reforma\s+tributari|cbs|ibs|imposto\s+seletivo|split\s+payment|transportadora|frota|carga|operador\s+logistico)\b/i,
  },
  {
    addon: 'fintech-br',
    descricao: 'Pix completo (BR Code, webhook HMAC, idempotencia TxId), Open Finance',
    keywords: /\b(pix|endtoendid|e2eid|txid|psp|open\s+finance|bacen|sicoob|itau\s+pix|cobranca\s+pix|dict)\b/i,
  },
  {
    addon: 'lgpd-compliance',
    descricao: 'DPO, RIPD, canal do titular, plano de incidente 72h, decisao automatizada (Art. 20)',
    keywords: /\b(lgpd|anpd|titular|dpo|ripd|base\s+legal|incidente\s+dados|decisao\s+automatizada|art\.?\s*20|transferencia\s+internacional)\b/i,
  },
  {
    addon: 'esocial-completo',
    descricao: 'Eventos S-1000 a S-3000, CIPA, NRs, REINF',
    keywords: /\bs(-)?1000\b|\bs(-)?2200\b|\bs(-)?3000\b|\besocial\b|\bcaepf\b|\breinf\b/i,
  },
  {
    addon: 'electron-br',
    descricao: 'App Electron + IPC seguro + SQLite + LGPD local',
    keywords: /\belectron\b/i,
  },
];

function buscarKeyword(projdir, re, max = 5) {
  try {
    const out = execFileSync('git', [
      '-c', 'protocol.file.allow=never',
      '-C', projdir, 'grep', '-l', '-iE', re.source,
      '--',
      '*.js', '*.ts', '*.tsx', '*.jsx', '*.py', '*.go', '*.rb', '*.php', '*.java',
      '*.md', '*.sql', '*.json',
    ], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, env: gitSafeEnv() }).toString().trim();
    if (!out) return [];
    return out.split('\n').slice(0, max);
  } catch { return []; }
}

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const marker = path.join(runtime, `addon-suggested-${sess}`);

  if (fs.existsSync(marker)) process.exit(0);

  const addonsInstalados = new Set();
  try {
    const addonsDir = path.join(projdir, 'addons');
    if (fs.existsSync(addonsDir)) {
      for (const n of fs.readdirSync(addonsDir)) addonsInstalados.add(n);
    }
  } catch { /* skip */ }

  const sugeridos = [];
  for (const s of SUGESTOES) {
    if (addonsInstalados.has(s.addon)) continue;
    const arquivos = buscarKeyword(projdir, s.keywords, 3);
    if (arquivos.length > 0) {
      sugeridos.push({ ...s, exemplos: arquivos });
    }
  }

  if (sugeridos.length === 0) {
    try { fs.mkdirSync(runtime, { recursive: true }); fs.writeFileSync(marker, ''); } catch { /* */ }
    process.exit(0);
  }

  process.stderr.write(`\n[INFO] [suggest-addon] Detectei termos BR que podem se beneficiar de addons:\n\n`);
  for (const s of sugeridos) {
    process.stderr.write(`  📦 ${s.addon} — ${s.descricao}\n`);
    process.stderr.write(`     encontrado em: ${s.exemplos.slice(0, 2).join(', ')}${s.exemplos.length > 2 ? '...' : ''}\n`);
    process.stderr.write(`     instalar: npx roldao-method add ${s.addon}\n\n`);
  }
  process.stderr.write(`(Mensagem aparece 1x por sessao — T-305/E5)\n`);

  try { fs.mkdirSync(runtime, { recursive: true }); fs.writeFileSync(marker, ''); } catch { /* */ }
  process.exit(0);
})().catch(() => process.exit(0));
