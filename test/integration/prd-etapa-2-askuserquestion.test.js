#!/usr/bin/env node
/**
 * test/integration/prd-etapa-2-askuserquestion.test.js — AC-112-5 (US-112).
 *
 * Valida que `/prd` etapa 2 dispara `AskUserQuestion` automaticamente a
 * partir das premissas listadas pelo analista, NAO obriga o Roldao a abrir
 * arquivo de brief.
 *
 * Property-based (nao chama LLM): valida o doc do command como fonte de
 * comportamento.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PRD_CMD = path.join(ROOT, 'templates', '.claude', 'commands', 'prd.md');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

console.log('test/integration/prd-etapa-2-askuserquestion.test.js — /prd dispara AskUserQuestion na etapa 2 (AC-112-5)\n');

const conteudo = fs.readFileSync(PRD_CMD, 'utf8');

// P1: doc do /prd referencia AskUserQuestion explicitamente
check(
  `/prd menciona AskUserQuestion no fluxo`,
  /AskUserQuestion/.test(conteudo),
  `AskUserQuestion nao mencionada em prd.md`,
);

// P2: doc descreve protocolo "premissas viram AskUserQuestion automatico"
// (cobertura de T-107 K7 — citacao explicita do mecanismo)
check(
  `/prd descreve premissas -> AskUserQuestion automatico (T-107 K7)`,
  /premissas?.*AskUserQuestion|AskUserQuestion.*premissa/is.test(conteudo),
  `mecanismo premissa->AskUserQuestion nao documentado`,
);

// P3: doc explicita que NAO pergunta texto livre — sempre opcoes pre-formuladas
check(
  `/prd proibe pergunta texto livre — exige opcoes pre-formuladas`,
  /opcoes\s+pre[- ]formuladas|nunca\s+perguntar\s+texto\s+livre/i.test(conteudo),
  `nao explicita restricao "sempre opcoes pre-formuladas"`,
);

// P4: doc cita INV-AGENT-006 (executar, nao perguntar — base do protocolo)
check(
  `/prd cita INV-AGENT-006 no contexto da etapa de premissas`,
  /INV-AGENT-006/.test(conteudo),
  `INV-AGENT-006 nao mencionada`,
);

// P5: doc tem mecanismo de fallback (assume default + marca no PRD) quando nao pergunta
check(
  `/prd tem fallback: assume default + grava no PRD quando nao pergunta`,
  /assume\s+default|premissa-resolvida/i.test(conteudo),
  `mecanismo de fallback nao documentado`,
);

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
