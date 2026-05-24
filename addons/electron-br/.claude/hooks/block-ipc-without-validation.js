#!/usr/bin/env node
// block-ipc-without-validation.js — barra ipcMain.handle sem validacao schema.
// Hook PreToolUse, matcher: Write|Edit. ELECTRON-002.

function readStdinJson() {
  return new Promise((resolve) => {
    let raw = '';
    if (process.stdin.isTTY) { resolve({}); return; }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { raw += c; });
    process.stdin.on('end', () => {
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

const MAIN_PATH_RE = /src\/main\/|main\/ipc\/|\/electron\/main\//;
const IPC_HANDLE_RE = /ipcMain\.handle\(/;
const VALIDATION_RE = /\.parse\(|\.safeParse\(|validate\(|ajv\.|Joi\.|assertSchema|zod\.|z\./;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!MAIN_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const lines = String(content).split(/\r?\n/);
  const violations = [];
  let inHandler = false;
  let handlerStart = 0;
  let handlerLine = '';
  let bodyCheck = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    if (!inHandler && IPC_HANDLE_RE.test(line)) {
      inHandler = true;
      handlerStart = lineNum;
      handlerLine = line;
      bodyCheck = '';
      continue;
    }
    if (inHandler) {
      bodyCheck += ' ' + line;
      if (lineNum - handlerStart >= 4) {
        if (!VALIDATION_RE.test(bodyCheck)) {
          violations.push(`L${handlerStart}: ${handlerLine}  ->  handler sem validacao Zod/Ajv/Joi nas 4 primeiras linhas`);
        }
        inHandler = false;
      }
    }
  }

  if (violations.length === 0) process.exit(0);

  process.stderr.write(`[block-ipc-without-validation] BLOQUEADO: IPC handler sem validacao de schema.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes:\n`);
  for (const v of violations) process.stderr.write(`  - ${v}\n`);
  process.stderr.write(`\nRegra: ELECTRON-002 — IPC handler valida payload do renderer ANTES de executar.\n\n`);
  process.stderr.write(`Renderer e nao-confiavel. Sem validacao = canal aberto pra injecao.\n\n`);
  process.stderr.write(`Exemplo:\n`);
  process.stderr.write(`  ipcMain.handle('cliente:cadastrar', async (e, payload) => {\n`);
  process.stderr.write(`    const data = MeuSchema.parse(payload);  // <-- obrigatorio\n`);
  process.stderr.write(`    // resto do handler\n`);
  process.stderr.write(`  });\n`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[block-ipc-without-validation] erro interno: ${err.message}\n`);
  process.exit(2);
});
