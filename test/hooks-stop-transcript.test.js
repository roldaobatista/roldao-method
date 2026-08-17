#!/usr/bin/env node
/**
 * test/hooks-stop-transcript.test.js — hooks de Stop com payload REAL.
 *
 * Auditoria 2026-08-17: block-jargon-pt-br e block-confirmation-questions
 * eram inertes em producao porque liam input.response/message, campos que o
 * evento Stop NAO envia (payload real: session_id, transcript_path, cwd,
 * hook_event_name, stop_hook_active). Os testes antigos fabricavam
 * {response} e ficavam verdes com o hook morto. Este arquivo garante que os
 * hooks funcionam com o payload verdadeiro (resposta lida do transcript
 * JSONL) e que stop_hook_active evita laco infinito.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const HOOK_JARGON = path.join(ROOT, 'templates', '.claude', 'hooks', 'block-jargon-pt-br.js');
const HOOK_CONFIRM = path.join(
  ROOT,
  'templates',
  '.claude',
  'hooks',
  'block-confirmation-questions.js',
);
const HOOK_PIPELINE = path.join(
  ROOT,
  'templates',
  '.claude',
  'hooks',
  'enforce-pipeline-completion.js',
);

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) {
    pass++;
    console.log(`  OK   ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`);
  }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stop-transcript-'));

// Monta um transcript JSONL no formato do Claude Code: entries user/assistant
// intercaladas; a resposta do assistente vem em message.content[{type:'text'}].
function writeTranscript(assistantText, opts = {}) {
  const file = path.join(tmpDir, `transcript-${Math.floor(Math.random() * 1e9)}.jsonl`);
  const lines = [
    JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text: 'pedido do usuario' }] },
    }),
    JSON.stringify({
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [{ type: 'tool_use', id: 'toolu_x', name: 'Bash', input: { command: 'ls' } }],
      },
    }),
    JSON.stringify({
      type: 'assistant',
      message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] },
    }),
  ];
  if (opts.trailingNonAssistant) {
    lines.push(JSON.stringify({ type: 'system', subtype: 'info' }));
  }
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

function runStop(hook, transcriptPath, extra = {}) {
  const input = JSON.stringify({
    session_id: 'abc123',
    transcript_path: transcriptPath,
    cwd: tmpDir,
    hook_event_name: 'Stop',
    stop_hook_active: false,
    ...extra,
  });
  const r = spawnSync('node', [hook], { input, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  const stdout = (r.stdout || '').toString();
  let decision = null;
  try {
    if (stdout) decision = JSON.parse(stdout).decision;
  } catch {
    /* nao e json */
  }
  return { exit: r.status, decision, stdout };
}

console.log('\nhooks-stop-transcript: payload REAL do evento Stop\n');

// ============================================================================
// block-jargon-pt-br via transcript
// ============================================================================
{
  const t = writeTranscript('fiz o deploy e o push da correcao pro backend');
  const r = runStop(HOOK_JARGON, t);
  check(
    'jargao no transcript → block (hook deixa de ser inerte)',
    r.decision === 'block',
    `decision=${r.decision}`,
  );
}
{
  const t = writeTranscript('salvei a correcao no sistema e validei que esta funcionando');
  const r = runStop(HOOK_JARGON, t);
  check('resposta limpa no transcript → libera', r.decision === null && r.exit === 0);
}
{
  const t = writeTranscript('fiz o deploy e o push da correcao', { trailingNonAssistant: true });
  const r = runStop(HOOK_JARGON, t);
  check('entry nao-assistant no fim nao esconde a resposta', r.decision === 'block');
}
{
  const t = writeTranscript('fiz o deploy e o push da correcao');
  const r = runStop(HOOK_JARGON, t, { stop_hook_active: true });
  check('stop_hook_active=true → nao re-bloqueia (anti-loop)', r.decision === null && r.exit === 0);
}
{
  const r = runStop(HOOK_JARGON, path.join(tmpDir, 'nao-existe.jsonl'));
  check('transcript inexistente → fail-open sem crash', r.decision === null && r.exit === 0);
}
{
  const r = runStop(HOOK_JARGON, null);
  check('payload Stop sem transcript_path → libera sem crash', r.decision === null && r.exit === 0);
}

// ============================================================================
// block-confirmation-questions via transcript
// ============================================================================
{
  const t = writeTranscript('Terminei a analise. Quer que eu aplique a correcao agora?');
  const r = runStop(HOOK_CONFIRM, t);
  check(
    'pergunta de confirmacao no transcript → block (hook deixa de ser inerte)',
    r.decision === 'block',
    `decision=${r.decision}`,
  );
}
{
  const t = writeTranscript('Apliquei a correcao e validei. Relatorio abaixo.');
  const r = runStop(HOOK_CONFIRM, t);
  check('resposta executora no transcript → libera', r.decision === null && r.exit === 0);
}
{
  const t = writeTranscript('Quer que eu aplique a correcao agora?');
  const r = runStop(HOOK_CONFIRM, t, { stop_hook_active: true });
  check(
    'confirm: stop_hook_active=true → nao re-bloqueia (anti-loop)',
    r.decision === null && r.exit === 0,
  );
}

// ============================================================================
// compat: input.response direto (PostToolUse / testes antigos) segue valendo
// ============================================================================
{
  const input = JSON.stringify({ response: 'fiz o deploy pro backend' });
  const r = spawnSync('node', [HOOK_JARGON], { input, timeout: 15000 });
  let decision = null;
  try {
    decision = JSON.parse((r.stdout || '').toString()).decision;
  } catch {
    /* nao e json */
  }
  check('compat: input.response direto ainda bloqueia', decision === 'block');
}

// ============================================================================
// enforce-pipeline-completion: anti-loop
// ============================================================================
{
  const input = JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: true });
  const r = spawnSync('node', [HOOK_PIPELINE], {
    input,
    timeout: 15000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: tmpDir },
  });
  check('pipeline: stop_hook_active=true → exit 0 imediato', r.status === 0);
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\nTotal: ${pass + fail}  |  OK: ${pass}  |  FAIL: ${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
