#!/usr/bin/env node
// commit-message-validator.js — valida mensagem de git commit antes de executar.
// Hook PreToolUse, matcher: Bash. Politica: 1 linha curta (<=72), 1 prefixo,
// T-NNN obrigatorio quando ha sessao /feature ou /bug ativa.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

const TIPOS = 'feat|fix|refactor|chore|docs|test|perf|build|ci|revert';
const TIPOS_STYLE = TIPOS + '|style';

function extractFromFileArg(normalized) {
  // Auditoria 2026-05-25 (hook #9): antes ignorava `git commit -F arquivo.txt`
  // e `--file=arquivo.txt` — commit sem T-NNN passava silencioso.
  // Agora: detecta o arg, le o arquivo, devolve conteudo pra validar.
  const reFileShort = /(?:^|\s)-F\s+(\S+)/;
  const reFileLong = /--file[=\s]+(\S+)/;
  const m = normalized.match(reFileShort) || normalized.match(reFileLong);
  if (!m) return '';
  const filePath = m[1].replace(/^["']|["']$/g, '');
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractMessages(cmd) {
  // Normaliza CRLF Windows → LF antes de qualquer regex
  const normalized = cmd.replace(/\r\n/g, '\n');
  const parts = [];
  const reShort = /-m\s+(["'])(.*?)\1/gs;
  let m;
  while ((m = reShort.exec(normalized)) !== null) parts.push(m[2]);
  const reLong = /--message[=\s]+(["'])(.*?)\1/gs;
  while ((m = reLong.exec(normalized)) !== null) parts.push(m[2]);
  // Heredoc com EOL tolerante (\r?\n) — Git Bash for Windows pode injetar CRLF
  const reHeredoc = /<<\s*'?(\w+)'?\s*\r?\n([\s\S]*?)\r?\n\1\b/;
  const hd = normalized.match(reHeredoc);
  if (hd) parts.push(hd[2]);
  // -F arquivo.txt / --file=arquivo.txt
  const fromFile = extractFromFileArg(normalized);
  if (fromFile) parts.push(fromFile);
  return parts.join('\n');
}

(async () => {
  const input = await readStdinJson();
  const cmd = input?.tool_input?.command || '';
  if (!cmd) process.exit(0);
  if (!cmd.includes('git commit')) process.exit(0);

  // Aplica: -m/--message/-F/--file OU --amend. Commit via editor sem nenhum
  // desses (sem -m): exit 0 (COMMIT_EDITMSG nao existe em PreToolUse).
  const hasInline = /-m\s/.test(cmd) || /--message[=\s]/.test(cmd)
    || /(?:^|\s)-F\s/.test(cmd) || /--file[=\s]/.test(cmd);
  const isAmend = /--amend/.test(cmd);
  if (!hasInline && !isAmend) process.exit(0);

  // Extrai mensagem. Se parser falhar (heredoc malformado, encoding raro), exit 0
  // ao inves de validar CMD inteiro. Validar CMD causava falso positivo cronico
  // em Windows com CRLF.
  const msg = extractMessages(cmd);
  if (!msg) process.exit(0);

  const primeiraLinha = msg.split(/\r?\n/)[0];
  const violations = [];

  // Regra 1: primeira linha <= 72
  if (primeiraLinha.length > 72) {
    violations.push(`primeira linha tem ${primeiraLinha.length} caracteres (maximo 72): ${primeiraLinha}`);
  }

  // Identifica tipo declarado no formato `tipo(escopo)?: ...` (1a ocorrencia)
  const prefixDeclMatch = primeiraLinha.match(/^([a-zA-Z]+)(?:\(([^)]*)\))?\s*!?:/);
  const tipoDeclarado = prefixDeclMatch ? prefixDeclMatch[1].toLowerCase() : '';
  const prefixos = tipoDeclarado ? new Set([tipoDeclarado]) : new Set();

  // Regra 2: nao misturar prefixos NO HEADER (ex: "feat: fix: ..." ou "feat:fix:").
  // Antes: acumulava qualquer mencao de outro tipo no corpo da primeira linha —
  // "feat(US-014): refactor do modulo X" virava feat+refactor (falso positivo).
  // Agora so olha o segText (parte ANTES do primeiro `:`).
  const segText = primeiraLinha.split(':')[0] || '';
  const segMatchRe = new RegExp(`\\b(${TIPOS})\\b`, 'gi');
  const segTipos = new Set();
  let sm;
  while ((sm = segMatchRe.exec(segText)) !== null) segTipos.add(sm[1].toLowerCase());
  if (segTipos.size > 1) {
    violations.push(`commit mistura prefixos: ${[...segTipos].join(' ')} — separe em commits atomicos (INV-AGENT-005)`);
  }

  // Regra 3a: tipo declarado deve estar na lista canonica
  if (tipoDeclarado) {
    const validos = new Set(TIPOS_STYLE.split('|'));
    if (!validos.has(tipoDeclarado)) {
      violations.push(`tipo '${tipoDeclarado}:' nao e Conventional Commit — use feat/fix/refactor/chore/docs/test/perf/build/ci/revert/style`);
    }
  }

  // Regra 3b: warning sem prefixo (nao bloqueia)
  if (!tipoDeclarado) {
    process.stderr.write(`[commit-message-validator] AVISO: sem prefixo (feat/fix/refactor/chore/docs/test): ${primeiraLinha}\n`);
  }

  // Regra 4: T-NNN obrigatorio em sessao /feature ou /bug ativa
  try {
    const projdir = sanitizeProjdir();
    const sess = sanitizeSessionHash(undefined, projdir);
    const runtime = path.join(projdir, '.claude', '.runtime');
    const markFeature = path.join(runtime, `feature-active-${sess}`);
    const markBug = path.join(runtime, `bug-trigger-${sess}`);
    if (fs.existsSync(markFeature) || fs.existsSync(markBug)) {
      const relevantes = ['feat', 'fix', 'refactor', 'perf'];
      const overlap = relevantes.some((p) => prefixos.has(p));
      if (overlap && !/\b(US-\d+|T-\d+)\b/.test(msg)) {
        violations.push('sessao /feature ou /bug ativa — commit precisa citar (US-NNN T-NNN) ou (T-NNN) na mensagem para rastreabilidade');
      }
    }
  } catch { /* sem projdir, skip rastreabilidade */ }

  if (violations.length === 0) process.exit(0);

  process.stderr.write(`[BLOQUEIO] [commit-message-validator] mensagem da gravacao nao segue a regra do projeto.\n\n`);
  process.stderr.write(`Efeito: a gravacao foi recusada — nada mudou no historico.\n`);
  process.stderr.write(`Causa:\n`);
  for (const v of violations) process.stderr.write(`  - ${v}\n`);
  process.stderr.write(`\nRegra (commit atomico — uma mudanca, um proposito):\n`);
  process.stderr.write(`  - Primeira linha curta (ate 72 caracteres) descrevendo a mudanca.\n`);
  process.stderr.write(`  - Comeca com 1 categoria seguida de dois-pontos:\n`);
  process.stderr.write(`      feat:       coisa nova\n`);
  process.stderr.write(`      fix:        correcao de erro\n`);
  process.stderr.write(`      docs:       so atualizacao de documento\n`);
  process.stderr.write(`      chore:      manutencao tecnica que nao afeta o usuario\n`);
  process.stderr.write(`      refactor:   reorganizacao sem mudar comportamento\n`);
  process.stderr.write(`      test:       so testes\n`);
  process.stderr.write(`  - Misturar 2 categorias na mesma gravacao e proibido — separe em 2 gravacoes.\n`);
  process.stderr.write(`  - Em sessao /feature ou /bug ativa: precisa citar US-NNN (story) ou T-NNN (task) na mensagem.\n`);
  process.stderr.write(`  - Corpo (explicacao mais longa) e opcional, separado da primeira linha por linha em branco.\n\n`);
  process.stderr.write(`Exemplos validos:\n`);
  process.stderr.write(`  feat(T-001): adiciona validacao de CNPJ alfanumerico\n`);
  process.stderr.write(`  fix(US-042): boleto saia com valor em dobro pra clientes PJ\n`);
  process.stderr.write(`  docs: atualiza README com novo comando demo\n`);
  recordMetric('block', 'commit-message-validator', violations[0]);
  process.exit(2);
})().catch((err) => {
  process.stderr.write(`[BLOQUEIO] [commit-message-validator] erro interno ao validar mensagem.\n`);
  process.stderr.write(`Detalhe tecnico (pra desenvolvedor): ${err.message}\n`);
  process.exit(2);
});
