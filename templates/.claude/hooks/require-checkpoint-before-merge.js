#!/usr/bin/env node
// require-checkpoint-before-merge.js — exige /checkpoint antes de git commit/merge/push
// em sessao /feature ativa.
// Hook PreToolUse, matcher: Bash.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const SKIP_PREFIXES_RE = /(docs|chore|ci|build|style):/;

(async () => {
  const input = await readStdinJson();
  const cmd = input?.tool_input?.command || '';
  if (!cmd) process.exit(0);
  if (!/git commit|git merge|git push/.test(cmd)) process.exit(0);
  if (SKIP_PREFIXES_RE.test(cmd)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const markFeature = path.join(runtime, `feature-active-${sess}`);
  const markCheckpoint = path.join(runtime, `checkpoint-done-${sess}`);

  if (!fs.existsSync(markFeature)) process.exit(0);
  if (fs.existsSync(markCheckpoint)) process.exit(0);

  let usHint = '';
  try {
    const head = fs.readFileSync(markFeature, 'utf8').split(/\r?\n/)[0];
    const m = head.match(/\b(US-\d+)\b/);
    if (m) usHint = m[1];
  } catch { /* skip */ }

  process.stderr.write(`[require-checkpoint-before-merge] BLOQUEADO: tentativa de commit/merge/push\n`);
  process.stderr.write(`em sessao /feature ativa sem /checkpoint executado.\n\n`);
  process.stderr.write(`Story alvo: ${usHint || '(nao identificada)'}\n`);
  process.stderr.write(`Comando bloqueado: ${cmd}\n\n`);
  process.stderr.write(`ANTES de subir a mudanca, rode:\n  /checkpoint\n\n`);
  process.stderr.write(`Isso gera docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md com:\n`);
  process.stderr.write(`  - Proposito em 1 frase (linguagem leiga)\n`);
  process.stderr.write(`  - O que muda pro cliente final + non-goals\n`);
  process.stderr.write(`  - Tabela de riscos\n`);
  process.stderr.write(`  - Plano de rollback se ha migracao\n`);
  process.stderr.write(`  - Decisoes consolidadas dos auditores\n\n`);
  process.stderr.write(`Pular o checkpoint reintroduz o erro classico:\n`);
  process.stderr.write(`  - Merge sem walkthrough = surpresa em producao\n`);
  process.stderr.write(`  - Cliente nao-tecnico nao entende o que mudou\n`);
  process.stderr.write(`  - Auditor disse RESSALVA e ninguem leu\n\n`);
  process.stderr.write(`Se voce esta certo que o commit NAO encerra feature (so atualiza doc/teste),\n`);
  process.stderr.write(`use prefixo conventional commit que pula esse hook:\n  docs:, chore:, ci:, build:, style:\n\n`);
  process.stderr.write(`Para liberar manualmente (sob sua responsabilidade):\n`);
  process.stderr.write(`  mkdir -p "${runtime}" && touch "${markCheckpoint}"\n\n`);
  process.stderr.write(`Aplica regras: INV-AGENT-006 (walkthrough antes de subir), INV-006 (verificar antes de afirmar).\n`);
  recordMetric('block', 'require-checkpoint-before-merge', `${usHint || 'US-?'}: commit sem checkpoint`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-checkpoint-before-merge] erro interno: ${err.message}\n`);
  process.exit(2);
});
