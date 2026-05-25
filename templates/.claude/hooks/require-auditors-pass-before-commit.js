#!/usr/bin/env node
// require-auditors-pass-before-commit.js — exige que os 3 auditores tenham aprovado
// antes de git commit/merge/push em sessao /feature ativa.
// Hook PreToolUse, matcher: Bash.
//
// Contrato: ADR-020 (markers de auditor sao JSON com 5 campos obrigatorios).
// Janela de compat v2.0.0 → v2.1.0: ADR-021 (flag ROLDAO_METHOD_LEGACY_MARKERS=1).
// Decomposicao: PRD-003 → US-111 → T-001.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric, gitSafeEnv } = require('./_lib.js');

// computeDiffShas — retorna { sha256, gitBlobSha } do diff HEAD atual.
// Marker do auditor pode trazer audit_sha em qualquer dos dois formatos.
// Decisao (auditoria 10-agentes): em Windows com core.autocrlf=true, crypto.sha256
// sobre `git diff HEAD` produz hashes diferentes entre sessoes; git hash-object
// e cross-platform. Aceitar ambos resolve staleness sem quebrar markers legados.
// Retorna { sha256:'', gitBlobSha:'' } se git nao disponivel.
function computeDiffShas(projdir) {
  try {
    execFileSync('git', ['-C', projdir, 'rev-parse', '--git-dir'], { stdio: 'ignore', env: gitSafeEnv() });
    const diff = execFileSync('git', ['-C', projdir, 'diff', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'], env: gitSafeEnv() });
    const sha256 = crypto.createHash('sha256').update(diff).digest('hex');
    const gitBlobSha = execFileSync('git', ['hash-object', '--stdin'], {
      input: diff || Buffer.alloc(0),
      stdio: ['pipe', 'pipe', 'ignore'],
      env: gitSafeEnv(),
    }).toString().trim();
    return { sha256, gitBlobSha };
  } catch {
    return { sha256: '', gitBlobSha: '' };
  }
}

const SKIP_PREFIXES_RE = /(docs|chore|ci|build|style):/;
const REQUIRED_FIELDS = ['session', 'agent', 'audit_sha', 'timestamp', 'lido_de'];
const LEGACY_MODE = process.env.ROLDAO_METHOD_LEGACY_MARKERS === '1';

const LABELS = {
  seg:  'auditor-seguranca (Caio) — secrets, LGPD, supply chain, OWASP',
  qual: 'auditor-qualidade (Julia) — testes, cobertura, anti-mascaramento',
  prod: 'auditor-produto (Pedro) — aderencia a US, non-goals',
};

// validateMarker — le um marker de auditor e classifica.
// Retorna { state, audit_sha } onde state ∈ {ok, missing, empty, malformed, missing-field, stale, legacy}.
// `currentShas` = { sha256, gitBlobSha } — marker e valido se audit_sha bater em qualquer um.
// Em LEGACY_MODE: marker vazio vira {state: 'legacy', audit_sha: ''} (passa com warning).
function validateMarker(passMark, currentShas) {
  if (!fs.existsSync(passMark)) return { state: 'missing', audit_sha: '' };

  let txt;
  try {
    txt = fs.readFileSync(passMark, 'utf8').trim();
  } catch {
    return { state: 'malformed', audit_sha: '' };
  }

  if (!txt) {
    // Marker vazio = tentativa de bypass via `touch` (ADR-020).
    // Em LEGACY_MODE (v2.0.0 a v2.1.0), passa com warning. Senao, bloqueia.
    return { state: LEGACY_MODE ? 'legacy' : 'empty', audit_sha: '' };
  }

  let j;
  try {
    j = JSON.parse(txt);
  } catch {
    return { state: 'malformed', audit_sha: '' };
  }

  // Valida shape canonico (ADR-020 secao 'Shape do marker').
  const faltando = REQUIRED_FIELDS.filter((k) => j[k] === undefined || j[k] === null || j[k] === '');
  if (faltando.length > 0) {
    return { state: 'missing-field', audit_sha: '', faltando };
  }

  // audit_sha valido — compara com diff atual (staleness check).
  // Aceita match em sha256 (legado) OU git hash-object (cross-platform).
  const cs = currentShas || { sha256: '', gitBlobSha: '' };
  const hasAtLeastOne = cs.sha256 || cs.gitBlobSha;
  if (hasAtLeastOne) {
    const bate = (j.audit_sha === cs.sha256) || (j.audit_sha === cs.gitBlobSha);
    if (!bate) return { state: 'stale', audit_sha: j.audit_sha };
  }

  return { state: 'ok', audit_sha: j.audit_sha };
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

  if (!fs.existsSync(markFeature)) process.exit(0);

  // Hash do diff atual em 2 formatos (sha256 legado + git hash-object cross-platform).
  // Marker e valido se audit_sha bater em QUALQUER um dos dois.
  const currentShas = computeDiffShas(projdir);

  const blocked = [];
  const missing = [];
  const empty = [];
  const malformed = [];
  const missingField = []; // {label, faltando}
  const stale = [];
  const legacy = [];

  for (const key of ['seg', 'qual', 'prod']) {
    const passMark = path.join(runtime, `auditor-${key}-pass-${sess}`);
    const blockMark = path.join(runtime, `auditor-${key}-blocked-${sess}`);

    if (fs.existsSync(blockMark)) {
      blocked.push(LABELS[key]);
      continue;
    }

    const r = validateMarker(passMark, currentShas);
    switch (r.state) {
      case 'ok': break;
      case 'missing': missing.push(LABELS[key]); break;
      case 'empty': empty.push(LABELS[key]); break;
      case 'malformed': malformed.push(LABELS[key]); break;
      case 'missing-field': missingField.push({ label: LABELS[key], faltando: r.faltando }); break;
      case 'stale': stale.push(LABELS[key]); break;
      case 'legacy': legacy.push(LABELS[key]); break;
    }
  }

  const totalProblemas = blocked.length + missing.length + empty.length + malformed.length + missingField.length + stale.length;
  if (totalProblemas === 0) {
    // Avisa sobre markers legacy se houver, mas nao bloqueia.
    if (legacy.length > 0) {
      process.stderr.write(`[require-auditors-pass-before-commit] AVISO: ${legacy.length} marker(s) sem JSON canonico — aceito porque ROLDAO_METHOD_LEGACY_MARKERS=1.\n`);
      process.stderr.write(`Esta tolerancia some em v2.2.0. Rode 'npx roldao-method migrate markers' pra atualizar.\n`);
    }
    process.exit(0);
  }

  let usHint = '';
  try {
    const head = fs.readFileSync(markFeature, 'utf8').split(/\r?\n/)[0];
    const m = head.match(/\b(US-\d+)\b/);
    if (m) usHint = m[1];
  } catch { /* skip */ }

  process.stderr.write(`[require-auditors-pass-before-commit] BLOQUEADO: tentativa de commit/merge/push\n`);
  process.stderr.write(`em sessao /feature ativa sem aprovacao consolidada e VERIFICAVEL dos 3 auditores.\n\n`);
  process.stderr.write(`Story alvo: ${usHint || '(nao identificada)'}\n`);
  process.stderr.write(`Comando bloqueado: ${cmd}\n\n`);

  if (blocked.length > 0) {
    process.stderr.write(`Auditores que BLOQUEARAM (apontaram ressalva grave):\n`);
    for (const a of blocked) process.stderr.write(`  ✗ ${a}\n`);
    process.stderr.write(`\n`);
  }
  if (missing.length > 0) {
    process.stderr.write(`Auditores que ainda NAO rodaram:\n`);
    for (const a of missing) process.stderr.write(`  ⏳ ${a}\n`);
    process.stderr.write(`\n`);
  }
  if (empty.length > 0) {
    process.stderr.write(`Auditores com marker VAZIO (tentativa de bypass — ADR-020):\n`);
    for (const a of empty) process.stderr.write(`  ⚠  ${a}\n`);
    process.stderr.write(`\n`);
  }
  if (malformed.length > 0) {
    process.stderr.write(`Auditores com marker MALFORMADO (JSON invalido):\n`);
    for (const a of malformed) process.stderr.write(`  ⚠  ${a}\n`);
    process.stderr.write(`\n`);
  }
  if (missingField.length > 0) {
    process.stderr.write(`Auditores com marker INCOMPLETO (campo obrigatorio faltando):\n`);
    for (const it of missingField) {
      process.stderr.write(`  ⚠  ${it.label}\n`);
      process.stderr.write(`     campos faltando: ${it.faltando.join(', ')}\n`);
    }
    process.stderr.write(`Campos obrigatorios (ADR-020): ${REQUIRED_FIELDS.join(', ')}\n\n`);
  }
  if (stale.length > 0) {
    process.stderr.write(`Auditores cuja aprovacao esta STALE (codigo mudou depois):\n`);
    for (const a of stale) process.stderr.write(`  ⚠  ${a}\n`);
    process.stderr.write(`\n`);
  }

  process.stderr.write(`Como destravar (caminho legitimo — NAO ha bypass mecanico):\n`);
  process.stderr.write(`  1. Volte ao /feature etapa 6 e peca pro Maestro re-rodar os 3 auditores.\n`);
  process.stderr.write(`     Ele invoca auditor-seguranca, auditor-qualidade, auditor-produto em paralelo.\n`);
  process.stderr.write(`  2. Cada auditor, ao APROVAR, escreve marker JSON canonico (ADR-020):\n`);
  process.stderr.write(`        {\n`);
  process.stderr.write(`          "session": "<hash da sessao>",\n`);
  process.stderr.write(`          "agent":   "auditor-seguranca",\n`);
  process.stderr.write(`          "audit_sha": "<sha256 do diff lido>",\n`);
  process.stderr.write(`          "timestamp": "2026-MM-DDTHH:MM:SSZ",\n`);
  process.stderr.write(`          "lido_de": ["arquivo1.js", "arquivo2.md"]\n`);
  process.stderr.write(`        }\n`);
  process.stderr.write(`  3. Se algum BLOQUEOU: volte pra Dev Senior (etapa 4), corrija, re-rode 5 e 6.\n\n`);
  process.stderr.write(`Por que esse rigor:\n`);
  process.stderr.write(`  - Marker vazio (criado por 'touch') NAO conta como aprovacao — INV-AGENT-004.\n`);
  process.stderr.write(`  - audit_sha amarra aprovacao ao diff exato — se voce mexer no codigo depois,\n`);
  process.stderr.write(`    marker fica "stale" e auditor precisa rodar de novo.\n`);
  process.stderr.write(`  - Sem esse contrato, "auditado" vira teatro (bloqueador 1 da auditoria 2026-05-24).\n\n`);
  process.stderr.write(`Em migracao de v1.x pra v2.x: setar ROLDAO_METHOD_LEGACY_MARKERS=1 aceita\n`);
  process.stderr.write(`markers antigos vazios por enquanto. Janela de tolerancia (ADR-021):\n`);
  process.stderr.write(`  - v2.0.0 → v2.1.0: flag aceita\n`);
  process.stderr.write(`  - v2.2.0+: flag removida; sem migracao quebra commit.\n\n`);
  process.stderr.write(`Aplica regras: INV-AGENT-004, INV-AGENT-006, SEC-* (seguranca), TST-* (qualidade).\n`);
  recordMetric('block', 'require-auditors-pass-before-commit', `${usHint || 'US-?'} blocked=${blocked.length} missing=${missing.length} empty=${empty.length} malformed=${malformed.length} missing-field=${missingField.length} stale=${stale.length}`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-auditors-pass-before-commit] erro interno: ${err.message}\n`);
  process.exit(2);
});
