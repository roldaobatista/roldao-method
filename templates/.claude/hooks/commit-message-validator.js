#!/usr/bin/env node
// commit-message-validator.js — valida mensagem de git commit antes de executar.
// Hook PreToolUse, matcher: Bash. Politica: 1 linha curta (<=72), 1 prefixo,
// T-NNN obrigatorio quando ha sessao /feature ou /bug ativa.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash } = require('./_lib.js');

const TIPOS = 'feat|fix|refactor|chore|docs|test|perf|build|ci|revert';
const TIPOS_STYLE = TIPOS + '|style';

function extractMessages(cmd) {
  const parts = [];
  const reShort = /-m\s+(["'])(.*?)\1/gs;
  let m;
  while ((m = reShort.exec(cmd)) !== null) parts.push(m[2]);
  const reLong = /--message[=\s]+(["'])(.*?)\1/gs;
  while ((m = reLong.exec(cmd)) !== null) parts.push(m[2]);
  const reHeredoc = /<<\s*'?(\w+)'?\s*\n([\s\S]*?)\n\1/;
  const hd = cmd.match(reHeredoc);
  if (hd) parts.push(hd[2]);
  return parts.join('\n');
}

(async () => {
  const input = await readStdinJson();
  const cmd = input?.tool_input?.command || '';
  if (!cmd) process.exit(0);
  if (!cmd.includes('git commit')) process.exit(0);

  // Aplica: -m/--message OU --amend. Commit via editor (sem -m): exit 0 (COMMIT_EDITMSG
  // nao existe ainda em PreToolUse).
  const hasInline = /-m\s/.test(cmd) || /--message[=\s]/.test(cmd);
  const isAmend = /--amend/.test(cmd);
  if (!hasInline && !isAmend) process.exit(0);

  // Extrai mensagem. Fail-closed: se parser falhar, usa CMD inteiro pra evitar bypass.
  let msg = extractMessages(cmd);
  if (!msg) msg = cmd;

  const primeiraLinha = msg.split(/\r?\n/)[0];
  const violations = [];

  // Regra 1: primeira linha <= 72
  if (primeiraLinha.length > 72) {
    violations.push(`primeira linha tem ${primeiraLinha.length} caracteres (maximo 72): ${primeiraLinha}`);
  }

  // Regra 2: nao misturar prefixos (declarcao com `:`)
  const tiposDeclRe = new RegExp(`\\b(${TIPOS})(\\([^)]*\\))?!?:`, 'gi');
  const seg = primeiraLinha.match(/^([^:]{0,40}):/);
  const segText = seg ? seg[1] : '';
  const segTipos = new Set();
  const segMatchRe = new RegExp(`\\b(${TIPOS})\\b`, 'gi');
  let sm;
  while ((sm = segMatchRe.exec(segText)) !== null) segTipos.add(sm[1].toLowerCase());
  const declTipos = new Set();
  let dm;
  while ((dm = tiposDeclRe.exec(primeiraLinha)) !== null) declTipos.add(dm[1].toLowerCase());
  const prefixos = new Set([...declTipos, ...segTipos]);
  if (prefixos.size > 1) {
    violations.push(`commit mistura prefixos: ${[...prefixos].join(' ')} — separe em commits atomicos (INV-AGENT-005)`);
  }

  // Regra 3a: tipo declarado deve estar na lista canonica
  const tipoDeclMatch = primeiraLinha.match(/^([a-zA-Z]+)(?:\([^)]*\))?\s*:/);
  let tipoDeclarado = '';
  if (tipoDeclMatch) tipoDeclarado = tipoDeclMatch[1].toLowerCase();
  if (tipoDeclarado) {
    const validos = new Set(TIPOS_STYLE.split('|'));
    if (!validos.has(tipoDeclarado)) {
      violations.push(`tipo '${tipoDeclarado}:' nao e Conventional Commit — use feat/fix/refactor/chore/docs/test/perf/build/ci/revert/style`);
    }
  }

  // Regra 3b: warning sem prefixo (nao bloqueia)
  if (prefixos.size === 0 && !tipoDeclarado) {
    process.stderr.write(`[commit-message-validator] AVISO: sem prefixo (feat/fix/refactor/chore/docs/test): ${primeiraLinha}\n`);
  }

  // Regra 4: T-NNN obrigatorio em sessao /feature ou /bug ativa
  try {
    const projdir = sanitizeProjdir();
    const sess = sanitizeSessionHash(undefined, projdir);
    const runtime = path.join(projdir, '.claude', '.runtime');
    const markFeature = path.join(runtime, `feature-active-${sess}`);
    const markBug = path.join(runtime, `bug-trigger-${sess}`);
    if (fs.existsSync(markFeature) || fs.existsSync(markBug)) {
      const relevantes = ['feat', 'fix', 'refactor', 'perf'];
      const overlap = relevantes.some((p) => prefixos.has(p));
      if (overlap && !/\b(US-\d+|T-\d+)\b/.test(msg)) {
        violations.push('sessao /feature ou /bug ativa — commit precisa citar (US-NNN T-NNN) ou (T-NNN) na mensagem para rastreabilidade');
      }
    }
  } catch { /* sem projdir, skip rastreabilidade */ }

  if (violations.length === 0) process.exit(0);

  process.stderr.write(`[commit-message-validator] BLOQUEADO: mensagem de commit nao atende politica.\n\nViolacoes:\n`);
  for (const v of violations) process.stderr.write(`  - ${v}\n`);
  process.stderr.write(`\nPolitica:\n`);
  process.stderr.write(`  - Primeira linha <= 72 caracteres.\n`);
  process.stderr.write(`  - 1 prefixo por commit (feat OU fix OU refactor OU ...).\n`);
  process.stderr.write(`  - Corpo opcional, separado por linha em branco.\n`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[commit-message-validator] erro interno: ${err.message}\n`);
  process.exit(2);
});
