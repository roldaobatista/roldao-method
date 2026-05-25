#!/usr/bin/env node
// auto-format-on-write.js — PostToolUse hook (Write|Edit).
// Roda lint/format do arquivo recem-tocado quando o projeto declarou ferramenta.
// Nunca bloqueia (exit 0 sempre).

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { readStdinJson, sanitizeProjdir } = require('./_lib.js');

// Auditoria 2026-05-25 (seguranca #8): hasCommand antes aceitava qualquer
// binario do PATH global. Atacante com write em ~/.local/bin/prettier conseguia
// rodar codigo arbitrario a cada Write/Edit. Agora so libera global quando o
// usuario opta explicitamente via ROLDAO_METHOD_FORMAT_ALLOW_GLOBAL=1.
const ALLOW_GLOBAL_FORMATTERS = process.env.ROLDAO_METHOD_FORMAT_ALLOW_GLOBAL === '1';

function hasCommand(cmd) {
  if (!ALLOW_GLOBAL_FORMATTERS) return false;
  try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function run(cmd, args) {
  // shell:false explicito + sem env herdado evita injection se algum dia o
  // file vier com metachar shell; timeout protege formatter travado.
  try {
    spawnSync(cmd, args, {
      stdio: 'ignore',
      timeout: 15000,
      shell: false,
      windowsHide: true,
    });
  } catch { /* best-effort */ }
}

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }

  const input = await readStdinJson();
  const file = input?.tool_input?.file_path || '';
  // Guard contra path interpretado como flag (ex: "-rf", "--config=evil")
  // pelas ferramentas chamadas adiante (prettier/eslint/ruff/black/gofmt/etc),
  // contra null-byte injection (corta path em libc) e contra path nao-string.
  if (typeof file !== 'string' || !file || file.startsWith('-') || file.includes('\0') || !fs.existsSync(file)) process.exit(0);

  const ext = (file.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
  const localBin = (b) => path.join(projdir, 'node_modules', '.bin', b);

  // md fica fora — paths-frontmatter-validator inspeciona quebras de linha.
  if (['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'yml', 'yaml', 'css', 'scss', 'html'].includes(ext)) {
    if (fs.existsSync(localBin('prettier'))) run(localBin('prettier'), ['--write', file]);
    else if (hasCommand('prettier')) run('prettier', ['--write', file]);

    if (['ts', 'tsx', 'js', 'jsx'].includes(ext) && fs.existsSync(localBin('eslint'))) {
      run(localBin('eslint'), ['--fix', file]);
    }
  } else if (ext === 'py') {
    if (hasCommand('ruff')) { run('ruff', ['format', file]); run('ruff', ['check', '--fix', file]); }
    if (hasCommand('black')) run('black', [file]);
  } else if (ext === 'go') {
    if (hasCommand('gofmt')) run('gofmt', ['-w', file]);
    if (hasCommand('goimports')) run('goimports', ['-w', file]);
  } else if (ext === 'rs') {
    if (hasCommand('rustfmt')) run('rustfmt', [file]);
  } else if (ext === 'sh' || ext === 'bash') {
    if (hasCommand('shfmt')) run('shfmt', ['-w', file]);
  }

  process.exit(0);
})().catch(() => process.exit(0));
