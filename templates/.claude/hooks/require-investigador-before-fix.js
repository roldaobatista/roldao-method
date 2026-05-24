#!/usr/bin/env node
// require-investigador-before-fix.js — exige investigador antes de Edit/Write em codigo
// quando o prompt original mencionou bug (REGRA #0).
// Hook PreToolUse, matcher: Write|Edit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart)$/;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const markBug = path.join(runtime, `bug-trigger-${sess}`);
  const markInv = path.join(runtime, `investigator-invoked-${sess}`);

  if (!fs.existsSync(markBug)) process.exit(0);

  // GATE 1: investigador invocado.
  if (!fs.existsSync(markInv)) {
    process.stderr.write(`[require-investigador-before-fix] BLOQUEADO: Edit/Write em código de negócio sem investigador.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write(`Motivo: o pedido inicial falou de bug/comportamento errado e o Detetive\n`);
    process.stderr.write(`(investigador) ainda não rodou. Mexer no código agora vira fix-no-sintoma\n`);
    process.stderr.write(`(REGRA #0 — INV-006).\n\n`);
    process.stderr.write(`Como destravar: rode /investigar ou /bug primeiro — o Detetive lê banco/log/\n`);
    process.stderr.write(`payload, identifica causa raiz e libera a edição.\n\n`);
    process.stderr.write(`Bypass (só se o usuário autorizar): touch ${markInv}\n`);
    recordMetric('block', 'require-investigador-before-fix', `edit em ${filePath} sem investigador`);
    process.exit(2);
  }

  // GATE 2 (auditoria 10-agentes 3ª passada 2026-05-24): investigador invocado E
  // gravou prova mecanica do que leu (investigation-*.json). Sem o JSON, o
  // marker pode ter sido "touch" cego — REGRA #0 vira cosmetica. Com bug-active
  // presente, EXIGIR o artefato.
  let bugActive = false;
  try {
    bugActive = fs.readdirSync(runtime).some((n) => /^bug-active-/.test(n));
  } catch { /* runtime ausente — confia no GATE 1 */ }

  if (bugActive) {
    let temProva = false;
    try {
      temProva = fs.readdirSync(runtime).some((n) => /^investigation-.*\.json$/.test(n));
    } catch { /* idem */ }

    if (!temProva) {
      process.stderr.write(`[require-investigador-before-fix] BLOQUEADO: investigador invocado SEM gravar prova.\n\n`);
      process.stderr.write(`Arquivo: ${filePath}\n`);
      process.stderr.write(`Motivo: REGRA #0 exige LEITURA REAL antes do fix (banco, log, payload, config).\n`);
      process.stderr.write(`O marker investigator-invoked existe mas nao ha .claude/.runtime/investigation-*.json\n`);
      process.stderr.write(`registrando o que foi lido. Sem prova mecânica, marker vira teatro.\n\n`);
      process.stderr.write(`Como resolver: o subagente investigador deve gravar JSON com:\n`);
      process.stderr.write(`  { "lido": ["arquivo:linha ou query SELECT"], "achado": "causa raiz", "ref": "..." }\n`);
      process.stderr.write(`em .claude/.runtime/investigation-<ref>.json antes de devolver controle ao dev.\n\n`);
      process.stderr.write(`Bypass (so se for trivial e o usuario autorizar):\n`);
      process.stderr.write(`  echo '{"lido":["bypass: confiei no usuario"], "achado":"trivial"}' > .claude/.runtime/investigation-bypass.json\n`);
      recordMetric('block', 'require-investigador-before-fix', `marker sem prova investigation-*.json`);
      process.exit(2);
    }
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[require-investigador-before-fix] erro interno: ${err.message}\n`);
  process.exit(2);
});
