#!/usr/bin/env node
// no-test-data-in-fixtures.js — bloqueia dado pessoal real em fixture/seed/teste.
// Hook PreToolUse, matcher: Write|Edit. TST-004.
//
// Port Node do .sh. Detecta CPF formatado, CPF nao-formatado (com DV valido),
// email de provedor real, telefone BR formatado.

const { readStdinJson, recordMetric } = require('./_lib.js');

const FIXTURE_PATH_RE = /fixture|seed|mock-?data|test-?data|sample|\.test\.|\.spec\.|test\/|tests\/|spec\/|specs\//;
const EXCEPTION_RE = /TST-004-exception|sintetico|synthetic|fake-data/;

const SYNTHETIC_DOMAINS_RE = /^(example\.com(\.br)?|test\.com|test\.local|fake\.com|exemplo\.com(\.br)?|localhost)$|\.(test|local|example)$/;
const REAL_PROVIDER_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'yahoo.com', 'yahoo.com.br',
  'outlook.com', 'icloud.com', 'live.com',
  'uol.com.br', 'terra.com.br', 'ig.com.br', 'bol.com.br',
]);

function allSameDigits(s) {
  return s.length > 0 && /^(.)\1+$/.test(s);
}

// Validador de DV de CPF (algoritmo oficial). Retorna true se DV bate.
function cpfDvOk(c) {
  if (!/^\d{11}$/.test(c)) return false;
  if (allSameDigits(c)) return false;
  const d = c.split('').map(Number);
  for (const t of [9, 10]) {
    let s = 0;
    for (let i = 0; i < t; i++) s += d[i] * ((t + 1) - i);
    let r = (s * 10) % 11;
    if (r === 10) r = 0;
    if (r !== d[t]) return false;
  }
  return true;
}

const SYNTHETIC_CPFS = new Set(['12345678909', '12345678900']);
const SYNTHETIC_PHONES = new Set(['11999999999']);

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!FIXTURE_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const violations = [];
  for (const line of String(content).split(/\r?\n/)) {
    const hasException = EXCEPTION_RE.test(line);

    // CPF formatado: 000.000.000-00
    const cpfFormatted = line.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/g) || [];
    for (const c of cpfFormatted) {
      const digits = c.replace(/\D/g, '');
      if (digits.length !== 11) continue;
      if (allSameDigits(digits)) continue;
      if (SYNTHETIC_CPFS.has(digits)) continue;
      if (hasException) continue;
      violations.push(`CPF aparente em fixture: ${c}  ->  ${line}`);
    }

    // CPF nao formatado: exatamente 11 digitos isolados (\b...\b) com DV valido.
    // Auditoria 10-agentes 2026-05-24: usar \b evita falso-positivo em timestamps
    // Unix em ms (13 dig — substring de 11 casava sem \b) e outros IDs longos.
    const cpfBare = line.match(/\b\d{11}\b/g) || [];
    for (const c of cpfBare) {
      if (allSameDigits(c)) continue;
      if (SYNTHETIC_CPFS.has(c)) continue;
      if (!cpfDvOk(c)) continue;
      if (hasException) continue;
      violations.push(`CPF nao-formatado aparente em fixture: ${c}  ->  ${line}`);
    }

    // Emails com dominio real de provedor pessoal
    const emails = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const e of emails) {
      const domain = e.split('@')[1].toLowerCase();
      if (SYNTHETIC_DOMAINS_RE.test(domain)) continue;
      if (hasException) continue;
      if (REAL_PROVIDER_DOMAINS.has(domain)) {
        violations.push(`Email de provedor real em fixture: ${e}  ->  ${line}`);
      }
    }

    // Telefone BR formatado: (XX) 9XXXX-XXXX
    const phones = line.match(/\(\d{2}\)\s?9\d{4}-\d{4}/g) || [];
    for (const p of phones) {
      const digits = p.replace(/\D/g, '');
      if (digits.length < 10) continue;
      if (allSameDigits(digits)) continue;
      if (SYNTHETIC_PHONES.has(digits)) continue;
      if (hasException) continue;
      violations.push(`Telefone BR aparente em fixture: ${p}  ->  ${line}`);
    }
  }

  if (violations.length > 0) {
    process.stderr.write(`[no-test-data-in-fixtures] BLOQUEADO: dado pessoal aparentemente real em fixture/seed/teste.\n\n`);
    process.stderr.write(`Arquivo: ${filePath}\n\nViolacoes encontradas:\n`);
    for (const v of violations) process.stderr.write(`  - ${v}\n`);
    process.stderr.write(`\nRegra: TST-004 — fixtures, seeds e testes usam dados sinteticos. Dados reais\n`);
    process.stderr.write(`de cliente em fixture vazam pra repo, CI, ambiente de dev e por log de teste.\n\n`);
    process.stderr.write(`Use:\n`);
    process.stderr.write(`  - CPF/CNPJ: validos por algoritmo mas com padrao sintetico claro (ex: 12345678909)\n`);
    process.stderr.write(`  - Email: dominios reservados — example.com, test.local, exemplo.com.br\n`);
    process.stderr.write(`  - Telefone: (11) 99999-9999 ou variacoes obviamente fake\n`);
    process.stderr.write(`  - Nomes: "Fulano de Tal", "Maria Teste", "Empresa Exemplo Ltda"\n`);
    process.stderr.write(`  - Geracao programatica: use a skill 'gerar-test-fixture-br' (CPF/CNPJ/CEP/E.164 validos).\n\n`);
    process.stderr.write(`Excecao: se MESMO assim precisa do dado real (caso reproduzido pra debug pontual),\n`);
    process.stderr.write(`adicione na mesma linha ou no header:\n  // TST-004-exception: <razao clara e tempo de retencao>\n`);
    recordMetric('block', 'no-test-data-in-fixtures', violations[0]);
    process.exit(2);
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[no-test-data-in-fixtures] erro interno: ${err.message}\n`);
  process.exit(2);
});
