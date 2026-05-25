#!/usr/bin/env node
// lgpd-minimizacao-reminder.js — soft warning quando migration/schema cria coluna
// de PII em larga (cpf, email, telefone, endereco, etc.) sem indicacao do POR QUE
// (LGPD-003). Sai SEMPRE com 0 (so warn em stderr).
//
// Hook PreToolUse, matcher: Write|Edit.
// Auditoria 2026-05-25 (regra #31): LGPD-003 (minimizacao) era so doutrinaria.

const { readStdinJson, normalizeFilePath } = require('./_lib.js');

const EXCLUDED_PATH_RE = /\.md$|\/docs\/|README|CHANGELOG|\/test\/|\/tests\/|\.test\.|\.spec\.|\/fixtures\/|\/mocks\/|\.json$|\.ya?ml$|\.env|\.sh$|\.ps1$|\.bat$|\.claude\/\.runtime\//;
// Migration / schema / model
const SCHEMA_PATH_RE = /(migration|migrate|schema|prisma|models?\/|\/db\/|\/sql\/)/i;
const CODE_EXT_RE = /\.(sql|prisma|ts|tsx|js|jsx|py|rb|go|java|kt|cs|php)$/;

// Colunas PII em CREATE TABLE / addColumn / @column / Field declarations
const PII_COLUMN_RE = /\b(cpf|cnpj|rg|email|e_mail|telefone|celular|phone|endereco|address|cep|nascimento|data_nascimento|birth_date|nome_completo|nome_civil|nome_mae|genero|etnia)\b/i;
const COLUMN_DECL_RE = /(CREATE\s+TABLE|ADD\s+COLUMN|alterTable|@column|@Column|@Field|column:|addColumn|t\.string|t\.text|String\s+@db|column\()/i;

// Marcadores que sinalizam o motivo declarado
const JUSTIFICATIVA_RE = /LGPD-003:|minimizacao|base[-_]legal:|finalidade:|coleta_necessaria|necessario_para|required_for/i;

(async () => {
  const input = await readStdinJson();
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);
  if (!SCHEMA_PATH_RE.test(filePath)) process.exit(0);

  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  // Deve haver declaracao de coluna E mencao a PII
  if (!COLUMN_DECL_RE.test(content)) process.exit(0);
  const piiMatch = String(content).match(PII_COLUMN_RE);
  if (!piiMatch) process.exit(0);

  // Se ja ha justificativa declarada, libera
  if (JUSTIFICATIVA_RE.test(content)) process.exit(0);

  process.stderr.write(`[lgpd-minimizacao-reminder] AVISO (nao bloqueio):\n\n`);
  process.stderr.write(`Arquivo ${filePath} parece adicionar coluna de dado pessoal ("${piiMatch[0]}") sem justificativa.\n`);
  process.stderr.write(`LGPD-003 (minimizacao) exige coletar SO o necessario.\n\n`);
  process.stderr.write(`Antes de aplicar a migration, responda:\n`);
  process.stderr.write(`  1. Esse campo e USADO em alguma feature? (se nao, nao coletar)\n`);
  process.stderr.write(`  2. Da pra usar versao mais grosseira? (faixa etaria > data nascimento; cidade > CEP)\n`);
  process.stderr.write(`  3. Tem caminho de exclusao? (LGPD-002 — direito ao esquecimento)\n\n`);
  process.stderr.write(`Como destravar (escolha 1):\n`);
  process.stderr.write(`  (a) Comentario na migration: // LGPD-003: necessario para <feature/contrato>\n`);
  process.stderr.write(`  (b) Frontmatter da story: base-legal: <consentimento|contrato|obrigacao legal>\n`);
  process.stderr.write(`  (c) Skill: rode \`checklist-lgpd\` antes de criar a coluna\n\n`);
  process.stderr.write(`Regra: LGPD-003 (REGRAS-INEGOCIAVEIS.md).\n`);

  process.exit(0); // soft warning
})().catch(() => process.exit(0));
