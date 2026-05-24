#!/usr/bin/env node
// fiscal-br-validator.js — bloqueia padroes que violam regras fiscais BR.
// Hook PreToolUse, matcher: Write|Edit. FISCAL-001/002/003/005.

const { readStdinJson, recordMetric } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|\/test\/|\/tests\/|\/__tests__\/|\/spec\/|\/specs\/|\/e2e\/|\.test\.|\.spec\.|\.e2e\.|\/fixtures\/|\/mocks\/|\/__mocks__\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs)$/;
const COMMENT_LINE_RE = /^\s*(\/\/|#)/;
const EXCEPTION_RE = /FISCAL-\d+-exception/;
// ENV_RE cobre referencia a env/secret. Usado SO em FISCAL-002 (caminho/senha
// de certificado vinda de env) — la o padrao seguro existe e o validator
// confirma. NAO use ENV_RE em FISCAL-003 (ambiente=1) — ver F3_ENV_PURE_RE.
const ENV_RE = /env\.|process\.env|os\.environ|getenv|ENV\[|secret|vault/i;

// FISCAL-001: regerar/alterar XML autorizado
const FISCAL_001_REGEN = /(regenerate|regerar|rebuild|recreate|overwrite).{0,30}(nfe|nf-e|xml).{0,30}(autorizad|authorized|emitida)/i;
const FISCAL_001_ALTER = /(nfe|nf-e|xml).{0,30}(autorizad|authorized|emitida).{0,30}(update|alter|modify|edit|rewrite)/i;

// FISCAL-002: certificado/senha hardcoded
const FISCAL_002_CERT_PATH = /(certificate|certificado|pfx|p12|cert_path).{0,30}=.{0,30}["'][^"']+\.(pfx|p12|pem)["']/;
const FISCAL_002_CERT_PASS = /(cert_pass|cert_password|certificado_senha|pfx_pass|p12_pass).{0,5}=.{0,5}["'][^"']{3,}["']/i;

// FISCAL-003: ambiente=1 (producao) hardcoded
// Cobre 3 notacoes: atribuicao (=), objeto/YAML (:) e tag XML (<tpAmb>1</tpAmb>)
const FISCAL_003_NUMERIC = /(tpAmb|tp_amb|ambiente|environment)\s*[=:]\s*["']?1["']?/;
const FISCAL_003_STRING = /(tpAmb|tp_amb|ambiente|environment)\s*[=:]\s*["']?(producao|production|prod)["']?/i;
const FISCAL_003_XML = /<\s*tpAmb\s*>\s*1\s*<\s*\/\s*tpAmb\s*>/i;
// F3_ENV_PURE_RE: libera APENAS quando o valor de ambiente VEM de env/config
// sem fallback literal. Antes (F3_ENV_RE simples) liberava
// `tpAmb = process.env.TPAMB || 1` — o fallback hardcoded de producao passava.
// Auditoria 10-agentes 2ª passada 2026-05-24: bloquear fallback || 1/'prod'.
const F3_ENV_PURE_RE = /(env\.|process\.env|os\.environ|getenv|ENV\[|config\.|settings\.)/i;
const F3_FALLBACK_PROD_RE = /(\|\||\?\?)\s*["']?(1|producao|production|prod)["']?\b/i;
const F3_COMMENT_HOMOLOG_RE = /(\/\/|#|\/\*).{0,80}(homolog|sandbox|desenvolvimento|dev|teste|test|exemplo|example|comentario|documenta)/i;
const F3_CONST_REFERENCIAL_RE = /^\s*(const|let|var|final|static)\s+(tpAmb_PROD|TP_AMB_PROD|AMBIENTE_PRODUCAO|SEFAZ_PRODUCAO|PROD_ENV)/i;

// FISCAL-005: regex CNPJ apenas numerica
const FISCAL_005_DIGIT = /cnpj.{0,30}=.{0,30}\/\^?\[0-9\]\{14\}\$?\//i;
const FISCAL_005_BACKSLASH = /cnpj.{0,30}=.{0,30}\/\^?\\d\{14\}\$?\//i;

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const violations = [];
  const lines = String(content).split(/\r?\n/);
  lines.forEach((line, i) => {
    if (COMMENT_LINE_RE.test(line)) return;
    if (EXCEPTION_RE.test(line)) return;
    const ln = i + 1;

    if (FISCAL_001_REGEN.test(line)) violations.push(`linha ${ln} [FISCAL-001]: regeracao de XML autorizado: ${line}`);
    if (FISCAL_001_ALTER.test(line)) violations.push(`linha ${ln} [FISCAL-001]: alteracao de XML autorizado: ${line}`);

    if (FISCAL_002_CERT_PATH.test(line) && !ENV_RE.test(line)) {
      violations.push(`linha ${ln} [FISCAL-002]: caminho de certificado hardcoded: ${line}`);
    }
    if (FISCAL_002_CERT_PASS.test(line) && !ENV_RE.test(line)) {
      violations.push(`linha ${ln} [FISCAL-002]: senha de certificado em texto puro: ${line}`);
    }

    if (FISCAL_003_NUMERIC.test(line) || FISCAL_003_STRING.test(line) || FISCAL_003_XML.test(line)) {
      // Libera se vem de env/config E nao tem fallback hardcoded de producao
      const fromEnv = F3_ENV_PURE_RE.test(line);
      const hasProdFallback = F3_FALLBACK_PROD_RE.test(line);
      if (fromEnv && !hasProdFallback) return;
      if (F3_COMMENT_HOMOLOG_RE.test(line)) return;
      if (F3_CONST_REFERENCIAL_RE.test(line)) return;
      violations.push(`linha ${ln} [FISCAL-003]: ambiente de producao codificado direto (ou fallback ||1 perigoso): ${line}`);
    }

    if (FISCAL_005_DIGIT.test(line)) {
      violations.push(`linha ${ln} [FISCAL-005]: regex CNPJ apenas numerica (pos jul/2026 aceita letras): ${line}`);
    }
    if (FISCAL_005_BACKSLASH.test(line)) {
      violations.push(`linha ${ln} [FISCAL-005]: regex CNPJ apenas numerica (pos jul/2026 aceita letras): ${line}`);
    }
  });

  if (violations.length > 0) {
    const MAX = 3;
    process.stderr.write(`[fiscal-br-validator] Bloqueei a escrita: padrao que viola regra fiscal BR.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes (ate ${MAX}):\n`);
    for (let i = 0; i < Math.min(MAX, violations.length); i++) {
      process.stderr.write(`  - ${violations[i]}\n`);
    }
    if (violations.length > MAX) {
      process.stderr.write(`  (... e mais ${violations.length - MAX} ocorrencia(s))\n`);
    }
    process.stderr.write(`\nComo destravar (caso a caso):\n`);
    process.stderr.write(`  FISCAL-001: NF-e autorizada nao pode ser alterada. Cancele ou emita CC-e.\n`);
    process.stderr.write(`  FISCAL-002: tire o certificado/senha do codigo. Coloque em variavel de ambiente.\n`);
    process.stderr.write(`  FISCAL-003: ambiente SEFAZ (1=producao, 2=homolog) vem de env, nunca do codigo.\n`);
    process.stderr.write(`  FISCAL-005: jul/2026: CNPJ aceita letras. Use [0-9A-Z]{14}, nao [0-9]{14}.\n\n`);
    process.stderr.write(`Detalhe: REGRAS-INEGOCIAVEIS.md (FISCAL-001..007).\n`);
    process.stderr.write(`Excecao por linha: // FISCAL-NNN-exception: <razao + responsavel>.\n`);
    recordMetric('block', 'fiscal-br-validator', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[fiscal-br-validator] erro interno: ${err.message}\n`);
  process.exit(2);
});
