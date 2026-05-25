#!/usr/bin/env node
/**
 * next-id.js — devolve o próximo ID disponível pra US/PRD/EP/ADR/T.
 *
 * Duas variantes vivem no framework — propósitos diferentes, evite confundir:
 *   - `.specify/scripts/next-id.js`  (ESTE arquivo) → CLI standalone.
 *     Use em scripts shell e em agentes que rodam via Bash: aceita t/us/adr
 *     em minúsculo, varia raiz buscando docs/, é o caminho documentado em
 *     templates e instalado pelo update.
 *   - `.claude/lib/next-id.js`       → biblioteca importável (`exports.nextId`).
 *     Use em hooks/tools Node nativos do framework via `require()`.
 *
 * Se você está editando aqui, edite também `templates/.claude/lib/next-id.js`
 * (lógica equivalente). O teste oficial é `test/lib-next-id.test.js`.
 *
 * Uso:
 *   node .specify/scripts/next-id.js us           # próximo US-NNN (varre docs/stories/)
 *   node .specify/scripts/next-id.js prd          # próximo PRD-NNN (docs/prd/)
 *   node .specify/scripts/next-id.js ep           # próximo EP-NNN (docs/epicos/)
 *   node .specify/scripts/next-id.js adr          # próximo ADR-NNN (docs/decisions/)
 *   node .specify/scripts/next-id.js t            # próximo T-NNN GLOBAL (T é local por story —
 *                                                   sem story de contexto retorna T-001)
 *   node .specify/scripts/next-id.js t US-042     # próximo T-NNN dentro de docs/stories/US-042-*.md
 *
 * Saída: 1 linha só com o ID formatado. Sem cor, sem prefixo, pronto pra
 * outro script consumir (`NEW_ID=$(node next-id.js us)`).
 *
 * INV-004 — IDs rastreáveis. T-001 da US-114 (E1 do PRD-003).
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Procura raiz do projeto: o lugar com docs/. Sobe da pasta do script até achar.
function findProjectRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'docs')) && fs.existsSync(path.join(dir, '.specify'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const ROOT = findProjectRoot();

const TIPOS = {
  us:  { pasta: 'docs/stories',   prefixo: 'US',  padding: 3 },
  prd: { pasta: 'docs/prd',       prefixo: 'PRD', padding: 3 },
  ep:  { pasta: 'docs/epicos',    prefixo: 'EP',  padding: 3 },
  adr: { pasta: 'docs/decisions', prefixo: 'ADR', padding: 3 },
};

function maiorNumero(pasta, prefixo) {
  const dir = path.join(ROOT, pasta);
  if (!fs.existsSync(dir)) return 0;
  const arquivos = fs.readdirSync(dir);
  // Aceita prefixos numéricos 3 OU 4 dígitos (ADR antigos usavam 4)
  const re = new RegExp(`\\b${prefixo}-(\\d{3,4})\\b`);
  let maior = 0;
  for (const f of arquivos) {
    const m = f.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maior) maior = n;
    }
  }
  return maior;
}

function proximoTaskGlobal(storyId) {
  // T é local por story. Sem story, devolve T-001.
  if (!storyId) return 'T-001';
  const dir = path.join(ROOT, 'docs/stories');
  if (!fs.existsSync(dir)) return 'T-001';
  // Localiza o arquivo da story
  const arquivos = fs.readdirSync(dir);
  const re = new RegExp(`^${storyId}[-_.]`);
  const arquivo = arquivos.find((f) => re.test(f));
  if (!arquivo) return 'T-001';
  const conteudo = fs.readFileSync(path.join(dir, arquivo), 'utf8');
  let maior = 0;
  const reTask = /\bT-(\d{3,4})\b/g;
  let m;
  while ((m = reTask.exec(conteudo)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > maior) maior = n;
  }
  return `T-${String(maior + 1).padStart(3, '0')}`;
}

function formatar(prefixo, numero, padding) {
  return `${prefixo}-${String(numero).padStart(padding, '0')}`;
}

function printHelp() {
  process.stdout.write(`next-id.js — devolve o próximo ID disponível pra US/PRD/EP/ADR/T.

Uso:
  node .specify/scripts/next-id.js <tipo> [storyId-se-t]

Tipos:
  us    próximo US-NNN (varre docs/stories/)
  prd   próximo PRD-NNN (varre docs/prd/)
  ep    próximo EP-NNN (varre docs/epicos/)
  adr   próximo ADR-NNN (varre docs/decisions/)
  t     próximo T-NNN dentro da story informada (T é local por story)

Exemplos:
  node .specify/scripts/next-id.js us              # -> US-115
  node .specify/scripts/next-id.js adr             # -> ADR-019
  node .specify/scripts/next-id.js t US-042        # -> T-005 (próximo task da US-042)

Saída: 1 linha só com o ID formatado, pronto pra outro script consumir:
  NEW_ID=$(node .specify/scripts/next-id.js us)

INV-004 — IDs rastreáveis.

ATENÇÃO: este script NÃO é atômico em chamadas paralelas. Duas execuções
simultâneas devolvem o mesmo ID. Se rodar em paralelo (CI, multi-agente),
faça lock externo ou serialize as chamadas.
`);
}

function main() {
  const tipo = (process.argv[2] || '').toLowerCase();
  const arg2 = process.argv[3] || '';

  if (!tipo || tipo === '--help' || tipo === '-h' || tipo === 'help') {
    printHelp();
    process.exit(tipo ? 0 : 1);
  }

  if (tipo === 't') {
    console.log(proximoTaskGlobal(arg2));
    return;
  }

  const cfg = TIPOS[tipo];
  if (!cfg) {
    process.stderr.write(`Tipo desconhecido: ${tipo}. Use: us, prd, ep, adr, t. Veja --help.\n`);
    process.exit(1);
  }

  const maior = maiorNumero(cfg.pasta, cfg.prefixo);
  console.log(formatar(cfg.prefixo, maior + 1, cfg.padding));
}

main();
