#!/usr/bin/env node
// Garante que o CLAUDE.md da raiz (dogfood) bate byte-a-byte com templates/CLAUDE.md.
// Sem deps. Roda como gate no prepublishOnly.
//
// Uso:
//   node tools/sincronizar-claude-md.js            → falha (exit 1) se houver drift, imprime diff
//   node tools/sincronizar-claude-md.js --write    → reescreve raiz a partir do template

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'CLAUDE.md');
const ROOT_PATH = path.join(ROOT, 'CLAUDE.md');

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`[sincronizar-claude-md] não consegui ler ${file}: ${err.message}`);
    process.exit(2);
  }
}

const template = read(TEMPLATE_PATH);

// CLAUDE.md raiz é dogfood opcional (gitignored: o repo nasce sem ele,
// só aparece após `npx roldao-method install` local). CI faz checkout
// limpo e nunca tem CLAUDE.md raiz — sem este short-circuit o gate
// quebrava em todo push.
if (!fs.existsSync(ROOT_PATH)) {
  console.log('[sincronizar-claude-md] OK — CLAUDE.md raiz ausente (gitignored); só template avaliado.');
  process.exit(0);
}

const root = read(ROOT_PATH);

if (template === root) {
  console.log('[sincronizar-claude-md] OK — CLAUDE.md raiz e templates/CLAUDE.md estão sincronizados.');
  process.exit(0);
}

const writeMode = process.argv.includes('--write');
if (writeMode) {
  fs.writeFileSync(ROOT_PATH, template, 'utf8');
  console.log('[sincronizar-claude-md] CLAUDE.md raiz reescrito a partir do template.');
  process.exit(0);
}

console.error('[sincronizar-claude-md] DRIFT entre templates/CLAUDE.md e CLAUDE.md raiz.');
console.error('Causa: alguém editou um sem editar o outro. Fonte canônica é templates/CLAUDE.md.');
console.error('');
console.error('Como resolver:');
console.error('  1. Confirme qual versão é correta.');
console.error('  2. Se a raiz está certa: copie raiz pra templates/CLAUDE.md.');
console.error('  3. Se template está certo: rode `node tools/sincronizar-claude-md.js --write`.');
console.error('');
console.error('Diff (template → raiz):');
const tLines = template.split('\n');
const rLines = root.split('\n');
const max = Math.max(tLines.length, rLines.length);
for (let i = 0; i < max; i++) {
  if (tLines[i] !== rLines[i]) {
    console.error(`  L${i + 1} template: ${tLines[i] || '(vazio)'}`);
    console.error(`  L${i + 1} raiz:     ${rLines[i] || '(vazio)'}`);
  }
}
process.exit(1);
