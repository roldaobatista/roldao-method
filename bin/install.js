#!/usr/bin/env node
/**
 * roldao-method install
 *
 * Copia os arquivos-modelo da pasta templates/ pro projeto do usuário,
 * detectando a ferramenta de IA (Claude Code, Cursor) e instalando no lugar certo.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FRAMEWORK_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(FRAMEWORK_ROOT, 'templates');
const CWD = process.cwd();

const args = process.argv.slice(2);
const command = args[0] || 'install';

function log(msg) {
  console.log(`[roldao-method] ${msg}`);
}

function warn(msg) {
  console.warn(`[roldao-method] AVISO: ${msg}`);
}

function err(msg) {
  console.error(`[roldao-method] ERRO: ${msg}`);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

function detectTool() {
  if (fs.existsSync(path.join(CWD, '.claude'))) return 'claude-code';
  if (fs.existsSync(path.join(CWD, '.cursor'))) return 'cursor';
  return null;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    if (fs.existsSync(dest)) {
      warn(`pulando (já existe): ${path.relative(CWD, dest)}`);
      return;
    }
    fs.copyFileSync(src, dest);
    log(`criado: ${path.relative(CWD, dest)}`);
  }
}

async function install() {
  log(`instalando ROLDAO-METHOD em: ${CWD}`);

  const detected = detectTool();
  if (detected === 'claude-code') {
    log('Claude Code detectado — usando integração nativa.');
  } else if (detected === 'cursor') {
    log('Cursor detectado — adaptação leve será aplicada.');
  } else {
    log('nenhuma ferramenta detectada — instalando estrutura padrão (Claude Code).');
  }

  if (!fs.existsSync(TEMPLATES_DIR)) {
    err(`pasta de templates não encontrada: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  const answer = await ask('Confirmar instalação em ' + CWD + '? [s/N] ');
  if (answer.toLowerCase() !== 's') {
    log('cancelado.');
    return;
  }

  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    copyRecursive(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry));
  }

  log('');
  log('instalação concluída.');
  log('');
  log('próximos passos:');
  log('  1. ler AGENTS.md — esse é seu documento-contrato');
  log('  2. ajustar REGRAS-INEGOCIAVEIS.md ao seu projeto');
  log('  3. usar /inicio, /feature, /bug, /refactor ou /auditoria no Claude Code');
  log('');
  log('docs: https://github.com/roldao/roldao-method');
}

function help() {
  console.log(`
ROLDAO-METHOD — framework de desenvolvimento ágil com IA em PT-BR

Uso:
  npx roldao-method install      Instala no projeto atual
  npx roldao-method help         Mostra esta ajuda
  npx roldao-method version      Mostra versão

Docs: https://github.com/roldao/roldao-method
`);
}

function version() {
  const pkg = require(path.join(FRAMEWORK_ROOT, 'package.json'));
  console.log(pkg.version);
}

(async () => {
  switch (command) {
    case 'install':
      await install();
      break;
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    case 'version':
    case '--version':
    case '-v':
      version();
      break;
    default:
      err(`comando desconhecido: ${command}`);
      help();
      process.exit(1);
  }
})();
