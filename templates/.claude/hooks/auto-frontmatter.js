#!/usr/bin/env node
// auto-frontmatter.js — auto-preenche frontmatter de docs/* (T-302 / E2 + E8).
// Hook PreToolUse, matcher: Write|Edit. Best-effort: nao bloqueia, so reescreve
// placeholders mecanicos.
//
// Substituicoes mecanicas:
//   revisado-em: AAAA-MM-DD     → revisado-em: <data ISO de hoje>
//   owner: <preencher>          → owner: <git config user.name || env USER>
//
// EXCLUSOES (nao toca):
//   - arquivos em templates/, .specify/templates/, *.example, *.template.md
//     (sao moldes — placeholder e proposital)
//   - arquivos sem frontmatter (linha 1 != '---')
//
// PRD-003 → US-114 → T-302 (E2+E8).

const { execFileSync } = require('child_process');
const { readStdinJson } = require('./_lib.js');

const EXCLUDED_PATH_RE = /(^|\/)(templates|\.specify\/templates)\/|\.example(\.[a-z]+)?$|\.template\.[a-z]+$/i;
const TARGET_EXT_RE = /\.md$/i;

function gitUserName() {
  try {
    return execFileSync('git', ['config', 'user.name'], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
  } catch { return ''; }
}

function fallbackUser() {
  return gitUserName() || process.env.USER || process.env.USERNAME || 'roldao';
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function reescreverFrontmatter(content) {
  if (!content) return null;
  const linhas = content.split(/\r?\n/);
  if (linhas[0].trim() !== '---') return null;

  // Acha 2o '---' (fim do frontmatter)
  let fim = -1;
  for (let i = 1; i < Math.min(linhas.length, 50); i++) {
    if (linhas[i].trim() === '---') { fim = i; break; }
  }
  if (fim === -1) return null;

  const user = fallbackUser();
  const data = hojeIso();
  let mudou = false;

  for (let i = 1; i < fim; i++) {
    // revisado-em: AAAA-MM-DD ou placeholder vazio
    const reData = /^(\s*revisado-em:\s*)(AAAA-MM-DD|YYYY-MM-DD|<.*?>|_\(preencher\)_|)\s*$/i;
    const mData = linhas[i].match(reData);
    if (mData) {
      linhas[i] = `${mData[1]}${data}`;
      mudou = true;
      continue;
    }
    // owner: <preencher> ou _(preencher)_ ou placeholder vazio
    const reOwner = /^(\s*owner:\s*)(<.*?>|_\(preencher\)_|preencher|)\s*$/i;
    const mOwner = linhas[i].match(reOwner);
    if (mOwner) {
      linhas[i] = `${mOwner[1]}${user}`;
      mudou = true;
    }
  }

  if (!mudou) return null;
  return linhas.join('\n');
}

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);
  if (EXCLUDED_PATH_RE.test(filePath)) process.exit(0);
  if (!TARGET_EXT_RE.test(filePath)) process.exit(0);

  // PreToolUse nao consegue modificar content do Write/Edit (limitacao do harness).
  // Funciona como AVISO: se detectar placeholder, alerta o agente pra usar valor real.
  const content = input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);

  const reescrito = reescreverFrontmatter(content);
  if (!reescrito) process.exit(0);

  // Soft warning (exit 0) sugerindo o frontmatter atualizado
  process.stderr.write(`[AVISO] [auto-frontmatter] Detectei placeholder em frontmatter de ${filePath}.\n`);
  process.stderr.write(`Sugestao mecanica: substituir 'AAAA-MM-DD' por '${hojeIso()}' e 'owner: <preencher>' por '${fallbackUser()}' antes de salvar.\n`);
  process.stderr.write(`(T-302 / E2+E8 — nao bloqueia, so lembra.)\n`);
  process.exit(0);
})().catch(() => process.exit(0));
