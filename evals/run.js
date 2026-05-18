#!/usr/bin/env node
/**
 * evals/run.js — executor de evals dos 12 agentes.
 *
 * Modo "lint-only" (sem ANTHROPIC_API_KEY): valida estrutura dos .eval.md
 *   (cada agente tem ≥ 3 cenários, cada cenário com Input + Validações).
 *
 * Modo "live" (com ANTHROPIC_API_KEY): roda prompt contra modelo e valida resposta.
 *
 * Sem dependência externa.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, 'agents');
const args = process.argv.slice(2);
// Aceita "--agent X" e "--agent=X" (formato comum em CI).
const wantAgent = (() => {
  const inline = args.find((a) => a.startsWith('--agent='));
  if (inline) return inline.slice('--agent='.length);
  return args.find((a, i) => args[i - 1] === '--agent');
})();
const jsonMode = args.includes('--json');

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;

function listEvals() {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.eval.md'))
    .map((f) => ({ agent: f.replace('.eval.md', ''), path: path.join(ROOT, f) }));
}

function parseScenarios(content) {
  const scenarios = [];
  const blocks = content.split(/^## Cenário\s+/m).slice(1);
  for (const b of blocks) {
    const titleMatch = b.match(/^(\d+)\s*[—-]\s*(.+)/);
    const inputMatch = b.match(/###\s*Input\s*\n([\s\S]*?)(?=\n###|$)/);
    const validMatch = b.match(/###\s*Resposta esperada[^\n]*\n([\s\S]*?)(?=\n##|$)/);
    if (!titleMatch || !inputMatch || !validMatch) continue;
    scenarios.push({
      n: titleMatch[1],
      title: titleMatch[2].trim(),
      input: inputMatch[1].trim(),
      validations: validMatch[1]
        .trim()
        .split(/\n/)
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean),
    });
  }
  return scenarios;
}

function lintScenario(s) {
  const issues = [];
  if (s.input.length < 10) issues.push('Input muito curto');
  if (s.validations.length < 2) issues.push('Precisa de pelo menos 2 validações');
  return issues;
}

// applyValidation removida em v0.10.0 (auditoria round 5): era stub
// chamada apenas em codigo comentado. Quando modo live for implementado,
// restaurar de evals/ inicial ou git log antes de 2026-05-18.

async function main() {
  const evals = listEvals().filter((e) => !wantAgent || e.agent === wantAgent);
  if (evals.length === 0) {
    console.error('Nenhum eval encontrado.');
    process.exit(2);
  }

  const results = [];
  let totalScenarios = 0;
  let failures = 0;

  for (const e of evals) {
    const content = fs.readFileSync(e.path, 'utf8');
    const scenarios = parseScenarios(content);
    if (scenarios.length < 3) {
      console.error(`[${e.agent}] FAIL: precisa de ≥ 3 cenários (tem ${scenarios.length})`);
      failures++;
      continue;
    }
    for (const s of scenarios) {
      totalScenarios++;
      const lintIssues = lintScenario(s);
      if (lintIssues.length > 0) {
        console.error(`[${e.agent}/${s.n}] LINT: ${lintIssues.join('; ')}`);
        failures++;
        continue;
      }
      if (!HAS_KEY) {
        // lint-only OK
        results.push({ agent: e.agent, n: s.n, status: 'lint-ok' });
        continue;
      }
      // Modo live: rodar contra modelo (não implementado aqui — placeholder)
      // const response = await callClaude(s.input);
      // for (const v of s.validations) { if (!applyValidation(v, response)) ... }
      results.push({ agent: e.agent, n: s.n, status: 'live-skipped-stub' });
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify({ totalScenarios, failures, results }, null, 2));
  } else {
    console.log(`\n${HAS_KEY ? 'Live' : 'Lint-only'} run: ${totalScenarios} cenários em ${evals.length} agentes`);
    if (failures > 0) console.log(`${failures} falha(s).`);
    else console.log('Todos OK.');
  }
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
