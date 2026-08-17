#!/usr/bin/env node
// block-mock-in-integration.js — bloqueia mock em arquivo de integration/e2e.
// Hook PreToolUse, matcher: Write|Edit. TST-003.

const { readStdinJson, recordMetric, normalizeFilePath } = require('./_lib.js');

// Auditoria 2026-08-17: o regex antigo (/integration|e2e|end-to-end/i) casava
// QUALQUER path que contivesse a substring "integration" — inclusive pasta de
// producao como src/integrations/stripe.test.ts (teste UNITARIO de um modulo
// que mora em integrations/). A regra e sobre TESTE DE INTEGRACAO, nao sobre
// qualquer arquivo perto da palavra. Agora exige convencao de teste:
//   - pasta dedicada:  tests/integration/..., __tests__/integration/...
//   - pastas e2e/end-to-end em qualquer nivel (convencao quase exclusiva de
//     suite Cypress/Playwright, raramente usada pra codigo de producao)
//   - sufixo de arquivo:  foo.integration.test.ts, foo.e2e.spec.js
const INTEGRATION_PATH_RE = new RegExp(
  [
    '(^|/)(tests?|__tests__|specs?)/integration(/|$)',
    '(^|/)(e2e|end-to-end)(/|$)',
    '\\.(integration|e2e|end-to-end)\\.(test|spec)\\.[jt]sx?$',
  ].join('|'),
  'i',
);

const MOCK_PATTERNS = [
  /vi\.mock\(/,
  /jest\.mock\(/,
  /sinon\.stub/,
  /sinon\.mock/,
  /unittest\.mock/,
  /from unittest\.mock/,
  /Mockito\.when/,
  /Mockito\.mock/,
  /@MockBean/,
  /mock\s*=\s*Mock\(/,
  /patch\(["']/,
];

const EXCEPTION_RE = /TST-003-exception|justificativa-mock/;

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!INTEGRATION_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const violations = [];
  for (const line of String(content).split(/\r?\n/)) {
    for (const re of MOCK_PATTERNS) {
      if (re.test(line)) {
        if (EXCEPTION_RE.test(line)) continue;
        violations.push(`${re.source}  ->  ${line}`);
      }
    }
  }

  if (violations.length > 0) {
    process.stderr.write(
      `[block-mock-in-integration] BLOQUEADO: mock detectado em teste de integracao/E2E.\n\n`,
    );
    process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes encontradas:\n`);
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.stderr.write(`\nRegra: TST-003 — nao testar com mock o que vai pra producao real.\n\n`);
    process.stderr.write(`Integration/E2E test que mocka tudo nao testa a integracao. Use:\n`);
    process.stderr.write(`  - banco de teste real (Docker, fixture, transaction rollback)\n`);
    process.stderr.write(`  - ambiente de homologacao da SEFAZ/RFB para teste fiscal\n`);
    process.stderr.write(`  - sandbox do gateway de pagamento\n\n`);
    process.stderr.write(
      `Excecao: se MESMO assim precisa do mock (timeout extremo, terceiro fora do ar),\n`,
    );
    process.stderr.write(`adicione na mesma linha:\n  // TST-003-exception: <razao clara>\n`);
    recordMetric('block', 'block-mock-in-integration', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[block-mock-in-integration] erro interno: ${err.message}\n`);
  process.exit(2);
});
