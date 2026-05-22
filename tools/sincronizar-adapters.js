#!/usr/bin/env node
/**
 * tools/sincronizar-adapters.js
 *
 * Auditor de paridade entre os 8 adapters multi-IDE e a fonte canonica
 * (CLAUDE.md + AGENTS.md + REGRAS-INEGOCIAVEIS.md + roldao-method.md).
 *
 * Diferenca em relacao a tools/validar-templates.js e test/adapters.test.js:
 * - validar-templates: detecta drift binario (cita REGRA #0? sim/nao).
 * - test/adapters: roda no `npm test` com checks duros.
 * - sincronizar-adapters: relatorio QUALITATIVO. Pra cada adapter, mostra
 *   QUAIS topicos canonicos estao presentes ou ausentes, e gera template de
 *   secao faltante pra o mantenedor colar (adapter e texto livre, nao da pra
 *   regenerar automaticamente sem perder voz por adapter).
 *
 * Uso:
 *   node tools/sincronizar-adapters.js              # relatorio completo
 *   node tools/sincronizar-adapters.js --quiet      # so divergencias
 *   node tools/sincronizar-adapters.js --adapter=cursor   # so um
 *
 * Exit 0 sempre — esta ferramenta e diagnostico, nao gate. Pra gate use
 * `npm test` (roda test/adapters.test.js).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const T = path.join(ROOT, 'templates');

// Argumentos CLI
const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const ONLY = (args.find((a) => a.startsWith('--adapter=')) || '').split('=')[1] || null;

// Topicos canonicos: cada um deve aparecer em TODOS os adapters derivados.
// Lista mantida em sincronia com test/adapters.test.js (checks duros do CI).
const TOPICS_CANONICOS = [
  {
    id: 'regra-zero',
    nome: 'REGRA #0 — investigar antes de mexer',
    regex: /regra\s*#?\s*0|investig(ar|ador)\s+antes/i,
    sugestao: [
      '## REGRA #0 — Investigar antes de mexer em lógica de negócio',
      '',
      'Bug reportado pelo usuário (PDF errado, cálculo errado, tela diferente do esperado):',
      '1. NÃO mexer no código antes de entender a causa.',
      '2. Ler o estado real: banco, logs, payload, console.',
      '3. Rastrear o fluxo: origem → persistência → leitura.',
      '4. Confirmar entendimento se houver ambiguidade.',
      '5. Só então implementar — no ponto raiz, não no sintoma.',
    ].join('\n'),
  },
  {
    id: 'sequencia',
    nome: 'Sequência obrigatória de agentes (Sofia → Detetive → Rafael)',
    regex: /sofia|detetive|rafael|sequ[êe]ncia\s+(obrigat[óo]ria|de\s+agentes)|gerente-produto.*investigador/i,
    sugestao: [
      '## Sequência obrigatória em /feature',
      '',
      '1. Sofia (gerente-produto) — US clara, AC testável, non-goals.',
      '2. Detetive (investigador) — lê código existente que a feature toca.',
      '3. Rafael (tech-lead) — ADR se decisão arquitetural (pula se trivial).',
      '4. Bruno (dev-senior) — implementa com TDD.',
      '5. Revisor — aderência à US + anti-padrões.',
      '6. Auditores (segurança + qualidade + produto) — em paralelo.',
    ].join('\n'),
  },
  {
    id: 'anti-mascaramento',
    nome: 'Anti-mascaramento (não esconder erro)',
    regex: /mascaramento|@ts-ignore|\.skip\(|assertTrue\(true|\|\| true|eslint-disable/i,
    sugestao: [
      '## Causa raiz, nunca sintoma',
      '',
      'Teste falhou = problema no sistema. Corrigir código, nunca mascarar.',
      'Proibido: `@ts-ignore`, `.skip()`, `assertTrue(true)`, `eslint-disable`,',
      '`|| true`, `--quiet`, baseline pra esconder erro, regra desligada.',
    ].join('\n'),
  },
  {
    id: 'pt-br',
    nome: 'PT-BR / sem jargão',
    regex: /(portugu[êe]s|pt-br|sem\s+jarg[ãa]o)/i,
    sugestao: [
      '## Linguagem',
      '',
      'Comunicar em **Português (Brasil)** por padrão.',
      'Sem jargão técnico sem tradução com usuário não-programador.',
    ].join('\n'),
  },
  {
    id: 'executar',
    nome: 'INV-AGENT-006 — Executar, não passar pro usuário',
    regex: /INV-AGENT-006|executar.*n[ãa]o.*passar|quer que eu/i,
    sugestao: [
      '## INV-AGENT-006 — Executar, não passar pro usuário',
      '',
      'Tudo que o agente PODE fazer (tem a ferramenta, não é destrutivo, não custa dinheiro), o agente DEVE fazer sem perguntar.',
      'Sinal de alerta: "quer que eu...?", "posso fazer X?", "devo continuar?" → PARE e execute.',
      'Confirmar antes apenas em ações destrutivas / gasto financeiro / mudança pública / credenciais.',
    ].join('\n'),
  },
  {
    id: 'agents-md',
    nome: 'Referência a AGENTS.md como contrato canônico',
    regex: /AGENTS\.md/,
    sugestao: '> Carregue `AGENTS.md` no contexto — é o contrato canônico do projeto.',
  },
];

const ADAPTERS = [
  { name: 'cursor',     file: '.cursor/rules/roldao-method.mdc' },
  { name: 'windsurf',   file: '.windsurf/rules/roldao-method.md' },
  { name: 'continue',   file: '.continue/config.yaml' },
  { name: 'cline',      file: '.clinerules' },
  { name: 'roo',        file: '.roorules' },
  { name: 'aider',      file: '.aider.conf.yml' },
  { name: 'gemini-cli', file: 'GEMINI.md' },
  { name: 'codex-cli',  file: '.codex/instructions.md' },
];

const filtered = ONLY ? ADAPTERS.filter((a) => a.name === ONLY) : ADAPTERS;
if (ONLY && filtered.length === 0) {
  console.error(`Adapter desconhecido: ${ONLY}. Disponiveis: ${ADAPTERS.map((a) => a.name).join(', ')}`);
  process.exit(2);
}

let totalGaps = 0;
const relatorio = [];

for (const a of filtered) {
  const full = path.join(T, a.file);
  const linhas = [`\n[${a.name}] ${a.file}`];

  if (!fs.existsSync(full)) {
    linhas.push('  AUSENTE — arquivo nao existe.');
    totalGaps += TOPICS_CANONICOS.length;
    relatorio.push(linhas.join('\n'));
    continue;
  }

  const text = fs.readFileSync(full, 'utf8');
  const gaps = [];
  for (const t of TOPICS_CANONICOS) {
    if (t.regex.test(text)) {
      if (!QUIET) linhas.push(`  OK   ${t.nome}`);
    } else {
      linhas.push(`  GAP  ${t.nome}`);
      gaps.push(t);
    }
  }

  if (gaps.length > 0) {
    totalGaps += gaps.length;
    linhas.push('');
    linhas.push(`  --- sugestao de patch para ${a.name} (cole no arquivo) ---`);
    for (const g of gaps) {
      linhas.push('');
      linhas.push(g.sugestao);
    }
    linhas.push('  --- fim do patch ---');
  } else if (QUIET) {
    // suprime output de adapter 100% sincronizado em modo quiet
    continue;
  }

  relatorio.push(linhas.join('\n'));
}

console.log(relatorio.join('\n'));
console.log('');
if (totalGaps === 0) {
  console.log(`Paridade OK — ${filtered.length} adapter(s) sincronizado(s).`);
} else {
  console.log(`${totalGaps} gap(s) detectado(s) em ${filtered.length} adapter(s).`);
  console.log('Esta ferramenta e diagnostica. O gate de bloqueio fica em test/adapters.test.js.');
}
process.exit(0);
