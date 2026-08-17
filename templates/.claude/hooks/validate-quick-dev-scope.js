#!/usr/bin/env node
// validate-quick-dev-scope.js — impede que /quick-dev vire /feature disfarcado.
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const {
  readStdinJson,
  sanitizeProjdir,
  sanitizeSessionHash,
  safeRuntimeDir,
  recordMetric,
  normalizeFilePath,
} = require('./_lib.js');

const SKIP_PATH_RE =
  /test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.claude\/\.runtime\/|\/docs\/|CHANGELOG|ROADMAP/;
const CODE_EXT_RE =
  /\.(js|jsx|ts|tsx|vue|svelte|py|go|rb|java|kt|cs|php|rs|swift|dart|css|scss|sass|less|html|hbs|ejs|pug)$/;
const PATH_SENSITIVE_RE =
  /(\b|\/)(fiscal|nfe|nfce|sat|esocial|reinf|sped|pix|lgpd|dpo|ripd|imposto|tributo|cpf|cnpj|certificado|sefaz)([\b/_.-]|$)/i;
const LIMIT = 3;

// Contrato do _dispatcher (ADR-033): retorna exit code, nunca chama process.exit.
async function runHook(input) {
  // Auditoria 2026-08-17: normaliza \ do Windows — senao SKIP_PATH_RE (com /)
  // nunca casa e o hook conta teste como arquivo de codigo no limite de 3.
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) return 0;

  let projdir;
  try {
    projdir = sanitizeProjdir();
  } catch {
    return 2;
  }
  const sess = sanitizeSessionHash(undefined, projdir);
  const markQd = path.join(projdir, '.claude', '.runtime', `quick-dev-active-${sess}`);

  if (!fs.existsSync(markQd)) return 0;
  if (SKIP_PATH_RE.test(filePath)) return 0;
  if (!CODE_EXT_RE.test(filePath)) return 0;

  // Bloqueio imediato em dominio sensivel
  if (PATH_SENSITIVE_RE.test(filePath)) {
    process.stderr.write(
      `[validate-quick-dev-scope] BLOQUEADO: /quick-dev tocando arquivo de dominio\n`,
    );
    process.stderr.write(
      `sensivel (fiscal/LGPD/Pix/eSocial). Esses dominios NUNCA sao triviais —\n`,
    );
    process.stderr.write(`calculo errado vira multa, vazamento de CPF vira incidente ANPD.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\n`);
    process.stderr.write(`Suba para /feature mesmo que pareca pequeno:\n`);
    process.stderr.write(
      `  1. Encerre /quick-dev: rm "$CLAUDE_PROJECT_DIR/.claude/.runtime/quick-dev-active-*"\n`,
    );
    process.stderr.write(`  2. Rode: /feature <descricao>\n\n`);
    process.stderr.write(`Aplica: validate-quick-dev-scope (palavra-gatilho), INV-AGENT-005.\n`);
    recordMetric('block', 'validate-quick-dev-scope', `dominio sensivel: ${filePath}`);
    return 2;
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
  if (alreadyInLog) return 0; // idempotencia

  const uniqueAfter = seen.size + 1;

  if (uniqueAfter <= LIMIT) {
    try {
      fs.appendFileSync(filesLog, normPath + '\n');
    } catch {}
    return 0;
  }

  // Estourou — NAO adiciona o novo, bloqueia
  process.stderr.write(
    `[validate-quick-dev-scope] BLOQUEADO: /quick-dev ja tocou ${LIMIT} arquivos\n`,
  );
  process.stderr.write(`de codigo de negocio. Tentativa de tocar o ${LIMIT + 1}o arquivo:\n\n`);
  process.stderr.write(`  ${filePath}\n\n`);
  process.stderr.write(`Arquivos ja modificados nesta sessao /quick-dev:\n`);
  for (const f of seen) process.stderr.write(`  - ${f}\n`);
  process.stderr.write(
    `\nLimite de /quick-dev: <=${LIMIT} arquivos de codigo, <=50 linhas de diff.\n\n`,
  );
  process.stderr.write(`A mudanca ESCALOU — nao e mais trivial. Suba para /feature:\n`);
  process.stderr.write(
    `  Rode /feature <descricao> — o pipeline completo (Sofia, Detetive, Rafael,\n`,
  );
  process.stderr.write(
    `  Dev, Revisor, Auditores) toma conta e o /quick-dev e encerrado pelo maestro.\n\n`,
  );
  process.stderr.write(
    `Atencao: nao tente apagar markers de PIPELINE (feature-active, auditor-*-pass,\n`,
  );
  process.stderr.write(
    `checkpoint-done...) — block-destructive bloqueia e conta como erosao do framework.\n`,
  );
  process.stderr.write(
    `Excecao unica: o proprio quick-dev-active-* pode ser removido ao encerrar o fluxo\n`,
  );
  process.stderr.write(`(passo documentado em /quick-dev.md).\n\n`);
  process.stderr.write(`Aplica: /quick-dev.md (cheklist obrigatorio), INV-AGENT-005.\n`);
  recordMetric('block', 'validate-quick-dev-scope', `escopo estourou: ${uniqueAfter} arquivos`);
  return 2;
}

module.exports = { runHook, onErrorExit: 2 };

if (require.main === module) {
  (async () => {
    process.exit(await runHook(await readStdinJson()));
  })().catch((err) => {
    process.stderr.write(`[validate-quick-dev-scope] erro interno: ${err.message}\n`);
    process.exit(2);
  });
}
