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
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'addon.yaml'));
    });
}

function listAddonsInstalled() {
  // Heuristica: addons instalam agente/hook/skill em .claude/ — detecta pelo agent nomeado do addon
  const installed = [];
  const known = {
    'electron-br': '.claude/agents/electron-arch.md',
    'fiscal-br-completo': '.claude/agents/nfe-arch.md',
    'lgpd-compliance': '.claude/agents/dpo-virtual.md',
    'fintech-br': '.claude/agents/pix-arch.md',
    'esocial-completo': '.claude/agents/esocial-arch.md',
    'varejo-pdv-br': '.claude/agents/pdv-arch.md',
  };
  for (const [name, marker] of Object.entries(known)) {
    if (fs.existsSync(path.join(CWD, marker))) installed.push(name);
  }
  return installed;
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

  // Wizard interativo (apenas se TTY + sem --yes/--force)
  let perfil = 'default';
  let addonsEscolhidos = [];
  if (!YES && !FORCE && process.stdin.isTTY) {
    perfil = await askMenu(
      'Qual o perfil do projeto?',
      ['Generico (sem addon)', 'Electron (desktop offline)', 'Fiscal/NF-e', 'Fintech/Pix', 'LGPD-strict', 'eSocial/folha', 'Varejo/PDV', 'Customizar (escolho depois)']
    );
    const map = {
      'Electron (desktop offline)': ['electron-br'],
      'Fiscal/NF-e': ['fiscal-br-completo'],
      'Fintech/Pix': ['fintech-br'],
      'LGPD-strict': ['lgpd-compliance'],
      'eSocial/folha': ['esocial-completo'],
      'Varejo/PDV': ['varejo-pdv-br', 'fiscal-br-completo'],
    };
    addonsEscolhidos = map[perfil] || [];

    const a = await ask(`${c.bold}Confirmar instalacao em ${CWD}?${c.reset} [s/N] `);
    if (a.toLowerCase() !== 's') { log('cancelado.'); return; }
  }

  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
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
  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
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
