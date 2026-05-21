#!/usr/bin/env node
/**
 * test/adapters.test.js — valida CONTEÚDO de cada adapter multi-IDE.
 *
 * Antes test/install.test.js so verificava PRESENCA do arquivo. O risco
 * eram regras centrais (REGRA #0, sequencia obrigatoria, anti-mascaramento)
 * serem removidas de um adapter por descuido — o instalador continuava
 * verde, mas o IDE alvo (Cursor/Cline/etc.) perdia a disciplina central.
 *
 * Cada adapter (texto carregado no contexto do IDE) DEVE conter:
 *   - REGRA #0 (investigar antes de mexer)
 *   - Sequencia obrigatoria de agentes (Sofia/investigador/etc.)
 *   - Anti-mascaramento basico
 *   - Referencia a 'AGENTS.md' ou conteudo equivalente
 *
 * Claude Code (templates/.claude/) NAO entra neste teste — la o hook
 * bloqueia mecanicamente, e a fonte e os 28 .sh + agents/*.md.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const T = path.join(ROOT, 'templates');

const adapters = [
  { name: 'cursor',     file: '.cursor/rules/roldao-method.mdc' },
  { name: 'windsurf',   file: '.windsurf/rules/roldao-method.md' },
  { name: 'continue',   file: '.continue/config.yaml' },
  { name: 'cline',      file: '.clinerules' },
  { name: 'roo',        file: '.roorules' },
  { name: 'aider',      file: '.aider.conf.yml' },
  { name: 'gemini-cli', file: 'GEMINI.md' },
  { name: 'codex-cli',  file: '.codex/instructions.md' },
];

let pass = 0;
let fail = 0;
function check(desc, cond, extra) {
  if (cond) { pass++; console.log(`  OK   ${desc}`); }
  else { fail++; console.log(`  FAIL ${desc}${extra ? ` — ${extra}` : ''}`); }
}

console.log(`\nValidando conteúdo dos ${adapters.length} adapters...\n`);

for (const a of adapters) {
  const p = path.join(T, a.file);
  console.log(`\n[${a.name}] ${a.file}`);

  if (!fs.existsSync(p)) {
    check(`${a.name}: arquivo existe`, false);
    continue;
  }
  check(`${a.name}: arquivo existe`, true);

  const text = fs.readFileSync(p, 'utf8');
  const lower = text.toLowerCase();

  // 1. REGRA #0 — invariante central do framework
  const regra0 = /regra\s*#?\s*0|investig(ar|ador)\s+antes/i.test(text);
  check(`${a.name}: cita REGRA #0 / investigar antes`, regra0);

  // 2. Sequencia obrigatoria — pelo menos um dos nomes da pipeline
  const sequencia = /sofia|detetive|rafael|sequ[êe]ncia\s+(obrigat[óo]ria|de\s+agentes)|gerente-produto.*investigador/i.test(text);
  check(`${a.name}: cita sequência obrigatória (Sofia/Detetive/Rafael/sequencia)`, sequencia);

  // 3. Anti-mascaramento — diferencial do framework
  const antiMascaramento = /mascaramento|@ts-ignore|\.skip\(|assertTrue\(true|\|\| true|skip\(|eslint-disable/i.test(text);
  check(`${a.name}: cita anti-mascaramento / padroes proibidos`, antiMascaramento);

  // 4. PT-BR — sem jargao tecnico cru
  const ptBr = /(portugu[êe]s|pt-br|sem\s+jarg[ãa]o)/i.test(text);
  check(`${a.name}: declara PT-BR / sem jargão`, ptBr);

  // 5. Tamanho minimo razoavel — adapter trivial nao da disciplina
  check(`${a.name}: conteudo nao-trivial (≥ 500 chars)`, text.length >= 500, `len=${text.length}`);

  // 6. Especifico por adapter
  if (a.name === 'aider') {
    // Aider carrega arquivos via `read:` — tem que apontar pro AGENTS.md
    const carregaAgents = /read:[\s\S]*AGENTS\.md/i.test(text) || /AGENTS\.md/i.test(text);
    check(`${a.name}: carrega AGENTS.md via read:`, carregaAgents);
  }
  if (a.name === 'continue') {
    // Continue usa estrutura YAML com `rules:` e `context:`
    check(`${a.name}: tem bloco rules:`, /^rules:\s*$/m.test(text));
    check(`${a.name}: aponta AGENTS.md via context.file include`, /AGENTS\.md/.test(text));
  }
  if (a.name === 'cursor' || a.name === 'windsurf') {
    // MDC tem frontmatter (windsurf usa .md normal, cursor usa .mdc com frontmatter
    // de glob — ambos esperam .md valido)
    check(`${a.name}: arquivo nao vazio apos frontmatter`, text.replace(/^---[\s\S]*?---/, '').trim().length > 200);
  }
}

console.log('');
if (fail === 0) { console.log(`Total OK (${pass} checagens).`); process.exit(0); }
console.log(`${fail} falha(s) em ${pass + fail} checagens.`); process.exit(1);
