#!/usr/bin/env node
/**
 * test/hooks-audit-sha-story.test.js — testa que validate-story-approvals.js
 * exige campo audit_sha nas 4 etapas que auditam diff (revisor + 3 auditores)
 * quando status: aprovado.
 *
 * Decomposicao: PRD-003 → US-111 → T-025 (J10).
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK = path.join(ROOT, 'templates', '.claude', 'hooks', 'validate-story-approvals.js');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

const SHA_VALIDO = 'a'.repeat(64);

function run(content) {
  const input = JSON.stringify({
    tool_input: {
      file_path: '/tmp/docs/stories/US-200-teste.md',
      content,
    },
  });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

// Helper: gera frontmatter completo com aprovacoes parametrizadas.
function story(opts = {}) {
  const sha = (etapa) => opts.shas?.[etapa] !== undefined ? opts.shas[etapa] : SHA_VALIDO;
  const linhaSha = (etapa) => opts.shas?.[etapa] === null ? '' : `\n    audit_sha: ${sha(etapa)}`;
  return `---
id: US-200
status: entregue
prd: PRD-003
epico: EP-002
owner: roldao
revisado-em: 2026-05-24
aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: 2026-05-24
    status: aprovado
  - etapa: investigador
    agente: Detetive
    data: 2026-05-24
    status: aprovado
  - etapa: tech-lead
    agente: Rafael
    data: 2026-05-24
    status: ${opts.techLeadStatus || 'aprovado'}
  - etapa: dev-senior
    agente: Bruno
    data: 2026-05-24
    status: aprovado
  - etapa: revisor
    agente: Ines
    data: 2026-05-24
    status: aprovado${linhaSha('revisor')}
  - etapa: auditor-seguranca
    agente: Caio
    data: 2026-05-24
    status: aprovado${linhaSha('auditor-seguranca')}
  - etapa: auditor-qualidade
    agente: Julia
    data: 2026-05-24
    status: aprovado${linhaSha('auditor-qualidade')}
  - etapa: auditor-produto
    agente: Pedro
    data: 2026-05-24
    status: aprovado${linhaSha('auditor-produto')}
---

# US-200

Story teste.
`;
}

console.log('\nhooks-audit-sha-story: aprovacoes exigem audit_sha (T-025 / J10)\n');

// Cenario 1: todos os 4 com audit_sha valido → pass
{
  const r = run(story());
  check('cenario 1: 4 etapas com audit_sha hex valido → exit 0',
    r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 200)}`);
}

// Cenario 2: revisor sem audit_sha → block
{
  const r = run(story({ shas: { revisor: null } }));
  check('cenario 2a: revisor sem audit_sha → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 2b: stderr menciona "revisor"', /revisor/.test(r.stderr), `stderr: ${r.stderr.slice(0, 300)}`);
  check('cenario 2c: stderr menciona "audit_sha"', /audit_sha/.test(r.stderr), `stderr: ${r.stderr.slice(0, 300)}`);
}

// Cenario 3: auditor-seguranca com audit_sha invalido (nao hex 64) → block
{
  const r = run(story({ shas: { 'auditor-seguranca': 'sha-invalido' } }));
  check('cenario 3a: audit_sha mal formado → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('cenario 3b: stderr menciona "sha256 hex"', /sha256 hex/.test(r.stderr), `stderr: ${r.stderr.slice(0, 300)}`);
}

// Cenario 4: 3 auditores sem audit_sha → block listando todos
{
  const r = run(story({ shas: { 'auditor-seguranca': null, 'auditor-qualidade': null, 'auditor-produto': null } }));
  check('cenario 4a: 3 auditores sem audit_sha → exit 2', r.exit === 2);
  check('cenario 4b: stderr lista auditor-seguranca',
    /auditor-seguranca.*audit_sha/.test(r.stderr), `stderr: ${r.stderr.slice(0, 400)}`);
  check('cenario 4c: stderr lista auditor-qualidade',
    /auditor-qualidade.*audit_sha/.test(r.stderr), `stderr: ${r.stderr.slice(0, 400)}`);
  check('cenario 4d: stderr lista auditor-produto',
    /auditor-produto.*audit_sha/.test(r.stderr), `stderr: ${r.stderr.slice(0, 400)}`);
}

// Cenario 5: tech-lead "dispensado" nao precisa de audit_sha (so etapas que auditam diff)
{
  const c = story({ techLeadStatus: 'dispensado' });
  const r = run(c);
  check('cenario 5: tech-lead dispensado + outros OK → exit 0', r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 200)}`);
}

// Cenario 6: revisor com status diferente de "aprovado" nao exige audit_sha
{
  const c = story().replace(
    /- etapa: revisor[\s\S]*?audit_sha: [a-f0-9]+/m,
    `- etapa: revisor
    agente: Ines
    data: 2026-05-24
    status: dispensado`
  );
  // Mas se revisor dispensado, story tem outros em aprovado — deve passar
  const r = run(c);
  check('cenario 6: revisor dispensado (sem sha) + outros OK → exit 0',
    r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 200)}`);
}

// Cenario 7 (regressao): status diferente de "entregue" nao dispara hook
{
  const c = story().replace(/^status:\s*entregue\b/m, 'status: draft');
  const r = run(c);
  check('cenario 7: status:draft → exit 0 (hook nao dispara)', r.exit === 0, `exit=${r.exit}`);
}

// Cenario 8 (regressao): arquivo fora de docs/stories/ nao dispara
{
  const input = JSON.stringify({
    tool_input: { file_path: '/tmp/outro/arquivo.md', content: story() },
  });
  const r = spawnSync('node', [HOOK], { input, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  check('cenario 8: arquivo fora de docs/stories/ → exit 0', r.status === 0, `exit=${r.status}`);
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
