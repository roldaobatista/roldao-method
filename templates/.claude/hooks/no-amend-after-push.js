#!/usr/bin/env node
// no-amend-after-push.js — bloqueia `git commit --amend` se HEAD ja foi pushado.
// Hook PreToolUse, matcher: Bash. Regra: nunca reescrever commit publicado.
//
// Port Node do no-amend-after-push.sh (EP-001/US-102). Compara HEAD com @{u}
// (upstream tracking) — mais robusto que exigir `git fetch` recente.

const { execFileSync } = require('child_process');
const { sanitizeProjdir, readStdinJson } = require('./_lib.js');

function git(args, opts = {}) {
  try {
    return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'], ...opts }).toString().trim();
  } catch {
    return '';
  }
}

(async () => {
  // Hook roda no PWD do harness. Aceita PROJDIR via env (sanitizado) ou cai pra
  // PWD. Fail-closed: se sanitizeProjdir recusar (env malicioso, traversal),
  // BLOQUEIA o --amend em vez de liberar.
  let projdir;
  try { projdir = sanitizeProjdir(process.env.CLAUDE_PROJECT_DIR || process.cwd()); }
  catch { process.exit(2); }

  const input = await readStdinJson();
  const cmd = input?.tool_input?.command || '';

  // Aplica so a `git commit`
  if (!cmd.includes('git commit')) process.exit(0);

  // --amend como argumento isolado (regex igual ao grep -E do .sh)
  if (!/(^|\s)--amend(\s|$)/.test(cmd)) process.exit(0);

  const opts = { cwd: projdir };

  // Estrategia 1: comparar HEAD com @{u} (upstream tracking)
  let pushedTo = '';
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], opts);
  if (upstream) {
    const localSha = git(['rev-parse', 'HEAD'], opts);
    const upstreamSha = git(['rev-parse', upstream], opts);
    if (localSha && upstreamSha) {
      if (localSha === upstreamSha) {
        pushedTo = upstream;
      } else {
        // merge-base --is-ancestor: exit 0 se LOCAL e ancestral de UPSTREAM
        try {
          execFileSync('git', ['merge-base', '--is-ancestor', localSha, upstreamSha], { stdio: 'ignore', cwd: projdir });
          pushedTo = upstream;
        } catch { /* nao e ancestral */ }
      }
    }
  }

  // Estrategia 2 (fallback): qualquer branch remota contendo HEAD
  if (!pushedTo) {
    const remoteBranches = git(['branch', '-r', '--contains', 'HEAD'], opts);
    if (remoteBranches) {
      pushedTo = remoteBranches.split('\n')[0].trim();
    }
  }

  if (pushedTo) {
    process.stderr.write(`[no-amend-after-push] BLOQUEADO: tentativa de --amend em commit ja pushado.\n\n`);
    process.stderr.write(`O commit atual (HEAD) ja existe em: ${pushedTo}\n\n`);
    process.stderr.write(`Regra: nunca reescrever historico publicado. Faca um NOVO commit em vez disso.\n\n`);
    process.stderr.write(`Excecao: se voce TEM CERTEZA que ninguem mais usa essa branch e quer mesmo reescrever,\n`);
    process.stderr.write(`execute com confirmacao explicita e force-with-lease consciente (autorizacao do usuario obrigatoria).\n`);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  // Fail-closed: erro inesperado num hook bloqueador NAO libera. Exit 2.
  process.stderr.write(`[no-amend-after-push] erro interno: ${err.message}\n`);
  process.exit(2);
});
