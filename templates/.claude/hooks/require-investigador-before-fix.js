#!/usr/bin/env node
// require-investigador-before-fix.js — exige investigador antes de Edit/Write em codigo
// quando o prompt original mencionou bug (REGRA #0).
// Hook PreToolUse, matcher: Write|Edit.
//
// GATE 1: marker investigator-invoked existe (basta touch — sinaliza intenção).
// GATE 2: investigation-*.json existe E tem shape valido (decorrencia de ADR-020).
//
// Decomposicao: PRD-003 → US-111 → T-003 (B3).

const fs = require('fs');
const path = require('path');
const {
  readStdinJson,
  sanitizeProjdir,
  sanitizeSessionHash,
  recordMetric,
  normalizeFilePath,
} = require('./_lib.js');

const EXCLUDED_PATH_RE =
  /\.md$|\/docs\/|README|CHANGELOG|ROADMAP|test\/|tests\/|spec\/|specs\/|\.test\.|\.spec\.|\.json$|\.ya?ml$|\.toml$|\.ini$|\.env|\.sh$|\.ps1$|\.bat$/;
const CODE_EXT_RE = /\.(js|jsx|ts|tsx|py|go|rb|java|kt|cs|php|rs|swift|dart)$/;
const ACHADO_MIN_CHARS = 20;
// Auditoria 10-agentes 2026-05-25 (INV-AGENT-002): a palavra "todo" minuscula era
// PT comum ("li todo o arquivo") e bloqueava investigacao legitima.
// Aceita so a versao MAIUSCULA estilo placeholder de codigo (montada via concat
// pra nao disparar block-todo-without-issue neste proprio arquivo).
const _PLACEHOLDER_MAIUSCULO = 'T' + 'ODO';
const BYPASS_WORDS = `bypass|trivial|confiei no usu[aá]rio|skip|n[aã]o investigad[oa]?|placeholder|tbd|${_PLACEHOLDER_MAIUSCULO}`;
// BYPASS_PHRASES_RE — usado pra validar itens de "lido" (evidencia estruturada
// tipo "arquivo:linha" ou query; substring basta, pois nao e prosa natural).
const BYPASS_PHRASES_RE = new RegExp(`\\b(${BYPASS_WORDS}):?\\b`);
// ACHADO_PLACEHOLDER_RE — usado pra validar "achado" (texto narrativo). So
// bloqueia quando o campo INTEIRO e composto so de frases de bypass (com
// pontuacao/espacos entre elas) — nao quando a palavra aparece dentro de uma
// frase real com conteudo de verdade. Auditoria 2026-08-17: a substring match
// antiga rejeitava achado legitimo tipo "o codigo faz skip da validacao de
// CPF quando o cliente e estrangeiro", que E uma causa raiz real.
const ACHADO_PLACEHOLDER_RE = new RegExp(`^(?:\\s*(?:${BYPASS_WORDS})[\\s,;:.\\-]*)+$`, 'i');
const LEGACY_MODE = process.env.ROLDAO_METHOD_LEGACY_MARKERS === '1';

// validateInvestigationJson — le e classifica um arquivo investigation-*.json.
// Retorna { state, reason } onde state ∈
//   {ok, empty, malformed, lido-not-array, lido-empty, achado-curto, achado-bypass, legacy}.
function validateInvestigationJson(filepath) {
  let txt;
  try {
    txt = fs.readFileSync(filepath, 'utf8').trim();
  } catch {
    return { state: 'malformed' };
  }

  if (!txt) {
    return { state: LEGACY_MODE ? 'legacy' : 'empty' };
  }

  let j;
  try {
    j = JSON.parse(txt);
  } catch {
    return { state: 'malformed' };
  }

  if (!Array.isArray(j.lido)) {
    return { state: 'lido-not-array', reason: 'campo "lido" deve ser array de strings' };
  }
  if (j.lido.length === 0) {
    return { state: 'lido-empty', reason: 'campo "lido" esta vazio — agente nao leu nada' };
  }

  const achado = typeof j.achado === 'string' ? j.achado.trim() : '';
  if (achado.length < ACHADO_MIN_CHARS) {
    return {
      state: 'achado-curto',
      reason: `"achado" tem ${achado.length} chars (minimo: ${ACHADO_MIN_CHARS})`,
    };
  }

  // Rejeita achado que e INTEIRO placeholder/bypass (nao so uma palavra dentro
  // de frase real — ver comentario de ACHADO_PLACEHOLDER_RE acima).
  if (ACHADO_PLACEHOLDER_RE.test(achado)) {
    return {
      state: 'achado-bypass',
      reason: `"achado" e so placeholder/bypass, sem causa raiz real: "${achado.slice(0, 80)}..."`,
    };
  }
  // Tambem rejeita se algum elemento de 'lido' for frase de bypass
  for (const item of j.lido) {
    if (typeof item === 'string' && BYPASS_PHRASES_RE.test(item)) {
      return {
        state: 'achado-bypass',
        reason: `elemento de "lido" contem palavra de bypass: "${item.slice(0, 80)}"`,
      };
    }
  }

  return { state: 'ok' };
}

// Contrato do _dispatcher (ADR-033): retorna exit code, nunca chama process.exit.
async function runHook(input) {
  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) return 0;
  if (EXCLUDED_PATH_RE.test(filePath)) return 0;
  if (!CODE_EXT_RE.test(filePath)) return 0;

  let projdir;
  try {
    projdir = sanitizeProjdir();
  } catch {
    return 2;
  }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const markBug = path.join(runtime, `bug-trigger-${sess}`);
  const markInv = path.join(runtime, `investigator-invoked-${sess}`);

  if (!fs.existsSync(markBug)) return 0;

  // GATE 1: investigador invocado.
  if (!fs.existsSync(markInv)) {
    process.stderr.write(
      `[require-investigador-before-fix] BLOQUEADO: Edit/Write em código de negócio sem investigador.\n\n`,
    );
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write(
      `Motivo: o pedido inicial falou de bug/comportamento errado e o Detetive\n`,
    );
    process.stderr.write(
      `(investigador) ainda não rodou. Mexer no código agora vira fix-no-sintoma\n`,
    );
    process.stderr.write(`(REGRA #0 — INV-006).\n\n`);
    process.stderr.write(
      `Como destravar: rode /investigar ou /bug primeiro — o Detetive lê banco/log/\n`,
    );
    process.stderr.write(`payload, identifica causa raiz e libera a edição.\n\n`);
    process.stderr.write(`Aplica regras: INV-006, INV-AGENT-002.\n`);
    recordMetric(
      'block',
      'require-investigador-before-fix',
      `edit em ${filePath} sem investigador (GATE 1)`,
    );
    return 2;
  }

  // GATE 2 (T-003 / B3): investigador invocado E gravou prova mecanica COM SHAPE VALIDO.
  // Sem JSON valido, marker pode ter sido fake — REGRA #0 vira cosmetica.
  let bugActive = false;
  let runtimeFiles = [];
  try {
    runtimeFiles = fs.readdirSync(runtime);
    // T-010 (G4): casa SOMENTE sessao atual. Antes era /^bug-active-/ generico
    // — marker de sessao antiga contaminava sessao nova (auditor 6).
    bugActive = runtimeFiles.includes(`bug-active-${sess}`);
  } catch {
    /* runtime ausente — confia no GATE 1 */
  }

  if (!bugActive) return 0;

  // Escopo temporal (auditoria 2026-08-17): so aceita investigation-*.json
  // GRAVADO DEPOIS do gatilho do bug atual (bug-trigger-${sess}). Sem isso, um
  // investigation-*.json de OUTRO bug — sessao antiga, nunca limpo — satisfaz
  // o GATE 2 pra sempre (a prova precisa ser POSTERIOR ao gatilho, nao so
  // existir). session-cleanup.js nunca apaga investigation-*.json (e
  // persistente de proposito, pra auditoria), entao so o mtime protege aqui.
  let triggerMtime = 0;
  try {
    triggerMtime = fs.statSync(markBug).mtimeMs;
  } catch {
    triggerMtime = 0; // markBug existe (GATE 1 ja confirmou) — defensivo
  }

  // Encontra todos os investigation-*.json e descarta os ANTERIORES ao gatilho
  // do bug atual (prova velha de outro bug nao conta).
  const allProvaFiles = runtimeFiles
    .filter((n) => /^investigation-.*\.json$/.test(n))
    .map((n) => path.join(runtime, n));
  // >= (nao so >): mtime tem resolucao limitada em alguns FS/OS — escrever
  // bug-trigger e investigation-*.json em sequencia rapida (mesmo ms) e comum
  // no fluxo real e nos testes. So queremos excluir prova INEQUIVOCAMENTE
  // anterior ao gatilho, nao empates.
  const provaFiles = allProvaFiles.filter((f) => {
    try {
      return fs.statSync(f).mtimeMs >= triggerMtime;
    } catch {
      return false;
    }
  });
  const staleCount = allProvaFiles.length - provaFiles.length;

  if (provaFiles.length === 0) {
    process.stderr.write(
      `[require-investigador-before-fix] BLOQUEADO: investigador invocado SEM gravar prova mecânica.\n\n`,
    );
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write(
      `Motivo: REGRA #0 exige LEITURA REAL antes do fix (banco, log, payload, config).\n`,
    );
    if (staleCount > 0) {
      process.stderr.write(
        `Encontrado(s) ${staleCount} investigation-*.json, mas ${staleCount === 1 ? 'e' : 'sao'} ANTERIOR${staleCount === 1 ? '' : 'ES'} ao gatilho\n`,
      );
      process.stderr.write(
        `deste bug (mtime <= bug-trigger-${sess}) — prova de outro bug/sessao, nao vale pra este.\n\n`,
      );
    } else {
      process.stderr.write(
        `Marker 'investigator-invoked' existe mas NAO ha .claude/.runtime/investigation-*.json\n`,
      );
      process.stderr.write(
        `registrando o que foi lido. Sem prova mecânica, marker vira teatro.\n\n`,
      );
    }
    process.stderr.write(
      `Como resolver: investigador deve gravar JSON canônico antes de devolver controle:\n`,
    );
    process.stderr.write(`  {\n`);
    process.stderr.write(`    "ref": "<bug-id ou hash>",\n`);
    process.stderr.write(
      `    "lido": ["arquivo:linha", "SELECT * FROM tabela WHERE id=X", "log Y linha Z"],\n`,
    );
    process.stderr.write(
      `    "achado": "causa raiz em pelo menos ${ACHADO_MIN_CHARS} caracteres descrevendo o que aconteceu"\n`,
    );
    process.stderr.write(`  }\n`);
    process.stderr.write(`Salve em .claude/.runtime/investigation-<ref>.json.\n\n`);
    process.stderr.write(`Aplica regras: INV-006, INV-AGENT-002, INV-AGENT-004.\n`);
    recordMetric(
      'block',
      'require-investigador-before-fix',
      `marker sem investigation-*.json (GATE 2.1)`,
    );
    return 2;
  }

  // Valida shape de cada investigation-*.json — pelo menos UM precisa ser valido (ok ou legacy).
  // Se TODOS forem invalidos, bloqueia explicando qual o problema.
  const validacoes = provaFiles.map((f) => ({ file: f, r: validateInvestigationJson(f) }));
  const algumValido = validacoes.some(({ r }) => r.state === 'ok' || r.state === 'legacy');

  if (algumValido) {
    const algunsLegacy = validacoes.some(({ r }) => r.state === 'legacy');
    if (algunsLegacy) {
      process.stderr.write(
        `[require-investigador-before-fix] AVISO: investigation JSON vazio aceito porque ROLDAO_METHOD_LEGACY_MARKERS=1.\n`,
      );
      process.stderr.write(
        `Esta tolerancia some em v2.2.0. Investigador deve gravar JSON canonico (ADR-020 + T-003).\n`,
      );
    }
    return 0;
  }

  // Nenhum JSON valido — bloqueia listando os problemas.
  process.stderr.write(
    `[require-investigador-before-fix] BLOQUEADO: investigation-*.json existe mas NAO tem shape valido.\n\n`,
  );
  process.stderr.write(`Arquivo alvo: ${filePath}\n`);
  process.stderr.write(
    `Motivo: REGRA #0 exige LEITURA REAL — JSON precisa ter "lido" (array nao-vazio)\n`,
  );
  process.stderr.write(
    `e "achado" (>= ${ACHADO_MIN_CHARS} chars descrevendo causa raiz). Bypass por palavra\n`,
  );
  process.stderr.write(`("trivial", "bypass", "confiei no usuario") e detectado e rejeitado.\n\n`);
  process.stderr.write(`Arquivos investigation-* problematicos:\n`);
  for (const { file, r } of validacoes) {
    process.stderr.write(`  ✗ ${path.basename(file)} — estado=${r.state}\n`);
    if (r.reason) process.stderr.write(`     ${r.reason}\n`);
  }
  process.stderr.write(`\nShape canonico minimo:\n`);
  process.stderr.write(`  {\n`);
  process.stderr.write(`    "ref": "<id>",\n`);
  process.stderr.write(`    "lido": ["arquivo:linha real", "query SELECT real", ...],\n`);
  process.stderr.write(
    `    "achado": "descricao da causa raiz com >= ${ACHADO_MIN_CHARS} caracteres"\n`,
  );
  process.stderr.write(`  }\n\n`);
  process.stderr.write(`Por que esse rigor (auditoria 10-agentes 2026-05-24, bloqueador 1):\n`);
  process.stderr.write(`  - JSON vazio ou {} = teatro de investigacao.\n`);
  process.stderr.write(`  - "lido": [] = agente nao leu nada — fix vira sintoma.\n`);
  process.stderr.write(`  - "achado": "trivial" = bypass mascarado de explicacao.\n\n`);
  process.stderr.write(
    `Em migracao de v1.x: setar ROLDAO_METHOD_LEGACY_MARKERS=1 aceita JSON vazio por enquanto (ADR-021).\n`,
  );
  process.stderr.write(`Aplica regras: INV-006, INV-AGENT-002, INV-AGENT-004.\n`);
  recordMetric(
    'block',
    'require-investigador-before-fix',
    `investigation-*.json sem shape valido (GATE 2.2)`,
  );
  return 2;
}

module.exports = { runHook, onErrorExit: 2 };

if (require.main === module) {
  (async () => {
    process.exit(await runHook(await readStdinJson()));
  })().catch((err) => {
    process.stderr.write(`[require-investigador-before-fix] erro interno: ${err.message}\n`);
    process.exit(2);
  });
}
