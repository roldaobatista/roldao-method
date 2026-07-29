#!/usr/bin/env node
// require-sefaz-env.js — barra codigo que emite NF-e sem ler SEFAZ_AMBIENTE de env.
// Hook PreToolUse, matcher: Write|Edit. FISCAL-003.
// FISCAL-004: nao-aplica (este hook valida codigo de emissao alheio; o hook em si nao emite).
// FISCAL-006: nao-aplica (validador, nao toca calculo tributario).

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

// FISCAL-004: nao-aplica — este arquivo SO escaneia codigo, nao chama webservice SEFAZ.
// As constantes abaixo sao regex que detectam padroes de codigo alheio.
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php)$/;
// Auditoria 10x1 (R4, 2026-05-27): expandido pra eSocial e REINF —
// FISCAL-003 exige ambiente de homologacao em TODA integracao fiscal,
// nao so NF-e. eSocial usa tpAmb em S-1000; REINF usa tpAmb em R-1000.
const NFE_PATH_RE = /nfe|NFe|nf-e|nfse|NFSe|sefaz|SEFAZ|fiscal|emit|esocial|eSocial|reinf|REINF|sped|SPED/;
const EMIT_RE = /autoriza|enviarLote|sefaz|tpAmb|ambiente.*sefaz|emit.*nfe|esocial.*envio|reinf.*envio/i;
const ENV_RE = /env.*(SEFAZ_AMBIENTE|ESOCIAL_AMBIENTE|REINF_AMBIENTE)|env\.(SEFAZ|ESOCIAL|REINF)|process\.env\.(SEFAZ|ESOCIAL|REINF)|os\.environ.*(SEFAZ|ESOCIAL|REINF)|getenv.*(SEFAZ|ESOCIAL|REINF)|config.*(sefaz|esocial|reinf)|ENV\['(SEFAZ|ESOCIAL|REINF)/i;
const EXCEPTION_RE = /NFE-003-exception|FISCAL-003-exception/;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);
  if (!NFE_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  if (!EMIT_RE.test(content)) process.exit(0);
  if (ENV_RE.test(content)) process.exit(0);
  if (EXCEPTION_RE.test(content)) process.exit(0);

  process.stderr.write(`[require-sefaz-env] BLOQUEADO: codigo fiscal sem leitura de SEFAZ_AMBIENTE da env.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n\n`);
  process.stderr.write(`Regra: FISCAL-003 / NFE-003 — ambiente SEFAZ (1=producao, 2=homologacao) sempre\n`);
  process.stderr.write(`vem de variavel de ambiente. Nunca hardcoded.\n\n`);
  process.stderr.write(`Por que:\n`);
  process.stderr.write(`  - Voce nao pode trocar prod<->homolog sem deploy.\n`);
  process.stderr.write(`  - Voce arrisca emitir nota fiscal real em ambiente de teste (problema legal).\n`);
  process.stderr.write(`  - Voce arrisca testar em producao (multa).\n\n`);
  process.stderr.write(`Correto:\n`);
  process.stderr.write(`  const SEFAZ_AMBIENTE = process.env.SEFAZ_AMBIENTE;\n`);
  process.stderr.write(`  if (!SEFAZ_AMBIENTE || !['1', '2'].includes(SEFAZ_AMBIENTE)) {\n`);
  process.stderr.write(`    throw new Error('SEFAZ_AMBIENTE deve ser "1" (prod) ou "2" (homolog)');\n`);
  process.stderr.write(`  }\n\n`);
  process.stderr.write(`Excecao na primeira linha do arquivo:\n`);
  process.stderr.write(`  // FISCAL-003-exception: <razao>\n`);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[require-sefaz-env] erro interno: ${err.message}\n`);
  process.exit(2);
});
