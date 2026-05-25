#!/usr/bin/env node
// lgpd-dpo-canal-reminder.js — soft warning quando o projeto trata dado pessoal
// (PII detectada em codigo) mas nao tem canal do titular nem DPO declarado
// (LGPD-009). Sai SEMPRE com 0 (so warn em stderr).
//
// Hook PreToolUse, matcher: Write|Edit.
// Auditoria 2026-05-25 (regra #33): LGPD-009 (DPO + canal do titular) era
// so doutrinaria/checklist.
//
// Dispara 1x por sessao via marker .claude/.runtime/dpo-canal-checked-<sess>.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, normalizeFilePath } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|\/test\/|\/tests\/|\.test\.|\.spec\.|\/fixtures\/|\/mocks\/|\.json$|\.ya?ml$|\.env|\.sh$|\.ps1$|\.bat$|\.claude\/\.runtime\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart|sql|prisma)$/;
const PII_RE = /\bcpf\b|\bcnpj\b|\brg\b|\bemail\b|\btelefone\b|\bcelular\b|\bnascimento\b|\bnome_completo\b|\bsaude\b/i;

function findDpoEvidence(projdir) {
  // (a) doc dedicado: docs/lgpd/canal-titular.md ou docs/lgpd/dpo.md
  const lgpdDir = path.join(projdir, 'docs', 'lgpd');
  if (fs.existsSync(lgpdDir)) {
    try {
      for (const f of fs.readdirSync(lgpdDir)) {
        if (/^(canal-titular|dpo|encarregado)\.md$/i.test(f)) return `docs/lgpd/${f}`;
      }
    } catch { /* skip */ }
  }
  // (b) variavel de ambiente: DPO_EMAIL ou CANAL_TITULAR_EMAIL em .env.example
  const envExample = path.join(projdir, '.env.example');
  if (fs.existsSync(envExample)) {
    try {
      const txt = fs.readFileSync(envExample, 'utf8');
      if (/\b(DPO_EMAIL|CANAL_TITULAR|ENCARREGADO_EMAIL)\b/i.test(txt)) return '.env.example';
    } catch { /* skip */ }
  }
  // (c) ADR mencionando DPO
  const decisionsDir = path.join(projdir, 'docs', 'decisions');
  if (fs.existsSync(decisionsDir)) {
    try {
      for (const f of fs.readdirSync(decisionsDir)) {
        if (/^ADR-.*\b(dpo|encarregado|canal[-_]titular)\b.*\.md$/i.test(f)) return `docs/decisions/${f}`;
      }
    } catch { /* skip */ }
  }
  return null;
}

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content || !PII_RE.test(content)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const marker = path.join(projdir, '.claude', '.runtime', `dpo-canal-checked-${sess}`);
  // 1x por sessao
  if (fs.existsSync(marker)) process.exit(0);

  const evid = findDpoEvidence(projdir);
  // Marca antes de sair (mesmo OK) — 1 alerta por sessao maximo
  try {
    fs.mkdirSync(path.dirname(marker), { recursive: true });
    fs.writeFileSync(marker, '');
  } catch { /* skip */ }

  if (evid) process.exit(0); // ja documentado

  process.stderr.write(`[lgpd-dpo-canal-reminder] AVISO (nao bloqueio, 1x por sessao):\n\n`);
  process.stderr.write(`O projeto manuseia dado pessoal (detectado em ${filePath}), mas nao encontrei:\n`);
  process.stderr.write(`  - docs/lgpd/canal-titular.md ou docs/lgpd/dpo.md\n`);
  process.stderr.write(`  - DPO_EMAIL / CANAL_TITULAR_EMAIL em .env.example\n`);
  process.stderr.write(`  - ADR-NNNN-dpo-*.md em docs/decisions/\n\n`);
  process.stderr.write(`LGPD-009 exige: encarregado (DPO) nomeado + canal funcional pro titular exercer\n`);
  process.stderr.write(`direitos (acesso, correcao, exclusao, portabilidade, revogacao).\n\n`);
  process.stderr.write(`Como destravar:\n`);
  process.stderr.write(`  (a) Crie docs/lgpd/canal-titular.md com email + SLA + processo\n`);
  process.stderr.write(`  (b) Adicione DPO_EMAIL=<email> em .env.example\n`);
  process.stderr.write(`  (c) addon lgpd-compliance tem skill \`gerar-canal-dpo\` que monta modelo\n\n`);
  process.stderr.write(`Regra: LGPD-009 (REGRAS-INEGOCIAVEIS.md).\n`);

  process.exit(0); // soft warning
})().catch(() => process.exit(0));
