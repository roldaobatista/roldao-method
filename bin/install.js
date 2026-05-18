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

function log(msg) { console.log(`[roldao-method] ${msg}`); }
function warn(msg) { console.warn(`[roldao-method] AVISO: ${msg}`); }
function err(msg) { console.error(`[roldao-method] ERRO: ${msg}`); }

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
  console.log('--- resumo ---');
  console.log(`  criados:      ${counters.criados}`);
  console.log(`  atualizados:  ${counters.atualizados}`);
  console.log(`  preservados:  ${counters.preservados} (customizacao do usuario)`);
  console.log(`  pulados:      ${counters.pulados}`);
  if (counters.erros > 0) console.log(`  erros:        ${counters.erros}`);
  console.log('');
}

async function install() {
  log(`instalando ROLDAO-METHOD em: ${CWD}`);
  if (isDangerousCwd()) {
    err(`recusa: diretorio atual (${CWD}) parece sensivel (raiz, home, system).`);
    err('rode dentro de uma pasta de projeto.');
    process.exit(2);
  }
  const tools = detectTools();
  if (tools.length === 0) log('nenhuma IDE/CLI detectada — instalando estrutura padrao (Claude Code).');
  else log(`detectado: ${tools.join(', ')}`);

  if (!fs.existsSync(TEMPLATES_DIR)) {
    err(`pasta de templates nao encontrada: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  if (!YES && !FORCE) {
    const a = await ask(`Confirmar instalacao em ${CWD}? [s/N] `);
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }

  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'install');
  }

  resumo();

  if (DRY_RUN) { log('dry-run: nenhuma mudanca aplicada.'); return; }
  log('instalacao concluida.');
  log('');
  log('proximos passos:');
  log('  1. ler AGENTS.md — seu documento-contrato');
  log('  2. ajustar REGRAS-INEGOCIAVEIS.md ao seu projeto');
  log('  3. ativar estilo PT-BR: /output-style no Claude Code -> pt-br-conciso');
  log('  4. usar /inicio /feature /bug /refactor /auditoria /historia /brownfield /qa /retro /prd /epico');
  log('');
  log('docs: https://github.com/roldaobatista/roldao-method');
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
  log(`diagnostico em: ${CWD}`);
  const checks = [
    { path: '.claude/settings.json', exigido: true },
    { path: '.claude/agents/dev-senior.md', exigido: true },
    { path: '.claude/agents/investigador.md', exigido: true },
    { path: '.claude/hooks/anti-mascaramento.sh', exigido: true },
    { path: '.claude/hooks/block-destructive.sh', exigido: true },
    { path: '.claude/hooks/secrets-scanner.sh', exigido: true },
    { path: '.claude/hooks/_test-runner.sh', exigido: true },
    { path: '.claude/commands/feature.md', exigido: true },
    { path: '.claude/commands/bug.md', exigido: true },
    { path: '.claude/skills/validar-cpf-cnpj/SKILL.md', exigido: true },
    { path: '.specify/memory/constitution.md', exigido: true },
    { path: 'AGENTS.md', exigido: true },
    { path: 'CLAUDE.md', exigido: true },
    { path: 'REGRAS-INEGOCIAVEIS.md', exigido: true },
  ];
  let ok = 0; let faltando = 0;
  for (const c of checks) {
    const full = path.join(CWD, c.path);
    const e = fs.existsSync(full);
    if (e) { ok++; console.log(`  OK   ${c.path}`); }
    else { faltando++; console.log(`  FALTA ${c.path}`); }
  }
  console.log('');
  console.log(`Total: ${checks.length}  |  OK: ${ok}  |  FALTA: ${faltando}`);
  if (faltando > 0) {
    console.log('');
    log('execute: npx roldao-method install (ou update)');
    process.exit(1);
  }
  log('instalacao OK.');
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
  console.log(`
ROLDAO-METHOD — framework de desenvolvimento agil com IA em PT-BR

Uso:
  npx roldao-method install [--yes] [--force] [--dry-run]   instala no projeto atual
  npx roldao-method update  [--yes] [--force] [--dry-run]   atualiza arquivos do framework
  npx roldao-method doctor                                   diagnostica instalacao
  npx roldao-method uninstall [--yes] [--dry-run]            remove o framework
  npx roldao-method help                                     ajuda
  npx roldao-method version                                  versao

Flags:
  --yes / -y    pula confirmacao (uso em CI)
  --force       sobrescreve sem perguntar
  --dry-run     so mostra o que faria

Docs: https://github.com/roldaobatista/roldao-method
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
