// _lib.js — helpers compartilhados pelos hooks Node (US-101 / EP-001).
//
// Espelha 1:1 as funcoes de _lib.sh (que continua existindo ate US-110 deletar).
// Equivalencia byte-a-byte validada por test/lib-equivalence.test.js.
//
// Sem dependencia externa — so Node stdlib. CommonJS pra evitar import gymnastics
// em scripts curtos (ver ADR-013).

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// sanitizeProjdir — valida e devolve um PROJDIR seguro.
// Aceita opcionalmente um valor (default: $CLAUDE_PROJECT_DIR ou process.cwd()).
// Lança Error se: path vazio, contém "..", ou não é absoluto.
// Caller deve fazer:
//   try { const dir = sanitizeProjdir(); ... }
//   catch (e) { process.stderr.write(e.message); process.exit(2); }
// ---------------------------------------------------------------------------
function sanitizeProjdir(candidate) {
  // Equivalente bash: ${1:-${CLAUDE_PROJECT_DIR:-$PWD}} — `:-` substitui se
  // for unset OU vazio, entao `||` em JS (vazio e falsy) bate.
  const value = candidate || process.env.CLAUDE_PROJECT_DIR || process.cwd();

  if (!value) {
    throw new Error('[_lib.js] PROJDIR vazio — abortando para evitar gravar fora do projeto.\n');
  }

  // Bloqueia traversal explicito (.. em qualquer segmento)
  if (/(^|\/)\.\.(\/|$)/.test(value)) {
    throw new Error(`[_lib.js] PROJDIR contem ".." (path traversal). Recusado: ${value}\n`);
  }

  // Exige path absoluto. Unix: /algo. Windows: C:\algo OU C:/algo OU /c/algo (Git Bash).
  const isUnixAbs = value.startsWith('/');
  const isWinAbs = /^[A-Za-z]:[\\/]/.test(value);
  if (!isUnixAbs && !isWinAbs) {
    throw new Error(`[_lib.js] PROJDIR nao e absoluto: ${value}\n`);
  }

  return value;
}

// ---------------------------------------------------------------------------
// sanitizeSessionHash — gera hash da sessao com persistencia POR WORKTREE.
// Strip-a tudo que nao e [a-zA-Z0-9]. Se vazio, usa "default" pra evitar
// marcadores genericos.
//
// Persistencia: le .claude/.runtime/.session-hash se existir (preserva hash
// entre --continue/--resume); senao gera novo e persiste best-effort.
//
// IMPORTANTE: o arquivo .session-hash vive DENTRO do projdir/.claude/.runtime,
// entao cada worktree (que tem seu proprio projdir) tem seu proprio hash —
// nao ha colisao entre worktrees paralelos. Em workflow de worktree (projdir
// diferente), markers ficam naturalmente isolados.
//
// Defesa adicional: se CLAUDE_SESSION_ID estiver vazio, mistura um sufixo
// derivado do projdir (8 chars de hash) ao inves de cair em "default" global.
// Evita que duas sessoes paralelas no MESMO projdir sem CLAUDE_SESSION_ID
// (raro mas possivel) colidam num hash "default" identico.
// ---------------------------------------------------------------------------
function sanitizeSessionHash(raw, projdir) {
  const candidate = raw ?? process.env.CLAUDE_SESSION_ID ?? '';
  let resolvedProjdir = projdir;
  if (!resolvedProjdir) {
    try { resolvedProjdir = sanitizeProjdir(); } catch { resolvedProjdir = ''; }
  }

  // Tenta ler hash persistido primeiro (preserva entre --continue/--resume)
  if (resolvedProjdir) {
    const hashFile = path.join(resolvedProjdir, '.claude', '.runtime', '.session-hash');
    try {
      const persisted = fs.readFileSync(hashFile, 'utf8').split(/\r?\n/)[0].replace(/[^a-zA-Z0-9]/g, '');
      if (persisted) return persisted;
    } catch { /* nao existe ou erro de leitura, gera novo */ }
  }

  let hash = String(candidate).replace(/[^a-zA-Z0-9]/g, '');
  if (!hash) {
    // CLAUDE_SESSION_ID vazio — deriva sufixo do projdir pra isolar de "default" global.
    // Hash crypto curto (8 chars) e estavel por projdir.
    try {
      const crypto = require('crypto');
      const projHash = crypto.createHash('sha256')
        .update(resolvedProjdir || process.cwd())
        .digest('hex')
        .slice(0, 8);
      hash = `default${projHash}`;
    } catch {
      hash = 'default';
    }
  }

  // Persiste pra proxima sessao (best-effort)
  if (resolvedProjdir) {
    const runtime = path.join(resolvedProjdir, '.claude', '.runtime');
    try {
      fs.mkdirSync(runtime, { recursive: true });
      fs.writeFileSync(path.join(runtime, '.session-hash'), hash + '\n');
    } catch { /* silencia disco cheio / permissao */ }
  }

  return hash;
}

// ---------------------------------------------------------------------------
// safeRuntimeDir — garante que .claude/.runtime existe e devolve o path.
// ---------------------------------------------------------------------------
function safeRuntimeDir(projdir) {
  if (!projdir) throw new Error('safeRuntimeDir: PROJDIR obrigatorio');
  const dir = path.join(projdir, '.claude', '.runtime');
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* best-effort */ }
  return dir;
}

// ---------------------------------------------------------------------------
// safeTmpfile — cria arquivo temporario com fallback isolado por UID.
// Em /tmp world-writable (Linux multi-user), atacante local pode pre-criar
// /tmp/hook.<PID> como symlink. Esta funcao isola fallback em
// $TMPDIR/roldao-<UID>/, mode 700.
// Retorna path do arquivo criado.
// ---------------------------------------------------------------------------
function safeTmpfile(prefix = 'hook') {
  try {
    const file = path.join(os.tmpdir(), `${prefix}.${process.pid}.${Date.now()}`);
    fs.writeFileSync(file, '');
    return file;
  } catch {
    const uid = (process.getuid && process.getuid()) || 0;
    const safeDir = path.join(process.env.TMPDIR || '/tmp', `roldao-${uid}`);
    try {
      fs.mkdirSync(safeDir, { recursive: true });
      fs.chmodSync(safeDir, 0o700);
    } catch { /* best-effort */ }
    const file = path.join(safeDir, `${prefix}.${process.pid}`);
    fs.writeFileSync(file, '');
    return file;
  }
}

// ---------------------------------------------------------------------------
// secretTokenPatterns — lista CANONICA de regex de tokens/segredos.
// Fonte unica consumida pelos hooks de scan (secrets-scanner,
// block-secrets-in-commit-message). Equivalente ao heredoc no _lib.sh.
// Retorna array de strings (cada uma e um regex ERE compativel).
// ---------------------------------------------------------------------------
function secretTokenPatterns() {
  return [
    'AKIA[0-9A-Z]{16}',
    'aws_secret_access_key[[:space:]]*=[[:space:]]*[A-Za-z0-9/+=]{40}',
    '-----BEGIN[[:space:]]+[A-Z]*[[:space:]]*(PRIVATE[[:space:]]+)?KEY-----',
    'sk-[A-Za-z0-9_-]{20,}',
    'sk-proj-[A-Za-z0-9_-]{20,}',
    'sk-ant-(api[0-9]{2}-)?[A-Za-z0-9_-]{32,}',
    'ghp_[A-Za-z0-9]{36}',
    'github_pat_[A-Za-z0-9_]{70,}',
    'xox[baprs]-[A-Za-z0-9-]{10,}',
    'AIza[0-9A-Za-z_-]{35}',
    'glpat-[A-Za-z0-9_-]{20}',
    'Bearer[[:space:]]+[A-Za-z0-9._-]{40,}',
    'sk_live_[0-9a-zA-Z]{16,}',
    'rk_live_[0-9a-zA-Z]{16,}',
    'eyJ[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}',
    '(postgres|postgresql|mysql|mongodb(\\+srv)?|redis|amqps?)://[^:@/[:space:]]+:[^@/[:space:]]+@',
    '"private_key"[[:space:]]*:[[:space:]]*"-----BEGIN',
  ];
}

// ---------------------------------------------------------------------------
// posixToJsRegex — converte pattern POSIX ERE (do _lib.sh) pra RegExp JS.
// Cobertura: [[:space:]], [[:alpha:]], [[:alnum:]], [[:digit:]], [[:upper:]],
// [[:lower:]], [[:punct:]], [[:xdigit:]]. Outros tokens passam direto.
// Usado por consumers de secretTokenPatterns() pra obter RegExp executavel.
// ---------------------------------------------------------------------------
function posixToJsRegex(pattern, flags = '') {
  const converted = pattern
    .replace(/\[\[:space:\]\]/g, '\\s')
    .replace(/\[\[:alpha:\]\]/g, '[a-zA-Z]')
    .replace(/\[\[:alnum:\]\]/g, '[a-zA-Z0-9]')
    .replace(/\[\[:digit:\]\]/g, '\\d')
    .replace(/\[\[:upper:\]\]/g, 'A-Z')
    .replace(/\[\[:lower:\]\]/g, 'a-z')
    .replace(/\[\[:punct:\]\]/g, '[!-/:-@\\[-`{-~]')
    .replace(/\[\[:xdigit:\]\]/g, '[0-9a-fA-F]');
  return new RegExp(converted, flags);
}

// ---------------------------------------------------------------------------
// secretTokenRegexes — versao executavel de secretTokenPatterns(). Retorna
// array de RegExp ja convertidos POSIX → JS, prontos pra .test(content).
// ---------------------------------------------------------------------------
function secretTokenRegexes() {
  return secretTokenPatterns().map((p) => posixToJsRegex(p));
}

// ---------------------------------------------------------------------------
// hookBlockHeader — cabecalho padronizado de bloqueio em stderr.
// Tambem dispara recordMetric pra contagem no statusline.
// ---------------------------------------------------------------------------
function hookBlockHeader(name, reason) {
  process.stderr.write(`[${name || 'hook'}] BLOQUEADO: ${reason || 'violacao de politica'}\n\n`);
  recordMetric('block', name || 'hook', reason || '');
}

// ---------------------------------------------------------------------------
// hookPrefix — prefixo padronizado de severidade pros hooks (T-006 / G7).
// Retorna string formatada "[NIVEL] [hook-name]" pra usar em stderr.
//
// Niveis:
//   'block' (default) → [BLOQUEIO] — exit 2 ou decision:block
//   'warn'            → [AVISO]    — soft warning (exit 0 com aviso)
//   'info'            → [INFO]     — lembrete / reminder
//
// Uso:
//   const { hookPrefix } = require('./_lib.js');
//   process.stderr.write(`${hookPrefix('block', 'meu-hook')} mensagem\n`);
//   // → "[BLOQUEIO] [meu-hook] mensagem"
// ---------------------------------------------------------------------------
function hookPrefix(level, name) {
  let tag = 'BLOQUEIO';
  if (level === 'warn') tag = 'AVISO';
  else if (level === 'info') tag = 'INFO';
  return `[${tag}] [${name || 'hook'}]`;
}

// ---------------------------------------------------------------------------
// recordMetric — appenda 1 evento em .claude/.runtime/metrics.jsonl.
// Formato JSONL: {"ts","kind","label","reason"}.
// Best-effort: silencia erros (disco cheio, permissao).
// ---------------------------------------------------------------------------
function recordMetric(kind, label, reason) {
  // Skip durante suite de teste — evita poluir metrics.jsonl com bloqueios
  // provocados de proposito pelos testes (block-destructive testa `rm -rf`,
  // secrets-scanner testa AKIA..., etc.). Cada `npm test` adicionaria
  // dezenas de eventos que nao refletem uso real.
  if (process.env.ROLDAO_SKIP_METRICS === '1') return;
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { return; }
  const runtime = path.join(projdir, '.claude', '.runtime');
  try { fs.mkdirSync(runtime, { recursive: true }); } catch { return; }
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  // Escapa aspas e barra na razao pra JSON valido. tr equivalente a perl no _lib.sh.
  const cleanReason = String(reason || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\n\t]/g, ' ');
  const line = `{"ts":"${ts}","kind":"${kind || '?'}","label":"${label || '?'}","reason":"${cleanReason}"}\n`;
  try { fs.appendFileSync(path.join(runtime, 'metrics.jsonl'), line); } catch { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// readStdinJson — le stdin completo e tenta JSON.parse.
// Fail-soft equivalente ao `perl -MJSON::PP` com eval: retorna {} se input
// vazio ou parse falha. Usado por todos os hooks que recebem JSON do Claude
// Code via stdin.
// ---------------------------------------------------------------------------
async function readStdinJson() {
  return new Promise((resolve) => {
    let raw = '';
    if (process.stdin.isTTY) { resolve({}); return; }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { raw += chunk; });
    process.stdin.on('end', () => {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); }
      catch { resolve({}); }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

// ---------------------------------------------------------------------------
// parseFrontmatter — extrai bloco YAML simples (--- ... ---) do topo de um
// markdown e devolve objeto { key: value }. Aceita apenas linhas no formato
// `chave: valor` (1 nivel, sem arrays/objetos aninhados). Comentarios `#` sao
// ignorados. Strip BOM + linhas em branco iniciais antes do primeiro `---`.
// Retorna null se nao houver frontmatter ou se for malformado (sem fechamento).
//
// Reuso central — usado por paths-frontmatter-validator, validate-story-approvals,
// validate-story-dependencies e demais hooks que leem cabecalho YAML.
// ---------------------------------------------------------------------------
function parseFrontmatter(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/^﻿/, '');
  const lines = cleaned.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (lines[i] !== '---') return null;
  i++;
  const fields = {};
  while (i < lines.length && lines[i] !== '---') {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (m) {
      const key = m[1];
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fields[key] = value;
    }
    i++;
  }
  if (i >= lines.length) return null;
  return fields;
}

// ---------------------------------------------------------------------------
// failClosedMessage — formata mensagem PT-BR leiga quando o hook precisa
// abortar por erro interno (parse falhou, ferramenta externa quebrou, ambiente
// suspeito) sem expor stack trace ao usuario nao-programador.
//
// Uso (tipico no catch final):
//   .catch((err) => {
//     process.stderr.write(failClosedMessage('meu-hook', err));
//     process.exit(2);
//   });
// ---------------------------------------------------------------------------
function failClosedMessage(hookName, err) {
  const errMsg = err && err.message ? err.message : String(err || 'erro nao especificado');
  return [
    `${hookPrefix('block', hookName)} erro interno ao validar a operacao.`,
    `Efeito: a operacao foi RECUSADA por seguranca (fail-closed).`,
    `Causa: o sistema de protecao do framework nao conseguiu rodar normalmente.`,
    `Proximo passo:`,
    `  - Tentar de novo (pode ser falha temporaria de leitura/escrita).`,
    `  - Se persistir, peca pro agente Claude diagnosticar com 'npx roldao-method doctor'.`,
    `  - Pra desenvolvedor: detalhe tecnico -> ${errMsg}`,
    ``,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// recordApproval — registra evento POSITIVO de aprovacao em metrics.jsonl.
// Diferencia do recordMetric('block', ...) que e negativo (recusou algo).
// Permite auditoria forense: "quem aprovou US-042 e em que diff?"
//
// Uso:
//   recordApproval('revisor', 'US-111', '<audit_sha>', 'aprovado');
//   recordApproval('auditor-seguranca', 'US-111', '<audit_sha>', 'bloqueado',
//                  'secret detectado em src/x.js');
// ---------------------------------------------------------------------------
function recordApproval(agente, refStory, auditSha, status, motivo) {
  recordMetric('approval', agente, JSON.stringify({
    story: refStory || 'US-?',
    audit_sha: auditSha || '',
    status: status || 'aprovado',
    motivo: motivo || '',
  }));
}

// ---------------------------------------------------------------------------
// normalizeFilePath — normaliza file_path pra usar `/` em vez de `\`.
// Necessario em Windows: o Claude Code as vezes envia path com `\`, e regex
// hardcoded com `/test\/` ou `/docs\//` falham. Normalizar antes de testar
// elimina toda essa classe de bug cross-platform.
// ---------------------------------------------------------------------------
function normalizeFilePath(fp) {
  if (!fp || typeof fp !== 'string') return '';
  return fp.replace(/\\/g, '/');
}

module.exports = {
  sanitizeProjdir,
  sanitizeSessionHash,
  safeRuntimeDir,
  safeTmpfile,
  secretTokenPatterns,
  secretTokenRegexes,
  posixToJsRegex,
  hookBlockHeader,
  hookPrefix,
  recordMetric,
  readStdinJson,
  parseFrontmatter,
  failClosedMessage,
  recordApproval,
  normalizeFilePath,
};
