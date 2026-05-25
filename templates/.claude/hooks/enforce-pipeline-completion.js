#!/usr/bin/env node
// enforce-pipeline-completion.js — Stop hook que recusa encerrar a sessao
// quando ha pipeline ATIVO (qualquer modo do Maestro) sem fechamento.
//
// Hook Stop. Retorna JSON {"decision":"block","reason":"..."} pra forcar
// o agente principal a fechar o ciclo antes de encerrar.
//
// T-208 (D8) — cobre 4 modos novos do Maestro alem do FT original:
// - prd-active (ADR-019) → exige decomp-done
// - brownfield-active → exige audit-seg-done
// - ar-active → exige 3 auditores pass
// - feature-active (original) → exige checkpoint-done

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

  // T-208 (D8): valida qual modo esta ativo (so 1 esperado por sessao)
  const modoFT = fs.existsSync(m('feature-active'));
  const modoPRD = fs.existsSync(m('prd-active'));
  const modoBROWN = fs.existsSync(m('brownfield-active'));
  const modoAR = fs.existsSync(m('ar-active'));

  if (!modoFT && !modoPRD && !modoBROWN && !modoAR) process.exit(0);

  // Modo PRD: exige decomp-done (etapa 6/6)
  if (modoPRD) {
    if (fs.existsSync(m('decomp-done'))) process.exit(0);
    if (!fs.existsSync(m('analista-done')) && !fs.existsSync(m('pm-prd-done'))) process.exit(0);
    const faltamPRD = [];
    if (!fs.existsSync(m('pm-prd-done'))) faltamPRD.push('Sofia (Modo PRD — escrever PRD-NNN)');
    if (!fs.existsSync(m('tech-lead-done'))) faltamPRD.push('Rafael (listar ADRs decorrentes)');
    if (!fs.existsSync(m('ux-done')) && !fs.existsSync(m('ux-skipped'))) faltamPRD.push('Lia (UX — gerar ou skipar explicitamente)');
    if (!fs.existsSync(m('decomp-done'))) faltamPRD.push('Sofia (Modo DECOMP — quebrar em US filhas)');
    const reason = `[enforce-pipeline-completion] Pipeline /prd aberto sem decomposicao final.\nFalta:\n${faltamPRD.map(x => `  - ${x}`).join('\n')}\n\nDelegue ao maestro Modo PRD pra retomar.`;
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }

  // Modo BROWNFIELD: exige audit-seg-done (etapa 4/4)
  if (modoBROWN) {
    if (fs.existsSync(m('audit-seg-done'))) process.exit(0);
    if (!fs.existsSync(m('inventario-done'))) process.exit(0);
    const faltamBF = [];
    if (!fs.existsSync(m('tech-lead-done'))) faltamBF.push('Rafael (ADRs de adocao)');
    if (!fs.existsSync(m('pm-onboarding-done'))) faltamBF.push('Sofia (AGENTS.md + onboarding)');
    if (!fs.existsSync(m('audit-seg-done'))) faltamBF.push('Caio (scan inicial seg)');
    const reason = `[enforce-pipeline-completion] Pipeline /brownfield aberto sem scan inicial seg.\nFalta:\n${faltamBF.map(x => `  - ${x}`).join('\n')}\n\nDelegue ao maestro Modo BROWNFIELD.`;
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }

  // Modo AR: exige 3 auditores pass (etapa 2/2)
  if (modoAR) {
    const auditoresOk = ['auditor-seg-pass', 'auditor-qual-pass', 'auditor-prod-pass']
      .every((k) => fs.existsSync(m(k)));
    if (auditoresOk) process.exit(0);
    if (!fs.existsSync(m('inventario-done'))) process.exit(0);
    const faltamAR = [];
    if (!fs.existsSync(m('auditor-seg-pass'))) faltamAR.push('Caio (auditor-seguranca)');
    if (!fs.existsSync(m('auditor-qual-pass'))) faltamAR.push('Julia (auditor-qualidade)');
    if (!fs.existsSync(m('auditor-prod-pass'))) faltamAR.push('Pedro (auditor-produto)');
    const reason = `[enforce-pipeline-completion] Pipeline /auditoria-reversa aberto sem 3 auditores.\nFalta:\n${faltamAR.map(x => `  - ${x}`).join('\n')}\n\nDelegue ao maestro Modo AR.`;
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    process.exit(0);
  }

  // Modo FT (original): exige checkpoint-done
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

Aborto consciente: o maestro tem ferramenta pra encerrar pipeline com motivo
documentado (Modo FT: "abortar US-NNN, motivo X"). Use isso ao inves de mexer
em markers manualmente — o hook block-destructive bloqueia rm em .claude/.runtime/.`;

  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
})().catch(() => {
  process.exit(0); // Stop hook nao deve falhar duro
});
