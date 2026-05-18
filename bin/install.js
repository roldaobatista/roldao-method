#!/usr/bin/env node
/**
 * roldao-method — CLI
 *
 * Comandos:
 *   install      copia templates pro projeto (preserva arquivos do usuario)
 *   update       sobrescreve arquivos do framework, preserva customizacoes
 *   doctor       diagnostica instalacao
 *   uninstall    remove arquivos do framework, preserva customizacoes
 *   help/version
 *
 * Flags:
 *   --yes/-y     pula confirmacao interativa (uso em CI)
 *   --force      sobrescreve em cima sem perguntar
 *   --dry-run    so mostra o que faria
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const FRAMEWORK_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(FRAMEWORK_ROOT, 'templates');
const CWD = process.cwd();

const rawArgs = process.argv.slice(2);
const command = rawArgs.find((a) => !a.startsWith('-')) || 'install';
const flags = new Set(rawArgs.filter((a) => a.startsWith('-')));
const YES = flags.has('--yes') || flags.has('-y');
const FORCE = flags.has('--force');
const DRY_RUN = flags.has('--dry-run');
const NO_COLOR = flags.has('--no-color') || process.env.NO_COLOR === '1';

// Cores ANSI puras (sem dependencia). Suporta NO_COLOR e terminal sem TTY.
const supportsColor = !NO_COLOR && process.stdout.isTTY && process.platform !== undefined;
const c = {
  reset: supportsColor ? '\x1b[0m' : '',
  bold: supportsColor ? '\x1b[1m' : '',
  dim: supportsColor ? '\x1b[2m' : '',
  green: supportsColor ? '\x1b[32m' : '',
  yellow: supportsColor ? '\x1b[33m' : '',
  red: supportsColor ? '\x1b[31m' : '',
  blue: supportsColor ? '\x1b[34m' : '',
  cyan: supportsColor ? '\x1b[36m' : '',
  magenta: supportsColor ? '\x1b[35m' : '',
};

// Arquivos que NUNCA devem ser sobrescritos no update (sao customizacao do usuario)
const USER_OWNED = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'REGRAS-INEGOCIAVEIS.md',
  '.specify/memory/constitution.md',
  '.claude/settings.local.json',
  '.mcp.json',
]);

const counters = { criados: 0, pulados: 0, atualizados: 0, preservados: 0, erros: 0 };
const detalhes = { criados: [], pulados: [], atualizados: [], preservados: [], erros: [] };

function log(msg) { console.log(`${c.cyan}[roldao-method]${c.reset} ${msg}`); }
function ok(msg) { console.log(`${c.green}✓${c.reset} ${msg}`); }
function warn(msg) { console.warn(`${c.yellow}[roldao-method]${c.reset} ${c.yellow}AVISO:${c.reset} ${msg}`); }
function err(msg) { console.error(`${c.red}[roldao-method]${c.reset} ${c.red}ERRO:${c.reset} ${msg}`); }
function banner() {
  if (YES) return;
  console.log('');
  console.log(`${c.cyan}${c.bold}  ROLDAO-METHOD${c.reset} ${c.dim}— framework de desenvolvimento agil com IA em PT-BR${c.reset}`);
  console.log(`${c.dim}  https://github.com/roldaobatista/roldao-method${c.reset}`);
  console.log('');
}

function ask(question) {
  if (YES) return Promise.resolve('s');
  if (!process.stdin.isTTY) {
    // Sem TTY (CI) e sem --yes: aborta com mensagem clara
    err('sem TTY e sem --yes/-y. Use --yes em CI/script.');
    process.exit(2);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

function detectTools() {
  const tools = [];
  if (fs.existsSync(path.join(CWD, '.claude'))) tools.push('claude-code');
  if (fs.existsSync(path.join(CWD, '.cursor'))) tools.push('cursor');
  if (fs.existsSync(path.join(CWD, '.windsurf'))) tools.push('windsurf');
  if (fs.existsSync(path.join(CWD, '.continue'))) tools.push('continue');
  if (fs.existsSync(path.join(CWD, '.aider.conf.yml'))) tools.push('aider');
  if (fs.existsSync(path.join(CWD, '.cline'))) tools.push('cline');
  if (fs.existsSync(path.join(CWD, '.roo'))) tools.push('roo');
  return tools;
}

function isDangerousCwd() {
  const resolved = path.resolve(CWD);
  const home = require('os').homedir();
  const candidates = [
    home,
    path.parse(resolved).root,
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    'C:\\Arquivos de Programas',
    '/etc',
    '/usr',
    '/bin',
    '/var',
    '/System',
    '/Applications',
  ];
  return candidates.some((p) => {
    try { return path.resolve(p) === resolved; } catch { return false; }
  });
}

function fileHash(file) {
  try {
    const data = fs.readFileSync(file);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch { return null; }
}

function isUserOwned(relPath) {
  const norm = relPath.split(path.sep).join('/');
  return USER_OWNED.has(norm);
}

function copyFile(src, dest, mode) {
  const rel = path.relative(CWD, dest);
  const exists = fs.existsSync(dest);

  if (DRY_RUN) {
    if (!exists) detalhes.criados.push(rel);
    else if (mode === 'update' && !isUserOwned(path.relative(CWD, dest))) {
      const a = fileHash(src); const b = fileHash(dest);
      if (a !== b) detalhes.atualizados.push(rel);
      else detalhes.pulados.push(`${rel} (igual)`);
    } else if (mode === 'update' && isUserOwned(path.relative(CWD, dest))) {
      detalhes.preservados.push(rel);
    } else {
      detalhes.pulados.push(`${rel} (ja existe)`);
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (!exists) {
    fs.copyFileSync(src, dest);
    counters.criados++;
    detalhes.criados.push(rel);
    return;
  }

  // existe
  if (mode === 'install' && !FORCE) {
    counters.pulados++;
    detalhes.pulados.push(`${rel} (ja existe)`);
    return;
  }

  // update: preserva arquivos do usuario
  if (mode === 'update' && isUserOwned(path.relative(CWD, dest))) {
    counters.preservados++;
    detalhes.preservados.push(rel);
    return;
  }

  const a = fileHash(src); const b = fileHash(dest);
  if (a === b) {
    counters.pulados++;
    detalhes.pulados.push(`${rel} (igual)`);
    return;
  }

  // backup + sobrescreve
  const bak = `${dest}.bak`;
  try {
    fs.copyFileSync(dest, bak);
  } catch (e) {
    detalhes.erros.push(`${rel}: backup falhou (${e.message})`);
    counters.erros++;
  }
  fs.copyFileSync(src, dest);
  counters.atualizados++;
  detalhes.atualizados.push(`${rel} (backup: ${path.basename(bak)})`);
}

function walkAndCopy(src, dest, mode) {
  const resolvedCwd = path.resolve(CWD);
  const resolvedDest = path.resolve(dest);
  if (!resolvedDest.startsWith(resolvedCwd + path.sep) && resolvedDest !== resolvedCwd) {
    err(`destino fora do diretorio alvo, abortando: ${dest}`);
    process.exit(2);
  }
  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) {
    warn(`pulando symlink: ${path.relative(FRAMEWORK_ROOT, src)}`);
    return;
  }
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      walkAndCopy(path.join(src, entry), path.join(dest, entry), mode);
    }
  } else if (stat.isFile()) {
    copyFile(src, dest, mode);
  }
}

function resumo() {
  console.log('');
  console.log(`${c.bold}--- resumo ---${c.reset}`);
  console.log(`  ${c.green}criados:${c.reset}      ${counters.criados}`);
  console.log(`  ${c.cyan}atualizados:${c.reset}  ${counters.atualizados}`);
  console.log(`  ${c.magenta}preservados:${c.reset}  ${counters.preservados} ${c.dim}(customizacao do usuario)${c.reset}`);
  console.log(`  ${c.dim}pulados:${c.reset}      ${counters.pulados}`);
  if (counters.erros > 0) console.log(`  ${c.red}erros:${c.reset}        ${counters.erros}`);
  console.log('');
}

async function install() {
  banner();
  log(`instalando ROLDAO-METHOD em: ${c.bold}${CWD}${c.reset}`);
  if (isDangerousCwd()) {
    err(`recusa: diretorio atual (${CWD}) parece sensivel (raiz, home, system).`);
    err('rode dentro de uma pasta de projeto.');
    process.exit(2);
  }
  const tools = detectTools();
  if (tools.length === 0) {
    log(`${c.yellow}nenhuma IDE/CLI detectada${c.reset} — instalando estrutura padrao (Claude Code).`);
    log(`${c.dim}suportadas: Claude Code, Cursor, Windsurf, Continue, Aider, Cline, Roo${c.reset}`);
  } else {
    log(`detectado: ${c.green}${tools.join(', ')}${c.reset}`);
  }

  if (!fs.existsSync(TEMPLATES_DIR)) {
    err(`pasta de templates nao encontrada: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  if (!YES && !FORCE) {
    const a = await ask(`${c.bold}Confirmar instalacao em ${CWD}?${c.reset} [s/N] `);
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }

  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'install');
  }

  resumo();

  if (DRY_RUN) { log(`${c.yellow}dry-run: nenhuma mudanca aplicada.${c.reset}`); return; }
  ok('instalacao concluida.');
  console.log('');
  console.log(`${c.bold}Proximos passos:${c.reset}`);
  console.log(`  ${c.cyan}1.${c.reset} ler ${c.bold}AGENTS.md${c.reset} — seu documento-contrato`);
  console.log(`  ${c.cyan}2.${c.reset} ajustar ${c.bold}REGRAS-INEGOCIAVEIS.md${c.reset} ao seu projeto`);
  console.log(`  ${c.cyan}3.${c.reset} ativar estilo PT-BR: ${c.dim}/output-style no Claude Code -> pt-br-conciso${c.reset}`);
  console.log(`  ${c.cyan}4.${c.reset} usar ${c.green}/inicio /feature /bug /refactor /auditoria /historia /brownfield /qa /retro /prd /epico /quick-dev${c.reset}`);
  console.log('');
  console.log(`${c.dim}docs: https://github.com/roldaobatista/roldao-method${c.reset}`);
  console.log('');
}

async function update() {
  log(`atualizando ROLDAO-METHOD em: ${CWD}`);
  if (!YES && !FORCE) {
    const a = await ask('Update sobrescreve arquivos do framework (preservando AGENTS.md, CLAUDE.md, REGRAS, settings.local.json). Backup em *.bak. Confirmar? [s/N] ');
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }
  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'update');
  }
  resumo();
  if (DRY_RUN) { log('dry-run: nenhuma mudanca aplicada.'); return; }
  log('update concluido.');
  log('arquivos do usuario preservados (AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md, settings.local.json).');
  log('arquivos sobrescritos tem .bak ao lado.');
}

function doctor() {
  banner();
  log(`diagnostico em: ${c.bold}${CWD}${c.reset}`);
  const checks = [
    { path: '.claude/settings.json', exigido: true },
    { path: '.claude/agents/dev-senior.md', exigido: true },
    { path: '.claude/agents/investigador.md', exigido: true },
    { path: '.claude/hooks/anti-mascaramento.sh', exigido: true },
    { path: '.claude/hooks/block-destructive.sh', exigido: true },
    { path: '.claude/hooks/secrets-scanner.sh', exigido: true },
    { path: '.claude/hooks/_test-runner.sh', exigido: true },
    { path: '.claude/hooks/no-test-data-in-fixtures.sh', exigido: false },
    { path: '.claude/hooks/no-hardcoded-env-urls.sh', exigido: false },
    { path: '.claude/hooks/fiscal-br-validator.sh', exigido: false },
    { path: '.claude/commands/feature.md', exigido: true },
    { path: '.claude/commands/bug.md', exigido: true },
    { path: '.claude/commands/quick-dev.md', exigido: false },
    { path: '.claude/skills/validar-cpf-cnpj/SKILL.md', exigido: true },
    { path: '.specify/memory/constitution.md', exigido: true },
    { path: '.specify/checklists/story-dod.md', exigido: false },
    { path: '.specify/data/kb-pt-br.md', exigido: false },
    { path: 'AGENTS.md', exigido: true },
    { path: 'CLAUDE.md', exigido: true },
    { path: 'REGRAS-INEGOCIAVEIS.md', exigido: true },
  ];
  let okCount = 0; let faltando = 0; let opcionalFaltando = 0;
  for (const ck of checks) {
    const full = path.join(CWD, ck.path);
    const e = fs.existsSync(full);
    if (e) { okCount++; console.log(`  ${c.green}OK   ${c.reset} ${ck.path}`); }
    else if (ck.exigido) { faltando++; console.log(`  ${c.red}FALTA${c.reset} ${ck.path}`); }
    else { opcionalFaltando++; console.log(`  ${c.yellow}NOVO ${c.reset} ${ck.path} ${c.dim}(opcional — v0.4.0+)${c.reset}`); }
  }
  console.log('');
  console.log(`${c.bold}Total:${c.reset} ${checks.length}  |  ${c.green}OK:${c.reset} ${okCount}  |  ${c.red}FALTA:${c.reset} ${faltando}  |  ${c.yellow}NOVO:${c.reset} ${opcionalFaltando}`);
  if (faltando > 0) {
    console.log('');
    log(`execute: ${c.cyan}npx roldao-method install${c.reset} (ou ${c.cyan}update${c.reset})`);
    process.exit(1);
  }
  if (opcionalFaltando > 0) {
    console.log('');
    log(`para incluir os arquivos novos: ${c.cyan}npx roldao-method update${c.reset}`);
  }
  ok('instalacao OK.');
}

async function uninstall() {
  log(`removendo ROLDAO-METHOD de: ${CWD}`);
  if (!YES && !FORCE) {
    const a = await ask('Remove arquivos do framework (preserva AGENTS.md, CLAUDE.md, REGRAS, settings.local.json, .mcp.json, docs/, addons/). Confirmar? [s/N] ');
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }
  const candidatos = [
    '.claude/settings.json',
    '.claude/agents',
    '.claude/hooks',
    '.claude/commands',
    '.claude/skills',
    '.claude/output-styles',
    '.specify/templates',
  ];
  let removidos = 0;
  for (const c of candidatos) {
    const full = path.join(CWD, c);
    if (!fs.existsSync(full)) continue;
    if (DRY_RUN) { console.log(`  REMOVERIA ${c}`); continue; }
    try {
      fs.rmSync(full, { recursive: true, force: true });
      removidos++;
      console.log(`  removido: ${c}`);
    } catch (e) {
      console.log(`  ERRO ${c}: ${e.message}`);
    }
  }
  log(`${removidos} caminho(s) removido(s).`);
  log('arquivos do usuario preservados (AGENTS.md, CLAUDE.md, REGRAS, .mcp.json, settings.local.json).');
}

function help() {
  banner();
  console.log(`${c.bold}Uso:${c.reset}
  ${c.cyan}npx roldao-method install${c.reset}   [--yes] [--force] [--dry-run]   instala no projeto atual
  ${c.cyan}npx roldao-method update${c.reset}    [--yes] [--force] [--dry-run]   atualiza arquivos do framework
  ${c.cyan}npx roldao-method doctor${c.reset}                                    diagnostica instalacao
  ${c.cyan}npx roldao-method uninstall${c.reset} [--yes] [--dry-run]             remove o framework
  ${c.cyan}npx roldao-method help${c.reset}                                      ajuda
  ${c.cyan}npx roldao-method version${c.reset}                                   versao

${c.bold}Flags:${c.reset}
  ${c.yellow}--yes / -y${c.reset}    pula confirmacao (uso em CI)
  ${c.yellow}--force${c.reset}       sobrescreve sem perguntar
  ${c.yellow}--dry-run${c.reset}     so mostra o que faria
  ${c.yellow}--no-color${c.reset}    desativa cores ANSI (ou NO_COLOR=1)

${c.bold}IDEs suportadas:${c.reset} Claude Code, Cursor, Windsurf, Continue, Aider, Cline, Roo

${c.dim}Docs: https://github.com/roldaobatista/roldao-method${c.reset}
`);
}

function version() {
  const pkg = require(path.join(FRAMEWORK_ROOT, 'package.json'));
  console.log(pkg.version);
}

(async () => {
  switch (command) {
    case 'install': await install(); break;
    case 'update': await update(); break;
    case 'doctor': doctor(); break;
    case 'uninstall': await uninstall(); break;
    case 'help': case '--help': case '-h': help(); break;
    case 'version': case '--version': case '-v': version(); break;
    default:
      err(`comando desconhecido: ${command}`);
      help();
      process.exit(1);
  }
})();
