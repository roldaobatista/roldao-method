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
check('26 commands em templates/.claude/commands/', cmdFiles.length === 26, `achou ${cmdFiles.length}`);

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
}

console.log('');
console.log(`agents-commands-statusline: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
