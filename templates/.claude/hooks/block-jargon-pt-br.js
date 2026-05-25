#!/usr/bin/env node
// block-jargon-pt-br.js — bloqueia resposta com jargao tecnico ao usuario nao-programador.
// Hook PostToolUse / Stop. JSON decision:block. INV-AGENT-001.

const { readStdinJson, recordMetric } = require('./_lib.js');

// Termos jargao (concatenados pra evitar trigger do proprio scanner em string-literal).
// T-009 (F1) — sincronizado com tabela canonica de traduzir-jargao/SKILL.md.
const JARGON_TERMS = [
  // Git/workflow
  '\\bcommit(s|ar|ed|ado|ei|ou)?\\b',
  '\\bbranch(es|ar|ado)?\\b',
  '\\bpush(es|ar|ado|ei|ou)?\\b',
  '\\bpull(s|ed|ar|ado|ei|ou)?\\b',
  '\\bmerge(s|ar|ado|ei|ou|ado)?\\b',
  '\\brebase(s|ar|ado|ei|ou)?\\b',
  '\\brevert(s|er|ido|i|eu)?\\b',
  '\\bcheckout(s|ar|ado)?\\b', '\\bstash(es|ar|ado)?\\b',
  '\\bcherry-pick(s|ed|ar|ado)?\\b', '\\bbisect(s|ar|ado)?\\b',
  '\\bamend(s|ar|ado)?\\b',
  '\\bdiff(s)?\\b',
  // CI/deploy
  '\\bdeploy(s|ar|ado|ei|ou)?\\b',
  '\\brollback(s|ar|ado)?\\b',
  '\\bbuild(s|ar|ado)?\\b',
  '\\blint(s|ar|ado)?\\b',
  '\\bCI\\b', '\\bPR\\b', '\\bMR\\b',
  '\\bhotfix(es)?\\b',
  '\\bpipeline(s)?\\b',
  // Arquitetura
  '\\bendpoint(s)?\\b',
  '\\brefactor(s|ar|ado|ei|ou)?\\b',
  '\\brepo(s)?\\b', '\\brepository(\\b|ies)',
  '\\bbackend\\b', '\\bfrontend\\b',
  '\\bwebhook(s)?\\b',
  '\\bpayload(s)?\\b',
  '\\bcache(s|ar|ado)?\\b',
  // T-009 — testes / dados
  '\\bmock(s|ar|ado|ei|ou)?\\b',
  '\\bfixture(s)?\\b',
  '\\bmigration(s)?\\b',
  // T-009 — debug
  'stack trace(s)?',
  '\\bnull pointer\\b',
  '\\brace condition(s)?\\b',
  // T-308 (K8): termos adicionais flagrados em auditoria de coerencia PT-BR
  '\\bedge case(s)?\\b',
  '\\brunbook(s)?\\b',
  '\\bbreakpoint(s)?\\b',
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
    // 2ª passada (mesma data): "tabela de tradu" era largo demais (casava
    // qualquer doc LGPD/fiscal mencionando "tabela de tradução"). Estreitamos
    // pra exigir contexto explicito de jargao/tecnico.
    if (/block-jargon-pt-br|INV-AGENT-001|hook que bloqueia jarg|tabela de jarg/i.test(ctx)) continue;
    if (/tabela de tradu[cç][aã]o[^.]{0,80}(jarg|tecnic|t[eé]cnic)/i.test(ctx)) continue;
    // Auditoria 10-agentes pos-correcao: contexto de CHANGELOG/release/checkpoint/postmortem
    // sao docs tecnicos onde os termos sao descritivos (estao narrando o que mudou).
    if (/^#{1,4}\s*(Adicionado|Mudado|Corrigido|Removido|Preservado|Deprecado|Seguranca)\b/i.test(ctx)) continue;
    if (/CHANGELOG\.md|docs\/releases\/|docs\/checkpoints\/|docs\/postmortems\//i.test(ctx)) continue;
    // Doc tecnico citando ID rastreavel (ADR-NN, US-NN, EP-NN, PRD-NN, T-NN).
    if (/\b(ADR|US|EP|PRD|T)-\d+/i.test(ctx)) continue;
    // Auditoria 10-agentes 2026-05-25: contextos PT comuns onde "branch" e "deploy"
    // sao usados em sentido coloquial (nao "branch git" / "deploy CI"). Evita falso
    // positivo em frases como "branch da empresa" ou "deploy em sentido figurado".
    if (/\bbranch(es|ar|ado)?\s+(da|do|de|para|pra)\s+(empresa|escrit[oó]rio|filial|loja|unidade)\b/i.test(ctx)) continue;
    violations.push(`jargao sem traducao: '${m}' em -> ${ctx}`);
  }

  if (violations.length === 0) process.exit(0);

  const violationsStr = violations.map((v) => `  - ${v}`).join('\n');
  const reasonText = `[block-jargon-pt-br] resposta usa jargao tecnico sem traduzir (INV-AGENT-001).

Usuario nao-programador. Reescrever em PT-BR claro.

Violacoes:
${violationsStr}

Tabela de traducao (sincronizada com skill traduzir-jargao):
  - commit/push -> 'salvei a correcao no sistema'
  - CI verde -> 'esta funcionando, validei'
  - rollback/revert -> 'voltar pra versao anterior'
  - deploy -> 'subir pro servidor'
  - refactor -> 'reorganizar (sem mudar o que aparece pro usuario)'
  - migration -> 'mudanca na estrutura dos dados salvos'
  - mock/fixture -> 'dados falsos pros testes'
  - backend -> 'parte que roda no servidor'
  - frontend -> 'parte que aparece pro cliente'
  - webhook -> 'aviso automatico que o sistema externo manda'
  - cache -> 'memoria rapida pra nao recalcular'
  - payload -> 'pacote de dados enviado/recebido'
  - hotfix -> 'correcao urgente'
  - pipeline -> 'sequencia automatica de validacoes'
  - stack trace -> 'trilha do erro tecnico'
  - amend -> 'reescrever a ultima gravacao'
  - diff -> 'comparacao entre versoes'
  - null pointer -> 'tentou usar uma coisa que nao existe'
  - race condition -> 'duas coisas acontecendo ao mesmo tempo e atrapalhando'
  - edge case -> 'caso fora do comum'
  - runbook -> 'passo a passo de plantao'
  - breakpoint -> 'parar o codigo pra investigar'
  - branch -> 'ramo de trabalho separado'
  - rebase -> 'reordenei as gravacoes'

Excecao: se o usuario E programador (declarado em AGENTS.md), peca pra ajustar a regra
em .claude/settings.json (desligar este hook ou adicionar 'developer-mode: true').`;

  recordMetric('jargao', 'block-jargon-pt-br', violations[0]);
  process.stdout.write(JSON.stringify({ decision: 'block', reason: reasonText }));
  process.exit(0);
})().catch(() => process.exit(0));
