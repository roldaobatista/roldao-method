#!/usr/bin/env node
// block-confirmation-questions.js — bloqueia "quer que eu...?" / "posso X?".
// Hook PostToolUse / Stop. JSON decision:block. INV-AGENT-006.

const { readStdinJson, recordMetric } = require('./_lib.js');

const PATTERNS = [
  /\bquer (que eu|q eu)\b/i,
  /\bposso (fazer|criar|gerar|continuar|seguir|aplicar|adicionar|remover|implementar|prosseguir|avancar|avan[cç]ar|encerrar|finalizar|parar|editar|refatorar|mexer|ajustar|mudar|atualizar|deletar|apagar|rodar|executar)\b/i,
  /\bdevo (continuar|seguir|fazer|criar|aplicar|prosseguir|avancar|avan[cç]ar|encerrar|finalizar|parar|implementar|mexer|ajustar)\b/i,
  /\b(voce|voc[eê]) prefere\b.*\b(ou|\/)\b/i,
  /\bqual (voce|voc[eê]) (prefere|quer|acha|gostaria)\b/i,
  /\bse (voce|voc[eê]) (quiser|preferir|desejar|achar melhor)\b/i,
  /\bse desejar\b/i,
  /\b(gostaria|deseja|desejaria|gostarias) que eu\b/i,
  /\b(quer|deseja|gostaria|prefere) que eu (faca|fa[cç]a|continue|prossiga|implemente|crie|aplique)\b/i,
  /\b(deixa|deixo|posso deixar) eu\b/i,
  /\b(continuo|prossigo|avan[cç]o|sigo|encerro|paro|fa[cç]o) (ou|e) (paro|aguardo|espero|fico|deixo|volto)\b/i,
  /\bte (pergunto|consulto)\b/i,
  /\baguardo (sua|seu) (confirma[cç][aã]o|resposta|aval|ok|sinal)\b/i,
  /\bshould I (continue|proceed|create|make|apply|generate|add|remove)\b/i,
  /\bdo you want me to\b/i,
  /\bwould you like me to\b/i,
];

const LEGIT_RE = /\bnpm publish\b|\bdrop (table|database)\b|\bgit push --force\b|\brm -rf\b|\breset --hard\b|\brotacion(ar|ado) credencial|\bdeletar (producao|prod|dados)\b|\bcobrar\b|\bgastar\b|\bpagar\b|\bcredencial\b|\bgastos com terceiros\b/i;

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

  const lines = resp.split(/\r?\n/);
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let hitPat = null;
    for (const pat of PATTERNS) {
      if (pat.test(line)) { hitPat = pat; break; }
    }
    if (!hitPat) continue;
    // Excecao: legit em qualquer das 4 linhas (3 anteriores + atual)
    const ctxStart = Math.max(0, i - 3);
    const ctx = lines.slice(ctxStart, i + 1).join('\n');
    if (LEGIT_RE.test(ctx)) continue;
    const hitMatch = line.match(hitPat);
    const hit = hitMatch ? hitMatch[0] : '';
    violations.push(`pergunta de confirmacao: '${hit}' -> ${line}`);
  }

  if (violations.length === 0) process.exit(0);

  const MAX = 3;
  const violationsStr = violations.slice(0, MAX).map((v) => `  - ${v}`).join('\n');
  let extra = '';
  if (violations.length > MAX) extra = `  (... e mais ${violations.length - MAX} ocorrencia(s))`;

  // stderr humano
  process.stderr.write(`[block-confirmation-questions] resposta empurrou decisao pro usuario (INV-AGENT-006).\n\n`);
  process.stderr.write(`O usuario nao programa. Pergunta como "quer que eu...?" / "posso X?" / "devo continuar?"\n`);
  process.stderr.write(`quebra o fluxo. Voce tem a ferramenta — execute o melhor caminho e reporte depois.\n\n`);
  process.stderr.write(`Violacoes (limite ${MAX}):\n${violationsStr}\n${extra}\n\n`);
  process.stderr.write(`Como corrigir: refaca a resposta executando direto. Se for operacao destrutiva\n`);
  process.stderr.write(`(rm -rf, push --force, drop table, npm publish, gasto financeiro, credencial),\n`);
  process.stderr.write(`cite isso EXPLICITAMENTE na mesma linha da pergunta.\n`);

  recordMetric('block', 'block-confirmation-questions', violations[0]);
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'Resposta contem pergunta de confirmacao que poderia ser executada direto (INV-AGENT-006). Execute e reporte depois.',
  }));
  process.exit(0);
})().catch(() => process.exit(0));
