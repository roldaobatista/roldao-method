#!/usr/bin/env node
// validate-story-dependencies.js — recusa Edit/Write em codigo se a US ativa
// tem dependencia (depende-de) sem status: entregue.
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$|\.claude\/\.runtime\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart)$/;
const DELIVERED_STATUSES = new Set(['entregue', 'done', 'concluida', 'completed']);

function findFile(dir, predicate) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return null; }
  for (const n of entries) {
    if (predicate(n)) return path.join(dir, n);
  }
  return null;
}

function extractDepsFromFrontmatter(text) {
  const inlineMatch = text.match(/^depende-de:\s*\[(.*?)\]/m);
  if (inlineMatch) {
    return inlineMatch[1].replace(/\s+/g, '').split(',').filter((x) => /^US-\d+$/.test(x));
  }
  // Multiline:
  // depende-de:
  //   - US-001
  //   - US-002
  const lines = text.split(/\r?\n/);
  const out = [];
  let inBlock = false;
  for (const line of lines) {
    if (/^depende-de:\s*$/.test(line)) { inBlock = true; continue; }
    if (inBlock) {
      const m = line.match(/^\s+-\s+(US-\d+)/);
      if (m) { out.push(m[1]); continue; }
      if (/^\S/.test(line)) break; // saiu do bloco
    }
  }
  return out;
}

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const markFeature = path.join(runtime, `feature-active-${sess}`);
  const markDepsOk = path.join(runtime, `deps-checked-${sess}`);

  if (!fs.existsSync(markFeature)) process.exit(0);
  if (fs.existsSync(markDepsOk)) process.exit(0); // cache de sessao

  let usId = '';
  try {
    const head = fs.readFileSync(markFeature, 'utf8').split(/\r?\n/)[0];
    const m = head.match(/\b(US-\d+)\b/);
    if (m) usId = m[1];
  } catch { /* skip */ }
  if (!usId) process.exit(0);

  const storyFile = findFile(
    path.join(projdir, 'docs', 'stories'),
    (n) => n.startsWith(usId + '-') && n.endsWith('.md')
  );
  if (!storyFile || !fs.existsSync(storyFile)) process.exit(0);

  let text;
  try { text = fs.readFileSync(storyFile, 'utf8'); } catch { process.exit(0); }
  const deps = extractDepsFromFrontmatter(text);

  if (deps.length === 0) {
    try { fs.mkdirSync(runtime, { recursive: true }); } catch {}
    try { fs.writeFileSync(markDepsOk, ''); } catch {}
    process.exit(0);
  }

  const blockers = [];
  for (const dep of deps) {
    const depFile = findFile(
      path.join(projdir, 'docs', 'stories'),
      (n) => n.startsWith(dep + '-') && n.endsWith('.md')
    );
    if (!depFile || !fs.existsSync(depFile)) {
      blockers.push(`  - ${dep}: arquivo nao encontrado em docs/stories/`);
      continue;
    }
    try {
      const depText = fs.readFileSync(depFile, 'utf8');
      const sMatch = depText.match(/^status:\s*(\S+)/m);
      const depStatus = sMatch ? sMatch[1] : 'desconhecido';
      if (!DELIVERED_STATUSES.has(depStatus)) {
        blockers.push(`  - ${dep}: status atual = '${depStatus}' (precisa: entregue/done)`);
      }
    } catch {
      blockers.push(`  - ${dep}: erro ao ler arquivo`);
    }
  }

  if (blockers.length === 0) {
    try { fs.mkdirSync(runtime, { recursive: true }); } catch {}
    try { fs.writeFileSync(markDepsOk, ''); } catch {}
    process.exit(0);
  }

  process.stderr.write(`[validate-story-dependencies] BLOQUEADO: ${usId} tem dependencias nao entregues.\n\n`);
  process.stderr.write(`Arquivo alvo: ${filePath}\n`);
  process.stderr.write(`Story em /feature: ${usId}\n`);
  process.stderr.write(`Story file: ${storyFile}\n\n`);
  process.stderr.write(`Dependencias bloqueando:\n`);
  for (const b of blockers) process.stderr.write(`${b}\n`);
  process.stderr.write(`\nFinalize as US dependentes (status: entregue) antes de iniciar ${usId}.\n`);
  process.stderr.write(`Ou ajuste o campo \`depende-de:\` no frontmatter se a dependencia mudou.\n\n`);
  process.stderr.write(`Aplica regra: INV-004 (cadeia rastreavel) + sequenciamento de sprint.\n`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[validate-story-dependencies] erro interno: ${err.message}\n`);
  process.exit(2);
});
