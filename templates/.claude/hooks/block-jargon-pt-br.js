#!/usr/bin/env node
// block-jargon-pt-br.js — bloqueia resposta com jargao tecnico ao usuario nao-programador.
// Hook PostToolUse / Stop. JSON decision:block. INV-AGENT-001.

const { readStdinJson, recordMetric } = require('./_lib.js');

// Termos jargao (concatenados pra evitar trigger do proprio scanner em string-literal).
const JARGON_TERMS = [
  '\\bcommit(s|ar|ed|ado|ei|ou)?\\b',
  '\\bbranch(es|ar|ado)?\\b',
  '\\bpush(es|ar|ado|ei|ou)?\\b',
  '\\bpull(s|ed|ar|ado|ei|ou)?\\b',
  '\\bmerge(s|ar|ado|ei|ou|ado)?\\b',
  '\\brebase(s|ar|ado|ei|ou)?\\b',
  '\\bdeploy(s|ar|ado|ei|ou)?\\b',
  '\\brollback(s|ar|ado)?\\b',
  '\\brevert(s|er|ido|i|eu)?\\b',
  '\\bendpoint(s)?\\b',
  '\\brefactor(s|ar|ado|ei|ou)?\\b',
  '\\blint(s|ar|ado)?\\b',
  '\\bbuild(s|ar|ado)?\\b',
  '\\bCI\\b', '\\bPR\\b', '\\bMR\\b',
  '\\brepo(s)?\\b', '\\brepository(\\b|ies)',
  '\\bcheckout(s|ar|ado)?\\b', '\\bstash(es|ar|ado)?\\b',
  '\\bcherry-pick(s|ed|ar|ado)?\\b', '\\bbisect(s|ar|ado)?\\b',
];
const COMBINED_RE = new RegExp(JARGON_TERMS.join('|'), 'gi');

(async () => {
  const input = await readStdinJson();
  let resp = input?.response || input?.message || '';
  if (!resp && input?.tool_response) {
    if (typeof input.tool_response === 'object') {
      resp = input.tool_response.content || input.tool_response.text || '';
    } else {
      resp = input.tool_response;
    }
  }
  resp = typeof resp === 'string' ? resp : '';
  if (!resp) process.exit(0);

  // Remove blocos de codigo (markdown ``` ... ``` + inline `...`)
  const clean = resp
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');

  const violations = [];
  const matches = clean.match(COMBINED_RE) || [];
  for (const m of matches.slice(0, 10)) {
    // Pega linha que contem o termo
    const lineRe = new RegExp(`.*${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'i');
    const ctxMatch = clean.match(lineRe);
    const ctx = ctxMatch ? ctxMatch[0] : m;
    // Ignora se linha tem parenteses explicativos ou aspas com termo PT
    if (/\(.{0,80}(salv|enviei|atualiz|servidor|cliente|sistema|arquivo|versao|configura).{0,80}\)/i.test(ctx)) continue;
    if (/"[^"]{3,40}"/.test(ctx)) continue;
    if (/\bou seja\b|\bsignific|isso e|isto e|i\.e\.|ex:/i.test(ctx)) continue;
    // Auditoria 10-agentes 2026-05-24: ignora linha que esta DISCUTINDO o
    // proprio hook (tech-writer/auditores explicando o bloqueio). Sem isso,
    // qualquer resposta que cite o hook ou a regra INV-AGENT-001 se auto-bloqueia.
    if (/block-jargon-pt-br|INV-AGENT-001|hook que bloqueia jarg|tabela de jarg|tabela de traducao|tabela de tradu/i.test(ctx)) continue;
    violations.push(`jargao sem traducao: '${m}' em -> ${ctx}`);
  }

  if (violations.length === 0) process.exit(0);

  const violationsStr = violations.map((v) => `  - ${v}`).join('\n');
  const reasonText = `[block-jargon-pt-br] resposta usa jargao tecnico sem traduzir (INV-AGENT-001).

Usuario nao-programador. Reescrever em PT-BR claro.

Violacoes:
${violationsStr}

Tabela de traducao:
  - commit/push -> 'salvei a correcao no sistema'
  - CI verde -> 'esta funcionando, validei'
  - rollback -> 'voltar pra versao anterior'
  - deploy -> 'subir pro servidor'
  - refactor -> 'reorganizar (sem mudar o que aparece pro usuario)'
  - migration -> 'mudanca na estrutura dos dados salvos'
  - mock/fixture -> 'dados falsos pros testes'

Excecao: se o usuario E programador (declarado em AGENTS.md), peca pra ajustar a regra.`;

  recordMetric('jargao', 'block-jargon-pt-br', violations[0]);
  process.stdout.write(JSON.stringify({ decision: 'block', reason: reasonText }));
  process.exit(0);
})().catch(() => process.exit(0));
