// bin/lib/session-relay.js
// US-117 / ADR-022 — wrapper externo que orquestra ciclo de sessao Claude.
//
// Arquitetura:
//   1. discoverTranscript(): acha o .jsonl da sessao Claude em ~/.claude/projects/<cwd-encoded>/
//   2. measureUsage(): mede bytes do .jsonl e converte em estimativa de tokens
//   3. shouldCheckpoint(): decide se passou do threshold
//   4. triggerCheckpoint(): escreve '/checkpoint\n' no stdin do filho
//   5. waitForSnapshot(): espera mtime de .claude/.runtime/session-snapshot.md atualizar
//   6. closeSession(): SIGTERM no filho com timeout, SIGKILL como fallback
//   7. spawnSession(): abre novo claude (ou --continue na segunda iteracao em diante)
//   8. runRelay(): loop principal — orchestra tudo
//
// Toda funcao publica e exportada e testavel isoladamente. Sem efeito colateral
// global. Sem dep runtime nova — so builtin do Node (>=14).
//
// Mensagens PT-BR adesao a INV-AGENT-001 (sem jargao com Roldao). Tabela completa
// em docs/decisions/ADR-022-session-relay-wrapper-externo.md.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ---------- Constantes (defaults documentados no ADR-022) ----------

const DEFAULT_THRESHOLD_TOKENS = 500000;       // 50% de 1M (Opus 4.7 1M)
const DEFAULT_TOKENS_PER_BYTE = 1 / 3.7;       // 3.7 bytes -> 1 token (heuristica PT-BR + JSON)
const DEFAULT_CHECK_INTERVAL_MS = 30 * 1000;   // 30s
const MIN_CHECK_INTERVAL_MS = 5 * 1000;        // chao 5s
const CHECKPOINT_WAIT_TIMEOUT_MS = 5 * 60 * 1000; // 5min pra Claude processar /checkpoint
const SIGTERM_GRACEFUL_TIMEOUT_MS = 30 * 1000;    // 30s antes do SIGKILL
const TRANSCRIPT_DISCOVERY_TIMEOUT_MS = 10 * 1000; // 10s pra .jsonl aparecer
const DEFAULT_CLAUDE_BIN = 'claude';

// ---------- 1. Discovery do transcript ----------

/**
 * Encoda o cwd no mesmo formato que o claude-code CLI usa:
 * substitui ':', '\\', '/' por '-' e preserva o restante.
 */
function encodeCwd(cwd) {
  if (typeof cwd !== 'string') throw new TypeError('cwd deve ser string');
  return cwd.replace(/[:\\/]/g, '-');
}

/**
 * Retorna o caminho do diretorio onde o Claude grava os .jsonl da sessao
 * pro cwd informado.
 */
function projectsDirFor(cwd, homeDir) {
  const home = homeDir || os.homedir();
  return path.join(home, '.claude', 'projects', encodeCwd(cwd));
}

/**
 * Lista .jsonl no nivel raiz do projectsDir (exclui subdir 'subagents/').
 * Retorna array de { file, mtimeMs, size }.
 */
function listRootJsonl(projectsDir) {
  if (!fs.existsSync(projectsDir)) return [];
  let entries;
  try {
    entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith('.jsonl')) continue;
    const full = path.join(projectsDir, e.name);
    try {
      const st = fs.statSync(full);
      out.push({ file: full, mtimeMs: st.mtimeMs, size: st.size });
    } catch {
      // arquivo pode ter sumido entre readdir e stat — ignora
    }
  }
  return out;
}

/**
 * Acha o .jsonl da sessao ativa. Estrategia em 2 passos:
 *   1. Se sessionId conhecido, procura <projectsDir>/<sessionId>.jsonl
 *   2. Senao, pega o .jsonl mais recente no projectsDir (exclui subagents/)
 */
function discoverTranscript({ cwd, sessionId, homeDir }) {
  const dir = projectsDirFor(cwd, homeDir);
  if (sessionId) {
    const direct = path.join(dir, `${sessionId}.jsonl`);
    if (fs.existsSync(direct)) {
      try {
        const st = fs.statSync(direct);
        return { file: direct, mtimeMs: st.mtimeMs, size: st.size };
      } catch {
        // segue pro fallback
      }
    }
  }
  const all = listRootJsonl(dir);
  if (all.length === 0) return null;
  all.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return all[0];
}

// ---------- 2. Medicao de uso ----------

/**
 * Converte bytes do .jsonl em estimativa de tokens.
 */
function bytesToTokens(bytes, tokensPerByte) {
  const ratio = tokensPerByte || DEFAULT_TOKENS_PER_BYTE;
  if (!Number.isFinite(bytes) || bytes < 0) return 0;
  return Math.round(bytes * ratio);
}

/**
 * Mede o tamanho atual do transcript. Retorna { bytes, tokens } ou null se nao achou.
 */
function measureUsage(transcript, opts) {
  if (!transcript || !transcript.file) return null;
  let bytes;
  try {
    bytes = fs.statSync(transcript.file).size;
  } catch {
    return null;
  }
  const tokens = bytesToTokens(bytes, (opts && opts.tokensPerByte));
  return { bytes, tokens };
}

// ---------- 3. Decisao de checkpoint ----------

/**
 * Decide se passou do threshold.
 * threshold = tokens absolutos (ex: 500000).
 */
function shouldCheckpoint(usage, threshold) {
  if (!usage) return false;
  const t = Number.isFinite(threshold) ? threshold : DEFAULT_THRESHOLD_TOKENS;
  return usage.tokens >= t;
}

// ---------- 4. Disparo do /checkpoint ----------

/**
 * Escreve '/checkpoint\n' no stdin do processo Claude filho.
 * `child` e o ChildProcess retornado por spawnSession.
 * Em dry-run, so loga.
 */
function triggerCheckpoint(child, { dryRun, log } = {}) {
  if (dryRun) {
    (log || console.log)('[dry-run] dispararia /checkpoint no Claude agora');
    return true;
  }
  if (!child || !child.stdin || child.killed) return false;
  try {
    child.stdin.write('/checkpoint\n');
    return true;
  } catch {
    return false;
  }
}

// ---------- 5. Espera o snapshot ser gravado ----------

/**
 * Le mtime de .claude/.runtime/session-snapshot.md.
 * Retorna mtimeMs ou 0 se nao existe.
 */
function snapshotMtime(projectDir) {
  const snap = path.join(projectDir, '.claude', '.runtime', 'session-snapshot.md');
  try {
    return fs.statSync(snap).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Espera ate mtime do session-snapshot.md ficar > baselineMs OU timeout.
 * Retorna true se detectou atualizacao, false se timeout.
 */
async function waitForSnapshot({ projectDir, baselineMs, timeoutMs, pollMs, log }) {
  const tmax = timeoutMs || CHECKPOINT_WAIT_TIMEOUT_MS;
  const tick = pollMs || 1000;
  const deadline = Date.now() + tmax;
  while (Date.now() < deadline) {
    const m = snapshotMtime(projectDir);
    if (m > baselineMs) return true;
    await sleep(tick);
  }
  (log || console.warn)('[session-relay] AVISO: timeout esperando o Claude salvar. seguindo mesmo assim.');
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- 6. Encerramento gracioso ----------

/**
 * Envia SIGTERM no filho e espera ate `timeoutMs`. Se nao sair, SIGKILL.
 * Retorna { exited: true|false, signal: 'SIGTERM'|'SIGKILL'|null }.
 */
async function closeSession(child, { timeoutMs, log } = {}) {
  if (!child) return { exited: true, signal: null };
  if (child.killed || child.exitCode !== null) return { exited: true, signal: null };
  const t = timeoutMs || SIGTERM_GRACEFUL_TIMEOUT_MS;
  try {
    child.kill('SIGTERM');
  } catch {
    // Windows pode lancar EPERM em alguns casos
  }
  const exited = await waitForExit(child, t);
  if (exited) return { exited: true, signal: 'SIGTERM' };
  (log || console.warn)('[session-relay] AVISO: Claude nao respondeu em 30s. forcando encerramento.');
  try { child.kill('SIGKILL'); } catch {}
  await waitForExit(child, 5000);
  return { exited: true, signal: 'SIGKILL' };
}

function waitForExit(child, ms) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve(true);
    let done = false;
    const onExit = () => { if (!done) { done = true; resolve(true); } };
    child.once('exit', onExit);
    setTimeout(() => { if (!done) { done = true; resolve(false); } }, ms);
  });
}

// ---------- 7. Spawn da sessao ----------

/**
 * Abre nova sessao Claude. Se isContinuation = true, passa '--continue'.
 * Retorna o ChildProcess.
 */
function spawnSession({ claudeBin, isContinuation, cwd, env, dryRun, log }) {
  const bin = claudeBin || DEFAULT_CLAUDE_BIN;
  const args = isContinuation ? ['--continue'] : [];
  if (dryRun) {
    (log || console.log)(`[dry-run] spawnaria: ${bin} ${args.join(' ')}`);
    // Retorna stub minimo pra loop nao quebrar
    return makeDryRunChild();
  }
  return spawn(bin, args, {
    cwd: cwd || process.cwd(),
    env: env || process.env,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

function makeDryRunChild() {
  // EventEmitter minimo que simula ChildProcess pra dry-run
  const EventEmitter = require('events');
  const child = new EventEmitter();
  child.stdin = { write: () => true };
  child.killed = false;
  child.exitCode = null;
  child.kill = () => {
    child.exitCode = 0;
    setImmediate(() => child.emit('exit', 0));
  };
  return child;
}

// ---------- 8. Loop principal ----------

/**
 * Loop principal do relay.
 * opts:
 *   threshold:        tokens absolutos (default 500_000)
 *   tokensPerByte:    razao bytes->tokens (default 1/3.7)
 *   checkIntervalMs:  intervalo de medicao (default 30_000, minimo 5_000)
 *   claudeBin:        binario do Claude (default 'claude')
 *   cwd:              cwd pro spawn (default process.cwd())
 *   dryRun:           nao spawn real, so loga
 *   projectDir:       diretorio com .claude/ (default process.cwd())
 *   log:              fn de log PT-BR
 *   maxIterations:    teto pra testes (default Infinity)
 *   onCycleEnd:       hook pra teste — chamado depois de cada ciclo de checkpoint
 *
 * Para sair: SIGINT (Ctrl+C). Loop intercepta, fecha filho com SIGTERM,
 * grava marker relay-stopped, sai com codigo 0.
 */
async function runRelay(opts) {
  const cfg = normalizeOpts(opts || {});
  const log = cfg.log;

  log(`abri o Claude pra voce. vou descobrir o id da sessao em alguns segundos.`);
  let isContinuation = false;
  let iter = 0;
  let stopRequested = false;

  // RESS-004: handler declarado, mas registrado dentro do try pra garantir
  // que removeListener no finally rode mesmo se algo estourar antes do loop.
  const onSigint = () => {
    if (stopRequested) return;
    stopRequested = true;
    log('ok, voce pediu pra parar. fechando o Claude e encerrando.');
  };

  try {
    process.on('SIGINT', onSigint);
    while (iter < cfg.maxIterations && !stopRequested) {
      iter++;
      const child = spawnSession({
        claudeBin: cfg.claudeBin,
        isContinuation,
        cwd: cfg.cwd,
        env: cfg.env,
        dryRun: cfg.dryRun,
        log,
      });

      const childExited = waitForChildExitPromise(child);
      const baselineSnapMtime = snapshotMtime(cfg.projectDir);

      // Espera o transcript aparecer (race no startup)
      const transcript = await waitForTranscript({
        cwd: cfg.cwd,
        homeDir: cfg.homeDir,
        timeoutMs: TRANSCRIPT_DISCOVERY_TIMEOUT_MS,
        log,
      });

      if (transcript) {
        log(`vigiando a conversa (arquivo em disco: ${path.basename(transcript.file)}). vou medir a cada ${Math.round(cfg.checkIntervalMs / 1000)}s.`);
      } else {
        log('AVISO: nao achei o arquivo da conversa em 10s. vou seguir vigiando, mas o disparo automatico pode falhar.');
      }

      // Loop de medicao desta sessao
      let triggered = false;
      while (!stopRequested && !triggered) {
        // Se o Claude saiu sozinho, sai do loop interno
        if (child.exitCode !== null) {
          log('o Claude fechou sozinho. vou tentar abrir de novo daqui a pouco.');
          break;
        }
        const t = transcript ? refreshTranscript(transcript) : null;
        const usage = t ? measureUsage(t, { tokensPerByte: cfg.tokensPerByte }) : null;
        if (usage && shouldCheckpoint(usage, cfg.threshold)) {
          log(`passou da metade da memoria (~${Math.round(usage.tokens / 1000)}k tokens). vou pedir pro Claude salvar tudo antes de continuar.`);
          triggerCheckpoint(child, { dryRun: cfg.dryRun, log });
          log('pedi pro Claude salvar. aguardando ele terminar.');
          const saved = await waitForSnapshot({
            projectDir: cfg.projectDir,
            baselineMs: baselineSnapMtime,
            timeoutMs: CHECKPOINT_WAIT_TIMEOUT_MS,
            pollMs: 1000,
            log,
          });
          if (saved) log('salvou. fechando essa sessao.');
          else log('passou o tempo limite esperando salvar. fechando mesmo assim.');
          await closeSession(child, { log });
          triggered = true;
        } else {
          await Promise.race([sleep(cfg.checkIntervalMs), childExited]);
        }
      }

      if (stopRequested) {
        await closeSession(child, { log });
        break;
      }

      // Proxima iteracao reabre com --continue
      isContinuation = true;
      if (!cfg.dryRun) log('abri sessao nova continuando de onde parou.');
      if (cfg.onCycleEnd) await cfg.onCycleEnd({ iter, child });
    }
  } finally {
    process.removeListener('SIGINT', onSigint);
    writeStopMarker(cfg.projectDir);
  }

  log('encerrei o robo. ate logo.');
  return { iterations: iter, stoppedByUser: stopRequested };
}

function waitForChildExitPromise(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve(child.exitCode);
    child.once('exit', (code) => resolve(code));
  });
}

function refreshTranscript(t) {
  try {
    const st = fs.statSync(t.file);
    return { file: t.file, mtimeMs: st.mtimeMs, size: st.size };
  } catch {
    return null;
  }
}

async function waitForTranscript({ cwd, homeDir, timeoutMs, log }) {
  const deadline = Date.now() + (timeoutMs || TRANSCRIPT_DISCOVERY_TIMEOUT_MS);
  while (Date.now() < deadline) {
    const t = discoverTranscript({ cwd, homeDir });
    if (t) return t;
    await sleep(500);
  }
  return null;
}

function writeStopMarker(projectDir) {
  try {
    const runtime = path.join(projectDir, '.claude', '.runtime');
    if (!fs.existsSync(runtime)) return;
    const marker = path.join(runtime, 'relay-stopped');
    fs.writeFileSync(marker, new Date().toISOString() + '\n');
  } catch {
    // best-effort
  }
}

function normalizeOpts(o) {
  const cwd = o.cwd || process.cwd();
  const checkInterval = Math.max(
    MIN_CHECK_INTERVAL_MS,
    o.checkIntervalMs || DEFAULT_CHECK_INTERVAL_MS,
  );
  // Default log: prefixo PT-BR amigavel
  const log = o.log || ((msg) => {
    if (o.quiet) return;
    console.log(`[robo-relay] ${msg}`);
  });
  return {
    threshold: o.threshold || DEFAULT_THRESHOLD_TOKENS,
    tokensPerByte: o.tokensPerByte || DEFAULT_TOKENS_PER_BYTE,
    checkIntervalMs: checkInterval,
    claudeBin: o.claudeBin || DEFAULT_CLAUDE_BIN,
    cwd,
    env: o.env || process.env,
    dryRun: !!o.dryRun,
    projectDir: o.projectDir || cwd,
    homeDir: o.homeDir, // undefined = os.homedir()
    log,
    maxIterations: o.maxIterations || Infinity,
    onCycleEnd: o.onCycleEnd || null,
  };
}

// ---------- Parser de flags CLI ----------

/**
 * Parser minimo de flags pro subcomando 'session-relay'.
 * Aceita: --threshold N, --threshold-percent P, --check-interval S,
 *         --tokens-per-byte R, --claude-bin BIN, --dry-run, --quiet
 */
function parseFlags(rawArgs) {
  const out = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '--dry-run') { out.dryRun = true; continue; }
    if (a === '--quiet' || a === '-q') { out.quiet = true; continue; }
    if (a === '--threshold' && rawArgs[i + 1]) {
      const v = parseInt(rawArgs[++i], 10);
      if (Number.isFinite(v) && v > 0) {
        out.threshold = v;
      } else {
        out._warnings = out._warnings || [];
        out._warnings.push(`--threshold recebeu valor invalido, mantive o default.`);
      }
      continue;
    }
    if (a === '--threshold-percent' && rawArgs[i + 1]) {
      const p = parseFloat(rawArgs[++i]);
      if (Number.isFinite(p) && p > 0 && p < 100) {
        // Assume janela 1M tokens (Opus 4.7 1M); pode virar config se mudar
        out.threshold = Math.round(1_000_000 * (p / 100));
      } else {
        out._warnings = out._warnings || [];
        out._warnings.push(`--threshold-percent precisa ser entre 0 e 100 (recebi ${rawArgs[i]}), mantive o default.`);
      }
      continue;
    }
    if (a === '--check-interval' && rawArgs[i + 1]) {
      const v = parseInt(rawArgs[++i], 10);
      if (Number.isFinite(v) && v > 0) {
        out.checkIntervalMs = Math.max(MIN_CHECK_INTERVAL_MS, v * 1000);
      } else {
        out._warnings = out._warnings || [];
        out._warnings.push(`--check-interval recebeu valor invalido, mantive o default.`);
      }
      continue;
    }
    if (a === '--tokens-per-byte' && rawArgs[i + 1]) {
      const r = parseFloat(rawArgs[++i]);
      if (Number.isFinite(r) && r > 0) {
        out.tokensPerByte = 1 / r;
      } else {
        out._warnings = out._warnings || [];
        out._warnings.push(`--tokens-per-byte precisa ser numero > 0, mantive o default.`);
      }
      continue;
    }
    if (a === '--claude-bin' && rawArgs[i + 1]) {
      out.claudeBin = rawArgs[++i];
      continue;
    }
  }
  return out;
}

// ---------- Exports ----------

module.exports = {
  // Constantes (uteis pra teste)
  DEFAULT_THRESHOLD_TOKENS,
  DEFAULT_TOKENS_PER_BYTE,
  DEFAULT_CHECK_INTERVAL_MS,
  MIN_CHECK_INTERVAL_MS,
  DEFAULT_CLAUDE_BIN,
  // Funcoes puras (testaveis)
  encodeCwd,
  projectsDirFor,
  listRootJsonl,
  discoverTranscript,
  bytesToTokens,
  measureUsage,
  shouldCheckpoint,
  triggerCheckpoint,
  snapshotMtime,
  waitForSnapshot,
  closeSession,
  spawnSession,
  parseFlags,
  // Loop principal
  runRelay,
};
