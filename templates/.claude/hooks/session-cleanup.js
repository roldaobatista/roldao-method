#!/usr/bin/env node
// session-cleanup.js — limpa markers efemeros da sessao atual ao encerrar.
// Hook SessionEnd. T-011 (G3) / PRD-003 US-111.
//
// Roda APOS session-snapshot.js (que precisa ler os markers pra gravar o
// snapshot). Apaga apenas markers da SESSAO ATUAL (nao toca em outras sessoes
// paralelas) e apenas markers efemeros que precisam ser limpos (triggers e
// active markers que sinalizam fluxo em andamento).
//
// O que NAO apaga:
// - .session-hash (preserva hash entre --continue)
// - session-snapshot.md, session-state.json (snapshot pra restore)
// - investigation-*.json com ate STALE_DAYS dias (persistente pra auditoria
//   ate esse limite — depois disso vira prova velha demais pra qualquer bug
//   novo e e removido, ver STALE_DAYS abaixo; auditoria 2026-08-17)
// - metrics.jsonl, audit-inventory.json (logs cumulativos)
// - markers de outras sessoes (so toca os que terminam em -${sess})
//
// Por que esse cleanup existe (auditor 6): marker bug-trigger ou bug-active
// de sessao morta contaminava sessao nova, bloqueando trabalho legitimo.
// Roldao tinha que apagar .runtime/ na mao — fricca inaceitavel.

const fs = require('fs');
const path = require('path');
const { sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

// STALE_DAYS — mesma politica de 7 dias usada em session-snapshot-restore.js
// pra snapshot. investigation-*.json e persistente de proposito (auditoria),
// mas sem limite de idade um investigation velho de bug ja resolvido ficava
// pra sempre satisfazendo o GATE 2 de require-investigador-before-fix.js pra
// bugs futuros (auditoria 2026-08-17). Mtime > 7 dias = descartavel.
const STALE_DAYS = 7;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

// Prefixos de markers efemeros a limpar (em ordem alfabetica).
// Cada prefixo + ${sess} = nome de arquivo a remover se existir.
const EPHEMERAL_PREFIXES = [
  'bug-active-',
  'bug-trigger-',
  'feature-active-',
  'prd-active-', // futuro (T-113 / Modo PRD Maestro)
  'brownfield-active-', // futuro (T-113 / Modo BROWNFIELD Maestro)
  'ar-active-', // futuro (T-113 / Modo AR Maestro)
  'sofia-done-',
  'detetive-done-',
  'rafael-done-',
  'rafael-skipped-',
  'bruno-done-',
  'ines-done-',
  'auditor-seg-pass-',
  'auditor-qual-pass-',
  'auditor-prod-pass-',
  'auditor-seg-blocked-',
  'auditor-qual-blocked-',
  'auditor-prod-blocked-',
  'checkpoint-done-',
  'investigator-invoked-',
  'agent-failed-',
];

(async () => {
  let projdir;
  try {
    projdir = sanitizeProjdir();
  } catch {
    process.exit(0); /* best-effort, nao bloqueia */
  }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');

  if (!fs.existsSync(runtime)) process.exit(0);

  let removidos = 0;
  for (const prefix of EPHEMERAL_PREFIXES) {
    const filename = `${prefix}${sess}`;
    const fullpath = path.join(runtime, filename);
    try {
      if (fs.existsSync(fullpath)) {
        fs.unlinkSync(fullpath);
        removidos++;
      }
    } catch {
      /* permissao/disco — segue */
    }
  }

  // investigation-*.json com mais de STALE_DAYS dias — limpeza por IDADE, nao
  // por sessao (esses artefatos sobrevivem entre sessoes de proposito, mas
  // nao pra sempre). Roda em toda sessao que encerra, nao so a que criou o
  // arquivo — mesmo padrao de STALE_DAYS de session-snapshot-restore.js.
  let investigationsRemovidos = 0;
  try {
    for (const name of fs.readdirSync(runtime)) {
      if (!/^investigation-.*\.json$/.test(name)) continue;
      const fullpath = path.join(runtime, name);
      try {
        const st = fs.statSync(fullpath);
        if (Date.now() - st.mtimeMs > STALE_MS) {
          fs.unlinkSync(fullpath);
          investigationsRemovidos++;
        }
      } catch {
        /* permissao/disco — segue */
      }
    }
  } catch {
    /* runtime sumiu entre o existsSync e agora — segue */
  }

  if (removidos > 0) {
    recordMetric(
      'cleanup',
      'session-cleanup',
      `${removidos} markers da sessao ${sess.slice(0, 8)}`,
    );
  }
  if (investigationsRemovidos > 0) {
    recordMetric(
      'cleanup',
      'session-cleanup',
      `${investigationsRemovidos} investigation-*.json com mais de ${STALE_DAYS} dias`,
    );
  }
  process.exit(0);
})().catch(() => process.exit(0));
