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

// T-025 (J10): etapas que precisam de audit_sha (auditam diff especifico).
// Etapas que escrevem code/spec mas nao auditam diff ficam fora:
// gerente-produto, investigador (tem investigation-*.json), tech-lead, dev-senior.
const REQUIRE_AUDIT_SHA = ['revisor', 'auditor-seguranca', 'auditor-qualidade', 'auditor-produto'];
const SHA256_HEX_RE = /^[a-f0-9]{64}$/i;

// Extrai bloco YAML de uma etapa especifica do frontmatter de story.
// Retorna o texto entre "- etapa: <name>" e o proximo "- etapa:" (ou fim do frontmatter).
function extractEtapaBlock(content, etapa) {
  const re = new RegExp(
    `^\\s*-\\s*etapa:\\s*${etapa}\\b[\\s\\S]*?(?=^\\s*-\\s*etapa:|^---$)`,
    'm'
  );
  const m = content.match(re);
  return m ? m[0] : '';
}

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

  // T-025 (J10): valida audit_sha nas etapas que auditam diff.
  // Aceita `status: aprovado` E variantes com sufixo (`aprovado-retroativo`,
  // `aprovado-com-ressalva`) — todas exigem audit_sha porque sao "aprovado" em
  // alguma forma. Antes do fix da auditoria 10-agentes, a regex era strict e
  // 7 stories com "aprovado-retroativo" escapavam o gate (audit_sha fantasma).
  const missingSha = []; // {etapa, motivo}
  const APROVADO_RE = /^\s*status:\s*aprovado(-[a-z-]+)?\s*$/im;
  for (const etapa of REQUIRE_AUDIT_SHA) {
    const block = extractEtapaBlock(content, etapa);
    if (!block) continue; // ja flagrado em REQUIRED se faltar
    if (!APROVADO_RE.test(block)) continue;
    const shaMatch = block.match(/^\s*audit_sha:\s*([a-f0-9]+)\s*$/im);
    if (!shaMatch) {
      missingSha.push({ etapa, motivo: 'campo "audit_sha" ausente' });
    } else if (!SHA256_HEX_RE.test(shaMatch[1])) {
      missingSha.push({ etapa, motivo: `"audit_sha" nao e sha256 hex valido (got=${shaMatch[1].slice(0, 16)}...)` });
    }
  }

  // Conta aprovacoes reprovadas/bloqueadas
  const hasBlock = (content.match(/^\s*status:\s*(reprovado|bloqueado)\s*$/gm) || []).length;

  if (missing.length === 0 && hasBlock === 0 && missingSha.length === 0) process.exit(0);

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

  if (missingSha.length > 0) {
    process.stderr.write(`Aprovacoes que auditaram diff mas NAO declararam audit_sha (T-025 / J10):\n`);
    for (const { etapa, motivo } of missingSha) {
      process.stderr.write(`  ✗ ${etapa} — ${motivo}\n`);
    }
    process.stderr.write(`\nEtapas que auditam diff (revisor + 3 auditores) precisam declarar o sha256\n`);
    process.stderr.write(`do diff que aprovaram. Sem isso, nao da pra cruzar 'auditor disse APROVADO'\n`);
    process.stderr.write(`com 'diff que esta no commit'. ADR-020 (mesma logica dos pass markers).\n\n`);
    process.stderr.write(`Formato:\n`);
    process.stderr.write(`  - etapa: revisor\n`);
    process.stderr.write(`    agente: Ines\n`);
    process.stderr.write(`    data: 2026-MM-DD\n`);
    process.stderr.write(`    status: aprovado\n`);
    process.stderr.write(`    audit_sha: <sha256 hex de 64 chars do diff lido>\n\n`);
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
