#!/usr/bin/env node
// enforce-pipeline-completion.js — Stop hook que recusa encerrar a sessao
// quando ha pipeline /feature ATIVO sem checkpoint salvo.
//
// Hook Stop. Retorna JSON {"decision":"block","reason":"..."} pra forcar
// o agente principal a fechar o ciclo antes de encerrar.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash } = require('./_lib.js');

(async () => {
  await readStdinJson(); // consome stdin (Stop hook recebe JSON do Claude Code)

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const m = (name) => path.join(runtime, `${name}-${sess}`);

  if (!fs.existsSync(m('feature-active'))) process.exit(0);
  if (fs.existsSync(m('checkpoint-done'))) process.exit(0);

  // Pipeline nao comecou (sem Sofia nem Detetive) — sessao abortada cedo
  if (!fs.existsSync(m('sofia-done')) && !fs.existsSync(m('detetive-done'))) {
    process.exit(0);
  }

  let usId = '(US nao identificada)';
  try {
    const head = fs.readFileSync(m('feature-active'), 'utf8').split(/\r?\n/)[0].trim();
    if (head) usId = head;
  } catch { /* skip */ }

  const faltam = [];
  // Revisor (Inês) e parte do pipeline /feature (Sofia → Detetive → Rafael →
  // Bruno → Inês → 3 auditores). Sem marker dele, doc promete 6 etapas mas
  // hook valida 5. Auditoria 10-agentes 2026-05-24 fechou esse gap.
  if (!fs.existsSync(m('revisor-done'))) faltam.push('revisor (Inês)');
  if (!fs.existsSync(m('auditor-seg-pass'))) faltam.push('auditor-seguranca (Caio)');
  if (!fs.existsSync(m('auditor-qual-pass'))) faltam.push('auditor-qualidade (Júlia)');
  if (!fs.existsSync(m('auditor-prod-pass'))) faltam.push('auditor-produto (Pedro)');
  if (!fs.existsSync(m('checkpoint-done'))) faltam.push('checkpoint (walkthrough do diff)');

  const reasonList = faltam.map((x) => `  - ${x}`).join('\n');
  const reason = `[enforce-pipeline-completion] Pipeline /feature aberto sem checkpoint.

US ativa: ${usId}

Falta fechar:
${reasonList}

Antes de encerrar, rode o restante do pipeline (auditores + checkpoint) — ou delegue ao maestro:
  Task subagent_type=maestro prompt="Modo FT continuacao: ${usId}, retomar do ponto atual ate checkpoint."

Encerrar agora deixa US-NNN sem audit trail (viola INV-002 + INV-AGENT-004).
Se voce REALMENTE quer abortar (decisao consciente), apague o marker:
  rm .claude/.runtime/feature-active-${sess}
e rode Stop de novo.`;

  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
})().catch(() => {
  process.exit(0); // Stop hook nao deve falhar duro
});
