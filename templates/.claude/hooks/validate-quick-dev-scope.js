#!/usr/bin/env node
// validate-quick-dev-scope.js — impede que /quick-dev vire /feature disfarcado.
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, safeRuntimeDir, recordMetric } = require('./_lib.js');

const SKIP_PATH_RE = /test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.claude\/\.runtime\/|\/docs\/|CHANGELOG|ROADMAP/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|vue|svelte|py|go|rb|java|kt|cs|php|rs|swift|dart|css|scss|sass|less|html|hbs|ejs|pug)$/;
const PATH_SENSITIVE_RE = /(\b|\/)(fiscal|nfe|nfce|sat|esocial|reinf|sped|pix|lgpd|dpo|ripd|imposto|tributo|cpf|cnpj|certificado|sefaz)([\b/_.-]|$)/i;
const LIMIT = 3;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const markQd = path.join(projdir, '.claude', '.runtime', `quick-dev-active-${sess}`);

  if (!fs.existsSync(markQd)) process.exit(0);
  if (SKIP_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  // Bloqueio imediato em dominio sensivel
  if (PATH_SENSITIVE_RE.test(filePath)) {
    process.stderr.write(`[validate-quick-dev-scope] BLOQUEADO: /quick-dev tocando arquivo de dominio\n`);
    process.stderr.write(`sensivel (fiscal/LGPD/Pix/eSocial). Esses dominios NUNCA sao triviais —\n`);
    process.stderr.write(`calculo errado vira multa, vazamento de CPF vira incidente ANPD.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\n`);
    process.stderr.write(`Suba para /feature mesmo que pareca pequeno:\n`);
    process.stderr.write(`  1. Encerre /quick-dev: rm "$CLAUDE_PROJECT_DIR/.claude/.runtime/quick-dev-active-*"\n`);
    process.stderr.write(`  2. Rode: /feature <descricao>\n\n`);
    process.stderr.write(`Aplica: validate-quick-dev-scope (palavra-gatilho), INV-AGENT-005.\n`);
    recordMetric('block', 'validate-quick-dev-scope', `dominio sensivel: ${filePath}`);
    process.exit(2);
  }

  const runtime = safeRuntimeDir(projdir);
  const filesLog = path.join(runtime, `quick-dev-files-${sess}`);

  // Normaliza path
  const normPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');

  // Le arquivos ja registrados
  const seen = new Set();
  if (fs.existsSync(filesLog)) {
    const lines = fs.readFileSync(filesLog, 'utf8').split(/\r?\n/);
    for (const l of lines) if (l) seen.add(l);
  }

  const alreadyInLog = seen.has(normPath);
  if (alreadyInLog) process.exit(0); // idempotencia

  const uniqueAfter = seen.size + 1;

  if (uniqueAfter <= LIMIT) {
    try { fs.appendFileSync(filesLog, normPath + '\n'); } catch {}
    process.exit(0);
  }

  // Estourou — NAO adiciona o novo, bloqueia
  process.stderr.write(`[validate-quick-dev-scope] BLOQUEADO: /quick-dev ja tocou ${LIMIT} arquivos\n`);
  process.stderr.write(`de codigo de negocio. Tentativa de tocar o ${LIMIT + 1}o arquivo:\n\n`);
  process.stderr.write(`  ${filePath}\n\n`);
  process.stderr.write(`Arquivos ja modificados nesta sessao /quick-dev:\n`);
  for (const f of seen) process.stderr.write(`  - ${f}\n`);
  process.stderr.write(`\nLimite de /quick-dev: <=${LIMIT} arquivos de codigo, <=50 linhas de diff.\n\n`);
  process.stderr.write(`A mudanca ESCALOU — nao e mais trivial. Suba para /feature:\n`);
  process.stderr.write(`  Rode /feature <descricao> — o pipeline completo (Sofia, Detetive, Rafael,\n`);
  process.stderr.write(`  Dev, Revisor, Auditores) toma conta e o /quick-dev e encerrado pelo maestro.\n\n`);
  process.stderr.write(`Atencao: nao tente apagar markers em .claude/.runtime/ — block-destructive\n`);
  process.stderr.write(`bloqueia, e fazer isso conta como erosao silenciosa do framework.\n\n`);
  process.stderr.write(`Aplica: /quick-dev.md (cheklist obrigatorio), INV-AGENT-005.\n`);
  recordMetric('block', 'validate-quick-dev-scope', `escopo estourou: ${uniqueAfter} arquivos`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[validate-quick-dev-scope] erro interno: ${err.message}\n`);
  process.exit(2);
});
