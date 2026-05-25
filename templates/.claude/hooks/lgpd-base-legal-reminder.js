#!/usr/bin/env node
// lgpd-base-legal-reminder.js — soft warning quando codigo toca dado pessoal
// sem ADR ou story declarando base legal (LGPD-001 / LGPD-007).
// Hook PreToolUse, matcher: Write|Edit. Sai SEMPRE com 0 (so warn em stderr).

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, normalizeFilePath } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$|\.claude\/\.runtime\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart|sql|prisma)$/;

const PII_RE = /\bcpf\b|\bcnpj\b|\brg\b|\bemail\b|\be[-_]mail\b|\btelefone\b|\bcelular\b|\bphone\b|\bendereco\b|\bnascimento\b|\bbirth(date|day)\b|\bnome_(completo|civil)\b|\bgenero\b|\betnia\b|\bbiometria\b|\bsaude\b|\bdiagnostico\b/i;

function findFirstMatch(dir, predicate) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of entries) {
    if (e.isFile() && predicate(e.name)) return path.join(dir, e.name);
    if (e.isDirectory()) {
      const inner = findFirstMatch(path.join(dir, e.name), predicate);
      if (inner) return inner;
    }
  }
  return null;
}

function fileMentionsLgpd(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.md')) {
      try {
        const txt = fs.readFileSync(path.join(dir, e.name), 'utf8');
        if (/LGPD-\d+/.test(txt)) return true;
      } catch { /* skip */ }
    } else if (e.isDirectory()) {
      if (fileMentionsLgpd(path.join(dir, e.name))) return true;
    }
  }
  return false;
}

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const piiMatch = String(content).match(PII_RE);
  if (!piiMatch) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const decisionsDir = path.join(projdir, 'docs', 'decisions');

  let documentado = false;
  // (a) ADR com lgpd ou base-legal no nome
  if (fs.existsSync(decisionsDir)) {
    const namedAdr = findFirstMatch(decisionsDir, (n) => /^ADR-.*(lgpd|base-legal).*\.md$/i.test(n));
    if (namedAdr) documentado = true;
    // (b) ADR mencionando LGPD-XXX
    if (!documentado && fileMentionsLgpd(decisionsDir)) documentado = true;
  }

  // (c) story ativa com base-legal: no frontmatter
  if (!documentado) {
    const sess = sanitizeSessionHash(undefined, projdir);
    const featMark = path.join(projdir, '.claude', '.runtime', `feature-active-${sess}`);
    if (fs.existsSync(featMark)) {
      try {
        const usId = fs.readFileSync(featMark, 'utf8').split(/\r?\n/)[0].trim();
        if (usId) {
          const storyFile = findFirstMatch(path.join(projdir, 'docs', 'stories'), (n) => n.startsWith(usId + '-') && n.endsWith('.md'));
          if (storyFile) {
            const head = fs.readFileSync(storyFile, 'utf8').split(/\r?\n/).slice(0, 50).join('\n');
            if (/^base[-_]legal:/im.test(head)) documentado = true;
          }
        }
      } catch { /* skip */ }
    }
  }

  if (documentado) process.exit(0);

  process.stderr.write(`[lgpd-base-legal-reminder] AVISO (nao bloqueio):\n\n`);
  process.stderr.write(`Arquivo ${filePath} menciona "${piiMatch[0]}" — pode ser dado pessoal (LGPD-001).\n`);
  process.stderr.write(`Nao encontrei ADR de base legal nem campo \`base-legal:\` na story ativa.\n\n`);
  process.stderr.write(`Antes de fechar a feature, decida e documente UMA das opcoes:\n`);
  process.stderr.write(`  (a) ADR-NNNN-base-legal-<contexto>.md citando art. 7 (dados gerais) ou art. 11 (sensiveis).\n`);
  process.stderr.write(`  (b) Frontmatter da story: \`base-legal: contrato\` (ou consentimento, obrigacao legal, etc.).\n`);
  process.stderr.write(`  (c) Excecao temporaria com prazo: \`base-legal: a-definir-ate-AAAA-MM-DD\`.\n\n`);
  process.stderr.write(`Skill ajuda: \`checklist-lgpd\` tem arvore de decisao das 10 bases legais.\n\n`);
  process.stderr.write(`Regras: LGPD-001 (toda coleta exige base legal), LGPD-007 (citar art. 7 ou 11).\n`);
  process.stderr.write(`Este e aviso doutrinario — auditor-seguranca cobra na auditoria final.\n`);

  process.exit(0); // soft warning: sai 0 sempre
})().catch(() => {
  process.exit(0); // fail-soft em hook de aviso
});
