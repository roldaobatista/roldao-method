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
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  for (const n of entries) if (regex.test(n)) return path.join(dir, n);
  return null;
}

// checkInvestigador — avisa se o investigador ja foi invocado (marker proprio
// gravado por ele mesmo, ver .claude/agents/investigador.md) mas nao deixou
// o artefato investigation-*.json. So dispara depois que o marker existe —
// evita AVISO prematuro em SubagentStop de agentes anteriores (Sofia etc.)
// que rodam antes do investigador sequer comecar.
function checkInvestigador(runtime, activeFeature, activeBug) {
  if (!(activeFeature || activeBug)) return;
  const invoked = findFirst(runtime, /^investigator-invoked-/);
  if (!invoked) return;
  const found = findFirst(runtime, /^investigation-.*\.json$/);
  if (!found) {
    process.stderr.write(
      `[subagent-handoff-audit] AVISO: investigador foi invocado mas .claude/.runtime/investigation-<ref>.json ainda nao existe. Proximo agente (dev-senior) vai bloquear.\n`,
    );
  }
}

// checkAuditores — avisa sobre auditor(es) sem veredito (pass/blocked) gravado.
// Se `specificRole` for informado (payload com agent_type/subagent_type valido),
// checa so aquele. Caso contrario checa os 3, mas so depois que `ines-done-*`
// existir (revisor concluido = fase de auditoria comecou, ver maestro.md linha
// 195: "Depois: Bruno -> Ines -> 3 auditores em paralelo") — evita AVISO
// prematuro antes da fase de auditoria comecar.
function checkAuditores(runtime, activeFeature, specificRole) {
  if (!activeFeature) return;
  if (!specificRole && !findFirst(runtime, /^ines-done-/)) return;

  const roles = specificRole
    ? [specificRole]
    : ['auditor-seguranca', 'auditor-qualidade', 'auditor-produto'];

  for (const subagent of roles) {
    const key =
      subagent === 'auditor-seguranca' ? 'seg' : subagent === 'auditor-qualidade' ? 'qual' : 'prod';
    const pass = findFirst(runtime, new RegExp(`^auditor-${key}-pass-`));
    const block = findFirst(runtime, new RegExp(`^auditor-${key}-blocked-`));
    if (!pass && !block) {
      process.stderr.write(
        `[subagent-handoff-audit] AVISO: ${subagent} sem veredito (pass/blocked) registrado. Commit/merge sera bloqueado.\n`,
      );
    }
  }
}

(async () => {
  let projdir;
  try {
    projdir = sanitizeProjdir();
  } catch {
    process.exit(0);
  }
  const runtime = safeRuntimeDir(projdir);

  const input = await readStdinJson();
  // Payload REAL de SubagentStop (Claude Code atual) nao manda subagent_type
  // — so session_id, transcript_path, cwd, hook_event_name, stop_hook_active.
  // O campo `input.subagent_type` lido aqui nunca existiu na pratica: o hook
  // sempre caia no "if (!subagent) process.exit(0)" e nunca avisava nada
  // (auditoria 2026-08-17). Aceita `agent_type`/`subagent_type` pra
  // compatibilidade caso uma versao futura passe a mandar, mas NAO depende
  // deles: na ausencia, infere a fase do pipeline pelos markers *-done-*/
  // *-invoked-* ja gravados pelos proprios agentes (contrato documentado em
  // .claude/agents/*.md e maestro.md) — o unico sinal realmente disponivel
  // neste hook hoje.
  const subagentHint = input?.agent_type || input?.subagent_type || '';

  const activeFeature = findFirst(runtime, /^feature-active-/);
  const activeBug = findFirst(runtime, /^bug-active-/);

  if (subagentHint === 'investigador') {
    checkInvestigador(runtime, activeFeature, activeBug);
  } else if (
    subagentHint === 'auditor-seguranca' ||
    subagentHint === 'auditor-qualidade' ||
    subagentHint === 'auditor-produto'
  ) {
    checkAuditores(runtime, activeFeature, subagentHint);
  } else if (!subagentHint) {
    // Sem hint de tipo — checa os dois pontos do pipeline que TEM sinal
    // proprio disponivel (marker gravado pelo agente / fase seguinte comecou).
    checkInvestigador(runtime, activeFeature, activeBug);
    checkAuditores(runtime, activeFeature, null);
  }

  process.exit(0);
})().catch(() => process.exit(0));
