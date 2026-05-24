#!/usr/bin/env node
// session-snapshot.js — PreCompact + SessionEnd hook.
// Grava 2 arquivos em .claude/.runtime/:
//   1. session-snapshot.md — narrativo PT-BR pra humano/Claude.
//   2. session-state.json — recriado por session-snapshot-restore na proxima sessao.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { sanitizeProjdir, sanitizeSessionHash, safeRuntimeDir } = require('./_lib.js');

function listFiles(dir, prefixes) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return []; }
  return entries
    .filter((n) => prefixes.some((p) => n.startsWith(p)))
    .map((n) => path.join(dir, n));
}

function listFilesWithPredicate(dir, predicate) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return []; }
  return entries.filter(predicate).map((n) => path.join(dir, n));
}

function head1(file) {
  try { return fs.readFileSync(file, 'utf8').split(/\r?\n/)[0]; }
  catch { return ''; }
}

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).toString().trim();
  } catch { return ''; }
}

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const runtime = safeRuntimeDir(projdir);
  const snapshot = path.join(runtime, 'session-snapshot.md');
  const state = path.join(runtime, 'session-state.json');
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const hash = sanitizeSessionHash(undefined, projdir);

  // Coleta paths com find equivalent (readdirSync — tolera espaco em path)
  const features = listFilesWithPredicate(runtime, (n) => n.startsWith('feature-active-'));
  const bugs = listFilesWithPredicate(runtime, (n) => n.startsWith('bug-active-'));
  let markers = listFilesWithPredicate(runtime, (n) => /(-done-|-skipped-)/.test(n));
  // Ordena por mtime desc, top 10
  try {
    markers = markers.map((f) => ({ f, m: fs.statSync(f).mtimeMs })).sort((a, b) => b.m - a.m).slice(0, 10).map((x) => x.f);
  } catch { markers = markers.slice(0, 10); }

  // ----- 1. Snapshot textual -----
  try {
    const out = [];
    out.push(`# Snapshot de sessão — ${ts}\n`);
    out.push(`\n## Stories ativas\n\n`);
    if (features.length > 0) {
      for (const f of features) out.push(`- ${head1(f)} (marker: \`${path.basename(f)}\`)\n`);
    } else out.push(`- (nenhuma)\n`);
    out.push(`\n## Bugs ativos\n\n`);
    if (bugs.length > 0) {
      for (const b of bugs) out.push(`- \`${path.basename(b)}\`\n`);
    } else out.push(`- (nenhum)\n`);
    out.push(`\n## Markers de agentes (últimos 10)\n\n`);
    if (markers.length > 0) {
      for (const m of markers) out.push(`- \`${path.basename(m)}\`\n`);
    } else out.push(`- (nenhum)\n`);
    out.push(`\n## Branch git\n\n`);
    const branch = git(['branch', '--show-current'], projdir) || '—';
    out.push(`- Branch: \`${branch}\`\n`);
    const status = git(['status', '--short'], projdir);
    if (status) {
      out.push(`- Working tree:\n\n\`\`\`\n${status.split(/\r?\n/).slice(0, 20).join('\n')}\n\`\`\`\n`);
    } else {
      out.push(`- Working tree: limpo\n`);
    }
    fs.writeFileSync(snapshot, out.join(''));
  } catch { /* best-effort */ }

  // ----- 2. State machine-readable -----
  const PATTERNS = [
    'feature-active-', 'bug-active-', 'readiness-passed-', 'auditor-',
    'investigator-invoked-', 'sofia-invoked-', 'rafael-invoked-', 'rafael-skipped-',
    'checkpoint-done-',
  ];
  const SUFFIX_PATTERNS = [/-done-/, /-skipped-/];
  let allMarkers = [];
  try {
    const entries = fs.readdirSync(runtime);
    for (const n of entries) {
      if (PATTERNS.some((p) => n.startsWith(p)) || SUFFIX_PATTERNS.some((re) => re.test(n))) {
        allMarkers.push(path.join(runtime, n));
      }
    }
  } catch { /* skip */ }

  try {
    const obj = {
      session_hash: hash,
      saved_at: ts,
      active_markers: allMarkers.map((file) => {
        const name = path.basename(file);
        let content = head1(file);
        content = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\t]/g, ' ');
        return { name, content };
      }),
    };
    fs.writeFileSync(state, JSON.stringify(obj, null, 2) + '\n');
  } catch { /* best-effort */ }

  process.exit(0);
})().catch(() => process.exit(0));
