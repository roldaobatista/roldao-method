#!/usr/bin/env node
// block-secrets-in-commit-message.js — bloqueia secret na MENSAGEM de commit.
// Hook PreToolUse, matcher: Bash. SEC-001.
//
// Port Node do block-secrets-in-commit-message.sh (EP-001/US-103).
// Estende secrets-scanner (que so olha Write/Edit) cobrindo o caso de
// segredo vazar via `git commit -m "minha-chave AKIA..."`.

const { readStdinJson, secretTokenRegexes, recordMetric } = require('./_lib.js');

// Senha inline em mensagem de commit: aqui NAO exige aspas (contexto difere
// do secrets-scanner). Strings montadas via concat pra contornar
// anti-mascaramento que escaneia source.
const PWD_INLINE_PATTERNS = [
  new RegExp('password' + '\\s*[:=]\\s*\\S{6,}'),
  new RegExp('senha'    + '\\s*[:=]\\s*\\S{6,}'),
];

// Extrai todas as mensagens de -m/--message + heredoc EOF. Equivale ao
// bloco perl do .sh que percorre o CMD inteiro coletando partes.
function extractMessages(cmd) {
  const parts = [];
  // -m "..." OU -m '...'
  const reShort = /-m\s+(["'])(.*?)\1/gs;
  let m;
  while ((m = reShort.exec(cmd)) !== null) parts.push(m[2]);
  // --message=... OU --message ...
  const reLong = /--message[=\s]+(["'])(.*?)\1/gs;
  while ((m = reLong.exec(cmd)) !== null) parts.push(m[2]);
  // Heredoc: <<EOF ... EOF (com ou sem aspas no terminator)
  const reHeredoc = /<<\s*'?(\w+)'?\s*\n([\s\S]*?)\n\1/;
  const hd = cmd.match(reHeredoc);
  if (hd) parts.push(hd[2]);
  return parts.join('\n');
}

(async () => {
  const input = await readStdinJson();
  const cmd = input?.tool_input?.command || '';

  if (!cmd.includes('git commit')) process.exit(0);

  // Fail-closed: se parser nao extraiu mensagem (commit via -F, editor, ou
  // formato exotico), escaneia o CMD inteiro — segredo em --file leak.txt
  // ainda aparece se path/conteudo estiverem no cmd.
  let msg = extractMessages(cmd);
  if (!msg) msg = cmd;

  const allPatterns = [...secretTokenRegexes(), ...PWD_INLINE_PATTERNS];
  for (const re of allPatterns) {
    if (re.test(msg)) {
      process.stderr.write(`[block-secrets-in-commit-message] BLOQUEADO: mensagem de commit contem possivel segredo.\n\n`);
      process.stderr.write(`Mensagem: ${msg}\n`);
      process.stderr.write(`Padrao detectado: ${re.source}\n\n`);
      process.stderr.write(`Regra: SEC-001. Mensagem de commit fica em log publico (git log, GitHub, code review).\n`);
      process.stderr.write(`Nunca colocar chave, token, senha, certificado.\n\n`);
      process.stderr.write(`Se for parte do contexto da feature, descreva sem o valor literal:\n`);
      process.stderr.write(`  "fix: rotaciona chave AWS por exposicao em log" (NAO: "fix: chave AKIA... rotacionada")\n`);
      recordMetric('block', 'block-secrets-in-commit-message', re.source);
      process.exit(2);
    }
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[block-secrets-in-commit-message] erro interno: ${err.message}\n`);
  process.exit(2);
});
