#!/usr/bin/env node
/**
 * roldao-method — CLI
 *
 * Comandos:
 *   install      copia templates pro projeto (preserva arquivos do usuario)
 *   update       sobrescreve arquivos do framework, preserva customizacoes
 *   add <addon>  instala addon especifico (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br, healthtech-br beta). Lista dinâmica via `search`.
 *   remove <add> remove um addon especifico (preserva o framework core)
 *   search [t]   lista addons disponiveis (filtra por termo opcional)
 *   list         lista IDEs detectadas, addons disponiveis, versao remota
 *   tasks-to-issues  exporta tasks T-NNN de docs/stories/ pra GitHub Issues (idempotente)
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

// Gate de versão Node. Único require permitido antes desta linha: builtin/lib/* (zero deps).
require('./lib/node-version-check').checkNodeVersion();

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
// --help/--version/-h/-v sao reconhecidos como COMANDO (nao flag) — antes
// caiam no filtro `positional = !startsWith('-')` e nunca chegavam ao switch,
// rodando `install` em vez do help. Auditoria 10-agentes 2ª passada 2026-05-24.
const HELP_FLAGS = new Set(['--help', '-h', '-?']);
const VERSION_FLAGS = new Set(['--version', '-v', '-V']);
const earlyCommand = rawArgs.find((a) => HELP_FLAGS.has(a)) ? 'help'
                   : rawArgs.find((a) => VERSION_FLAGS.has(a)) ? 'version'
                   : null;
const positional = rawArgs.filter((a) => !a.startsWith('-'));
// T-020 (J16): `npx roldao-method` sem argumentos em TTY interativo mostra
// menu de proximos passos em vez de cair em `install` cego. Em CI/script
// (sem TTY) continua default = install pra nao quebrar pipelines.
const isInteractiveBare = rawArgs.length === 0 && process.stdout.isTTY;
const command = earlyCommand || positional[0] || (isInteractiveBare ? 'menu' : 'install');
const subArg = positional[1];
const flags = new Set(rawArgs.filter((a) => a.startsWith('-') && !HELP_FLAGS.has(a) && !VERSION_FLAGS.has(a)));
const YES = flags.has('--yes') || flags.has('-y');
const FORCE = flags.has('--force');
const DRY_RUN = flags.has('--dry-run');
const NO_COLOR = flags.has('--no-color') || process.env.NO_COLOR === '1';
const QUIET = flags.has('--quiet') || flags.has('-q') || process.env.ROLDAO_QUIET === '1';
// --ascii substitui glifos Unicode (✓ ✗ ⚠ ╔═╗) por equivalentes ASCII ([OK] [X] [!] +-+).
// Necessário em CMD legacy Windows sem `chcp 65001`, PuTTY antigo, SSH com gateway
// que stripa UTF-8, e leitor de tela. Acoplado a --no-color porque quem desliga
// cor geralmente está em ambiente restrito. Auditoria 10-agentes 3ª passada 2026-05-24.
const ASCII_ONLY = flags.has('--ascii') || process.env.ROLDAO_ASCII === '1' || NO_COLOR;

// Cores ANSI, glifos com fallback ASCII e lista USER_OWNED.
const c = require('./lib/colors').makeColors({ noColor: NO_COLOR, isTTY: process.stdout.isTTY });
const g = require('./lib/glyphs').makeGlyphs({ noUnicode: ASCII_ONLY });
const { makeSpinner } = require('./lib/spinner');
const { USER_OWNED, isCustomizable } = require('./lib/user-owned');
const snapshotLib = require('./lib/snapshot');
const registry = require('./lib/registry');

let currentSnapshot = null;

function spinner(msg) {
  return makeSpinner({
    isTTY: !!process.stdout.isTTY,
    quiet: QUIET,
    noUnicode: ASCII_ONLY,
  }).start(msg);
}

const counters = { criados: 0, pulados: 0, atualizados: 0, preservados: 0, erros: 0 };
const detalhes = { criados: [], pulados: [], atualizados: [], preservados: [], erros: [] };

function log(msg) { if (!QUIET) console.log(`${c.cyan}[roldao-method]${c.reset} ${msg}`); }
function ok(msg) { if (!QUIET) console.log(`${c.green}${g.ok}${c.reset} ${msg}`); }
function warn(msg) { console.warn(`${c.yellow}[roldao-method]${c.reset} ${c.yellow}AVISO:${c.reset} ${msg}`); }
function err(msg) { console.error(`${c.red}[roldao-method]${c.reset} ${c.red}ERRO:${c.reset} ${msg}`); }

function banner() {
  if (YES || QUIET) return;
  console.log('');
  console.log(`${c.cyan}${c.bold}  ROLDAO-METHOD${c.reset} ${c.dim}— framework de desenvolvimento agil com IA em PT-BR${c.reset}`);
  console.log(`${c.dim}  https://github.com/roldaobatista/roldao-method${c.reset}`);
  console.log('');
}

function ask(question) {
  if (YES) return Promise.resolve('s');
  if (!process.stdin.isTTY) {
    err('estou rodando dentro de um script ou outro programa que nao consegue te perguntar nada (terminal nao-interativo).');
    err('Adicione --yes (ou -y) no final do comando pra eu assumir o caminho padrao seguro.');
    err('Exemplo: npx roldao-method install --yes');
    process.exit(2);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

// Aceita "s", "sim", "y", "yes" como confirmacao positiva. Auditoria 10-agentes
// 3ª passada (2026-05-24): leigo brasileiro digita "sim" e cancela silenciosamente
// porque o codigo so reconhecia "s".
function isYes(answer) {
  const a = String(answer || '').trim().toLowerCase();
  return a === 's' || a === 'sim' || a === 'y' || a === 'yes';
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

// Hooks foram migrados pra Node puro em EP-001 (v1.0). Não usam mais bash/perl.
// Funcionam em PowerShell, CMD, bash, zsh, sh — qualquer shell que execute `node`.
// Gate Windows-sem-Git-Bash de versões anteriores virou ruído: bloqueava
// instalação válida em Win11 default sem benefício real. Removido na auditoria
// 10-agentes de 2026-05-24. Se algum addon legado voltar a usar `.sh`, o aviso
// passa a ser problema desse addon, não do core.

function detectTools() {
  const tools = [];
  if (fs.existsSync(path.join(CWD, '.claude'))) tools.push('claude-code');
  if (fs.existsSync(path.join(CWD, '.cursor'))) tools.push('cursor');
  if (fs.existsSync(path.join(CWD, '.windsurf'))) tools.push('windsurf');
  if (fs.existsSync(path.join(CWD, '.continue'))) tools.push('continue');
  if (fs.existsSync(path.join(CWD, '.aider.conf.yml'))) tools.push('aider');
  if (fs.existsSync(path.join(CWD, '.clinerules')) || fs.existsSync(path.join(CWD, '.cline'))) tools.push('cline');
  if (fs.existsSync(path.join(CWD, '.roorules')) || fs.existsSync(path.join(CWD, '.roo'))) tools.push('roo');
  if (fs.existsSync(path.join(CWD, 'GEMINI.md')) || fs.existsSync(path.join(CWD, '.gemini'))) tools.push('gemini-cli');
  if (fs.existsSync(path.join(CWD, '.codex'))) tools.push('codex-cli');
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
  'gemini-cli': ['GEMINI.md'],
  'codex-cli': ['.codex'],
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
  } catch {
    // Symbol unico por chamada — duas falhas NUNCA dao ===.
    // Antes retornava null, e a===b virava true em "ambos falharam",
    // fazendo o update pular cópia válida (potencial perda de update).
    return Symbol('UNREAD');
  }
}

function isUserOwned(relPath) {
  const norm = relPath.split(path.sep).join('/');
  // Tudo sob .specify/overrides/ e customizacao do projeto: NUNCA sobrescrever
  // no update. Permite ajustar template/regra sem fork do framework.
  if (norm === '.specify/overrides' || norm.startsWith('.specify/overrides/')) return true;
  return USER_OWNED.has(norm);
}

// Garante bit de execucao em scripts shell/Node. npm pack / copyFileSync nao
// preservam +x de forma confiavel — sem isso o Claude Code nao consegue
// invocar os hooks e o cliente Unix fica com TODOS os bloqueadores inertes.
// Pos v1.0 (EP-001), hooks sao .js Node puro — chmod ainda necessario porque
// settings.json chama `node hook.js` (ok sem +x) mas hooks rodam tambem via
// shebang em ambiente que respeita (Unix). Cobre .sh por compatibilidade com
// addons legados que ainda usam bash.
function ensureExecutable(dest) {
  if (process.platform === 'win32') return;
  if (!/\.(sh|js)$/.test(dest)) return;
  if (!dest.includes(`${path.sep}.claude${path.sep}hooks${path.sep}`)) return;
  try { fs.chmodSync(dest, 0o755); } catch { /* best effort */ }
}

// copyFileSync que NUNCA crasha o instalador no meio do walk. Disco cheio,
// EACCES (permissao), EBUSY (NTFS travou) viram entrada em counters.erros
// e a instalacao segue — outros arquivos ainda copiam, e o resumo final
// mostra o que falhou pro cliente reaplicar depois.
function safeCopy(src, dest, rel) {
  try {
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    counters.erros++;
    detalhes.erros.push(`${rel}: copia falhou (${e.code || ''} ${e.message})`);
    return false;
  }
}

// Atomic write em JSON: escreve em arquivo .tmp e renomeia. Se o processo
// morrer no meio, o original fica intacto (rename e operacao atomica em
// POSIX/NTFS). Antes, settings.json corrompia se Ctrl+C cai entre o write
// e o flush — e settings.json corrompido quebra o Claude Code inteiro do projeto.
function atomicWriteJson(filePath, obj) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  // O sufixo aleatorio evita colisao quando 2 addons aplicam patch em paralelo
  // (raro em uso interativo, mas possivel em CI rodando `add a && add b`).
  const tmp = path.join(dir, `.${base}.tmp.${process.pid}.${Date.now()}`);
  const payload = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(tmp, payload, 'utf8');
  fs.renameSync(tmp, filePath);
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
    if (!safeCopy(src, dest, rel)) return;
    ensureExecutable(dest);
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

  // Registra no snapshot ANTES de mexer (rollback precisa do estado anterior).
  if (currentSnapshot && mode === 'update') {
    try { snapshotLib.recordFile(currentSnapshot, CWD, rel, isCustomizable(rel) ? 'customized' : 'updated'); }
    catch { /* best effort — snapshot quebrar nao deve impedir update */ }
  }

  // Arquivo em pasta customizavel (.claude/agents, .claude/commands etc) com hash
  // diferente do template = usuario provavelmente editou. Em vez de .bak simples,
  // gera backup datado e marca como CUSTOMIZADO no resumo pra ele saber.
  let bak = `${dest}.bak`;
  if (mode === 'update' && isCustomizable(path.relative(CWD, dest))) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    bak = `${dest}.customizado.${ts}.bak`;
  }
  // Se ja existe um .bak DIFERENTE do dest atual, esse .bak provavelmente
  // veio de um update anterior — preservar com sufixo timestamp pra nao
  // destruir o backup original do usuario.
  if (fs.existsSync(bak)) {
    try {
      const prevBak = fs.readFileSync(bak);
      const curDest = fs.readFileSync(dest);
      if (!prevBak.equals(curDest)) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        bak = `${dest}.bak.${ts}`;
      }
    } catch { /* se falhar a leitura, segue pro try abaixo */ }
  }
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
  if (!safeCopy(src, dest, rel)) return;
  ensureExecutable(dest);
  counters.atualizados++;
  detalhes.atualizados.push(`${rel} (backup: ${path.basename(bak)})`);
}

// Arquivos de metadado/instalacao do addon que NAO devem ser copiados pro projeto.
// Sao consumidos pelo CLI (ex: settings.json.patch e mesclado em applyAddonSettingsPatch),
// nao pelo Claude Code em runtime.
const ADDON_META_FILES = new Set(['settings.json.patch']);

function walkAndCopy(src, dest, mode, sp) {
  const resolvedCwd = path.resolve(CWD);
  const resolvedDest = path.resolve(dest);
  if (!resolvedDest.startsWith(resolvedCwd + path.sep) && resolvedDest !== resolvedCwd) {
    err(`destino fora do diretorio alvo, abortando: ${dest}`);
    process.exit(2);
  }
  if (ADDON_META_FILES.has(path.basename(src))) return;
  if (sp) {
    const totalFiles = counters.criados + counters.atualizados + counters.pulados + counters.preservados;
    sp.tick(`copiando arquivos... ${totalFiles}`);
  }
  // Permissao negada em src (lstat/readdir) nao deve crashar — registra erro
  // e segue pra outros arquivos. Caso comum em Windows: AV/Defender prendeu.
  let stat;
  try { stat = fs.lstatSync(src); }
  catch (e) {
    counters.erros++;
    detalhes.erros.push(`${path.relative(FRAMEWORK_ROOT, src)}: lstat falhou (${e.code || ''} ${e.message})`);
    return;
  }
  if (stat.isSymbolicLink()) {
    warn(`pulando symlink: ${path.relative(FRAMEWORK_ROOT, src)}`);
    return;
  }
  if (stat.isDirectory()) {
    try {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    } catch (e) {
      counters.erros++;
      detalhes.erros.push(`${path.relative(CWD, dest)}: mkdir falhou (${e.code || ''} ${e.message})`);
      return;
    }
    let entries;
    try { entries = fs.readdirSync(src); }
    catch (e) {
      counters.erros++;
      detalhes.erros.push(`${path.relative(FRAMEWORK_ROOT, src)}: readdir falhou (${e.code || ''} ${e.message})`);
      return;
    }
    for (const entry of entries) {
      walkAndCopy(path.join(src, entry), path.join(dest, entry), mode, sp);
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
          resolve(typeof parsed.version === 'string' ? parsed.version : null);
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
  // Comparação X.Y.Z, ignorando sufixo de pré-release (ex: 0.14.0-rc.1).
  // Sem o strip, split('.').map(Number) produzia NaN e o aviso de update errava.
  const cmp = (a, b) => {
    const core = (v) => String(v).replace(/[-+].*$/, '').split('.');
    const aa = core(a).map((n) => parseInt(n, 10) || 0);
    const bb = core(b).map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) {
      if ((aa[i] || 0) !== (bb[i] || 0)) return (aa[i] || 0) - (bb[i] || 0);
    }
    return 0;
  };
  if (cmp(remote, local) > 0) {
    drawBox([
      `${c.bold}Nova versao disponivel:${c.reset} ${c.green}v${remote}${c.reset} (voce: v${local})`,
      `Rode: ${c.cyan}npx roldao-method@latest update${c.reset}`,
    ], { color: c.yellow });
  }
}

// Desenha caixa ASCII/Unicode com largura dinâmica baseada no conteudo.
// Largura fixa de 52 colunas quebrava com versoes de 3+ digitos (1.10.0) e
// em terminais < 56 colunas. Auditoria 10-agentes 3ª passada 2026-05-24.
function drawBox(lines, { color = '' } = {}) {
  // Calcula largura visível (sem códigos ANSI). Limita a colunas do terminal.
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
  const maxCol = Math.max(40, Math.min(process.stdout.columns || 80, 100));
  const inner = Math.min(maxCol - 4, lines.reduce((m, l) => Math.max(m, stripAnsi(l).length), 0));
  const reset = c.reset;
  const h = g.box.h.repeat(inner + 2);
  console.log('');
  console.log(`${color}${g.box.tl}${h}${g.box.tr}${reset}`);
  for (const line of lines) {
    const visible = stripAnsi(line).length;
    const pad = ' '.repeat(Math.max(0, inner - visible));
    console.log(`${color}${g.box.v}${reset} ${line}${pad} ${color}${g.box.v}${reset}`);
  }
  console.log(`${color}${g.box.bl}${h}${g.box.br}${reset}`);
  console.log('');
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
  // Parser linha-a-linha: localiza "provoca:", entao "agents:" dentro, entao
  // primeiro item "- nome". Regex multilinha previa quebrava em YAMLs validos.
  const lines = text.split(/\r?\n/);
  let inProvoca = false;
  let inAgents = false;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (/^[A-Za-z_][\w-]*:\s*$/.test(line)) {
      inProvoca = /^provoca:\s*$/.test(line);
      inAgents = false;
      continue;
    }
    if (!inProvoca) continue;
    if (/^\s+agents:\s*$/.test(line)) { inAgents = true; continue; }
    if (inAgents) {
      const m = line.match(/^\s+-\s*([\w-]+)\s*$/);
      if (m) return `.claude/agents/${m[1]}.md`;
      if (/^\s+\w[\w-]*:\s*$/.test(line)) inAgents = false;
    }
  }
  return null;
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
    err('"pasta de projeto" = um diretorio com seu codigo dentro (ex: ~/projetos/meu-app),');
    err('NAO sua home (~), nao a raiz do disco (/), nao /tmp.');
    err('Crie ou entre na pasta do projeto primeiro: cd ~/projetos/meu-app && npx roldao-method install');
    process.exit(2);
  }

  // Update check assincrono — guarda a Promise pra aguardar antes do exit final,
  // assim o banner de "nova versao disponivel" nao vaza no meio de outro output.
  const updateCheckP = checkUpdate().catch(() => {});

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
    err('Isso indica instalacao corrompida do pacote npm. Para reinstalar:');
    err('  npm cache clean --force');
    err('  npx roldao-method@latest install');
    err('Se o erro persistir, abra issue em https://github.com/roldaobatista/roldao-method/issues');
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

    // Validacao: addons do perfil precisam existir em addons/ (defensivo contra
    // profiles.json desatualizado). Filtra invalidos com aviso, evita falha
    // tardia em installAddon.
    if (addonsEscolhidos.length) {
      const available = listAddonsAvailable();
      const invalid = addonsEscolhidos.filter((a) => !available.includes(a));
      if (invalid.length) {
        warn(`perfil cita addon(s) inexistente(s): ${invalid.join(', ')} — pulados.`);
        warn(`disponiveis: ${available.join(', ')}`);
        addonsEscolhidos = addonsEscolhidos.filter((a) => available.includes(a));
      }
    }

    const a = await ask(`${c.bold}Confirmar instalacao em ${CWD}?${c.reset} [s/N] `);
    if (!isYes(a)) { log('cancelado.'); return; }
  }

  const t0 = Date.now();
  const sp = spinner('copiando templates do core...');
  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    const adapter = entryBelongsToAdapter(entry);
    if (adapter && !adapters.includes(adapter)) continue;
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'install', sp);
  }
  const totalCore = counters.criados + counters.atualizados + counters.preservados + counters.pulados;
  sp.succeed(`core copiado (${totalCore} arquivos · ${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  resumo();

  // Instala addons do perfil. Falha em um addon nao mata o wizard inteiro —
  // continua e reporta o que falhou no final.
  const addonFailures = [];
  for (const addonName of addonsEscolhidos) {
    log(`instalando addon ${c.cyan}${addonName}${c.reset}...`);
    try {
      await installAddon(addonName, true, true);
    } catch (e) {
      err(`addon ${addonName} falhou (${e.message}); seguindo com o resto`);
      addonFailures.push(addonName);
    }
  }
  if (addonFailures.length) {
    err(`addons que falharam: ${addonFailures.join(', ')} — rode 'add <nome>' depois pra tentar de novo.`);
  }

  if (DRY_RUN) { log(`${c.yellow}dry-run: nenhuma mudanca aplicada.${c.reset}`); return; }
  // Registra projeto no registry global pra `update --all` poder achar depois.
  try { registry.addProject(CWD); } catch { /* best effort */ }
  ok('instalacao concluida.');
  console.log('');
  console.log(`${c.bold}Proximos passos (do mais simples pro mais avancado):${c.reset}`);
  console.log(`  ${c.cyan}1.${c.reset} ${c.green}npx roldao-method tutorial${c.reset}  ${c.dim}— 5 perguntas em PT-BR preenchem o AGENTS.md por voce (2 minutos)${c.reset}`);
  console.log(`  ${c.cyan}2.${c.reset} no Claude Code (ou outro assistente): ${c.green}/inicio${c.reset} pra criar a primeira funcionalidade`);
  console.log(`  ${c.cyan}3.${c.reset} ${c.dim}(se ja tem codigo existente)${c.reset} ${c.green}/brownfield${c.reset} pra adotar no projeto atual`);
  console.log(`  ${c.cyan}4.${c.reset} ${c.dim}(opcional)${c.reset} addons BR: ${c.cyan}npx roldao-method search${c.reset}`);
  console.log('');
  console.log(`${c.bold}Nao programa? Comece aqui:${c.reset}`);
  console.log(`  ${c.cyan}->${c.reset} ${c.green}docs/PARA-DONO-DE-PRODUTO.md${c.reset}  ${c.dim}— manual pro dono de produto que nao escreve codigo${c.reset}`);
  console.log('');
  console.log(`${c.dim}Detalhes tecnicos (CLAUDE.local.md, MCP, GitHub Action): docs/QUICKSTART.md${c.reset}`);
  console.log(`${c.dim}Glossario sem jargao: docs/GLOSSARIO.md${c.reset}`);
  console.log('');
  // Aguarda a checagem de versao terminar (com timeout interno) pra o banner
  // de update aparecer ordenado, sem vazar no meio do output do proximo comando.
  await updateCheckP;
}

async function update() {
  // Flag --all itera todos os projetos no registry global.
  if (rawArgs.includes('--all')) return updateAll();

  log(`atualizando ROLDAO-METHOD em: ${CWD}`);
  // Promise fire-and-forget aguardada no fim — igual a install().
  // Antes era ignorada totalmente e podia vazar no output do proximo comando.
  const updateCheckP = checkUpdate().catch(() => {});
  if (!YES && !FORCE) {
    const a = await ask('Update sobrescreve arquivos do framework (preservando AGENTS.md, CLAUDE.md, REGRAS, settings.local.json). Snapshot criado antes (use `rollback` pra desfazer). Confirmar? [s/N] ');
    if (!isYes(a)) { log('cancelado.'); return; }
  }

  // Cria snapshot ANTES de qualquer mudanca — rollback precisa.
  if (!DRY_RUN) {
    try {
      const pkg = require(path.join(FRAMEWORK_ROOT, 'package.json'));
      currentSnapshot = snapshotLib.createSnapshot({ cwd: CWD, fromVersion: 'instalado', toVersion: pkg.version });
      log(`${c.dim}snapshot criado: ${currentSnapshot}${c.reset}`);
    } catch (e) {
      warn(`falhou ao criar snapshot (${e.message}) — update segue mas rollback nao funcionara.`);
    }
  }

  // Atualiza so adapters detectados no projeto (ou os pedidos via flag).
  // Evita "ressuscitar" pastas de IDE que o usuario nao usa.
  const adapters = resolveAdapters();
  const t0 = Date.now();
  const sp = spinner('atualizando templates...');
  for (const entry of fs.readdirSync(TEMPLATES_DIR)) {
    const adapter = entryBelongsToAdapter(entry);
    if (adapter && !adapters.includes(adapter)) continue;
    walkAndCopy(path.join(TEMPLATES_DIR, entry), path.join(CWD, entry), 'update', sp);
  }
  const total = counters.criados + counters.atualizados + counters.preservados + counters.pulados;
  sp.succeed(`update concluido (${total} arquivos · ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  resumo();
  if (DRY_RUN) { log('dry-run: nenhuma mudanca aplicada.'); return; }
  log('update concluido.');
  log('arquivos do usuario preservados (AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md, settings.local.json).');
  log(`pra desfazer este update: ${c.cyan}npx roldao-method rollback${c.reset}`);
  if (!DRY_RUN) try { registry.markUpdated(CWD); } catch { /* best effort */ }
  currentSnapshot = null;
  await updateCheckP;
}

async function updateAll() {
  const projects = registry.listProjects();
  if (projects.length === 0) {
    log('nenhum projeto registrado ainda. Rode `npx roldao-method install` em cada um pra registrar.');
    return;
  }
  log(`encontrei ${c.bold}${projects.length}${c.reset} projeto(s) registrado(s):`);
  projects.forEach((p, i) => console.log(`  ${c.cyan}${i + 1}.${c.reset} ${p.path} ${c.dim}(ultimo update: ${p.lastUpdate || 'nunca'})${c.reset}`));
  if (!YES && !FORCE) {
    const a = await ask(`Atualizar todos? [s/N] `);
    if (!isYes(a)) { log('cancelado.'); return; }
  }
  let okCount = 0, failCount = 0;
  for (const proj of projects) {
    console.log('');
    log(`${c.bold}=> ${proj.path}${c.reset}`);
    const { spawnSync } = require('child_process');
    const args = [__filename, 'update', '--yes'];
    if (FORCE) args.push('--force');
    if (DRY_RUN) args.push('--dry-run');
    const res = spawnSync(process.execPath, args, { cwd: proj.path, stdio: 'inherit' });
    if (res.status === 0) okCount++;
    else { failCount++; err(`falhou em ${proj.path} (exit=${res.status})`); }
  }
  console.log('');
  if (failCount === 0) ok(`${okCount} projeto(s) atualizados com sucesso.`);
  else warn(`${okCount} OK, ${failCount} falharam. Rode individualmente nos que falharam pra ver detalhe.`);
}

async function rollback() {
  const subId = subArg;
  const snapshots = snapshotLib.listSnapshots(CWD);
  if (snapshots.length === 0) {
    err('nenhum snapshot encontrado neste projeto.');
    err(`snapshots sao criados automaticamente em todo ${c.cyan}npx roldao-method update${c.reset}.`);
    process.exit(1);
  }
  if (rawArgs.includes('--list')) {
    console.log(`${c.bold}Snapshots disponiveis (mais recente primeiro):${c.reset}`);
    snapshots.forEach((s, i) => {
      console.log(`  ${c.cyan}${i + 1}.${c.reset} ${s.id} ${c.dim}(${s.fileCount} arquivo(s))${c.reset}`);
    });
    console.log('');
    console.log(`Pra restaurar: ${c.cyan}npx roldao-method rollback${c.reset} ${c.dim}(ultimo)${c.reset}`);
    console.log(`Pra restaurar especifico: ${c.cyan}npx roldao-method rollback <id>${c.reset}`);
    return;
  }
  const target = subId ? snapshots.find((s) => s.id === subId || s.id.startsWith(subId)) : snapshots[0];
  if (!target) {
    err(`snapshot "${subId}" nao encontrado. Liste com --list.`);
    process.exit(1);
  }
  log(`vou restaurar snapshot: ${c.bold}${target.id}${c.reset} (${target.fileCount} arquivo(s))`);
  if (!YES && !FORCE) {
    const a = await ask(`Confirmar rollback? Isso vai desfazer o ultimo update. [s/N] `);
    if (!isYes(a)) { log('cancelado.'); return; }
  }
  const result = snapshotLib.restoreSnapshot(CWD, target.id);
  if (result.errors.length > 0) {
    warn(`${result.errors.length} erro(s) durante restauracao:`);
    result.errors.forEach((e) => err(`  ${e}`));
  }
  ok(`${result.restored} arquivo(s) restaurado(s) do snapshot ${target.id}.`);
}

async function installAddon(name, skipConfirm = false, throwOnError = false) {
  if (isDangerousCwd(CWD)) {
    err(`recusando addon: pasta sensivel ${CWD}`);
    log('rode dentro de uma pasta de projeto, nao da home/raiz.');
    if (throwOnError) throw new Error('dangerous_cwd');
    process.exit(2);
  }
  const available = listAddonsAvailable();
  if (!available.includes(name)) {
    err(`addon desconhecido: "${name}". Verifique a digitacao.`);
    err(`disponiveis: ${available.join(', ')}`);
    err(`Para ver a lista completa com descricao: ${c.cyan}npx roldao-method search${c.reset}`);
    if (throwOnError) throw new Error('addon_not_found');
    process.exit(1);
  }
  const addonDir = path.join(ADDONS_DIR, name);
  log(`instalando addon ${c.bold}${name}${c.reset} de ${addonDir}`);

  if (!skipConfirm && !YES && !FORCE) {
    const a = await ask(`Confirmar instalacao do addon ${name}? [s/N] `);
    if (!isYes(a)) { log('cancelado.'); return false; }
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
  // Aplica settings.json.patch do addon (ativa hooks do addon no settings real).
  // Sem isso, o addon copia o .sh mas o Claude Code nunca o invoca — falso senso
  // de protecao detectado na auditoria 10-agentes (2026-05-22).
  applyAddonSettingsPatch(name);
  resumo();
  ok(`addon ${name} instalado.`);
  log(`Veja: ${c.cyan}addons/${name}/README.md${c.reset} pra detalhes.`);
  return true;
}

// Mescla .claude/settings.json.patch do addon no .claude/settings.json do projeto.
// Formato do patch: mesma estrutura do settings.json, parcial.
// Estrategia: profunda pra hooks (append em arrays sob hooks.<event>[].hooks[]);
// shallow pros demais. Idempotente — nao duplica se mesma command ja existe.
function applyAddonSettingsPatch(name) {
  const patchPath = path.join(ADDONS_DIR, name, '.claude', 'settings.json.patch');
  const settingsPath = path.join(CWD, '.claude', 'settings.json');
  if (!fs.existsSync(patchPath) || !fs.existsSync(settingsPath)) return;

  let patch, settings;
  try {
    patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    warn(`addon ${name}: settings.json.patch invalido (${e.message}); pulado.`);
    return;
  }

  let changed = false;

  // Hooks: append por evento+matcher se a command exata nao existir
  if (patch.hooks && typeof patch.hooks === 'object') {
    settings.hooks = settings.hooks || {};
    for (const [event, entries] of Object.entries(patch.hooks)) {
      if (!Array.isArray(entries)) continue;
      settings.hooks[event] = settings.hooks[event] || [];
      for (const patchEntry of entries) {
        const matcher = patchEntry.matcher || '';
        const patchHooks = Array.isArray(patchEntry.hooks) ? patchEntry.hooks : [];
        let group = settings.hooks[event].find((g) => (g.matcher || '') === matcher);
        if (!group) {
          group = { ...(matcher ? { matcher } : {}), hooks: [] };
          settings.hooks[event].push(group);
        }
        group.hooks = group.hooks || [];
        for (const h of patchHooks) {
          if (!group.hooks.some((existing) => existing.command === h.command)) {
            group.hooks.push(h);
            changed = true;
          }
        }
      }
    }
  }

  // Permissions: union (allow/ask/deny) por string
  if (patch.permissions && typeof patch.permissions === 'object') {
    settings.permissions = settings.permissions || {};
    for (const k of ['allow', 'ask', 'deny']) {
      if (Array.isArray(patch.permissions[k])) {
        settings.permissions[k] = settings.permissions[k] || [];
        for (const item of patch.permissions[k]) {
          if (!settings.permissions[k].includes(item)) {
            settings.permissions[k].push(item);
            changed = true;
          }
        }
      }
    }
  }

  if (changed) {
    atomicWriteJson(settingsPath, settings);
    log(`  ${c.green}+${c.reset} settings.json: hooks/permissoes do addon ${c.bold}${name}${c.reset} ativadas`);
  }
}

// Simetrica de applyAddonSettingsPatch — desfaz hooks/permissions que o addon
// adicionou. Roda em `remove <addon>` ANTES do delete dos arquivos pra evitar
// orfao (settings.json referenciando hook que ja foi apagado do disco).
// Auditoria 10-agentes 2ª passada 2026-05-24 identificou o gap (addons/README.md
// promete reverter, mas implementacao nao revertia — Claude Code lancava erro
// a cada Write/Edit apos remove).
function reverseAddonSettingsPatch(name) {
  const patchPath = path.join(ADDONS_DIR, name, '.claude', 'settings.json.patch');
  const settingsPath = path.join(CWD, '.claude', 'settings.json');
  if (!fs.existsSync(patchPath) || !fs.existsSync(settingsPath)) return;

  let patch, settings;
  try {
    patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    warn(`addon ${name}: settings.json.patch invalido (${e.message}); revert pulado.`);
    return;
  }

  let changed = false;

  // Hooks: remove cada command exato; remove grupo se ficar sem hooks; remove
  // array do evento se ficar vazio.
  if (patch.hooks && settings.hooks && typeof patch.hooks === 'object') {
    for (const [event, entries] of Object.entries(patch.hooks)) {
      if (!Array.isArray(entries) || !Array.isArray(settings.hooks[event])) continue;
      for (const patchEntry of entries) {
        const matcher = patchEntry.matcher || '';
        const patchHooks = Array.isArray(patchEntry.hooks) ? patchEntry.hooks : [];
        const group = settings.hooks[event].find((g) => (g.matcher || '') === matcher);
        if (!group || !Array.isArray(group.hooks)) continue;
        const before = group.hooks.length;
        group.hooks = group.hooks.filter((existing) => !patchHooks.some((h) => h.command === existing.command));
        if (group.hooks.length !== before) changed = true;
        if (group.hooks.length === 0) {
          settings.hooks[event] = settings.hooks[event].filter((g) => g !== group);
        }
      }
      if (settings.hooks[event].length === 0) delete settings.hooks[event];
    }
  }

  // Permissions: remove items exatos
  if (patch.permissions && settings.permissions && typeof patch.permissions === 'object') {
    for (const k of ['allow', 'ask', 'deny']) {
      if (Array.isArray(patch.permissions[k]) && Array.isArray(settings.permissions[k])) {
        const before = settings.permissions[k].length;
        settings.permissions[k] = settings.permissions[k].filter((item) => !patch.permissions[k].includes(item));
        if (settings.permissions[k].length !== before) changed = true;
      }
    }
  }

  if (changed) {
    atomicWriteJson(settingsPath, settings);
    log(`  ${c.green}-${c.reset} settings.json: hooks/permissoes do addon ${c.bold}${name}${c.reset} removidas`);
  }
}

// Enumera os arquivos que um addon instala dentro de .claude/ (paths
// relativos ao CWD). Usado pra remocao cirurgica sem tocar no core.
//
// Sym links sao pulados (lstat + isSymbolicLink) — addon malicioso poderia
// gravar symlink apontando pra ~/.ssh/id_rsa, e a remocao seguiria o link
// e apagaria a chave do usuario. Validacao final do path resolvido fica
// em `removeAddon` antes do rmSync.
function addonClaudeFiles(name) {
  const addonClaudeDir = path.join(ADDONS_DIR, name, '.claude');
  const out = [];
  if (!fs.existsSync(addonClaudeDir)) return out;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir)) {
      const full = path.join(dir, e);
      const st = fs.lstatSync(full);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) out.push(path.join('.claude', path.relative(addonClaudeDir, full)));
    }
  })(addonClaudeDir);
  return out;
}

function addonDescription(name) {
  try {
    const yml = fs.readFileSync(path.join(ADDONS_DIR, name, 'addon.yaml'), 'utf8');
    const m = yml.match(/description:\s*(.+)/);
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

// remove <addon> — tira do projeto so os arquivos que ESTE addon trouxe,
// preservando o framework core e os demais addons. Operacao destrutiva
// localizada: pede confirmacao (salvo --yes/--force).
async function removeAddon(name) {
  if (isDangerousCwd()) {
    err(`recusando: pasta sensivel ${CWD}`);
    process.exit(2);
  }
  const available = listAddonsAvailable();
  if (!available.includes(name)) {
    err(`addon desconhecido: "${name}". Verifique a digitacao.`);
    err(`disponiveis: ${available.join(', ')}`);
    err(`Para ver a lista completa: ${c.cyan}npx roldao-method search${c.reset}`);
    process.exit(1);
  }
  if (!listAddonsInstalled().includes(name)) {
    warn(`addon ${name} nao parece instalado neste projeto — nada a remover.`);
    return;
  }
  const claudeFiles = addonClaudeFiles(name);
  const addonProjDir = path.join(CWD, 'addons', name);
  console.log(`${c.bold}Vai remover do projeto:${c.reset}`);
  claudeFiles.forEach((f) => console.log(`  - ${f}`));
  if (fs.existsSync(addonProjDir)) console.log(`  - addons/${name}/ ${c.dim}(README, addon.yaml, templates do addon)${c.reset}`);

  if (!YES && !FORCE && !DRY_RUN) {
    const a = await ask(`Confirmar remocao do addon ${c.bold}${name}${c.reset}? O framework core fica intacto. [s/N] `);
    if (!isYes(a)) { log('cancelado.'); return; }
  }

  // Reverte settings.json.patch ANTES do delete dos arquivos. Ordem importa:
  // se apagar o hook primeiro e o reverso falhar, settings.json fica orfão.
  if (!DRY_RUN) reverseAddonSettingsPatch(name);

  // SECURITY: re-resolver cada path e validar que cai dentro de CWD/.claude/.
  // Sem isto, addon malicioso com symlink (ou TOCTOU entre walk e rm) podia
  // induzir rmSync em alvo fora do projeto (ex.: ~/.ssh/id_rsa).
  const resolvedCwd = path.resolve(CWD);
  const claudeBoundary = path.join(resolvedCwd, '.claude') + path.sep;
  let removed = 0;
  for (const rel of claudeFiles) {
    const full = path.join(CWD, rel);
    const resolvedFull = path.resolve(full);
    if (!resolvedFull.startsWith(claudeBoundary)) {
      console.log(`  ${c.red}RECUSADO${c.reset} ${rel}: path fora de .claude/ (${resolvedFull})`);
      continue;
    }
    // Re-checa que nao virou symlink entre o walk e agora.
    let st;
    try { st = fs.lstatSync(full); } catch { continue; }
    if (st.isSymbolicLink()) {
      console.log(`  ${c.yellow}PULADO${c.reset} ${rel}: symlink (recusado por seguranca)`);
      continue;
    }
    if (DRY_RUN) { console.log(`  REMOVERIA ${rel}`); continue; }
    try { fs.rmSync(full, { force: true }); removed++; console.log(`  removido: ${rel}`); }
    catch (e) { console.log(`  ${c.red}ERRO${c.reset} ${rel}: ${e.message}`); }
  }
  if (fs.existsSync(addonProjDir)) {
    const resolvedProj = path.resolve(addonProjDir);
    const addonsBoundary = path.join(resolvedCwd, 'addons') + path.sep;
    if (!resolvedProj.startsWith(addonsBoundary)) {
      console.log(`  ${c.red}RECUSADO${c.reset} addons/${name}/: path fora de addons/`);
    } else if (DRY_RUN) {
      console.log(`  REMOVERIA addons/${name}/`);
    } else {
      try { fs.rmSync(addonProjDir, { recursive: true, force: true }); removed++; console.log(`  removido: addons/${name}/`); }
      catch (e) { console.log(`  ${c.red}ERRO${c.reset} addons/${name}: ${e.message}`); }
    }
  }
  if (DRY_RUN) { log(`${c.yellow}dry-run: nada removido.${c.reset}`); return; }
  ok(`addon ${name} removido (${removed} caminho(s)). Core e demais addons preservados.`);
}

// search [termo] — lista addons disponiveis com descricao, marcando os
// instalados. Sem termo = catalogo completo.
function searchCommand(term) {
  banner();
  const available = listAddonsAvailable();
  const installed = listAddonsInstalled();
  const q = (term || '').toLowerCase();
  const rows = [];
  for (const addon of available) {
    const desc = addonDescription(addon);
    if (q && !`${addon} ${desc}`.toLowerCase().includes(q)) continue;
    rows.push({ addon, desc, inst: installed.includes(addon) });
  }
  if (rows.length === 0) {
    log(q ? `nenhum addon casa com "${term}".` : 'nenhum addon disponivel.');
    return;
  }
  console.log(`${c.bold}Addons${q ? ` ${c.dim}(filtro: "${term}")${c.reset}${c.bold}` : ''}:${c.reset}`);
  for (const r of rows) {
    const flag = r.inst ? `${c.green}[instalado]${c.reset}` : `${c.dim}[disponivel]${c.reset}`;
    console.log(`  ${flag} ${c.cyan}${r.addon}${c.reset} ${c.dim}${r.desc.substring(0, 90)}${c.reset}`);
  }
  console.log('');
  console.log(`${c.dim}instalar:${c.reset} ${c.cyan}npx roldao-method add <addon>${c.reset}    ${c.dim}remover:${c.reset} ${c.cyan}npx roldao-method remove <addon>${c.reset}`);
}

// tasks-to-issues — varre docs/stories/*.md por linhas com T-NNN e cria
// uma GitHub Issue por task ainda nao exportada. Idempotente: o mapa
// T-NNN->numero fica em .specify/.tasks-to-issues.json.
async function tasksToIssues() {
  const { execFileSync } = require('child_process');
  try {
    execFileSync('gh', ['--version'], { stdio: 'pipe' });
  } catch {
    err('GitHub CLI (gh) nao encontrado. Instale em https://cli.github.com e rode `gh auth login`.');
    process.exit(1);
  }
  const storiesDir = path.join(CWD, 'docs', 'stories');
  if (!fs.existsSync(storiesDir)) {
    err('pasta docs/stories/ nao encontrada — nenhuma task pra exportar.');
    process.exit(1);
  }
  const mapFile = path.join(CWD, '.specify', '.tasks-to-issues.json');
  let map = {};
  try {
    if (fs.existsSync(mapFile)) map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  } catch (e) {
    warn(`mapa ${path.relative(CWD, mapFile)} corrompido (${e.message}) — usando mapa vazio (issues duplicadas podem ser criadas)`);
  }

  const seen = new Set();
  const tasks = [];
  for (const f of fs.readdirSync(storiesDir).sort()) {
    if (!f.endsWith('.md')) continue;
    const lines = fs.readFileSync(path.join(storiesDir, f), 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/\bT-(\d{3,})\b/);
      if (!m) continue;
      const id = `T-${m[1]}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const title = line.replace(/^[\s\-*>]+/, '').replace(/^\[[ xX]\]\s*/, '')
        .replace(/[\r\n\t]+/g, ' ').trim().slice(0, 200);
      tasks.push({ id, title: title || id, story: f });
    }
  }
  const pending = tasks.filter((t) => !map[t.id]);
  if (pending.length === 0) {
    log(`nenhuma task nova. ${Object.keys(map).length} ja exportada(s), ${tasks.length} no projeto.`);
    return;
  }
  log(`${pending.length} task(s) sem issue (de ${tasks.length} no projeto):`);
  pending.forEach((t) => console.log(`  ${c.cyan}${t.id}${c.reset} ${t.title} ${c.dim}(${t.story})${c.reset}`));
  if (DRY_RUN) { log(`${c.yellow}dry-run: nenhuma issue criada.${c.reset}`); return; }
  if (!YES && !FORCE) {
    const a = await ask(`Criar ${pending.length} issue(s) no GitHub deste repositorio? [s/N] `);
    if (!isYes(a)) { log('cancelado.'); return; }
  }
  let created = 0;
  for (const t of pending) {
    const body = `Task ${t.id} — origem: docs/stories/${t.story}\n\nExportada por \`roldao-method tasks-to-issues\` (rastreabilidade US→AC→T-NNN→issue).`;
    try {
      const out = execFileSync('gh', ['issue', 'create', '--title', `${t.id}: ${t.title}`, '--body', body], { cwd: CWD, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
      const num = (out.match(/\/issues\/(\d+)/) || [])[1] || out;
      map[t.id] = num;
      created++;
      console.log(`  ${c.green}${g.ok}${c.reset} ${t.id} ${g.arrow} issue ${num}`);
    } catch (e) {
      err(`falhou criar issue de ${t.id}: ${((e.stderr || e.message || '') + '').trim()}`);
    }
  }
  fs.mkdirSync(path.dirname(mapFile), { recursive: true });
  fs.writeFileSync(mapFile, JSON.stringify(map, null, 2) + '\n');
  ok(`${created} issue(s) criada(s). Mapa em .specify/.tasks-to-issues.json (rode de novo = so o que falta).`);
}

async function listCommand() {
  banner();
  const tools = detectTools();
  console.log(`${c.bold}IDEs detectadas no projeto:${c.reset}`);
  if (tools.length === 0) {
    console.log(`  ${c.dim}(nenhuma — instalacao padrao copia .claude/)${c.reset}`);
  } else {
    tools.forEach((t) => console.log(`  ${c.green}${g.ok}${c.reset} ${t}`));
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
  console.log(`  ${c.cyan}npx roldao-method add <addon>${c.reset}     instalar addon`);
  console.log(`  ${c.cyan}npx roldao-method remove <addon>${c.reset}  remover addon (core preservado)`);
  console.log(`  ${c.cyan}npx roldao-method search [termo]${c.reset}  buscar addons disponiveis`);
  console.log(`  ${c.cyan}npx roldao-method update${c.reset}          atualizar framework`);
  console.log(`  ${c.cyan}npx roldao-method doctor${c.reset}          diagnosticar instalacao`);
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
    // Hooks Node — port v1.0.0 (EP-001). .sh legado removido em v1.0.
    { path: '.claude/hooks/_lib.js', exigido: true },
    { path: '.claude/hooks/anti-mascaramento.js', exigido: true },
    { path: '.claude/hooks/block-destructive.js', exigido: true },
    { path: '.claude/hooks/secrets-scanner.js', exigido: true },
    { path: '.claude/hooks/no-test-data-in-fixtures.js', exigido: false, label: 'v0.4+' },
    { path: '.claude/hooks/no-hardcoded-env-urls.js', exigido: false, label: 'v0.4+' },
    { path: '.claude/hooks/fiscal-br-validator.js', exigido: false, label: 'v0.4+' },
    { path: '.claude/hooks/block-jargon-pt-br.js', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/block-secrets-in-commit-message.js', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/block-confirmation-questions.js', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/require-investigador-before-fix.js', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/validate-test-pyramid.js', exigido: false, label: 'v0.5+' },
    { path: '.claude/hooks/auto-format-on-write.js', exigido: false, label: 'v0.15+' },
    { path: '.claude/hooks/subagent-handoff-audit.js', exigido: false, label: 'v0.15+' },
    { path: '.claude/hooks/session-snapshot.js', exigido: false, label: 'v0.15+' },
    { path: '.claude/hooks/session-snapshot-restore.js', exigido: false, label: 'v0.15+' },
    { path: '.claude/statusline.js', exigido: false, label: 'v1.0+' },
    { path: '.claude/output-styles/pt-br-conciso.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/output-styles/dpo-lgpd.md', exigido: false, label: 'v0.15+' },
    { path: '.claude/output-styles/fiscal-br.md', exigido: false, label: 'v0.15+' },
    { path: '.claude/commands/feature.md', exigido: true },
    { path: '.claude/commands/bug.md', exigido: true },
    { path: '.claude/commands/quick-dev.md', exigido: false, label: 'v0.4+' },
    { path: '.claude/commands/help.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/commands/sprint.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/commands/clarificar.md', exigido: false, label: 'v0.13+' },
    { path: '.claude/commands/consistencia.md', exigido: false, label: 'v0.13+' },
    { path: '.claude/skills/validar-cpf-cnpj/SKILL.md', exigido: true },
    { path: '.claude/skills/brainstormar-ideia/SKILL.md', exigido: false, label: 'v0.5+' },
    { path: '.claude/skills/gerar-test-fixture-br/SKILL.md', exigido: false, label: 'v0.5+' },
    { path: '.specify/memory/constitution.md', exigido: true },
    { path: '.specify/checklists/story-dod.md', exigido: false, label: 'v0.4+' },
    { path: '.specify/checklists/release-readiness.md', exigido: false, label: 'v0.5+' },
    { path: '.specify/data/kb-pt-br.md', exigido: false, label: 'v0.4+' },
    { path: '.specify/data/kb-brainstorming-pt-br.md', exigido: false, label: 'v0.5+' },
    { path: '.mcp.json.examples/README.md', exigido: false, label: 'v0.15+' },
    { path: '.github/workflows/claude-review.yml', exigido: false, label: 'v0.15+' },
    { path: 'AGENTS.md', exigido: true },
    { path: 'CLAUDE.md', exigido: true },
    { path: 'REGRAS-INEGOCIAVEIS.md', exigido: true },
    { path: 'CLAUDE.local.md.example', exigido: false, label: 'v0.15+' },
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

  // Hooks são Node puro desde EP-001 (v1.0). Único requisito de runtime é Node>=18
  // — já validado por bin/lib/node-version-check.js antes de qualquer require não-builtin.
  // Checks de bash/perl removidos na auditoria 10-agentes (2026-05-24) — eram ruído
  // que confundia operador (alegava "FALTA" quando hooks rodavam perfeitamente).
  console.log(`  ${c.green}OK   ${c.reset} node ${process.version} (hooks são Node puro)`);

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
    if (!isYes(a)) { log('cancelado.'); return; }
  }
  const candidatos = [
    '.claude/settings.json',
    '.claude/statusline.sh',    // resquício de instalações pré-v1.0 — removido pelo uninstall
    '.claude/statusline.js',    // v1.0+ (port Node — ADR-012)
    '.claude/agents',
    '.claude/hooks',
    '.claude/commands',
    '.claude/skills',
    '.claude/output-styles',
    '.claude/_meta',
    '.specify/templates',
    '.mcp.json.examples',
  ];
  // Não apaga direto: MOVE pra um backup datado. O usuário pode ter criado
  // agente/skill/command próprio dentro dessas pastas — rmSync cego perderia
  // sem volta. Backup preserva e ainda "desinstala" (some do .claude ativo).
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupRoot = path.join(CWD, `.roldao-method.uninstalled-${ts}`);
  let removidos = 0;
  for (const p of candidatos) {
    const full = path.join(CWD, p);
    if (!fs.existsSync(full)) continue;
    if (DRY_RUN) { console.log(`  MOVERIA ${p} -> ${path.basename(backupRoot)}/${p}`); continue; }
    try {
      const dest = path.join(backupRoot, p);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.renameSync(full, dest);
      removidos++;
      console.log(`  movido p/ backup: ${p}`);
    } catch (e) {
      console.log(`  ERRO ${p}: ${e.message}`);
    }
  }
  log(`${removidos} caminho(s) movido(s) para ${path.basename(backupRoot)}/ (não apagados — customizações suas preservadas; apague a pasta manualmente se quiser).`);
  log('arquivos do usuario preservados (AGENTS.md, CLAUDE.md, REGRAS, .mcp.json, settings.local.json).');
}

// menu — chamado por `npx roldao-method` sem argumento em TTY interativo.
// Mostra menu amigavel ao Roldao (nao-programador) com as 4 opcoes mais usadas
// em vez de cair em `install` cego.
function menu() {
  banner();
  console.log(`${c.bold}O que voce quer fazer?${c.reset}\n`);
  console.log(`  ${c.cyan}npx roldao-method ${c.green}demo${c.reset}      ${c.dim}— testa 3 verificacoes em 30s, sem instalar nada${c.reset}`);
  console.log(`  ${c.cyan}npx roldao-method ${c.green}install${c.reset}   ${c.dim}— copia o framework pra pasta atual${c.reset}`);
  console.log(`  ${c.cyan}npx roldao-method ${c.green}tutorial${c.reset}  ${c.dim}— 5 perguntas em PT-BR preenchem o AGENTS.md por voce${c.reset}`);
  console.log(`  ${c.cyan}npx roldao-method ${c.green}doctor${c.reset}    ${c.dim}— diagnostica instalacao existente${c.reset}`);
  console.log('');
  console.log(`${c.bold}Nao programa?${c.reset} Veja primeiro: ${c.green}docs/PARA-DONO-DE-PRODUTO.md${c.reset}`);
  console.log(`${c.bold}Mais comandos?${c.reset}  ${c.cyan}npx roldao-method --help${c.reset}`);
  console.log('');
}

function help() {
  banner();
  console.log(`${c.bold}Uso:${c.reset}
  ${c.cyan}npx roldao-method demo${c.reset}                                            ${c.green}roda 3 verificacoes offline (30s) — sem instalar nada${c.reset}
  ${c.cyan}npx roldao-method install${c.reset}        [--yes] [--force] [--dry-run]   instala no projeto atual
  ${c.cyan}npx roldao-method tutorial${c.reset}       [--force]                        ${c.green}preenche AGENTS.md por 5 perguntas guiadas${c.reset}
  ${c.cyan}npx roldao-method update${c.reset}         [--yes] [--force] [--dry-run] [--all]   atualiza arquivos do framework
  ${c.cyan}npx roldao-method rollback${c.reset}       [<id>] [--list]                desfaz o ultimo update (volta o snapshot)
  ${c.cyan}npx roldao-method add <addon>${c.reset}    [--yes]                          instala addon especifico
  ${c.cyan}npx roldao-method remove <addon>${c.reset} [--yes] [--dry-run]              remove um addon (core preservado)
  ${c.cyan}npx roldao-method search [termo]${c.reset}                                   lista/filtra addons disponiveis
  ${c.cyan}npx roldao-method tasks-to-issues${c.reset} [--yes] [--dry-run]              exporta T-NNN de docs/stories/ pra GitHub Issues
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
  ${c.yellow}--ascii${c.reset}       glifos ASCII puros em vez de Unicode (ou ROLDAO_ASCII=1)
  ${c.yellow}--quiet / -q${c.reset}  silencioso (so erros e --help) — bom pra script e leitor de tela

${c.bold}Addons disponiveis:${c.reset}
  ${c.cyan}electron-br${c.reset}            Desktop Electron + SQLite + LGPD offline
  ${c.cyan}fiscal-br-completo${c.reset}     NF-e/NFC-e/NFS-e, Reforma 2026, CNPJ alfanumerico
  ${c.cyan}lgpd-compliance${c.reset}        DPO virtual, RIPD, canal titular, incidente 72h
  ${c.cyan}fintech-br${c.reset}             Pix completo + Open Finance + webhook HMAC
  ${c.cyan}esocial-completo${c.reset}       Eventos S-1000 a S-3000, CIPA, NRs, prazo legal
  ${c.cyan}varejo-pdv-br${c.reset}          SAT-CF-e, NFC-e, TEF, balanca/impressora
  ${c.cyan}healthtech-br${c.reset}          Telemedicina CFM 2.314, prontuario ANS RN 305, CNS, TISS/TUSS ${c.dim}(beta)${c.reset}

${c.bold}IDEs suportadas:${c.reset} Claude Code, Cursor, Windsurf, Continue, Aider, Cline, Roo, Gemini CLI, Codex CLI

${c.bold}Requisito:${c.reset} Node.js >=18. Hooks rodam em qualquer shell (PowerShell, CMD, bash, zsh, sh).

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
    case 'remove': case 'rm':
      if (!subArg) { err('uso: remove <nome-do-addon>'); help(); process.exit(1); }
      await removeAddon(subArg);
      break;
    case 'search': case 'find': searchCommand(subArg); break;
    case 'tasks-to-issues': case 'tasks2issues': await tasksToIssues(); break;
    case 'list': await listCommand(); break;
    case 'doctor': doctor(); break;
    case 'uninstall': await uninstall(); break;
    case 'demo': {
      const { demo } = require('./lib/demo');
      const code = await demo({ colors: c, glyphs: g, root: FRAMEWORK_ROOT, fast: YES || QUIET });
      process.exit(code);
      break;
    }
    case 'tutorial': case 'tut': {
      const { tutorial } = require('./lib/tutorial');
      const code = await tutorial({ cwd: CWD, colors: c, glyphs: g, force: FORCE });
      process.exit(code);
      break;
    }
    case 'rollback': await rollback(); break;
    case 'menu': menu(); break;
    case 'help': case '--help': case '-h': help(); break;
    case 'version': case '--version': case '-v': version(); break;
    default:
      err(`comando desconhecido: ${command}`);
      help();
      process.exit(1);
  }
})();
