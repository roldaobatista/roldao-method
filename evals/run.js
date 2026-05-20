#!/usr/bin/env node
/**
 * evals/run.js — verificador dos evals dos agentes.
 *
 * Dois modos:
 *
 * 1. LINT-ONLY (sem ANTHROPIC_API_KEY, default em CI): valida que cada
 *    .eval.md tem ≥ 3 cenários bem formados (Input + ≥ 2 validações).
 *    NÃO chama modelo nenhum.
 *
 * 2. LIVE (com ANTHROPIC_API_KEY): chama a API Anthropic com o prompt
 *    do agente (templates/.claude/agents/<nome>.md) + Input do cenário,
 *    e aplica as validações sobre a resposta.
 *
 *    Formatos suportados de validação (linha em "Resposta esperada"):
 *      - "inclui <texto>"      — substring match case-insensitive
 *      - "não inclui <texto>"  — substring negada
 *      - "mínimo N palavras"   — resposta tem ≥ N palavras
 *
 *    Modelo default: claude-haiku-4-5-20251001 (barato pra eval).
 *    Override via env EVAL_MODEL=claude-sonnet-4-6 (etc.).
 *
 * Cruza com templates/.claude/agents/: todo agente DEVE ter .eval.md.
 * Sem dependência externa (usa fetch nativo Node 18+).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, 'agents');
const AGENTS_DIR = path.resolve(__dirname, '..', 'templates', '.claude', 'agents');
const args = process.argv.slice(2);
// Aceita "--agent X" e "--agent=X" (formato comum em CI).
const wantAgent = (() => {
  const inline = args.find((a) => a.startsWith('--agent='));
  if (inline) return inline.slice('--agent='.length);
  return args.find((a, i) => args[i - 1] === '--agent');
})();
const jsonMode = args.includes('--json');

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.EVAL_MODEL || 'claude-haiku-4-5-20251001';

function listEvals() {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.eval.md'))
    .map((f) => ({ agent: f.replace('.eval.md', ''), path: path.join(ROOT, f) }));
}

function parseScenarios(content) {
  const scenarios = [];
  const blocks = content.split(/^## Cenário\s+/m).slice(1);
  for (const b of blocks) {
    const titleMatch = b.match(/^(\d+)\s*[—-]\s*(.+)/);
    const inputMatch = b.match(/###\s*Input\s*\n([\s\S]*?)(?=\n###|$)/);
    const validMatch = b.match(/###\s*Resposta esperada[^\n]*\n([\s\S]*?)(?=\n##|$)/);
    if (!titleMatch || !inputMatch || !validMatch) continue;
    scenarios.push({
      n: titleMatch[1],
      title: titleMatch[2].trim(),
      input: inputMatch[1].trim(),
      validations: validMatch[1]
        .trim()
        .split(/\n/)
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean),
    });
  }
  return scenarios;
}

function lintScenario(s) {
  const issues = [];
  if (s.input.length < 10) issues.push('Input muito curto');
  if (s.validations.length < 2) issues.push('Precisa de pelo menos 2 validações');
  return issues;
}

// Lê o prompt do agente (templates/.claude/agents/<nome>.md) e extrai o
// corpo após o frontmatter — é o system prompt do subagente no Claude Code.
function readAgentPrompt(agent) {
  const file = path.join(AGENTS_DIR, `${agent}.md`);
  if (!fs.existsSync(file)) throw new Error(`Agente ${agent} não tem .md em ${AGENTS_DIR}`);
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return (m ? m[1] : raw).trim();
}

async function callClaude(systemPrompt, userInput, model) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${text.substring(0, 300)}`);
  }
  const data = await resp.json();
  return (data.content || []).map((b) => b.text || '').join('\n').trim();
}

// Aplica uma validação à resposta. Retorna { ok: bool, reason?: string }.
// Sintaxes suportadas (case-insensitive, "não" também aceita "nao"):
//   - "inclui <texto>"      — substring match
//   - "não inclui <texto>"  — substring negada
//   - "mínimo N palavras"   — resposta tem ≥ N palavras (separador whitespace)
// Validação fora desses padrões = lint-only (ignora em live, conta como ok).
function applyValidation(rule, response) {
  const lowerResp = response.toLowerCase();
  const noWords = (response.match(/\S+/g) || []).length;

  const inclui = rule.match(/^inclui\s+(.+)$/i);
  if (inclui) {
    const needle = inclui[1].trim().toLowerCase();
    return lowerResp.includes(needle)
      ? { ok: true }
      : { ok: false, reason: `não encontrou "${needle}"` };
  }

  const naoInclui = rule.match(/^n[ãa]o\s+inclui\s+(.+)$/i);
  if (naoInclui) {
    const needle = naoInclui[1].trim().toLowerCase();
    return !lowerResp.includes(needle)
      ? { ok: true }
      : { ok: false, reason: `continha proibido "${needle}"` };
  }

  const minPal = rule.match(/^m[íi]nimo\s+(\d+)\s+palavras?$/i);
  if (minPal) {
    const n = parseInt(minPal[1], 10);
    return noWords >= n
      ? { ok: true }
      : { ok: false, reason: `${noWords} palavras < ${n}` };
  }

  // Padrão não reconhecido — não falha (apenas avisa).
  return { ok: true, note: `regra livre não validada: "${rule}"` };
}

async function main() {
  const evals = listEvals().filter((e) => !wantAgent || e.agent === wantAgent);
  if (evals.length === 0) {
    console.error('Nenhum eval encontrado.');
    process.exit(2);
  }

  // Cross-check: todo agente em templates/.claude/agents precisa de eval.
  // Antes a ausência era silenciosa ("Todos OK" enganoso com 5/12 cobertos).
  if (!wantAgent && fs.existsSync(AGENTS_DIR)) {
    const agentNames = fs.readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace('.md', ''));
    const evalNames = new Set(listEvals().map((e) => e.agent));
    const semEval = agentNames.filter((a) => !evalNames.has(a));
    if (semEval.length > 0) {
      console.error(`FAIL: agentes sem .eval.md: ${semEval.join(', ')}`);
      process.exit(1);
    }
  }

  const results = [];
  let totalScenarios = 0;
  let failures = 0;

  for (const e of evals) {
    const content = fs.readFileSync(e.path, 'utf8');
    const scenarios = parseScenarios(content);
    if (scenarios.length < 3) {
      console.error(`[${e.agent}] FAIL: precisa de ≥ 3 cenários (tem ${scenarios.length})`);
      failures++;
      continue;
    }
    let systemPrompt = null;
    if (HAS_KEY) {
      try { systemPrompt = readAgentPrompt(e.agent); }
      catch (err) {
        console.error(`[${e.agent}] FAIL: ${err.message}`);
        failures++;
        continue;
      }
    }

    for (const s of scenarios) {
      totalScenarios++;
      const lintIssues = lintScenario(s);
      if (lintIssues.length > 0) {
        console.error(`[${e.agent}/${s.n}] LINT: ${lintIssues.join('; ')}`);
        failures++;
        continue;
      }
      if (!HAS_KEY) {
        results.push({ agent: e.agent, n: s.n, status: 'lint-ok' });
        continue;
      }
      try {
        const response = await callClaude(systemPrompt, s.input, MODEL);
        const ruleResults = s.validations.map((v) => ({ rule: v, ...applyValidation(v, response) }));
        const failed = ruleResults.filter((r) => !r.ok);
        if (failed.length > 0) {
          console.error(`[${e.agent}/${s.n}] LIVE FAIL: ${failed.map((f) => `${f.rule} (${f.reason})`).join(' | ')}`);
          failures++;
          results.push({ agent: e.agent, n: s.n, status: 'live-fail', failed: failed.map((f) => f.rule) });
        } else {
          results.push({ agent: e.agent, n: s.n, status: 'live-ok' });
        }
      } catch (err) {
        console.error(`[${e.agent}/${s.n}] LIVE ERROR: ${err.message}`);
        failures++;
        results.push({ agent: e.agent, n: s.n, status: 'live-error', error: err.message });
      }
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify({ totalScenarios, failures, results }, null, 2));
  } else {
    console.log(`\n${HAS_KEY ? 'Live' : 'Lint-only'} run: ${totalScenarios} cenários em ${evals.length} agentes`);
    if (failures > 0) console.log(`${failures} falha(s).`);
    else console.log('Todos OK.');
  }
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
