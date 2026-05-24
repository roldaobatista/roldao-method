#!/usr/bin/env node
// require-auditors-pass-before-commit.js — exige que os 3 auditores tenham aprovado
// antes de git commit/merge/push em sessao /feature ativa.
// Hook PreToolUse, matcher: Bash.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const SKIP_PREFIXES_RE = /(docs|chore|ci|build|style):/;

const LABELS = {
  seg:  'auditor-seguranca (Caio) — secrets, LGPD, supply chain, OWASP',
  qual: 'auditor-qualidade (Julia) — testes, cobertura, anti-mascaramento',
  prod: 'auditor-produto (Pedro) — aderencia a US, non-goals',
};

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

  if (!fs.existsSync(markFeature)) process.exit(0);

  // Hash do diff atual pra validar staleness de pass markers
  let currentSha = '';
  try {
    execFileSync('git', ['-C', projdir, 'rev-parse', '--git-dir'], { stdio: 'ignore' });
    const diff = execFileSync('git', ['-C', projdir, 'diff', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    currentSha = crypto.createHash('sha256').update(diff).digest('hex');
  } catch { /* sem git, currentSha fica vazio — skip de staleness check */ }

  const blocked = [];
  const missing = [];
  const stale = [];

  for (const key of ['seg', 'qual', 'prod']) {
    const passMark = path.join(runtime, `auditor-${key}-pass-${sess}`);
    const blockMark = path.join(runtime, `auditor-${key}-blocked-${sess}`);
    if (fs.existsSync(blockMark)) {
      blocked.push(LABELS[key]);
    } else if (!fs.existsSync(passMark)) {
      missing.push(LABELS[key]);
    } else if (currentSha) {
      let auditSha = '';
      try {
        const txt = fs.readFileSync(passMark, 'utf8').trim();
        if (txt) {
          const j = JSON.parse(txt);
          auditSha = j.audit_sha || '';
        }
      } catch { /* marker sem JSON valido — sem staleness check */ }
      if (auditSha && auditSha !== currentSha) {
        stale.push(LABELS[key]);
      }
    }
  }

  if (blocked.length === 0 && missing.length === 0 && stale.length === 0) process.exit(0);

  let usHint = '';
  try {
    const head = fs.readFileSync(markFeature, 'utf8').split(/\r?\n/)[0];
    const m = head.match(/\b(US-\d+)\b/);
    if (m) usHint = m[1];
  } catch { /* skip */ }

  process.stderr.write(`[require-auditors-pass-before-commit] BLOQUEADO: tentativa de commit/merge/push\n`);
  process.stderr.write(`em sessao /feature ativa sem aprovacao consolidada dos 3 auditores.\n\n`);
  process.stderr.write(`Story alvo: ${usHint || '(nao identificada)'}\n`);
  process.stderr.write(`Comando bloqueado: ${cmd}\n\n`);

  if (blocked.length > 0) {
    process.stderr.write(`Auditores que BLOQUEARAM:\n`);
    for (const a of blocked) process.stderr.write(`  ✗ ${a}\n`);
    process.stderr.write(`\n`);
  }
  if (missing.length > 0) {
    process.stderr.write(`Auditores que ainda NAO rodaram:\n`);
    for (const a of missing) process.stderr.write(`  ⏳ ${a}\n`);
    process.stderr.write(`\n`);
  }
  if (stale.length > 0) {
    process.stderr.write(`Auditores cuja aprovacao esta STALE (codigo mudou depois):\n`);
    for (const a of stale) process.stderr.write(`  ⚠  ${a}\n`);
    process.stderr.write(`\n`);
  }

  process.stderr.write(`ANTES de fechar a feature:\n`);
  process.stderr.write(`  - Volte ao /feature etapa 6 e rode os 3 auditores em paralelo.\n`);
  process.stderr.write(`  - Cada auditor cria seu marker: auditor-{seg|qual|prod}-pass-* (aprovou)\n`);
  process.stderr.write(`    ou auditor-{seg|qual|prod}-blocked-* (apontou ressalva bloqueante).\n`);
  process.stderr.write(`  - Se algum BLOQUEOU, volte pra Dev Senior (etapa 4), corrija, re-rode etapas 5 e 6.\n\n`);
  process.stderr.write(`Pular essa validacao reintroduz o erro classico:\n`);
  process.stderr.write(`  - Merge com auditor BLOQUEADO = vulnerabilidade/regressao subindo em producao\n`);
  process.stderr.write(`  - "Eu falo com o auditor depois" = o depois nunca chega\n\n`);
  process.stderr.write(`Override manual (so com autorizacao explicita do usuario nao-tecnico):\n`);
  process.stderr.write(`  mkdir -p "${runtime}"\n`);
  process.stderr.write(`  touch "${path.join(runtime, `auditor-seg-pass-${sess}`)}"\n`);
  process.stderr.write(`  touch "${path.join(runtime, `auditor-qual-pass-${sess}`)}"\n`);
  process.stderr.write(`  touch "${path.join(runtime, `auditor-prod-pass-${sess}`)}"\n\n`);
  process.stderr.write(`Aplica regras: INV-AGENT-006, SEC-* (seguranca obrigatoria), TST-* (qualidade obrigatoria).\n`);
  recordMetric('block', 'require-auditors-pass-before-commit', `${usHint || 'US-?'} blocked=${blocked.length} missing=${missing.length} stale=${stale.length}`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-auditors-pass-before-commit] erro interno: ${err.message}\n`);
  process.exit(2);
});
