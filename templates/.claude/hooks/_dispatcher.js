#!/usr/bin/env node
// _dispatcher.js — roda um GRUPO de hooks num único processo node.
//
// Motivação (ADR-033, auditoria 2026-08-17): cada Write/Edit disparava 22
// processos node simultâneos (cold-start ~600ms cada; ~6s de cadeia medidos
// num notebook classe U). Com o dispatcher, o Claude Code sobe UM processo
// por evento; os hooks do grupo rodam in-process, na MESMA ordem de antes.
//
// Contrato de hook "despachável":
//   module.exports = { runHook, onErrorExit }
//   - runHook(input) -> Promise<number>  (0 = libera; 2 = bloqueia)
//     * escreve process.stderr/stdout normalmente; NUNCA chama process.exit.
//   - onErrorExit: 0 (fail-open, hooks soft) ou 2 (fail-closed, bloqueadores)
//   O modo CLI de cada hook continua existindo (wrapper `require.main`),
//   então os testes que spawnam o arquivo direto não mudam.
//
// Hook ainda não convertido: fallback automático via subprocesso (compat).
//
// Uso (settings.json): node _dispatcher.js <nome-do-grupo>
// Grupos e ordem: _dispatcher-groups.json (fonte única, validada por
// tools/validar-cobertura-hooks.js).

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readStdinRaw() {
  return new Promise((resolve) => {
    let raw = '';
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => {
      raw += c;
    });
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(raw));
  });
}

(async () => {
  const grupo = process.argv[2] || '';
  if (!grupo) {
    process.stderr.write('[_dispatcher] uso: _dispatcher.js <grupo>\n');
    process.exit(0);
  }

  let grupos;
  try {
    grupos = JSON.parse(fs.readFileSync(path.join(__dirname, '_dispatcher-groups.json'), 'utf8'));
  } catch (err) {
    // Sem mapa de grupos não dá pra saber o que rodar — falha visível, não silenciosa.
    process.stderr.write(`[_dispatcher] _dispatcher-groups.json ilegível: ${err.message}\n`);
    process.exit(2);
  }
  const hooks = grupos[grupo];
  if (!Array.isArray(hooks) || hooks.length === 0) {
    process.stderr.write(`[_dispatcher] grupo desconhecido/vazio: ${grupo}\n`);
    process.exit(2);
  }

  const raw = await readStdinRaw();
  let input = {};
  try {
    input = raw ? JSON.parse(raw) : {};
  } catch {
    input = {};
  }

  for (const nome of hooks) {
    const file = path.join(__dirname, `${nome}.js`);
    let mod = null;
    try {
      mod = require(file);
    } catch (err) {
      process.stderr.write(`[_dispatcher] falha ao carregar ${nome}: ${err.message}\n`);
      process.exit(2); // hook bloqueador ausente não pode virar liberação silenciosa
    }

    let exit = 0;
    if (mod && typeof mod.runHook === 'function') {
      const onErr = mod.onErrorExit === 0 ? 0 : 2;
      try {
        // 2º arg: texto cru do stdin — block-destructive escaneia mesmo com JSON quebrado.
        exit = (await mod.runHook(input, raw)) | 0;
      } catch (err) {
        process.stderr.write(`[${nome}] erro interno: ${err.message}\n`);
        exit = onErr;
      }
    } else {
      // Compat: hook legado sem contrato — roda como subprocesso (modo antigo).
      const r = spawnSync(process.execPath, [file], {
        input: raw,
        stdio: ['pipe', 'inherit', 'inherit'],
        timeout: 30000,
        windowsHide: true,
      });
      exit = r.status === null ? 2 : r.status;
    }

    if (exit !== 0) process.exit(exit);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[_dispatcher] erro interno: ${err.message}\n`);
  process.exit(2);
});
