#!/usr/bin/env node
/**
 * test/install.test.js — smoke test do CLI.
 * Cria pasta temporaria, roda `install --yes`, verifica que arquivos chegaram,
 * roda `doctor`, depois `uninstall --yes`. Sem dependencia externa.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN = path.join(ROOT, 'bin/install.js');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-test-'));
process.chdir(TMP);

let failures = 0;
function check(desc, cond) {
  if (cond) console.log(`  OK   ${desc}`);
  else { console.log(`  FAIL ${desc}`); failures++; }
}

console.log(`\nTestando em: ${TMP}\n`);

// 1) Install
try {
  execSync(`node "${BIN}" install --yes`, { stdio: 'pipe' });
  check('install --yes nao deu erro', true);
} catch (e) {
  check('install --yes nao deu erro', false);
  console.log(e.stderr?.toString() || e.message);
}

// 2) Arquivos esperados
const exigidos = [
  'AGENTS.md',
  'CLAUDE.md',
  'REGRAS-INEGOCIAVEIS.md',
  '.claude/settings.json',
  '.claude/agents/dev-senior.md',
  '.claude/agents/investigador.md',
  '.claude/agents/analista.md',
  '.claude/agents/ux-designer.md',
  '.claude/agents/fiscal-br.md',
  '.claude/commands/feature.md',
  '.claude/commands/historia.md',
  '.claude/commands/brownfield.md',
  '.claude/commands/epico.md',
  '.claude/commands/qa.md',
  '.claude/commands/retro.md',
  '.claude/commands/prd.md',
  '.claude/hooks/anti-mascaramento.sh',
  '.claude/hooks/block-mock-in-integration.sh',
  '.claude/hooks/block-todo-without-issue.sh',
  '.claude/hooks/commit-message-validator.sh',
  '.claude/hooks/no-amend-after-push.sh',
  '.claude/hooks/mcp-validator.sh',
  '.claude/hooks/_test-runner.sh',
  '.claude/skills/validar-cpf-cnpj/SKILL.md',
  '.claude/skills/validar-cpf-cnpj/scripts/validar.py',
  '.claude/skills/validar-pix/SKILL.md',
  '.claude/skills/validar-cep/SKILL.md',
  '.claude/skills/checklist-lgpd/SKILL.md',
  '.specify/memory/constitution.md',
  '.specify/templates/prd.md',
  '.specify/templates/story.md',
  '.specify/templates/architecture.md',
];
for (const f of exigidos) {
  check(`arquivo criado: ${f}`, fs.existsSync(path.join(TMP, f)));
}

// 3) Doctor
try {
  const out = execSync(`node "${BIN}" doctor`, { stdio: 'pipe' }).toString();
  check('doctor: instalacao OK', /instalacao OK/.test(out));
} catch (e) {
  check('doctor: instalacao OK', false);
}

// 4) Reinstall = idempotente
try {
  const out = execSync(`node "${BIN}" install --yes`, { stdio: 'pipe' }).toString();
  check('reinstall mostra resumo', /resumo/.test(out));
  check('reinstall pula ja existentes', /pulados:/.test(out));
} catch (e) {
  check('reinstall idempotente', false);
}

// 5) Uninstall
try {
  execSync(`node "${BIN}" uninstall --yes`, { stdio: 'pipe' });
  check('uninstall executou', true);
  check('uninstall removeu .claude/agents', !fs.existsSync(path.join(TMP, '.claude/agents')));
  check('uninstall preservou AGENTS.md', fs.existsSync(path.join(TMP, 'AGENTS.md')));
  check('uninstall preservou CLAUDE.md', fs.existsSync(path.join(TMP, 'CLAUDE.md')));
  check('uninstall preservou REGRAS-INEGOCIAVEIS.md', fs.existsSync(path.join(TMP, 'REGRAS-INEGOCIAVEIS.md')));
} catch (e) {
  check('uninstall executou', false);
}

// Cleanup
process.chdir(ROOT);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}

console.log('');
if (failures === 0) { console.log('Total OK.'); process.exit(0); }
console.log(`${failures} falha(s).`); process.exit(1);
