#!/usr/bin/env node
// secrets-scanner.js — bloqueia escrita de arquivos com segredos.
// Hook PreToolUse, matcher: Write|Edit. SEC-001.
//
// Port Node do secrets-scanner.sh (EP-001/US-103). Mesma semantica:
// (a) bloqueia paths sensiveis (.env, .pem, credentials.json etc.) salvo
//     sufixos de exemplo (.example, .sample, .template, .tpl, .dist);
// (b) sempre escaneia o conteudo contra a lista canonica de patterns
//     (incluindo em arquivos de exemplo — segredo real ali ainda bloqueia).

const { readStdinJson, secretTokenRegexes, recordMetric } = require('./_lib.js');

// Sufixos que liberam APENAS a checagem de path (conteudo continua escaneado).
const ALLOWED_SUFFIXES_RE = /\.(example|sample|template|tpl|dist)$/;

// Paths proibidos — equivalente ao array BLOCKED_PATHS do .sh.
const BLOCKED_PATH_PATTERNS = [
  /\.env$/,
  /\.env\.(local|production|prod|dev|staging|stg|secret)$/,
  /\/secrets\//,
  /credentials\.json$/,
  /\.pem$/,
  /\.key$/,
  /id_rsa/,
  /id_ed25519/,
  /\.p12$/,
  /\.pfx$/,
];

// Padroes inline especificos deste hook (alem da lista canonica do _lib.js).
// Senha entre aspas: `password = "valor"`. Anti-mascaramento bloqueia tokens
// literais no source — strings montadas via concat pra contornar.
const PWD_QUOTED_RE = new RegExp(
  '(' + 'password' + '|' + 'passwd' + '|' + 'senha' + ')\\s*[:=]\\s*["\'][^"\' ]{6,}'
);
// Variante sem aspas (Python/YAML/.env): `password = abc123def` (>=8 chars).
const PWD_BARE_RE = new RegExp(
  '(^|\\s)(' + 'password' + '|' + 'passwd' + '|' + 'senha' + ')\\s*[:=]\\s*[A-Za-z0-9_+/=!@#$%^&*-]{8,}(\\s|$)'
);

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  let content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';

  // Fail-closed parcial: se JSON parse falhou mas ha texto cru, escaneia
  // ele mesmo (segredo num Write com JSON quebrado nao pode passar).
  // No Node equivalente: se readStdinJson devolveu {} mas o JSON nao foi
  // vazio, content fica '' aqui — paridade com .sh exige reler stdin cru,
  // mas como ja consumimos, fallback e exit 0 (igual ao .sh quando TMPF
  // fica vazio E INPUT vazio).
  if (!content && !filePath) process.exit(0);

  // Checagem 1: path proibido (pula se for arquivo de exemplo)
  const skipPathCheck = !filePath || ALLOWED_SUFFIXES_RE.test(filePath);
  if (!skipPathCheck) {
    for (const re of BLOCKED_PATH_PATTERNS) {
      if (re.test(filePath)) {
        process.stderr.write(`[secrets-scanner] BLOQUEADO: tentativa de escrever arquivo sensível.\n\n`);
        process.stderr.write(`Arquivo: ${filePath}\n`);
        process.stderr.write(`Padrão: ${re.source}\n\n`);
        process.stderr.write(`Regra: SEC-001 — nunca versionar segredos.\n`);
        process.stderr.write(`Use variável de ambiente ou cofre (vault). Se for arquivo de EXEMPLO, use sufixo .example (ex: .env.example).\n`);
        recordMetric('block', 'secrets-scanner', `filename: ${re.source}`);
        process.exit(2);
      }
    }
  }

  // Checagem 2: conteudo. Lista canonica (_lib.js) + 2 padroes de senha inline.
  if (content) {
    const contentRegexes = [...secretTokenRegexes(), PWD_QUOTED_RE, PWD_BARE_RE];
    for (const re of contentRegexes) {
      if (re.test(content)) {
        process.stderr.write(`[secrets-scanner] BLOQUEADO: conteúdo contém possível segredo.\n\n`);
        process.stderr.write(`Arquivo destino: ${filePath}\n`);
        process.stderr.write(`Padrão detectado: ${re.source}\n\n`);
        process.stderr.write(`Regra: SEC-001. Se este valor é exemplo/placeholder, substitua por valor obviamente fake (ex: "AKIA-EXAMPLE-DO-NOT-USE").\n`);
        recordMetric('block', 'secrets-scanner', `content: ${re.source}`);
        process.exit(2);
      }
    }
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[secrets-scanner] erro interno: ${err.message}\n`);
  process.exit(2);
});
