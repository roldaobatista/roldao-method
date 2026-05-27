#!/usr/bin/env node
/**
 * test/integration/agent-premissas.test.js — AC-112-4 (US-112).
 *
 * Valida que os 3 agentes que poderiam devolver "pergunta evitavel pro PM"
 * (analista, dba-dados, devops-infra) declaram explicitamente o protocolo:
 * "escrever premissa no frontmatter em vez de devolver pergunta".
 *
 * Property-based (nao chama LLM): valida o doc do agente como fonte de
 * comportamento. Padrao igual ao de evals/agent-behavior/.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(ROOT, 'templates', '.claude', 'agents');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

console.log('test/integration/agent-premissas.test.js — agentes registram premissa em vez de devolver pergunta (AC-112-4)\n');

const agentes = ['analista.md', 'dba-dados.md', 'devops-infra.md'];

for (const arq of agentes) {
  const filepath = path.join(AGENTS_DIR, arq);
  const conteudo = fs.readFileSync(filepath, 'utf8');

  // P1: Doc declara mecanismo anti-pergunta-evitavel — pode ser premissa
  // (quem produz spec), "investiga/assume" (quem consome contexto), ou
  // "escolhe pelo contexto" / "aplica direto" (quem age sobre o repo).
  const temMecanismo = /premissa/i.test(conteudo)
                    || /assume\s+(valores?\s+)?razo[áa]veis?/i.test(conteudo)
                    || /investiga\s+/i.test(conteudo)
                    || /escolhe\s+pelo\s+contexto/i.test(conteudo)
                    || /aplica\s+direto/i.test(conteudo);
  check(
    `${arq}: doc declara mecanismo anti-pergunta-evitavel`,
    temMecanismo,
    `nenhum mecanismo (premissa/assume/investiga/escolhe pelo contexto/aplica direto) presente`,
  );

  // P2: Doc cita INV-AGENT-006 (regra de "executar, nao passar pro usuario")
  check(
    `${arq}: doc cita INV-AGENT-006 (executar, nao perguntar)`,
    /INV-AGENT-006/.test(conteudo),
    `INV-AGENT-006 nao mencionada`,
  );

  // P3: Doc NAO contem frase canonica de bypass ("perguntas pendentes pro PM" / "pergunta padrao de X")
  const temAntipattern = /perguntas?\s+pendentes?\s+(?:pro|para)\s+(?:o\s+)?PM/i.test(conteudo)
                      || /pergunta\s+padr[ãa]o\s+de/i.test(conteudo);
  check(
    `${arq}: doc NAO tem antipattern 'perguntas pendentes pro PM' ou 'pergunta padrao de X'`,
    !temAntipattern,
    `antipattern presente`,
  );
}

// P4: Agente principal (Sofia/gerente-produto) referencia premissas no fluxo
{
  const sofia = fs.readFileSync(path.join(AGENTS_DIR, 'gerente-produto.md'), 'utf8');
  check(
    `gerente-produto.md: menciona 'premissa' no fluxo (consome o que analista produziu)`,
    /premissa/i.test(sofia),
    `gerente-produto nao referencia premissa`,
  );
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
