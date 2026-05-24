#!/usr/bin/env node
// session-snapshot-restore.js — SessionStart hook.
// Le snapshot da sessao anterior e recria markers ativos.

const fs = require('fs');
const path = require('path');
const { sanitizeProjdir } = require('./_lib.js');

const STALE_DAYS = 7;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const runtime = path.join(projdir, '.claude', '.runtime');
  const snapshot = path.join(runtime, 'session-snapshot.md');
  const state = path.join(runtime, 'session-state.json');

  // Snapshot textual no stderr (se recente)
  if (fs.existsSync(snapshot)) {
    try {
      const st = fs.statSync(snapshot);
      if (Date.now() - st.mtimeMs <= STALE_MS) {
        const txt = fs.readFileSync(snapshot, 'utf8');
        process.stderr.write(`\n[session-snapshot-restore] Snapshot da sessao anterior:\n`);
        process.stderr.write(txt);
        process.stderr.write(`\n[session-snapshot-restore] Snapshot lido. Continue de onde parou ou rode \`/status\` pra confirmar.\n\n`);
      }
    } catch { /* skip */ }
  }

  // Recria markers a partir do session-state.json
  if (fs.existsSync(state)) {
    try {
      const st = fs.statSync(state);
      if (Date.now() - st.mtimeMs > STALE_MS) process.exit(0);

      const j = JSON.parse(fs.readFileSync(state, 'utf8'));
      const savedHash = j.session_hash || '';
      if (savedHash) {
        try { fs.writeFileSync(path.join(runtime, '.session-hash'), savedHash + '\n'); } catch {}
        process.stderr.write(`[session-snapshot-restore] SESSION_HASH restaurado: ${savedHash}\n`);
      }

      const markers = j.active_markers || [];
      let restored = 0;
      for (const m of markers) {
        const name = m.name || '';
        const content = m.content || '';
        if (!name) continue;
        // Validacao: sem / ou ..
        if (name.includes('/') || name.includes('..')) continue;
        const markerPath = path.join(runtime, name);
        if (!fs.existsSync(markerPath)) {
          try { fs.writeFileSync(markerPath, content); restored++; } catch {}
        }
      }
      if (restored > 0) {
        process.stderr.write(`[session-snapshot-restore] ${restored} marker(s) recriado(s) — Sofia/Detetive/Rafael preservados entre sessoes.\n\n`);
      }
    } catch { /* skip */ }
  }

  process.exit(0);
})().catch(() => process.exit(0));
