#!/usr/bin/env node
// scripts/normalizar-acentos-frontmatter.js — corrige acentuacao errada nos
// frontmatters dos agentes/comandos/rules em templates/.claude/.
//
// T-303 (F2) / PRD-003 US-114.
//
// Substituicoes mecanicas em campos do frontmatter (entre as 2 linhas '---'):
//   nao        → não
//   voce       → você
//   tambem     → também
//   ja         → já
//   esta       → está
//   atraves    → através
//   ate        → até
//   producao   → produção
//   versao     → versão
//   validacao  → validação
//   dominio    → domínio
//   regulacao  → regulação
//   funcao     → função
//   comunicacao→ comunicação
//   tecnico    → técnico
//   logica     → lógica
//   critica    → crítica
//   proximo    → próximo
//   usuario    → usuário
//
// NAO toca corpo do markdown — so o frontmatter YAML.
//
// Uso:
//   node scripts/normalizar-acentos-frontmatter.js [--dry-run] [--write]

const fs = require('fs');
const path = require('path');

const PASTAS = [
  'templates/.claude/agents',
  'templates/.claude/commands',
  'templates/.claude/rules',
  'templates/.claude/skills',
];

const SUBSTITUICOES = [
  [/\bnao\b/g, 'não'],
  [/\bvoce\b/g, 'você'],
  [/\btambem\b/g, 'também'],
  [/\bja\b/g, 'já'],
  [/\besta\b/g, 'está'],
  [/\batraves\b/g, 'através'],
  [/\bate\b/g, 'até'],
  [/\bproducao\b/g, 'produção'],
  [/\bversao\b/g, 'versão'],
  [/\bvalidacao\b/g, 'validação'],
  [/\bdominio\b/g, 'domínio'],
  [/\bregulacao\b/g, 'regulação'],
  [/\bfuncao\b/g, 'função'],
  [/\bcomunicacao\b/g, 'comunicação'],
  [/\btecnico\b/g, 'técnico'],
  [/\blogica\b/g, 'lógica'],
  [/\bcritica\b/g, 'crítica'],
  [/\bproximo\b/g, 'próximo'],
  [/\busuario\b/g, 'usuário'],
  [/\bCodigo\b/g, 'Código'],
  [/\bsao\b/g, 'são'],
  [/\bSao\b/g, 'São'],
  [/\bdecisao\b/g, 'decisão'],
];

function processarArquivo(filepath, dryRun) {
  const conteudo = fs.readFileSync(filepath, 'utf8');
  const linhas = conteudo.split(/\r?\n/);
  if (linhas[0].trim() !== '---') return { mudancas: 0, novoConteudo: null };

  // Acha 2o ---
  let fim = -1;
  for (let i = 1; i < Math.min(linhas.length, 60); i++) {
    if (linhas[i].trim() === '---') { fim = i; break; }
  }
  if (fim === -1) return { mudancas: 0, novoConteudo: null };

  let mudancas = 0;
  for (let i = 1; i < fim; i++) {
    const original = linhas[i];
    let novo = original;
    for (const [re, sub] of SUBSTITUICOES) {
      novo = novo.replace(re, sub);
    }
    if (novo !== original) {
      mudancas++;
      linhas[i] = novo;
    }
  }

  if (mudancas === 0) return { mudancas: 0, novoConteudo: null };

  const novoConteudo = linhas.join('\n');
  if (!dryRun) {
    fs.writeFileSync(filepath, novoConteudo);
  }
  return { mudancas, novoConteudo };
}

function walkMd(dir) {
  const resultado = [];
  if (!fs.existsSync(dir)) return resultado;
  for (const nome of fs.readdirSync(dir)) {
    const full = path.join(dir, nome);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      resultado.push(...walkMd(full));
    } else if (nome.endsWith('.md') || nome.endsWith('.MD')) {
      resultado.push(full);
    }
  }
  return resultado;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const write = args.includes('--write');

  if (!dryRun && !write) {
    console.error('Uso: node scripts/normalizar-acentos-frontmatter.js [--dry-run | --write]');
    console.error('  --dry-run  mostra o que seria mudado sem escrever');
    console.error('  --write    aplica as mudancas em disco');
    process.exit(1);
  }

  const root = path.resolve(__dirname, '..');
  let totalArquivos = 0;
  let totalMudancas = 0;
  const mudados = [];

  for (const pasta of PASTAS) {
    const dirAbs = path.join(root, pasta);
    const arquivos = walkMd(dirAbs);
    for (const f of arquivos) {
      totalArquivos++;
      const { mudancas } = processarArquivo(f, dryRun);
      if (mudancas > 0) {
        totalMudancas += mudancas;
        const rel = path.relative(root, f);
        mudados.push({ arquivo: rel, mudancas });
      }
    }
  }

  console.log(`\n[${dryRun ? 'DRY-RUN' : 'WRITE'}] Acentos normalizados em frontmatters`);
  console.log(`Arquivos varridos: ${totalArquivos}`);
  console.log(`Arquivos com mudanca: ${mudados.length}`);
  console.log(`Total de substituicoes: ${totalMudancas}\n`);
  for (const m of mudados) {
    console.log(`  ${m.mudancas.toString().padStart(3)} - ${m.arquivo}`);
  }
  if (dryRun && mudados.length > 0) {
    console.log(`\nRode com --write pra aplicar.`);
  }
}

main();
