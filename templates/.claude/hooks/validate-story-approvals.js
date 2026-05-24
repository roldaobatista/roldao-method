#!/usr/bin/env node
// validate-story-approvals.js — bloqueia mudar `status: entregue` numa story
// sem audit trail completo no bloco `aprovacoes:` do frontmatter.
// Hook PreToolUse, matcher: Write|Edit.

const { readStdinJson, recordMetric } = require('./_lib.js');

const STORY_PATH_RE = /docs\/stories\/US-.*\.md$/;
const REQUIRED = [
  'gerente-produto',
  'investigador',
  'dev-senior',
  'revisor',
  'auditor-seguranca',
  'auditor-qualidade',
  'auditor-produto',
];

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!filePath) process.exit(0);
  if (!content) process.exit(0);
  if (!STORY_PATH_RE.test(filePath)) process.exit(0);
  if (!/^status:\s*entregue\b/m.test(content)) process.exit(0);

  const missing = [];
  for (const etapa of REQUIRED) {
    const re = new RegExp(`^\\s*-\\s*etapa:\\s*${etapa}\\b`, 'm');
    if (!re.test(content)) missing.push(etapa);
  }
  // Tech-lead opcional mas precisa aparecer
  if (!/^\s*-\s*etapa:\s*tech-lead\b/m.test(content)) {
    missing.push("tech-lead (pode ser 'dispensado' para features triviais)");
  }

  // Conta aprovacoes reprovadas/bloqueadas
  const hasBlock = (content.match(/^\s*status:\s*(reprovado|bloqueado)\s*$/gm) || []).length;

  if (missing.length === 0 && hasBlock === 0) process.exit(0);

  const usMatch = content.match(/^id:\s*(US-\d+)/m);
  const usId = usMatch ? usMatch[1] : '(nao identificada)';

  process.stderr.write(`[validate-story-approvals] BLOQUEADO: tentativa de marcar story como\n`);
  process.stderr.write(`'status: entregue' sem audit trail completo no bloco \`aprovacoes:\`.\n\n`);
  process.stderr.write(`Story: ${usId}\nArquivo: ${filePath}\n\n`);

  if (missing.length > 0) {
    process.stderr.write(`Etapas FALTANDO no bloco aprovacoes:\n`);
    for (const e of missing) process.stderr.write(`  ✗ ${e}\n`);
    process.stderr.write(`\n`);
  }

  if (hasBlock > 0) {
    process.stderr.write(`Existem aprovacoes com status 'reprovado' ou 'bloqueado'. Resolva (corrigir\n`);
    process.stderr.write(`no codigo + re-rodar etapa correspondente do /feature + atualizar a entrada\n`);
    process.stderr.write(`para status: aprovado) antes de marcar entregue.\n\n`);
  }

  process.stderr.write(`Formato esperado no frontmatter:\n\n`);
  process.stderr.write(`aprovacoes:\n`);
  process.stderr.write(`  - etapa: gerente-produto\n`);
  process.stderr.write(`    agente: Sofia\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`    notas: "AC testaveis, non-goals OK"\n`);
  process.stderr.write(`  - etapa: investigador\n`);
  process.stderr.write(`    agente: Detetive\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`  - etapa: tech-lead          # ou status: dispensado se trivial\n`);
  process.stderr.write(`    agente: Rafael\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`  - etapa: dev-senior\n`);
  process.stderr.write(`    agente: Bruno\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`  - etapa: revisor\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`  - etapa: auditor-seguranca\n`);
  process.stderr.write(`    agente: Caio\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`  - etapa: auditor-qualidade\n`);
  process.stderr.write(`    agente: Julia\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n`);
  process.stderr.write(`  - etapa: auditor-produto\n`);
  process.stderr.write(`    agente: Pedro\n`);
  process.stderr.write(`    data: AAAA-MM-DD\n`);
  process.stderr.write(`    status: aprovado\n\n`);
  process.stderr.write(`Sem audit trail completo, nao ha como auditar 6 meses depois quem decidiu\n`);
  process.stderr.write(`o que. Marcador efemero em .runtime/ nao serve — limpo ao fim da sessao.\n\n`);
  process.stderr.write(`Aplica regras: INV-001 (documento e estado compartilhado), INV-AGENT-006.\n`);
  recordMetric('block', 'validate-story-approvals', `${usId}: missing=${missing.length} blocked=${hasBlock}`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[validate-story-approvals] erro interno: ${err.message}\n`);
  process.exit(2);
});
