#!/usr/bin/env node
// require-ripd-for-automated-decision.js — soft warning quando codigo
// implementa decisao automatizada (Art. 20 LGPD / LGPD-010) ou tratamento
// de alto risco que exige RIPD (LGPD-008) sem documento correspondente
// em docs/lgpd/RIPD-*.md, docs/ripd/, ou ADR de decisao automatizada.
//
// Hook PreToolUse, matcher: Write|Edit. Sai SEMPRE com 0 (so warn em stderr).
// Fail-soft por design — o objetivo e lembrar o operador, nao bloquear
// experimento. auditor-seguranca cobra na revisao final.
//
// Standalone: sem dependencia de _lib.js do core (espelha padrao de
// validate-webhook-signature.js do addon fintech-br) — funciona em projeto
// que tem so o addon instalado sem o core.

const fs = require('fs');
const path = require('path');

function readStdinJson() {
  return new Promise((resolve) => {
    let raw = '';
    if (process.stdin.isTTY) { resolve({}); return; }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { raw += c; });
    process.stdin.on('end', () => {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function sanitizeProjdir() {
  const env = process.env.CLAUDE_PROJECT_DIR;
  if (env && fs.existsSync(env)) return env;
  return process.cwd();
}

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|\/test\/|\/tests\/|\.test\.|\.spec\.|\/spec\/|README|CHANGELOG/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart|sql|prisma)$/;

// Sinaliza decisao automatizada (Art. 20) ou alto risco (Art. 38).
// Termos especificos pra evitar barulho. Lista cresce conforme caso aparecer.
const AUTOMATED_DECISION_RE = /\b(score[_-]?credito|credit[_-]?score|aprovar[_-]?credito|recusar[_-]?credito|risco[_-]?fraude|deny[_-]?list|denylist|allowlist|allow[_-]?list|preco[_-]?dinamico|dynamic[_-]?pricing|surge[_-]?pricing|matching[_-]?algorithm|recomendador|recommender|profile[_-]?score|perfilhamento|profiling)\b/i;
const HIGH_RISK_RE = /\b(monitoramento[_-]?continuo|continuous[_-]?monitoring|vigilancia[_-]?sistematica|biometria|biometric|reconhecimento[_-]?facial|facial[_-]?recognition|dados[_-]?sensiveis[_-]?em[_-]?escala|crianca|menor[_-]?de[_-]?idade|adolescente)\b/i;

function hasRipdDoc(projdir) {
  const candidates = [
    path.join(projdir, 'docs', 'lgpd'),
    path.join(projdir, 'docs', 'ripd'),
    path.join(projdir, 'docs', 'decisions'),
  ];
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    let entries;
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const e of entries) {
      if (/^(RIPD-|ADR-.*ripd|ADR-.*decisao-automatizada).*\.md$/i.test(e)) return true;
    }
  }
  return false;
}

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath || EXCLUDED_PATH_RE.test(filePath) || !CODE_EXT_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const auto = String(content).match(AUTOMATED_DECISION_RE);
  const risco = String(content).match(HIGH_RISK_RE);
  if (!auto && !risco) process.exit(0);

  const projdir = sanitizeProjdir();
  if (hasRipdDoc(projdir)) process.exit(0);

  const sinal = auto ? `decisao automatizada ("${auto[0]}")` : `tratamento de alto risco ("${risco[0]}")`;
  process.stderr.write(`[require-ripd-for-automated-decision] AVISO (nao bloqueio):\n\n`);
  process.stderr.write(`Arquivo ${filePath} sugere ${sinal}.\n`);
  process.stderr.write(`Nao encontrei RIPD nem ADR de decisao automatizada em docs/lgpd, docs/ripd ou docs/decisions.\n\n`);
  process.stderr.write(`Antes de fechar a feature, gere o documento via skill \`gerar-ripd\` (addon lgpd-compliance).\n`);
  process.stderr.write(`Regras: LGPD-008 (RIPD obrigatorio em alto risco), LGPD-010 (decisao automatizada exige revisao humana + explicacao).\n`);
  process.stderr.write(`Este e aviso doutrinario — auditor-seguranca cobra na auditoria final.\n`);
  process.exit(0);
})().catch(() => process.exit(0));
