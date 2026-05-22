#!/usr/bin/env node
/**
 * tools/validar-ids-rastreaveis.js
 *
 * Auto-auditoria de IDs do REGRAS-INEGOCIAVEIS.md (INV-004):
 * - extrai todo ID do tipo INV-NNN, SEC-NNN, TST-NNN, LGPD-NNN,
 *   FISCAL-NNN, PIX-NNN, INV-AGENT-NNN, MEU-NNN (de addons).
 * - para cada ID, exige que ele apareça em pelo menos UM dos:
 *   - .claude/rules/roldao-method.md (tabela / referencia)
 *   - templates/.claude/hooks/*.sh (codigo mecanico)
 *   - templates/.claude/agents/*.md (agente que aplica)
 *   - templates/.specify/checklists/*.md (checklist auditavel)
 *
 * Idea: ID sem rastreabilidade vira "decoração" — viola TST-002 aplicado ao
 * proprio framework. Toda regra inegociavel deve ter pelo menos 1 ponto
 * operacional citando ela.
 *
 * Excecoes: ID com comentario `<!-- nao-operacional -->` na linha do titulo
 * (ex: regra educacional pura) e ignorado.
 *
 * Exit 0 = todos os IDs rastreados; exit 1 = N IDs orfaos.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const REGRAS_FILE = path.join(ROOT, 'REGRAS-INEGOCIAVEIS.md');
const TEMPLATES_REGRAS = path.join(ROOT, 'templates', 'REGRAS-INEGOCIAVEIS.md');

// Pontos onde um ID e considerado rastreado
const PONTOS_DE_RASTREIO = [
  path.join(ROOT, 'templates', '.claude', 'rules', 'roldao-method.md'),
  path.join(ROOT, '.claude', 'rules', 'roldao-method.md'),
];

function listFilesRecursive(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...listFilesRecursive(full, exts));
    } else if (exts.some((e) => ent.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

PONTOS_DE_RASTREIO.push(
  ...listFilesRecursive(path.join(ROOT, 'templates', '.claude', 'hooks'), ['.sh']),
  ...listFilesRecursive(path.join(ROOT, 'templates', '.claude', 'agents'), ['.md']),
  ...listFilesRecursive(path.join(ROOT, 'templates', '.specify', 'checklists'), ['.md']),
);

// Regex que casa qualquer ID rastreavel
const ID_REGEX = /\b(INV-AGENT-\d{3}|INV-\d{3}|SEC-\d{3}|TST-\d{3}|LGPD-\d{3}|FISCAL-\d{3}|PIX-\d{3})\b/g;

function extrairIds(arquivo) {
  if (!fs.existsSync(arquivo)) return new Set();
  const texto = fs.readFileSync(arquivo, 'utf8');
  const ids = new Set();
  for (const m of texto.matchAll(ID_REGEX)) ids.add(m[1]);
  return ids;
}

function lerTextoSeguro(arquivo) {
  try {
    return fs.readFileSync(arquivo, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  // 1. coleta ids DEFINIDOS no REGRAS (procura `### ID-NNN` ou `### ID-NNN — `).
  const definidos = new Set();
  for (const arq of [REGRAS_FILE, TEMPLATES_REGRAS]) {
    if (!fs.existsSync(arq)) continue;
    const texto = lerTextoSeguro(arq);
    // captura ID no titulo `### XXX-NNN — ...`
    const def = /^###\s+(INV-AGENT-\d{3}|INV-\d{3}|SEC-\d{3}|TST-\d{3}|LGPD-\d{3}|FISCAL-\d{3}|PIX-\d{3})\b/gm;
    for (const m of texto.matchAll(def)) definidos.add(m[1]);
  }

  if (definidos.size === 0) {
    console.error('[validar-ids] Nenhum ID encontrado em REGRAS-INEGOCIAVEIS.md (nem raiz nem templates).');
    process.exit(1);
  }

  // 2. coleta IDs RASTREADOS nos pontos operacionais
  const rastreados = new Map(); // id -> [arquivos]
  for (const arq of PONTOS_DE_RASTREIO) {
    const ids = extrairIds(arq);
    for (const id of ids) {
      if (!rastreados.has(id)) rastreados.set(id, []);
      rastreados.get(id).push(path.relative(ROOT, arq));
    }
  }

  // 3. compara
  const orfaos = [];
  for (const id of [...definidos].sort()) {
    if (!rastreados.has(id)) orfaos.push(id);
  }

  console.log(`[validar-ids] IDs definidos: ${definidos.size}`);
  console.log(`[validar-ids] IDs rastreados em algum ponto operacional: ${[...definidos].filter((id) => rastreados.has(id)).length}`);

  if (orfaos.length === 0) {
    console.log('[validar-ids] OK — todos os IDs sao mencionados em pelo menos 1 ponto operacional (hook, agente, regra ou checklist).');
    process.exit(0);
  }

  console.error('');
  console.error('[validar-ids] FALHA — IDs orfaos (definidos em REGRAS-INEGOCIAVEIS.md mas sem mencao em nenhum hook/agente/regra/checklist):');
  for (const id of orfaos) {
    console.error(`  - ${id}`);
  }
  console.error('');
  console.error('Como resolver:');
  console.error('  - se a regra e mecanizavel: crie hook em templates/.claude/hooks/');
  console.error('  - se a regra e organizacional: cite em templates/.claude/agents/ ou checklist');
  console.error('  - se a regra precisa virar lembrete: cite em .claude/rules/roldao-method.md');
  process.exit(1);
}

main();
