#!/usr/bin/env node
// regra-zero-reminder.js — injeta lembrete da REGRA #0 quando o prompt menciona bug.
// Hook UserPromptSubmit. Soft warning — exit 0 sempre.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, safeRuntimeDir } = require('./_lib.js');

// Gatilhos: termos fortes de bug (bug, erro, problema, travou, quebrou, "nao funciona")
// disparam por si só. Gatilhos fracos (deveria, esperava, estranho) precisam de
// contexto adicional pra evitar falso positivo em pedido de feature/refactor.
// Antes (auditoria 10-agentes): "implementar X que deveria validar Y" disparava o reminder
// e armava bug-trigger, bloqueando dev-senior no meio de /feature legítimo.
const TRIGGERS_FORTES = /\b(bug|erro|problema|n[aã]o\s+funciona|n[aã]o\s+sai|n[aã]o\s+aparece|n[aã]o\s+salva|tela\s+errada|c[aá]lculo\s+errado|valor\s+errado|travou|quebrou|crash(ou|ando)?|exception|stack\s*trace|reportou\s+que|cliente\s+disse|comportamento\s+errado)\b/i;
const TRIGGERS_FRACOS = /\b(deveria|esperava|estranho|inesperad[oa]|comportamento\s+(errad|estranh))\b/i;
// Contexto adicional pra trigger fraco virar bug-trigger: alguma evidencia de produção/usuário/dados reais.
const CTX_BUG = /\b(produc[aã]o|prod\b|usu[aá]ri[oa]|cliente|banco|log|payload|console|tela|formul[aá]rio|relat[oó]rio|emiss[aã]o|exporta[cç][aã]o|impress[aã]o|reporto?u)\b/i;

function isBugPrompt(text) {
  if (TRIGGERS_FORTES.test(text)) return true;
  if (TRIGGERS_FRACOS.test(text) && CTX_BUG.test(text)) return true;
  return false;
}

const REMINDER = `
[ROLDAO-METHOD — REGRA #0 ativada]

O prompt parece descrever um bug/comportamento errado. Antes de propor solução:

1. NÃO mexa no código ainda.
2. Leia o ESTADO REAL: banco (SELECT direto), logs, payload, console, config.
3. Rastreie o fluxo: onde o dado é gerado, salvo, lido. Há caminhos duplicados?
4. Se houver ambiguidade no relato, PERGUNTE antes de implementar (use AskUserQuestion).
5. Só então corrija — no ponto RAIZ, não no sintoma.

Considere rodar o agente \`investigador\` (Detetive 🔬) antes de qualquer Edit/Write.
O hook \`require-investigador-before-fix\` foi armado e vai bloquear edits em código
de negócio até o investigador rodar.

Aplica regras: INV-006, INV-AGENT-002.
`;

(async () => {
  const input = await readStdinJson();
  const prompt = input?.prompt || '';
  if (!prompt) process.exit(0);
  if (!isBugPrompt(prompt)) process.exit(0);

  let projdir;
  try {
    projdir = sanitizeProjdir();
    const sess = sanitizeSessionHash(undefined, projdir);
    const runtime = safeRuntimeDir(projdir);
    try { fs.writeFileSync(path.join(runtime, `bug-trigger-${sess}`), ''); } catch {}
  } catch {
    process.stderr.write(`[regra-zero-reminder] aviso: PROJDIR invalido — lembrete injetado, mas o marker bug-trigger NAO foi criado. require-investigador-before-fix pode nao armar nesta sessao.\n`);
  }

  process.stdout.write(REMINDER);
  process.exit(0);
})().catch(() => process.exit(0));
