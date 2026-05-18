#!/usr/bin/env node
/**
 * roldao-method — CLI
 *
 * Comandos:
 *   install      copia templates pro projeto (preserva arquivos do usuario)
 *   update       sobrescreve arquivos do framework, preserva customizacoes
 *   add <addon>  instala addon especifico (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br)
 *   list         lista IDEs detectadas, addons disponiveis, versao remota
 *   doctor       diagnostica instalacao
 *   uninstall    remove arquivos do framework, preserva customizacoes
 *   help/version
 *
 * Flags:
 *   --yes/-y     pula confirmacao interativa (uso em CI)
 *   --force      sobrescreve em cima sem perguntar
 *   --dry-run    so mostra o que faria
 *   --no-color   desativa cores ANSI
 *
 * Bin tambem disponivel como 'roldao' (alias curto).
 */

// Checa Node 18+ antes de qualquer require — usa fs basico so depois.
// Mensagem em PT-BR pra usuario nao-tecnico entender o que fazer.
(function checkNodeVersion() {
  const required = 18;
  const current = process.versions && process.versions.node;
  if (!current) return;
  const major = parseInt(current.split('.')[0], 10);
  if (isNaN(major) || major >= required) return;
  process.stderr.write(
    '\n[roldao-method] Node ' + required + '+ necessario. Voce esta usando: ' + current + '\n' +
    '\n' +
    'Como atualizar:\n' +
    '  - Windows/macOS: baixe instalador em https://nodejs.org (versao LTS)\n' +
    '  - Linux: use nvm (https://github.com/nvm-sh/nvm) ou pacote da distro\n' +
    '\n' +
    'Depois rode novamente: npx roldao-method install\n\n'
  );
  process.exit(1);
})();

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const https = require('https');

const FRAMEWORK_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(FRAMEWORK_ROOT, 'templates');
const ADDONS_DIR = path.join(FRAMEWORK_ROOT, 'addons');
const CWD = process.cwd();

const rawArgs = process.argv.slice(2);
const positional = rawArgs.filter((a) => !a.startsWith('-'));
const command = positional[0] || 'install';
const subArg = positional[1];
const flags = new Set(rawArgs.filter((a) => a.startsWith('-')));
const YES = flags.has('--yes') || flags.has('-y');
const FORCE = flags.has('--force');
const DRY_RUN = flags.has('--dry-run');
const NO_COLOR = flags.has('--no-color') || process.env.NO_COLOR === '1';

// Windows moderno (Terminal/Git Bash/VS Code) suporta ANSI; isTTY ja cobre o caso CMD/PowerShell sem TTY.
const supportsColor = !NO_COLOR && process.stdout.isTTY;
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
    err('sem TTY e sem --yes/-y. Use --yes em CI/script.');
    process.exit(2);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

async function askMenu(question, options) {
  if (YES) return options[0];
  if (!process.stdin.isTTY) return options[0];
  console.log(`\n${c.bold}${question}${c.reset}`);
  options.forEach((opt, i) => console.log(`  ${c.cyan}${i + 1}.${c.reset} ${opt}`));
  const a = await ask(`Escolha [1-${options.length}]: `);
  const n = parseInt(a, 10);
  if (n >= 1 && n <= options.length) return options[n - 1];
  return options[0];
}

// Em Windows, hooks bash/perl so rodam dentro de Git Bash. PowerShell e CMD
// nao executam .sh — o Claude Code chama os hooks via shell, e sem Git Bash
// no PATH eles falham silenciosamente (cliente acha que esta protegido, nao
// esta). Detectar via MSYSTEM (setado pelo Git Bash/MSYS2) e SHELL.
function isWindowsWithoutBash() {
  if (process.platform !== 'win32') return false;
  if (process.env.MSYSTEM) return false;        // Git Bash, MSYS2, Cygwin
  if ((process.env.SHELL || '').toLowerCase().includes('bash')) return false;
  return true;
}

function warnWindowsShell() {
  if (!isWindowsWithoutBash()) return;
  console.log('');
  console.log(`${c.yellow}${c.bold}AVISO — Windows sem Git Bash detectado.${c.reset}`);
  console.log(`${c.yellow}Os hooks de protecao (21 bloqueadores) ${c.bold}NAO vao rodar${c.reset}${c.yellow} em PowerShell ou CMD.${c.reset}`);
  console.log('');
  console.log(`Para ativar a protecao do framework:`);
  console.log(`  ${c.cyan}1.${c.reset} Instale Git for Windows: ${c.dim}https://git-scm.com/download/win${c.reset}`);
  console.log(`  ${c.cyan}2.${c.reset} Abra ${c.bold}Git Bash${c.reset} (nao PowerShell, nao CMD)`);
  console.log(`  ${c.cyan}3.${c.reset} Rode o Claude Code dentro do Git Bash`);
  console.log('');
  console.log(`${c.dim}Confira a deteccao com: npx roldao-method doctor${c.reset}`);
  console.log('');
}

function detectTools() {
  const tools = [];
  if (fs.existsSync(path.join(CWD, '.claude'))) tools.push('claude-code');
  if (fs.existsSync(path.join(CWD, '.cursor'))) tools.push('cursor');
  if (fs.existsSync(path.join(CWD, '.windsurf'))) tools.push('windsurf');
  if (fs.existsSync(path.join(CWD, '.continue'))) tools.push('continue');
  if (fs.existsSync(path.join(CWD, '.aider.conf.yml'))) tools.push('aider');
  if (fs.existsSync(path.join(CWD, '.clinerules')) || fs.existsSync(path.join(CWD, '.cline'))) tools.push('cline');
  if (fs.existsSync(path.join(CWD, '.roorules')) || fs.existsSync(path.join(CWD, '.roo'))) tools.push('roo');
  return tools;
}

// Mapa de adapter -> entries de templates/ que pertencem a ele.
// Entries fora deste mapa (AGENTS.md, CLAUDE.md, .specify/, .claude-plugin/, etc)
// sao "core" e instalam SEMPRE.
const ADAPTER_ENTRIES = {
  'claude-code': ['.claude'],
  cursor: ['.cursor'],
  windsurf: ['.windsurf'],
  continue: ['.continue'],
  aider: ['.aider.conf.yml'],
  cline: ['.clinerules'],
  roo: ['.roorules'],
};

const ALL_ADAPTERS = Object.keys(ADAPTER_ENTRIES);

function entryBelongsToAdapter(entry) {
  for (const [adapter, entries] of Object.entries(ADAPTER_ENTRIES)) {
    if (entries.includes(entry)) return adapter;
  }
  return null;
}

// Resolve quais adapters instalar:
//  - --all-adapters: todos
//  - --adapters=cursor,windsurf: lista explicita (claude-code sempre incluso)
//  - detecta IDE no CWD: instala detectadas + claude-code
//  - nada detectado: so claude-code (padrao)
function resolveAdapters() {
  if (rawArgs.some((a) => a === '--all-adapters')) return ALL_ADAPTERS;
  const explicit = rawArgs.find((a) => a.startsWith('--adapters='));
  if (explicit) {
    const list = explicit.slice('--adapters='.length).split(',').map((s) => s.trim()).filter(Boolean);
    const valid = list.filter((a) => ALL_ADAPTERS.includes(a));
    if (!valid.includes('claude-code')) valid.unshift('claude-code');
    return valid;
  }
  const detected = detectTools();
  if (detected.length === 0) return ['claude-code'];
  if (!detected.includes('claude-code')) detected.unshift('claude-code');
  return detected;
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

  if (mode === 'install' && !FORCE) {
    counters.pulados++;
    detalhes.pulados.push(`${rel} (ja existe)`);
    return;
  }

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

  const bak = `${dest}.bak`;
  try {
    fs.copyFileSync(dest, bak);
  } catch (e) {
    // CRITICO: nao sobrescrever sem backup. Se backup falhou (permissao,
    // disco cheio, NTFS travado), preservar arquivo do usuario. Cliente
    // pode reaplicar a atualizacao depois de corrigir o ambiente, OU
    // forcar com --force pra aceitar o risco explicitamente.
    if (!FORCE) {
      detalhes.erros.push(`${rel}: backup falhou (${e.message}) — arquivo PRESERVADO. Use --force para sobrescrever mesmo assim.`);
      counters.erros++;
      return;
    }
    detalhes.erros.push(`${rel}: backup falhou (${e.message}) — sobrescrito com --force`);
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

function fetchRemoteVersion(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = https.get('https://registry.npmjs.org/roldao-method/latest', { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.version || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function checkUpdate() {
  const pkg = require(path.join(FRAMEWORK_ROOT, 'package.json'));
  const local = pkg.version;
  const remote = await fetchRemoteVersion();
  if (!remote) return;
  if (remote === local) return;
  // Comparação simples X.Y.Z
  const cmp = (a, b) => {
    const aa = a.split('.').map(Number);
    const bb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((aa[i] || 0) !== (bb[i] || 0)) return (aa[i] || 0) - (bb[i] || 0);
    }
    return 0;
  };
  if (cmp(remote, local) > 0) {
    console.log('');
    console.log(`${c.yellow}╔════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.yellow}║${c.reset}  ${c.bold}Nova versao disponivel:${c.reset} ${c.green}v${remote}${c.reset} (voce: v${local})  ${c.yellow}║${c.reset}`);
    console.log(`${c.yellow}║${c.reset}  Rode: ${c.cyan}npx roldao-method@latest update${c.reset}        ${c.yellow}║${c.reset}`);
    console.log(`${c.yellow}╚════════════════════════════════════════════════════╝${c.reset}`);
    console.log('');
  }
}

function listAddonsAvailable() {
  if (!fs.existsSync(ADDONS_DIR)) return [];
  return fs
    .readdirSync(ADDONS_DIR)
    .filter((f) => {
      const p = path.join(ADDONS_DIR, f);
      if (!fs.statSync(p).isDirectory()) return false;
      return fs.existsSync(path.join(p, 'addon.yaml'));
    });
}

// Le o primeiro agent listado em provoca: do addon.yaml — usamos como marker
// pra detectar instalacao sem precisar de lista hardcoded no CLI.
function addonMarker(addonName) {
  const yamlPath = path.join(ADDONS_DIR, addonName, 'addon.yaml');
  if (!fs.existsSync(yamlPath)) return null;
  const text = fs.readFileSync(yamlPath, 'utf8');
  // procura bloco "provoca:" seguido de "agents:" com primeiro item "- nome"
  const m = text.match(/^provoca:\s*$[\s\S]*?^\s*agents:\s*$\s*-\s*([\w-]+)/m);
  return m ? `.claude/agents/${m[1]}.md` : null;
}

function listAddonsInstalled() {
  const installed = [];
  for (const name of listAddonsAvailable()) {
    const marker = addonMarker(name);
    if (marker && fs.existsSync(path.join(CWD, marker))) installed.push(name);
  }
  return installed;
}

// Carrega perfis de instalacao do arquivo data-driven addons/profiles.json.
// Fallback minimo se arquivo nao existir (defensivo, nao deveria acontecer).
function loadProfiles() {
  const profilesFile = path.join(ADDONS_DIR, 'profiles.json');
  if (!fs.existsSync(profilesFile)) {
    return [{ label: 'Genérico (sem addon)', addons: [] }];
  }
  try {
    const data = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
    if (!Array.isArray(data.perfis)) return [{ label: 'Genérico (sem addon)', addons: [] }];
    return data.perfis;
  } catch {
    return [{ label: 'Genérico (sem addon)', addons: [] }];
  }
}

async function install() {
  banner();
  log(`instalando ROLDAO-METHOD em: ${c.bold}${CWD}${c.reset}`);
  if (isDangerousCwd()) {
    err(`recusa: diretorio atual (${CWD}) parece sensivel (raiz, home, system).`);
    err('rode dentro de uma pasta de projeto.');
    process.exit(2);
  }

  // Update check assincrono em background — nao bloqueia
  checkUpdate().catch(() => {});

  const tools = detectTools();
  const adapters = resolveAdapters();
  if (tools.length === 0) {
    log(`${c.yellow}nenhuma IDE/CLI detectada${c.reset} — instalando ${c.bold}Claude Code${c.reset} (padrao).`);
    log(`${c.dim}para outros adapters use --adapters=cursor,windsurf ou --all-adapters${c.reset}`);
  } else {
    log(`detectado: ${c.green}${tools.join(', ')}${c.reset}`);
  }
  log(`adapters a instalar: ${c.cyan}${adapters.join(', ')}${c.reset}`);
  const nonClaude = adapters.filter((a) => a !== 'claude-code');
  if (nonClaude.length > 0) {
    log(`${c.dim}nota: em ${nonClaude.join(', ')}, hooks/skills/slash do Claude Code nao rodam — disciplina vem por prompt.${c.reset}`);
  }

  if (!fs.existsSync(TEMPLATES_DIR)) {
    err(`pasta de templates nao encontrada: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  // Wizard interativo (apenas se TTY + sem --yes/--force).
  // Perfis vem de addons/profiles.json — data-driven, sem hardcode no CLI.
  let addonsEscolhidos = [];
  if (!YES && !FORCE && process.stdin.isTTY) {
    const perfis = loadProfiles();
    const escolhido = await askMenu('Qual o perfil do projeto?', perfis.map((p) => p.label));
    const matched = perfis.find((p) => p.label === escolhido);
    addonsEscolhidos = matched ? matched.addons : [];

    const a = await ask(`${c.bold}Confirmar instalacao em ${CWD}?${c.reset} [s/N] `);
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }

  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    const adapter = entryBelongsToAdapter(entry);
    if (adapter && !adapters.includes(adapter)) continue;
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'install');
  }

  resumo();

  // Instala addons do perfil
  for (const addonName of addonsEscolhidos) {
    log(`instalando addon ${c.cyan}${addonName}${c.reset}...`);
    await installAddon(addonName, true);
  }

  if (DRY_RUN) { log(`${c.yellow}dry-run: nenhuma mudanca aplicada.${c.reset}`); return; }
  ok('instalacao concluida.');
  warnWindowsShell();
  console.log('');
  console.log(`${c.bold}Proximos passos:${c.reset}`);
  console.log(`  ${c.cyan}1.${c.reset} ler ${c.bold}AGENTS.md${c.reset} — seu documento-contrato`);
  console.log(`  ${c.cyan}2.${c.reset} ajustar ${c.bold}REGRAS-INEGOCIAVEIS.md${c.reset} ao seu projeto`);
  console.log(`  ${c.cyan}3.${c.reset} ativar estilo PT-BR: ${c.dim}/output-style no Claude Code -> pt-br-conciso${c.reset}`);
  console.log(`  ${c.cyan}4.${c.reset} listar comandos: ${c.green}/help${c.reset} (catalogo dos 19 workflows)`);
  console.log(`  ${c.cyan}5.${c.reset} adicionar addon: ${c.cyan}npx roldao-method add <addon>${c.reset}`);
  console.log('');
  console.log(`${c.dim}docs: https://github.com/roldaobatista/roldao-method${c.reset}`);
  console.log('');
}

async function update() {
  log(`atualizando ROLDAO-METHOD em: ${CWD}`);
  checkUpdate().catch(() => {});
  if (!YES && !FORCE) {
    const a = await ask('Update sobrescreve arquivos do framework (preservando AGENTS.md, CLAUDE.md, REGRAS, settings.local.json). Backup em *.bak. Confirmar? [s/N] ');
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }
  // Atualiza so adapters detectados no projeto (ou os pedidos via flag).
  // Evita "ressuscitar" pastas de IDE que o usuario nao usa.
  const adapters = resolveAdapters();
  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    const adapter = entryBelongsToAdapter(entry);
    if (adapter && !adapters.includes(adapter)) continue;
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'update');
  }
  resumo();
  if (DRY_RUN) { log('dry-run: nenhuma mudanca aplicada.'); return; }
  log('update concluido.');
  log('arquivos do usuario preservados (AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md, settings.local.json).');
  log('arquivos sobrescritos tem .bak ao lado.');
}

async function installAddon(name, skipConfirm = false) {
  const available = listAddonsAvailable();
  if (!available.includes(name)) {
    err(`addon desconhecido: ${name}`);
    log(`disponiveis: ${available.join(', ')}`);
    process.exit(1);
  }
  const addonDir = path.join(ADDONS_DIR, name);
  log(`instalando addon ${c.bold}${name}${c.reset} de ${addonDir}`);

  if (!skipConfirm && !YES && !FORCE) {
    const a = await ask(`Confirmar instalacao do addon ${name}? [s/N] `);
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }

  // Copia .claude/ do addon pro .claude/ do projeto (merge)
  const addonClaudeDir = path.join(addonDir, '.claude');
  if (fs.existsSync(addonClaudeDir)) {
    walkAndCopy(addonClaudeDir, path.join(CWD, '.claude'), 'install');
  }
  // Copia templates/ do addon se houver
  const addonTemplatesDir = path.join(addonDir, 'templates');
  if (fs.existsSync(addonTemplatesDir)) {
    walkAndCopy(addonTemplatesDir, path.join(CWD, 'addons', name, 'templates'), 'install');
  }
  // Copia README.md e addon.yaml pro projeto
  const readmeSrc = path.join(addonDir, 'README.md');
  const yamlSrc = path.join(addonDir, 'addon.yaml');
  if (fs.existsSync(readmeSrc)) {
    walkAndCopy(readmeSrc, path.join(CWD, 'addons', name, 'README.md'), 'install');
  }
  if (fs.existsSync(yamlSrc)) {
    walkAndCopy(yamlSrc, path.join(CWD, 'addons', name, 'addon.yaml'), 'install');
  }
  resumo();
  ok(`addon ${name} instalado.`);
  log(`Veja: ${c.cyan}addons/${name}/README.md${c.reset} pra detalhes.`);
}

async function listCommand() {
  banner();
  const tools = detectTools();
  console.log(`${c.bold}IDEs detectadas no projeto:${c.reset}`);
  if (tools.length === 0) {
    console.log(`  ${c.dim}(nenhuma — instalacao padrao copia .claude/)${c.reset}`);
  } else {
    tools.forEach((t) => console.log(`  ${c.green}✓${c.reset} ${t}`));
  }
  console.log('');

  const available = listAddonsAvailable();
  const installed = listAddonsInstalled();
  console.log(`${c.bold}Addons (${available.length} disponiveis):${c.reset}`);
  for (const addon of available) {
    const inst = installed.includes(addon);
    const yamlPath = path.join(ADDONS_DIR, addon, 'addon.yaml');
    let desc = '';
    try {
      const ymlContent = fs.readFileSync(yamlPath, 'utf8');
      const descMatch = ymlContent.match(/description:\s*(.+)/);
      if (descMatch) desc = descMatch[1].trim().substring(0, 80);
    } catch {}
    const flag = inst ? `${c.green}[instalado]${c.reset}` : `${c.dim}[disponivel]${c.reset}`;
    console.log(`  ${flag} ${c.cyan}${addon}${c.reset} ${c.dim}${desc}${c.reset}`);
  }
  console.log('');

  const pkg = require(path.join(FRAMEWORK_ROOT, 'package.json'));
  console.log(`${c.bold}Versao local:${c.reset} ${c.green}v${pkg.version}${c.reset}`);
  const remote = await fetchRemoteVersion(3000);
  if (remote) {
    if (remote !== pkg.version) {
      console.log(`${c.bold}Versao remota:${c.reset} ${c.yellow}v${remote}${c.reset} ${c.yellow}(atualizar!)${c.reset}`);
    } else {
      console.log(`${c.bold}Versao remota:${c.reset} ${c.green}v${remote}${c.reset} ${c.dim}(atualizado)${c.reset}`);
    }
  } else {
    console.log(`${c.bold}Versao remota:${c.reset} ${c.dim}(npm registry indisponivel)${c.reset}`);
  }
  console.log('');
  console.log(`${c.bold}Comandos uteis:${c.reset}`);
  console.log(`  ${c.cyan}npx roldao-method add <addon>${c.reset}    instalar addon`);
  console.log(`  ${c.cyan}npx roldao-method update${c.reset}         atualizar framework`);
  console.log(`  ${c.cyan}npx roldao-method doctor${c.reset}         diagnosticar instalacao`);
  console.log('');
}

function doctor() {
  banner();
  log(`diagnostico em: ${c.bold}${CWD}${c.reset}`);
  const checks = [
    { path: '.claude/settings.json', exigido: true },
    { path: '.claude/agents/dev-senior.md', exigido: true },
    { path: '.claude/agents/investigador.md', exigido: true },
    { path: '.claude/agents/tech-writer.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/anti-mascaramento.sh', exigido: true },
    { path: '.claude/hooks/block-destructive.sh', exigido: true },
    { path: '.claude/hooks/secrets-scanner.sh', exigido: true },
    { path: '.claude/hooks/_test-runner.sh', exigido: true },
    { path: '.claude/hooks/no-test-data-in-fixtures.sh', exigido: false, label: 'v0.4+' },
    { path: '.claude/hooks/no-hardcoded-env-urls.sh', exigido: false, label: 'v0.4+' },
    { path: '.claude/hooks/fiscal-br-validator.sh', exigido: false, label: 'v0.4+' },
    { path: '.claude/hooks/block-jargon-pt-br.sh', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/block-secrets-in-commit-message.sh', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/block-confirmation-questions.sh', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/require-investigador-before-fix.sh', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/validate-test-pyramid.sh', exigido: false, label: 'v0.5+' },
    { path: '.claude/commands/feature.md', exigido: true },
    { path: '.claude/commands/bug.md', exigido: true },
    { path: '.claude/commands/quick-dev.md', exigido: false, label: 'v0.4+' },
    { path: '.claude/commands/help.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/commands/sprint.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/skills/validar-cpf-cnpj/SKILL.md', exigido: true },
    { path: '.claude/skills/brainstormar-ideia/SKILL.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/skills/gerar-test-fixture-br/SKILL.md', exigido: false, label: 'v0.5+' },
    { path: '.specify/memory/constitution.md', exigido: true },
    { path: '.specify/checklists/story-dod.md', exigido: false, label: 'v0.4+' },
    { path: '.specify/checklists/release-readiness.md', exigido: false, label: 'v0.5+' },
    { path: '.specify/data/kb-pt-br.md', exigido: false, label: 'v0.4+' },
    { path: '.specify/data/kb-brainstorming-pt-br.md', exigido: false, label: 'v0.5+' },
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
    else {
      opcionalFaltando++;
      console.log(`  ${c.yellow}NOVO ${c.reset} ${ck.path} ${c.dim}(opcional — ${ck.label || ''})${c.reset}`);
    }
  }
  console.log('');

  // Check bash + perl no Windows
  if (process.platform === 'win32') {
    const { execSync } = require('child_process');
    if (isWindowsWithoutBash()) {
      console.log(`  ${c.yellow}AVISO${c.reset} parece que este terminal nao e Git Bash (MSYSTEM/SHELL nao detectado).`);
      console.log(`         Em PowerShell/CMD, hooks .sh ${c.bold}nao executam${c.reset} — abra Git Bash antes.`);
      faltando++;
    }
    try {
      execSync('bash --version', { stdio: 'pipe' });
      console.log(`  ${c.green}OK   ${c.reset} bash disponivel (Git Bash)`);
    } catch {
      console.log(`  ${c.red}FALTA${c.reset} bash — hooks nao vao funcionar. Instale Git for Windows.`);
      faltando++;
    }
    try {
      execSync('perl --version', { stdio: 'pipe' });
      console.log(`  ${c.green}OK   ${c.reset} perl disponivel`);
    } catch {
      console.log(`  ${c.red}FALTA${c.reset} perl — hooks usam perl -MJSON::PP. Instale Strawberry Perl ou use Git Bash.`);
      faltando++;
    }
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
    '.claude/_meta',
    '.specify/templates',
  ];
  let removidos = 0;
  for (const p of candidatos) {
    const full = path.join(CWD, p);
    if (!fs.existsSync(full)) continue;
    if (DRY_RUN) { console.log(`  REMOVERIA ${p}`); continue; }
    try {
      fs.rmSync(full, { recursive: true, force: true });
      removidos++;
      console.log(`  removido: ${p}`);
    } catch (e) {
      console.log(`  ERRO ${p}: ${e.message}`);
    }
  }
  log(`${removidos} caminho(s) removido(s).`);
  log('arquivos do usuario preservados (AGENTS.md, CLAUDE.md, REGRAS, .mcp.json, settings.local.json).');
}

function help() {
  banner();
  console.log(`${c.bold}Uso:${c.reset}
  ${c.cyan}npx roldao-method install${c.reset}        [--yes] [--force] [--dry-run]   instala no projeto atual
  ${c.cyan}npx roldao-method update${c.reset}         [--yes] [--force] [--dry-run]   atualiza arquivos do framework
  ${c.cyan}npx roldao-method add <addon>${c.reset}    [--yes]                          instala addon especifico
  ${c.cyan}npx roldao-method list${c.reset}                                             lista IDEs + addons + versao remota
  ${c.cyan}npx roldao-method doctor${c.reset}                                            diagnostica instalacao
  ${c.cyan}npx roldao-method uninstall${c.reset}      [--yes] [--dry-run]              remove o framework
  ${c.cyan}npx roldao-method help${c.reset}                                              ajuda
  ${c.cyan}npx roldao-method version${c.reset}                                           versao

${c.bold}Alias:${c.reset} comando tambem aceita ${c.cyan}roldao${c.reset} (mais curto).

${c.bold}Flags:${c.reset}
  ${c.yellow}--yes / -y${c.reset}    pula confirmacao (uso em CI)
  ${c.yellow}--force${c.reset}       sobrescreve sem perguntar
  ${c.yellow}--dry-run${c.reset}     so mostra o que faria
  ${c.yellow}--no-color${c.reset}    desativa cores ANSI (ou NO_COLOR=1)

${c.bold}Addons disponiveis:${c.reset}
  ${c.cyan}electron-br${c.reset}            Desktop Electron + SQLite + LGPD offline
  ${c.cyan}fiscal-br-completo${c.reset}     NF-e/NFC-e/NFS-e, Reforma 2026, CNPJ alfanumerico
  ${c.cyan}lgpd-compliance${c.reset}        DPO virtual, RIPD, canal titular, incidente 72h
  ${c.cyan}fintech-br${c.reset}             Pix completo + Open Finance + webhook HMAC
  ${c.cyan}esocial-completo${c.reset}       Eventos S-1000 a S-3000, CIPA, NRs, prazo legal
  ${c.cyan}varejo-pdv-br${c.reset}          SAT-CF-e, NFC-e, TEF, balanca/impressora

${c.bold}IDEs suportadas:${c.reset} Claude Code, Cursor, Windsurf, Continue, Aider, Cline, Roo

${c.bold}Requisito Windows:${c.reset} Git for Windows (Git Bash) — hooks usam bash + perl.

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
    case 'add':
      if (!subArg) { err('uso: add <nome-do-addon>'); help(); process.exit(1); }
      await installAddon(subArg);
      break;
    case 'list': await listCommand(); break;
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
