#!/usr/bin/env node
// require-checkpoint-before-merge.js — exige /checkpoint antes de git commit/merge/push
// em sessao /feature ativa.
// Hook PreToolUse, matcher: Bash.
//
// Contrato: marker checkpoint-done-* e JSON com 5 campos obrigatorios
// (decorrencia de ADR-020: mesmo padrao dos markers de auditor).
// Janela de compat v2.0.0 → v2.1.0: ADR-021 (flag ROLDAO_METHOD_LEGACY_MARKERS=1).
// Decomposicao: PRD-003 → US-111 → T-002.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

// computeDiffShas — retorna { sha256, gitBlobSha } do diff HEAD atual.
// Marker e valido se audit_sha bater em qualquer dos dois formatos.
// Resolve staleness em Windows com core.autocrlf=true sem quebrar markers legados.
function computeDiffShas(projdir) {
  try {
    execFileSync('git', ['-C', projdir, 'rev-parse', '--git-dir'], { stdio: 'ignore' });
    const diff = execFileSync('git', ['-C', projdir, 'diff', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] });
    const sha256 = crypto.createHash('sha256').update(diff).digest('hex');
    const gitBlobSha = execFileSync('git', ['hash-object', '--stdin'], {
      input: diff || Buffer.alloc(0),
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim();
    return { sha256, gitBlobSha };
  } catch {
    return { sha256: '', gitBlobSha: '' };
  }
}

const SKIP_PREFIXES_RE = /(docs|chore|ci|build|style):/;
const REQUIRED_FIELDS = ['session', 'checkpoint_path', 'audit_sha', 'timestamp', 'us'];
const LEGACY_MODE = process.env.ROLDAO_METHOD_LEGACY_MARKERS === '1';

// validateCheckpointMarker — le marker e classifica.
// Retorna { state, reason } onde state ∈
//   {ok, missing, empty, malformed, missing-field, file-not-found, stale, legacy}.
function validateCheckpointMarker(markPath, projdir, currentShas) {
  if (!fs.existsSync(markPath)) return { state: 'missing' };

  let txt;
  try { txt = fs.readFileSync(markPath, 'utf8').trim(); }
  catch { return { state: 'malformed' }; }

  if (!txt) {
    return { state: LEGACY_MODE ? 'legacy' : 'empty' };
  }

  let j;
  try { j = JSON.parse(txt); }
  catch { return { state: 'malformed' }; }

  const faltando = REQUIRED_FIELDS.filter((k) => j[k] === undefined || j[k] === null || j[k] === '');
  if (faltando.length > 0) return { state: 'missing-field', reason: faltando.join(', ') };

  // Valida que CHK existe em disco — protege contra "marker aponta pra arquivo fantasma"
  const chkAbs = path.isAbsolute(j.checkpoint_path)
    ? j.checkpoint_path
    : path.join(projdir, j.checkpoint_path);
  if (!fs.existsSync(chkAbs)) {
    return { state: 'file-not-found', reason: j.checkpoint_path };
  }

  // Staleness: audit_sha do checkpoint deve casar com sha256 OU git hash-object atual.
  const cs = currentShas || { sha256: '', gitBlobSha: '' };
  const hasAtLeastOne = cs.sha256 || cs.gitBlobSha;
  if (hasAtLeastOne) {
    const bate = (j.audit_sha === cs.sha256) || (j.audit_sha === cs.gitBlobSha);
    if (!bate) {
      return { state: 'stale', reason: `audit_sha=${j.audit_sha.slice(0, 12)} vs atual sha256=${cs.sha256.slice(0, 12)} / gitBlob=${cs.gitBlobSha.slice(0, 12)}` };
    }
  }

  return { state: 'ok' };
}

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

  const currentShas = computeDiffShas(projdir);

  const r = validateCheckpointMarker(markCheckpoint, projdir, currentShas);

  if (r.state === 'ok') process.exit(0);
  if (r.state === 'legacy') {
    process.stderr.write(`[require-checkpoint-before-merge] AVISO: checkpoint marker sem JSON canonico — aceito porque ROLDAO_METHOD_LEGACY_MARKERS=1.\n`);
    process.stderr.write(`Esta tolerancia some em v2.2.0. Rode '/checkpoint' completo na proxima feature.\n`);
    process.exit(0);
  }

  let usHint = '';
  try {
    const head = fs.readFileSync(markFeature, 'utf8').split(/\r?\n/)[0];
    const m = head.match(/\b(US-\d+)\b/);
    if (m) usHint = m[1];
  } catch { /* skip */ }

  process.stderr.write(`[require-checkpoint-before-merge] BLOQUEADO: tentativa de commit/merge/push\n`);
  process.stderr.write(`em sessao /feature ativa sem /checkpoint VALIDO executado.\n\n`);
  process.stderr.write(`Story alvo: ${usHint || '(nao identificada)'}\n`);
  process.stderr.write(`Comando bloqueado: ${cmd}\n\n`);

  switch (r.state) {
    case 'missing':
      process.stderr.write(`Estado: marker checkpoint-done-* AUSENTE.\n`);
      process.stderr.write(`Voce ainda nao rodou /checkpoint pra esta sessao.\n\n`);
      break;
    case 'empty':
      process.stderr.write(`Estado: marker VAZIO (tentativa de bypass via 'touch').\n`);
      process.stderr.write(`Marker existe mas nao tem conteudo — nao basta criar arquivo.\n\n`);
      break;
    case 'malformed':
      process.stderr.write(`Estado: marker MALFORMADO (JSON invalido).\n`);
      process.stderr.write(`Conteudo nao e JSON parseavel.\n\n`);
      break;
    case 'missing-field':
      process.stderr.write(`Estado: marker INCOMPLETO (campos obrigatorios faltando).\n`);
      process.stderr.write(`Campos faltando: ${r.reason}\n`);
      process.stderr.write(`Campos obrigatorios: ${REQUIRED_FIELDS.join(', ')}\n\n`);
      break;
    case 'file-not-found':
      process.stderr.write(`Estado: marker aponta pra arquivo FANTASMA.\n`);
      process.stderr.write(`checkpoint_path: ${r.reason}\n`);
      process.stderr.write(`Arquivo nao existe em disco. /checkpoint deve gerar docs/checkpoints/CHK-*.md ANTES de criar o marker.\n\n`);
      break;
    case 'stale':
      process.stderr.write(`Estado: marker STALE (codigo mudou depois do checkpoint).\n`);
      process.stderr.write(`${r.reason}\n`);
      process.stderr.write(`Voce rodou /checkpoint mas mexeu no codigo depois — re-rode /checkpoint pra cobrir o diff novo.\n\n`);
      break;
  }

  process.stderr.write(`Como destravar (caminho legitimo — NAO ha bypass mecanico):\n`);
  process.stderr.write(`  1. Rode /checkpoint completo (etapas 1-5).\n`);
  process.stderr.write(`  2. /checkpoint gera docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md com:\n`);
  process.stderr.write(`        - Proposito em 1 frase (linguagem leiga)\n`);
  process.stderr.write(`        - O que muda pro cliente + non-goals\n`);
  process.stderr.write(`        - Tabela de riscos\n`);
  process.stderr.write(`        - Decisoes consolidadas dos auditores\n`);
  process.stderr.write(`  3. Ao final, /checkpoint escreve marker JSON canonico:\n`);
  process.stderr.write(`        {\n`);
  process.stderr.write(`          "session": "<hash>",\n`);
  process.stderr.write(`          "checkpoint_path": "docs/checkpoints/CHK-2026-MM-DD-<slug>.md",\n`);
  process.stderr.write(`          "audit_sha": "<sha256 do diff coberto>",\n`);
  process.stderr.write(`          "timestamp": "2026-MM-DDTHH:MM:SSZ",\n`);
  process.stderr.write(`          "us": "US-NNN"\n`);
  process.stderr.write(`        }\n\n`);
  process.stderr.write(`Por que esse rigor:\n`);
  process.stderr.write(`  - Marker vazio (criado por 'touch') NAO conta como checkpoint — INV-AGENT-004.\n`);
  process.stderr.write(`  - audit_sha amarra walkthrough ao diff exato — se mexer no codigo, re-rodar.\n`);
  process.stderr.write(`  - checkpoint_path obriga arquivo CHK existir — nao pode marcar 'feito' sem o doc.\n`);
  process.stderr.write(`  - Sem isso, "checkpoint" vira rubber-stamp (bloqueador 1 da auditoria 2026-05-24).\n\n`);
  process.stderr.write(`Se voce esta certo que o commit NAO encerra feature (so atualiza doc/teste),\n`);
  process.stderr.write(`use prefixo conventional commit que pula esse hook:\n  docs:, chore:, ci:, build:, style:\n\n`);
  process.stderr.write(`Em migracao de v1.x pra v2.x: setar ROLDAO_METHOD_LEGACY_MARKERS=1 aceita\n`);
  process.stderr.write(`markers antigos vazios por enquanto. Janela de tolerancia (ADR-021):\n`);
  process.stderr.write(`  - v2.0.0 → v2.1.0: flag aceita\n`);
  process.stderr.write(`  - v2.2.0+: flag removida; checkpoint sem JSON canonico quebra commit.\n\n`);
  process.stderr.write(`Aplica regras: INV-AGENT-004, INV-AGENT-006, INV-006.\n`);
  recordMetric('block', 'require-checkpoint-before-merge', `${usHint || 'US-?'}: state=${r.state}`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-checkpoint-before-merge] erro interno: ${err.message}\n`);
  process.exit(2);
});
