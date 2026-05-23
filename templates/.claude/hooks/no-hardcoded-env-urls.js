#!/usr/bin/env node
// no-hardcoded-env-urls.js — bloqueia URL/host de servico externo hardcoded.
// Hook PreToolUse, matcher: Write|Edit. SEC-005.

const { readStdinJson, recordMetric } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.env|config.*\.example|\.example|README|\.md$|\/docs\/|\/test\/|\/tests\/|\/__tests__\/|\/spec\/|\/specs\/|\/e2e\/|\/cypress\/|\/playwright\/|\.test\.|\.spec\.|\.e2e\.|\/fixtures\/|\/mocks\/|\/__mocks__\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift)$/;
const COMMENT_LINE_RE = /^\s*(\/\/|#|\/\*|\*)/;
const EXCEPTION_RE = /SEC-005-exception|env\.|process\.env|os\.environ|getenv|ENV\[|Deno\.env/;

const SENSITIVE_DOMAINS = [
  'api\\.sefaz\\.[a-z]+\\.gov\\.br',
  'nfe\\.fazenda\\.[a-z]+\\.gov\\.br',
  'nfe\\.fazenda\\.gov\\.br',
  'homologacao\\.nfe\\.fazenda\\.gov\\.br',
  'producao\\.nfe\\.fazenda\\.gov\\.br',
  'webservices\\.nfe\\.[a-z]+\\.gov\\.br',
  'svc-an\\.[a-z]+\\.gov\\.br',
  'svc-rs\\.[a-z]+\\.gov\\.br',
  'pix\\.bcb\\.gov\\.br',
  'matls-api\\.bcb\\.gov\\.br',
  'api\\.openfinancebrasil\\.org\\.br',
  'esocial\\.gov\\.br',
  'gov\\.br/receita',
  'api\\.stripe\\.com',
  'api\\.openai\\.com',
  'api\\.anthropic\\.com',
  'api\\.pagar\\.me',
  'api\\.asaas\\.com',
  'api\\.mercadopago\\.com',
  'api\\.pagseguro\\.uol\\.com\\.br',
  'gerencianet\\.com\\.br',
  'sandbox\\.(asaas|pagarme|stripe|mercadopago|gerencianet|stark|efi)\\.com',
];

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
    for (const dom of SENSITIVE_DOMAINS) {
      const re = new RegExp(`https?://${dom}`);
      if (re.test(line)) {
        if (EXCEPTION_RE.test(line)) continue;
        violations.push(`linha ${i + 1}: ${dom}  ->  ${line}`);
      }
    }
  });

  if (violations.length > 0) {
    process.stderr.write(`[no-hardcoded-env-urls] BLOQUEADO: URL de servico externo hardcoded.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes encontradas:\n`);
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.stderr.write(`\nRegra: SEC-005 — URLs de servicos externos (SEFAZ, Pix, gateways, APIs pagas)\n`);
    process.stderr.write(`SEMPRE vem de variavel de ambiente, nunca hardcoded.\n\n`);
    process.stderr.write(`Por que:\n`);
    process.stderr.write(`  - Voce nao pode trocar URL sem deploy (homologacao vs producao).\n`);
    process.stderr.write(`  - Voce arrisca chamar producao em ambiente de teste.\n`);
    process.stderr.write(`  - Voce esconde dependencia externa do operador de infra.\n\n`);
    process.stderr.write(`Correto:\n  const SEFAZ_URL = process.env.SEFAZ_URL;\n  if (!SEFAZ_URL) throw new Error('SEFAZ_URL nao configurada');\n\n`);
    process.stderr.write(`Excecao: se MESMO assim e necessario (ex: URL canonica imutavel publicada em RFC),\n`);
    process.stderr.write(`adicione na mesma linha:\n  // SEC-005-exception: <razao>\n`);
    recordMetric('block', 'no-hardcoded-env-urls', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[no-hardcoded-env-urls] erro interno: ${err.message}\n`);
  process.exit(2);
});
