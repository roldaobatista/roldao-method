#!/usr/bin/env node
// lgpd-esquecimento-reminder.js — soft warning (exit 0) quando codigo cria
// tabela/modelo com dado pessoal sem caminho de exclusao visivel.
// Hook PostToolUse, matcher: Write|Edit. LGPD-002 (direito ao esquecimento).
//
// Heuristica: se Write/Edit cria coluna `cpf`, `email`, `telefone` etc. em
// migration ou modelo ORM, lembrar que LGPD-002 exige caminho de exclusao
// efetiva (crypto-shredding ou DELETE). Soft warning — NUNCA bloqueia.
// O autor decide se a observacao se aplica.

const { readStdinJson, normalizeFilePath } = require('./_lib.js');

const TRIGGER_PATHS_RE = /migrations?\/|schemas?\/|models?\/|prisma\/|alembic\//i;
const CODE_EXT_RE = /\.(sql|prisma|py|rb|js|jsx|ts|tsx|go|java|kt|cs|php|rs)$/i;

// Colunas/campos que claramente sao dado pessoal LGPD Art. 5 I.
const COLUNAS_DADO_PESSOAL = [
  '\\bcpf\\b',
  '\\bcnpj\\b', // PJ tambem, em alguns casos
  '\\brg\\b',
  '\\bemail\\b',
  '\\be_?mail\\b',
  '\\btelefone\\b',
  '\\bcelular\\b',
  '\\bphone\\b',
  '\\bendereco\\b',
  '\\baddress\\b',
  '\\bdata_?nascimento\\b',
  '\\bbirth_?date\\b',
  '\\bnome_?completo\\b',
  '\\bfull_?name\\b',
];
const COLUNA_RE = new RegExp('(' + COLUNAS_DADO_PESSOAL.join('|') + ')', 'i');

// Sinais de que ja existe caminho de exclusao no mesmo arquivo.
const ESQUECIMENTO_RE =
  /(DELETE\s+FROM|deletar?|esquece?r?|forgott?en|crypto[_-]?shred|right[_-]?to[_-]?erasur|anonimiz)/i;

(async () => {
  const input = await readStdinJson();
  const toolName = input?.tool_name || '';
  if (toolName !== 'Write' && toolName !== 'Edit') process.exit(0);

  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);
  if (!TRIGGER_PATHS_RE.test(filePath)) process.exit(0);

  const content =
    input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  // Acha colunas de dado pessoal sendo CRIADAS (CREATE TABLE, ADD COLUMN, ou
  // declaracao de campo em modelo ORM).
  const isCreate =
    /CREATE\s+TABLE|ADD\s+COLUMN|@Column|@Field|sa\.Column|models\.|prisma|@Entity|class\s+\w+\s*\(/i.test(
      content,
    );
  if (!isCreate) process.exit(0);

  if (!COLUNA_RE.test(content)) process.exit(0);
  if (ESQUECIMENTO_RE.test(content)) process.exit(0); // ja menciona caminho

  // Soft warning — exit 0, escreve em stderr (Claude le).
  process.stderr.write(
    `[lgpd-esquecimento-reminder] Lembrete LGPD-002 — direito ao esquecimento.\n\n` +
      `Arquivo: ${filePath}\n` +
      `Detectado: criacao de coluna/campo com dado pessoal (CPF/email/telefone/etc.).\n\n` +
      `LGPD Art. 18 V garante ao titular o direito de exclusao dos dados. ` +
      `Confirme que existe um caminho efetivo de exclusao:\n` +
      `  - DELETE fisico (com cascade nas FK), OU\n` +
      `  - Crypto-shredding (anular chave que criptografa o registro), OU\n` +
      `  - Anonimizacao irreversivel (substituir por valor sintetico).\n\n` +
      `Se o caminho ja existe em outro arquivo, ignore este lembrete.\n` +
      `Soft warning — nao bloqueia. Plugar caminho de exclusao na proxima feature dessa entidade.\n`,
  );
  process.exit(0);
})().catch(() => process.exit(0));
