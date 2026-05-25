#!/usr/bin/env node
// lgpd-transferencia-internacional-reminder.js — soft warning quando codigo
// armazena/envia dado pessoal pra provedor cloud sem regiao BR declarada
// (LGPD-005). Sai SEMPRE com 0 (so warn em stderr).
//
// Hook PreToolUse, matcher: Write|Edit.
// Auditoria 2026-05-25 (regra #32): LGPD-005 (transferencia internacional)
// era so checklist.

const { readStdinJson, normalizeFilePath } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|\/test\/|\/tests\/|\.test\.|\.spec\.|\/fixtures\/|\/mocks\/|\.claude\/\.runtime\//;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|sql|prisma|ya?ml|tf|json)$/;

// Provedores cloud + servicos de storage/db comuns
const PROVIDER_RE = /(s3\.amazonaws\.com|s3-[a-z0-9-]+\.amazonaws\.com|storage\.googleapis\.com|gs:\/\/|blob\.core\.windows\.net|azure\.com|firebaseio\.com|firebasestorage\.googleapis\.com|sendgrid\.|mailgun\.|twilio\.|stripe\.com|sentry\.io|datadoghq\.com|mixpanel\.|segment\.com)/i;

// Regioes BR (sa-east-1 AWS, southamerica-east1 GCP, brazilsouth Azure)
const REGIAO_BR_RE = /(sa-east-1|sa-east|southamerica-east1|southamerica-west1|brazilsouth|brazil_south|brasil_sul)/i;

// Marker de tratamento documentado pra transferencia internacional
const DPA_RE = /LGPD-005:|transferencia[-_]internacional|DPA[-_]?assinado|standard[-_]contractual[-_]clauses|adequacy[-_]decision/i;

// Indicios fortes de processar dado pessoal (pra evitar warn em arquivo neutro)
const PII_USAGE_RE = /\b(cpf|cnpj|email|telefone|endereco|user\.|customer\.|cliente\.|usuario\.)/i;

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const provMatch = String(content).match(PROVIDER_RE);
  if (!provMatch) process.exit(0);

  // Se tem regiao BR declarada na mesma referencia, libera
  if (REGIAO_BR_RE.test(content)) process.exit(0);
  // Se ha declaracao de DPA, libera
  if (DPA_RE.test(content)) process.exit(0);
  // Se nao manuseia PII no arquivo, nao avisa (pode ser config de CDN)
  if (!PII_USAGE_RE.test(content)) process.exit(0);

  process.stderr.write(`[lgpd-transferencia-internacional-reminder] AVISO (nao bloqueio):\n\n`);
  process.stderr.write(`Arquivo ${filePath} usa provedor externo "${provMatch[0]}" e parece tocar dado pessoal,\n`);
  process.stderr.write(`mas nao declarou regiao BR (sa-east-1 / southamerica-east1 / brazilsouth) nem DPA.\n\n`);
  process.stderr.write(`LGPD-005 (transferencia internacional): dado pessoal de brasileiro saindo do Brasil exige\n`);
  process.stderr.write(`base legal especifica + acordo (DPA) com o fornecedor.\n\n`);
  process.stderr.write(`Como destravar (escolha 1):\n`);
  process.stderr.write(`  (a) Usar regiao BR do provedor: AWS sa-east-1, GCP southamerica-east1, Azure brazilsouth\n`);
  process.stderr.write(`  (b) Declarar DPA assinado: // LGPD-005: DPA-assinado com <fornecedor> em <data>\n`);
  process.stderr.write(`  (c) Trocar por alternativa BR (provedor nacional)\n\n`);
  process.stderr.write(`Regra: LGPD-005 (REGRAS-INEGOCIAVEIS.md).\n`);
  process.stderr.write(`Addon lgpd-compliance tem skill \`gerar-dpa-fornecedor\` que monta modelo.\n`);

  process.exit(0); // soft warning
})().catch(() => process.exit(0));
