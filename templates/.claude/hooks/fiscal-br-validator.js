#!/usr/bin/env node
// fiscal-br-validator.js — bloqueia padroes que violam regras fiscais BR.
// Hook PreToolUse, matcher: Write|Edit. FISCAL-001/002/003/004/005/006.
//
// FISCAL-006: nao-aplica (o hook detecta menciones tributarias, nao calcula imposto)
// FISCAL-004: nao-aplica (o hook nao chama webservice SEFAZ, so escaneia codigo)

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

// FISCAL-006: Reforma Tributaria 2026-2033 — calculo paralelo ICMS/ISS/PIS/COFINS
// (regime atual) E CBS/IBS/IS (regime novo) durante a transicao. Codigo que toca
// imposto sem declarar "qual regime cobre" vira debito tecnico fiscal grande.
//
// Detectamos: criacao de campo/variavel/funcao de calculo tributario sem
// declaracao de // FISCAL-006: <periodo>, ex: "transicao", "pos-2033", "split-payment".
const FISCAL_006_TAX_FIELDS = /\b(icms|iss|pis|cofins|cbs|ibs|imposto_seletivo|imposto_unico|aliquota|base_calculo|tributacao)\b/i;
const FISCAL_006_DECLARATION_RE = /FISCAL-006:\s*(transicao|pos-?2033|atual|novo-regime|split-payment|nao-aplica)/i;
// So dispara em arquivo que parece calculo (nome ou diretorio de tributacao/fiscal)
const FISCAL_006_RELEVANT_PATH = /(tributa|fiscal|imposto|calculo[-_]?(icms|iss|pis|cofins|cbs|ibs))/i;

// FISCAL-006: nao-aplica / FISCAL-004: nao-aplica (este arquivo SO escaneia codigo)
// FISCAL-004: contingencia SEFAZ. Codigo que emite NF-e (chama webservice
// nfeAutorizacao/emitir/transmitir/enviarLote/sendNFe etc.) sem declarar a
// estrategia de contingencia (SVC-AN/SVC-RS/EPEC) vira sintoma quando SEFAZ
// cair. Auditoria 2026-05-25 (regra #26): FISCAL-004 era so doutrina.
//
// Padrao moderno (Manual NF-e 7.00+): SVC-AN (maioria UFs), SVC-RS (AM/PR/RS),
// EPEC (Evento Previo de Emissao em Contingencia). FS-DA esta em desuso.
const FISCAL_004_EMISSAO_RE = /\b(nfeAutorizacao|nfeAutorizacaoLote|nfceAutorizacao|cteAutorizacao|mdfeAutorizacao|enviarLote|transmitirNFe|sendNFe|emitirNFe|emitirNFCe|emitirCTe|emitirMDFe|enviar_lote_nfe|envia_lote)\b/i;
const FISCAL_004_DECLARATION_RE = /FISCAL-004:\s*(svc-an|svc-rs|epec|contingencia|fs-da|nao-aplica)/i;

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

  // FISCAL-006: checagem por arquivo (nao por linha). Se o caminho parece fiscal
  // E o conteudo menciona impostos sem declaracao FISCAL-006, soft-bloqueia.
  // FISCAL-006: nao-aplica (FISCAL_006_DECLARATION_RE casa "nao-aplica")
  if (FISCAL_006_RELEVANT_PATH.test(filePath) && FISCAL_006_TAX_FIELDS.test(content)) {
    if (!FISCAL_006_DECLARATION_RE.test(content)) {
      violations.push(
        `arquivo [FISCAL-006]: codigo tributario sem declaracao de regime (transicao/pos-2033/split-payment). Reforma 2026-2033 exige calculo paralelo ICMS/CBS — sem isso vira debito tecnico fiscal.`
      );
    }
  }

  // FISCAL-004: checagem por arquivo. Arquivo que chama webservice de emissao
  // SEFAZ deve declarar a estrategia de contingencia (FISCAL-004: SVC-AN|SVC-RS|
  // EPEC|nao-aplica). Sem declaracao, emissao trava quando SEFAZ cai.
  // FISCAL-004: nao-aplica (este bloco escaneia codigo, nao chama SEFAZ)
  if (FISCAL_004_EMISSAO_RE.test(content) && !FISCAL_004_DECLARATION_RE.test(content)) {
    violations.push(
      `arquivo [FISCAL-004]: codigo emite NF-e sem declarar estrategia de contingencia. Quando SEFAZ cai, operacao trava. Declare no topo do arquivo: // FISCAL-004: SVC-AN (ou SVC-RS / EPEC).`
    );
  }

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
    process.stderr.write(`  FISCAL-004: declare estrategia de contingencia no topo do arquivo:\n`);
    process.stderr.write(`              // FISCAL-004: SVC-AN (UFs gerais — SP, MG, RJ, etc.)\n`);
    process.stderr.write(`              ou: // FISCAL-004: SVC-RS (AM, PR, RS)\n`);
    process.stderr.write(`              ou: // FISCAL-004: EPEC (Evento Previo de Emissao em Contingencia)\n`);
    process.stderr.write(`              ou: // FISCAL-004: nao-aplica (modulo de leitura, nao emite)\n`);
    process.stderr.write(`  FISCAL-005: jul/2026: CNPJ aceita letras. Use [0-9A-Z]{14}, nao [0-9]{14}.\n`);
    process.stderr.write(`  FISCAL-006: declare regime tributario no topo do arquivo:\n`);
    process.stderr.write(`              // FISCAL-006: transicao (calcula ICMS atual E CBS/IBS novo em paralelo)\n`);
    process.stderr.write(`              ou: // FISCAL-006: pos-2033 (so CBS/IBS)\n`);
    process.stderr.write(`              ou: // FISCAL-006: nao-aplica (codigo nao toca calculo, so persistencia)\n\n`);
    process.stderr.write(`Detalhe: REGRAS-INEGOCIAVEIS.md (FISCAL-001..010).\n`);
    process.stderr.write(`Excecao por linha: // FISCAL-NNN-exception: <razao + responsavel>.\n`);
    recordMetric('block', 'fiscal-br-validator', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[fiscal-br-validator] erro interno: ${err.message}\n`);
  process.exit(2);
});
