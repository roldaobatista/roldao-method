#!/usr/bin/env node
// subagent-handoff-audit.js — SubagentStop hook.
// Avisa (sem bloquear) quando subagente investigador/auditor encerra sem gravar
// artefato de saida. Gate principal continua em require-investigador-before-fix
// e require-auditors-pass-before-commit.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, safeRuntimeDir } = require('./_lib.js');

function findFirst(dir, regex) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return null; }
  for (const n of entries) if (regex.test(n)) return path.join(dir, n);
  return null;
}

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const runtime = safeRuntimeDir(projdir);

  const input = await readStdinJson();
  const subagent = input?.subagent_type || '';
  if (!subagent) process.exit(0);

  const activeFeature = findFirst(runtime, /^feature-active-/);
  const activeBug = findFirst(runtime, /^bug-active-/);

  if (subagent === 'investigador') {
    if (activeFeature || activeBug) {
      const found = findFirst(runtime, /^investigation-.*\.json$/);
      if (!found) {
        process.stderr.write(`[subagent-handoff-audit] AVISO: investigador encerrou sem gravar .claude/.runtime/investigation-<ref>.json. Próximo agente (dev-senior) vai bloquear.\n`);
      }
    }
  } else if (subagent === 'auditor-seguranca' || subagent === 'auditor-qualidade' || subagent === 'auditor-produto') {
    if (activeFeature) {
      const key = subagent === 'auditor-seguranca' ? 'seg' : subagent === 'auditor-qualidade' ? 'qual' : 'prod';
      const pass = findFirst(runtime, new RegExp(`^auditor-${key}-pass-`));
      const block = findFirst(runtime, new RegExp(`^auditor-${key}-blocked-`));
      if (!pass && !block) {
        process.stderr.write(`[subagent-handoff-audit] AVISO: ${subagent} encerrou sem gravar veredito (pass/blocked). Commit/merge será bloqueado.\n`);
      }
    }
  }

  process.exit(0);
})().catch(() => process.exit(0));
