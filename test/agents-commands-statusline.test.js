#!/usr/bin/env node
/**
 * test/agents-commands-statusline.test.js — valida frontmatter dos 15 agentes
 * (+ docs auxiliares) e 26 commands em templates/.claude/, e smoke do statusline.js.
 *
 * Auditoria 10-agentes 2026-05-24 identificou que 41 .md críticos (agents+commands)
 * NÃO tinham teste — frontmatter quebrado ou referência cruzada inválida passava
 * verde. Este teste fecha essa lacuna.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(ROOT, 'templates', '.claude', 'agents');
const COMMANDS_DIR = path.join(ROOT, 'templates', '.claude', 'commands');
const STATUSLINE = path.join(ROOT, 'templates', '.claude', 'statusline.js');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function readFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const obj = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) obj[kv[1]] = kv[2].trim();
  }
  return obj;
}

console.log('\n[agents — frontmatter]');
// MAPA-VISUAL.md e PERSONAS.md são docs auxiliares (SCREAMING-CASE no nome),
// não agentes invocáveis — pulamos. Mesma regra do tools/validar-templates.js.
const agentFiles = fs.readdirSync(AGENTS_DIR).filter((f) => {
  if (!f.endsWith('.md')) return false;
  if (f.startsWith('_')) return false;
  // Pula arquivos com letras maiúsculas (docs auxiliares).
  return !/[A-Z]/.test(f.replace(/\.md$/, ''));
});
check('15 agentes invocáveis em templates/.claude/agents/', agentFiles.length === 15, `achou ${agentFiles.length}`);

for (const file of agentFiles) {
  const fm = readFrontmatter(path.join(AGENTS_DIR, file));
  const slug = file.replace(/\.md$/, '');
  check(`agent ${slug}: tem frontmatter`, !!fm);
  if (!fm) continue;
  check(`agent ${slug}: name = ${slug}`, fm.name === slug, `name=${fm.name}`);
  check(`agent ${slug}: description com gatilho concreto (>=80 chars)`,
        (fm.description || '').length >= 80,
        `len=${(fm.description || '').length}`);
  check(`agent ${slug}: tools OU model declarado`, !!(fm.tools || fm.model));
}

console.log('\n[agents — docs auxiliares]');
const auxFiles = ['MAPA-VISUAL.md', 'PERSONAS.md'];
for (const f of auxFiles) {
  const full = path.join(AGENTS_DIR, f);
  check(`agents/${f} existe`, fs.existsSync(full));
  if (!fs.existsSync(full)) continue;
  const fm = readFrontmatter(full);
  check(`agents/${f}: tem frontmatter (owner/revisado-em/status)`,
        fm && fm.owner && fm['revisado-em'] && fm.status);
}

console.log('\n[commands — frontmatter + allowed-tools]');
const cmdFiles = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md'));
check('28 commands em templates/.claude/commands/', cmdFiles.length === 28, `achou ${cmdFiles.length}`);

for (const file of cmdFiles) {
  const fm = readFrontmatter(path.join(COMMANDS_DIR, file));
  const slug = file.replace(/\.md$/, '');
  check(`command /${slug}: tem frontmatter`, !!fm);
  if (!fm) continue;
  check(`command /${slug}: description presente`, !!fm.description);
  check(`command /${slug}: allowed-tools declarado (menor privilégio SEC-004)`,
        !!fm['allowed-tools'],
        'sem allowed-tools dá acesso total — risco UX/segurança');
}

console.log('\n[command /shard — chama investigador, precisa de Task]');
const shardFm = readFrontmatter(path.join(COMMANDS_DIR, 'shard.md'));
const shardBody = fs.readFileSync(path.join(COMMANDS_DIR, 'shard.md'), 'utf8');
const shardChamaInvestigador = /Invoque\s+`?investigador`?|Task\s+subagent_type\s*=\s*investigador/i.test(shardBody);
if (shardChamaInvestigador) {
  check('shard: tem Task em allowed-tools (chama investigador)',
        (shardFm['allowed-tools'] || '').includes('Task'),
        `allowed-tools=${shardFm['allowed-tools']}`);
}

console.log('\n[statusline.js — smoke]');
check('statusline.js existe', fs.existsSync(STATUSLINE));
if (fs.existsSync(STATUSLINE)) {
  const r = spawnSync('node', [STATUSLINE], {
    input: JSON.stringify({ model: { display_name: 'Sonnet 4.6' } }),
    encoding: 'utf8',
    timeout: 5000,
  });
  check('statusline: exit 0', r.status === 0, `exit=${r.status} stderr=${(r.stderr || '').slice(0, 200)}`);
  check('statusline: stdout não-vazio', (r.stdout || '').trim().length > 0);
  // Deve ter ao menos versão (📍) e modelo (🤖)
  check('statusline: contém 📍 versão', /📍/.test(r.stdout || ''));
  check('statusline: contém 🤖 modelo', /🤖/.test(r.stdout || ''));
  check('statusline: contém Sonnet 4.6', /Sonnet 4\.6/.test(r.stdout || ''));

  // Smoke do parsing de transcript_path com porcentagem de contexto (commit e139c06).
  // Cria transcript JSONL fake com usage e confirma que statusline imprime "📊 N%".
  const tmpTranscript = path.join(require('os').tmpdir(), `roldao-test-transcript-${Date.now()}.jsonl`);
  const linhaUsage = JSON.stringify({
    type: 'assistant',
    message: { usage: { input_tokens: 50000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
  });
  fs.writeFileSync(tmpTranscript, linhaUsage + '\n');
  const r2 = spawnSync('node', [STATUSLINE], {
    input: JSON.stringify({ model: { display_name: 'Sonnet 4.6', id: 'claude-sonnet-4-6' }, transcript_path: tmpTranscript }),
    encoding: 'utf8',
    timeout: 5000,
  });
  check('statusline: lê transcript_path e calcula % de contexto', /📊\s*\d+%/.test(r2.stdout || ''),
        `stdout=${(r2.stdout || '').slice(0, 200)}`);
  try { fs.unlinkSync(tmpTranscript); } catch { /* skip */ }
}

// [output-styles] — smoke do frontmatter
console.log('\n[output-styles — frontmatter]');
const OUTPUT_STYLES_DIR = path.join(ROOT, 'templates', '.claude', 'output-styles');
if (fs.existsSync(OUTPUT_STYLES_DIR)) {
  const styles = fs.readdirSync(OUTPUT_STYLES_DIR).filter((f) => f.endsWith('.md'));
  check('output-styles: ≥ 3 estilos (pt-br-conciso/dpo-lgpd/fiscal-br)', styles.length >= 3, `achou ${styles.length}`);
  for (const file of styles) {
    const fm = readFrontmatter(path.join(OUTPUT_STYLES_DIR, file));
    check(`output-style ${file}: tem frontmatter`, !!fm);
    if (fm) {
      check(`output-style ${file}: name presente`, !!fm.name);
      check(`output-style ${file}: description presente`, !!fm.description);
    }
  }
}

// [rules] — smoke do frontmatter (paths: opcional, mas owner/revisado-em/status quando declarado)
console.log('\n[rules — frontmatter]');
const RULES_DIR = path.join(ROOT, 'templates', '.claude', 'rules');
if (fs.existsSync(RULES_DIR)) {
  const rules = fs.readdirSync(RULES_DIR).filter((f) => f.endsWith('.md'));
  check('rules: ≥ 1 regra', rules.length >= 1, `achou ${rules.length}`);
  for (const file of rules) {
    const fm = readFrontmatter(path.join(RULES_DIR, file));
    // Frontmatter em rules é opcional, mas se declarar deve estar bem formado
    if (fm) {
      check(`rule ${file}: frontmatter coerente (se declarado)`,
            !!fm.owner || !!fm.description || !!fm.paths,
            `fm=${JSON.stringify(fm).slice(0, 100)}`);
    } else {
      check(`rule ${file}: arquivo não-vazio`, fs.statSync(path.join(RULES_DIR, file)).size > 100);
    }
  }
}

console.log('');
console.log(`agents-commands-statusline: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
