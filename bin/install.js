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
  const resolvedCwd = path.resolve(CWD);
  const resolvedDest = path.resolve(dest);
  if (!resolvedDest.startsWith(resolvedCwd + path.sep) && resolvedDest !== resolvedCwd) {
    err(`destino fora do diretório alvo, abortando: ${dest}`);
    process.exit(2);
  }

  const stat = fs.lstatSync(src);

  if (stat.isSymbolicLink()) {
    warn(`pulando symlink (segurança): ${path.relative(FRAMEWORK_ROOT, src)}`);
    return;
  }

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    if (fs.existsSync(dest)) {
      warn(`pulando (já existe): ${path.relative(CWD, dest)}`);
      return;
    }
    fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
    log(`criado: ${path.relative(CWD, dest)}`);
  } else {
    warn(`pulando tipo não suportado: ${path.relative(FRAMEWORK_ROOT, src)}`);
  }
}

function isDangerousCwd() {
  const resolved = path.resolve(CWD);
  const home = require('os').homedir();
  const blocked = [
    home,
    path.parse(resolved).root,
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    '/etc',
    '/usr',
    '/bin',
    '/var',
  ].map((p) => path.resolve(p));
  return blocked.includes(resolved);
}

async function install() {
  log(`instalando ROLDAO-METHOD em: ${CWD}`);

  if (isDangerousCwd()) {
    err(`recusa: diretório atual (${CWD}) parece sensível (raiz, home, system).`);
    err('rode dentro de uma pasta de projeto.');
    process.exit(2);
  }

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
  log('  3. ativar o estilo PT-BR conciso: rode /output-style no Claude Code e escolha pt-br-conciso');
  log('  4. usar /inicio, /feature, /bug, /refactor ou /auditoria no Claude Code');
  log('');
  log('docs: https://github.com/roldaobatista/roldao-method');
}

function help() {
  console.log(`
ROLDAO-METHOD — framework de desenvolvimento ágil com IA em PT-BR

Uso:
  npx roldao-method install      Instala no projeto atual
  npx roldao-method help         Mostra esta ajuda
  npx roldao-method version      Mostra versão

Docs: https://github.com/roldaobatista/roldao-method
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
