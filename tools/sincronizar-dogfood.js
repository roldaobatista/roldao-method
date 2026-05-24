#!/usr/bin/env node
// Verifica que o dogfood local (.claude/, .specify/ e AGENTS.md/CLAUDE.md/REGRAS na raiz)
// bate byte-a-byte com a fonte canônica em templates/. Sem deps. Roda no `npm test`.
//
// Por design (ADR-005):
//  - templates/ é fonte de verdade (versionada).
//  - .claude/, .specify/, AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md na raiz são GERADOS
//    via `npx roldao-method install` ou `node tools/sincronizar-dogfood.js --write`.
//  - Quem desenvolve o framework precisa do dogfood pra rodar hooks em si mesmo.
//
// Uso:
//   node tools/sincronizar-dogfood.js            → falha (exit 1) se drift, lista arquivos
//   node tools/sincronizar-dogfood.js --write    → copia templates/* → raiz, criando dogfood
//   node tools/sincronizar-dogfood.js --quiet    → sem ruído se OK (pra rodar em pre-commit)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const QUIET = process.argv.includes('--quiet');

// Pares (origem em templates/ → destino na raiz). Diretórios são walkados.
const PARES = [
  { src: 'templates/.claude/hooks',    dst: '.claude/hooks',    tipo: 'dir' },
  { src: 'templates/.claude/agents',   dst: '.claude/agents',   tipo: 'dir' },
  { src: 'templates/.claude/commands', dst: '.claude/commands', tipo: 'dir' },
  { src: 'templates/.claude/rules',    dst: '.claude/rules',    tipo: 'dir' },
  { src: 'templates/.claude/skills',   dst: '.claude/skills',   tipo: 'dir' },
  { src: 'templates/.claude/output-styles', dst: '.claude/output-styles', tipo: 'dir' },
  { src: 'templates/.specify/templates',    dst: '.specify/templates',    tipo: 'dir' },
  { src: 'templates/.specify/schemas',      dst: '.specify/schemas',      tipo: 'dir' },
];

function hash(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function walkar(dir) {
  const fora = [];
  if (!fs.existsSync(dir)) return fora;
  for (const nome of fs.readdirSync(dir)) {
    const cheio = path.join(dir, nome);
    const stat = fs.lstatSync(cheio);
    if (stat.isDirectory()) {
      // Pula caches Python que ressuscitam sozinhos.
      if (nome === '__pycache__') continue;
      fora.push(...walkar(cheio));
    } else if (stat.isFile()) {
      fora.push(cheio);
    }
  }
  return fora;
}

function relPosix(abs, base) {
  return path.relative(base, abs).split(path.sep).join('/');
}

const drifts = [];
const apenasNoSrc = [];
const apenasNoDst = [];

for (const par of PARES) {
  const srcAbs = path.join(ROOT, par.src);
  const dstAbs = path.join(ROOT, par.dst);
  if (!fs.existsSync(srcAbs)) {
    console.error(`[sincronizar-dogfood] origem ausente: ${par.src}`);
    process.exit(2);
  }
  const arquivosSrc = walkar(srcAbs);
  const arquivosDst = walkar(dstAbs);

  const mapSrc = new Map(arquivosSrc.map(f => [relPosix(f, srcAbs), f]));
  const mapDst = new Map(arquivosDst.map(f => [relPosix(f, dstAbs), f]));

  for (const [rel, abs] of mapSrc) {
    if (!mapDst.has(rel)) {
      apenasNoSrc.push(`${par.dst}/${rel}`);
      if (WRITE) {
        const destino = path.join(dstAbs, rel);
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.copyFileSync(abs, destino);
      }
      continue;
    }
    const hSrc = hash(fs.readFileSync(abs));
    const hDst = hash(fs.readFileSync(mapDst.get(rel)));
    if (hSrc !== hDst) {
      drifts.push(`${par.dst}/${rel}`);
      if (WRITE) fs.copyFileSync(abs, mapDst.get(rel));
    }
  }
  for (const rel of mapDst.keys()) {
    if (!mapSrc.has(rel)) apenasNoDst.push(`${par.dst}/${rel}`);
  }
}

// Órfãos no dogfood (apenasNoDst) NÃO são erro — podem ser override local, addon
// instalado, ou cache (`__pycache__` já filtrado). Só drift de conteúdo e ausência
// no dogfood quebram o gate.
const total = drifts.length + apenasNoSrc.length;

if (total === 0) {
  if (!QUIET) console.log('[sincronizar-dogfood] OK — dogfood bate com templates/.');
  process.exit(0);
}

if (WRITE) {
  console.log(`[sincronizar-dogfood] regenerei dogfood: ${drifts.length} sobrescritos, ${apenasNoSrc.length} criados, ${apenasNoDst.length} órfãos no dogfood (mantidos).`);
  process.exit(0);
}

console.error('[sincronizar-dogfood] DRIFT entre templates/ (fonte) e dogfood na raiz.');
console.error('Causa comum: editou templates/ sem regenerar o dogfood — ou vice-versa.');
console.error('');
if (drifts.length) {
  console.error(`Arquivos com conteúdo divergente (${drifts.length}):`);
  drifts.slice(0, 30).forEach(f => console.error(`  - ${f}`));
  if (drifts.length > 30) console.error(`  ... e mais ${drifts.length - 30}`);
}
if (apenasNoSrc.length) {
  console.error(`Existem em templates/ mas faltam no dogfood (${apenasNoSrc.length}):`);
  apenasNoSrc.slice(0, 10).forEach(f => console.error(`  - ${f}`));
}
if (apenasNoDst.length) {
  console.error(`Existem no dogfood mas não no template (${apenasNoDst.length} — geralmente cache local, ok):`);
  apenasNoDst.slice(0, 10).forEach(f => console.error(`  - ${f}`));
}
console.error('');
console.error('Como resolver:');
console.error('  1. Se templates/ está correto (caso comum): `node tools/sincronizar-dogfood.js --write`');
console.error('  2. Se a raiz tem edição válida que precisa virar template: copie manualmente pra templates/ e commite.');
console.error('  3. Lembre que arquivos órfãos no dogfood (item 3) não são erro — são overrides locais ou cache.');
process.exit(1);
