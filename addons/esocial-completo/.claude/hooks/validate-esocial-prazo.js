#!/usr/bin/env node
// validate-esocial-prazo.js — AVISO (nao bloqueia) sobre evento eSocial fora de prazo.
// Hook PreToolUse, matcher: Write|Edit. ESOCIAL-001.

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

const ESOCIAL_PATH_RE = /esocial|e-social|ESocial|eSocial/;
const CODE_EXT_RE = /\.(js|ts|py|go|java|cs|rb|php|rs)$/;
const ESOCIAL_KEYWORDS_RE = /S-?[0-9]{4}|esocial|admissao|desligamento|cat-acid/i;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  // Aplicabilidade: path com "esocial" OU codigo com keyword esocial
  if (!ESOCIAL_PATH_RE.test(filePath)) {
    if (!CODE_EXT_RE.test(filePath)) process.exit(0);
    if (!ESOCIAL_KEYWORDS_RE.test(content)) process.exit(0);
  }

  const warnings = [];

  // S-2200 (admissao) — prazo: dia anterior
  if (/S-?2200|admiss/i.test(content)) {
    if (!/antes.{0,30}(inicio|admiss|dia\s+anterior)/i.test(content)) {
      warnings.push("Codigo toca S-2200 (admissao) mas nao parece validar prazo 'dia anterior ao inicio'. ESOCIAL-001.");
    }
  }

  // S-2299 (desligamento) — 10 dias OR TRCT
  if (/S-?2299|desligamento|rescis/i.test(content)) {
    if (!/10.{0,30}(dia|days)|TRCT|trct|recibo/i.test(content)) {
      warnings.push("Codigo toca S-2299 (desligamento) mas nao parece validar prazo 10 dias ou TRCT. ESOCIAL-001.");
    }
  }

  // S-2210 (CAT) — 1 dia util
  if (/S-?2210|\bCAT\b|acidente/i.test(content)) {
    if (!/1.{0,30}(dia|day)|imediato|primeiro\s+dia/i.test(content)) {
      warnings.push("Codigo toca S-2210 (CAT) mas nao parece validar prazo 1 dia util. ESOCIAL-001 (multa alta).");
    }
  }

  // ESOCIAL-003: ambiente hardcoded
  if (/ESOCIAL_AMBIENTE.{0,10}=.{0,5}["']?1["']?/.test(content)) {
    if (!/env|process\.env|os\.environ|getenv/i.test(content)) {
      warnings.push("ESOCIAL-003: ambiente eSocial=1 (producao) hardcoded. Use env.");
    }
  }

  if (warnings.length === 0) process.exit(0);

  process.stderr.write(`[validate-esocial-prazo] AVISO: integracao com eSocial sem validacao explicita de prazo legal.\n\n`);
  process.stderr.write(`Arquivo: ${filePath}\n\nPontos detectados:\n`);
  for (const w of warnings) process.stderr.write(`  - ${w}\n`);
  process.stderr.write(`\nPrazos legais eSocial (ESOCIAL-001):\n`);
  process.stderr.write(`  S-2200 admissao -> dia anterior ao inicio das atividades\n`);
  process.stderr.write(`  S-2299 desligamento -> 10 dia subsequente OU envio TRCT\n`);
  process.stderr.write(`  S-2210 CAT -> 1 dia util (imediato se fatal)\n`);
  process.stderr.write(`  S-2230 afastamento -> dia 15 do mes seguinte\n`);
  process.stderr.write(`  S-1200/1210/1299 folha -> dia 15 do mes seguinte\n\n`);
  process.stderr.write(`Multa por atraso: R$ 500 a R$ 24.000 por evento (Decreto 8.373/2014).\n\n`);
  process.stderr.write(`NAO e BLOQUEIO — e AVISO. Confirme que ha controle de prazo (alerta, fila com agendamento) antes de seguir.\n`);
  process.exit(0); // soft warning
})().catch(() => process.exit(0));
