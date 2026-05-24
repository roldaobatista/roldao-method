#!/usr/bin/env node
// require-readiness-before-feature.js — exige /readiness aprovado antes de Edit/Write
// em codigo de negocio quando ha sessao /feature ativa.
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$|\.claude\/\.runtime\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart)$/;

function firstMatchFile(dir, predicate) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return null; }
  for (const n of entries) {
    if (predicate(n)) return path.join(dir, n);
  }
  return null;
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
  const markReadiness = path.join(runtime, `readiness-passed-${sess}`);

  if (!fs.existsSync(markFeature)) process.exit(0);
  if (fs.existsSync(markReadiness)) process.exit(0);

  // Tenta ler US do marker e buscar status do epico
  let usId = '';
  try {
    const head = fs.readFileSync(markFeature, 'utf8').split(/\r?\n/)[0];
    const m = head.match(/\b(US-\d+)\b/);
    if (m) usId = m[1];
  } catch { /* skip */ }

  let epHint = '';
  let statusHint = '';
  if (usId) {
    const storyFile = firstMatchFile(
      path.join(projdir, 'docs', 'stories'),
      (n) => n.startsWith(usId + '-') && n.endsWith('.md')
    );
    if (storyFile && fs.existsSync(storyFile)) {
      try {
        const txt = fs.readFileSync(storyFile, 'utf8');
        const epMatch = txt.match(/^epico:\s*(EP-\d+)/m);
        if (epMatch) {
          epHint = epMatch[1];
          const statusFile = path.join(projdir, 'docs', 'readiness', `${epHint}-status.md`);
          if (fs.existsSync(statusFile)) {
            const statusTxt = fs.readFileSync(statusFile, 'utf8');
            const sMatch = statusTxt.match(/^status:\s*(\w+)/m);
            if (sMatch) {
              statusHint = sMatch[1];
              if (statusHint === 'PRONTO') {
                try { fs.mkdirSync(runtime, { recursive: true }); } catch {}
                try { fs.writeFileSync(markReadiness, ''); } catch {}
                process.exit(0);
              }
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  process.stderr.write(`[require-readiness-before-feature] BLOQUEADO: tentativa de Edit/Write em codigo\n`);
  process.stderr.write(`de negocio sem readiness aprovado.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n`);
  process.stderr.write(`Story alvo: ${usId || '(nao identificada)'}\n`);
  process.stderr.write(`Epico: ${epHint || '(nao identificado)'}\n`);
  process.stderr.write(`Status atual: ${statusHint || '(arquivo de status nao existe)'}\n\n`);
  process.stderr.write(`ANTES de implementar feature, rode:\n  /readiness ${epHint || 'EP-NNN'}\n\n`);
  process.stderr.write(`Isso gera docs/readiness/${epHint || 'EP-NNN'}-status.md com status: PRONTO.\n\n`);
  process.stderr.write(`Se voce ja rodou /readiness e o status esta PRONTO, talvez o marker de sessao\n`);
  process.stderr.write(`nao foi criado. Force liberacao manual (sob sua responsabilidade):\n`);
  process.stderr.write(`  mkdir -p "${runtime}" && touch "${markReadiness}"\n\n`);
  process.stderr.write(`Aplica regras: INV-001, INV-002 (spec gera codigo — sem spec readiness, sem codigo).\n`);
  recordMetric('block', 'require-readiness-before-feature', `${usId || 'US-?'} sem readiness (status=${statusHint || 'sem arquivo'})`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-readiness-before-feature] erro interno: ${err.message}\n`);
  process.exit(2);
});
