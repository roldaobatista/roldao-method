#!/usr/bin/env node
// validar-self-masking.js — dogfood do hook anti-mascaramento (TST-001) sobre o próprio repo.
// Escaneia código de produção (templates/, bin/, tools/, addons/) por padrões de
// mascaramento de teste. Falha (exit 1) se encontrar.
//
// Não é o mesmo que anti-mascaramento.js (que é hook PreToolUse com input JSON do
// Claude). Aqui rodamos contra o repo inteiro num único passe — fecha o loop
// "casa do ferreiro" reportado em auditoria 2026-05-23.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['templates', 'bin', 'tools', 'addons'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', 'dist', 'build']);

// Padrões proibidos em código de produção / scripts CI que rodam teste.
// Cada padrão tem: regex, descrição, e lista de extensões alvo.
const PATTERNS = [
  { re: /\b(it|describe|test)\.skip\s*\(/, desc: 'test/skip em código', exts: ['.js', '.ts', '.tsx', '.jsx'] },
  { re: /\bxit\s*\(/, desc: 'xit em código', exts: ['.js', '.ts', '.tsx', '.jsx'] },
  { re: /\bxdescribe\s*\(/, desc: 'xdescribe em código', exts: ['.js', '.ts', '.tsx', '.jsx'] },
  { re: /assert(?:\.equal)?\s*\(\s*true\s*,\s*true\s*\)/, desc: 'assert(true, true)', exts: ['.js', '.ts'] },
  { re: /assertTrue\s*\(\s*true\s*\)/, desc: 'assertTrue(true) - assertiva vazia', exts: ['.js', '.ts'] },
  { re: /@ts-ignore\b/, desc: '@ts-ignore em código de teste', exts: ['.ts', '.tsx'] },
  // Comandos de teste com `|| true` em YAML/shell — silencia falha do teste.
  // Restringe a linhas que parecem invocar runner de teste pra não dar falso positivo
  // em scripts utilitários.
  { re: /\b(npm\s+(?:test|run\s+test\S*)|node\s+test\/|pytest|jest|vitest|go\s+test)[^|\n]*\|\|\s*true\b/, desc: '|| true em comando de teste', exts: ['.yml', '.yaml', '.sh', '.json'] },
];

function walk(dir, acc) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(full, acc);
    } else if (e.isFile()) {
      acc.push(full);
    }
  }
}

function scan() {
  const files = [];
  for (const d of SCAN_DIRS) {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) walk(full, files);
  }

  const violations = [];
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const content = (() => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } })();
    if (!content) continue;

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of PATTERNS) {
        if (!p.exts.includes(ext)) continue;
        if (p.re.test(line)) {
          // Falso positivo: arquivo é a definição/teste do PRÓPRIO validador / hook anti-mascaramento.
          const rel = path.relative(ROOT, file).replace(/\\/g, '/');
          if (rel.endsWith('validar-self-masking.js')) continue;
          if (rel.endsWith('anti-mascaramento.js')) continue;
          if (rel.endsWith('hooks-node-only.test.js')) continue;    // teste do hook contém fixtures
          if (rel.endsWith('block-todo-without-issue.js')) continue;
          if (rel.endsWith('sincronizar-adapters.js')) continue;    // lista os padrões como string
          if (rel.startsWith('templates/.cursor/')) continue;       // adapter — texto descritivo
          if (rel.startsWith('templates/.windsurf/')) continue;
          if (rel.startsWith('templates/.continue/')) continue;
          if (rel.startsWith('templates/.cline/')) continue;
          if (rel.startsWith('templates/.roo/')) continue;
          if (rel.startsWith('templates/.aider/')) continue;
          if (rel.startsWith('templates/.gemini/')) continue;
          if (rel.startsWith('templates/.codex/')) continue;
          if (rel.startsWith('templates/.opencode/')) continue;
          violations.push({ file: rel, line: i + 1, pattern: p.desc, text: line.trim().slice(0, 120) });
        }
      }
    }
  }
  return violations;
}

const v = scan();
if (v.length === 0) {
  console.log('OK: nenhum mascaramento de teste detectado no código de produção (TST-001).');
  process.exit(0);
}

console.error('FAIL: mascaramento de teste detectado (TST-001):');
for (const x of v) {
  console.error(`  ${x.file}:${x.line} — ${x.pattern}`);
  console.error(`    > ${x.text}`);
}
process.exit(1);
