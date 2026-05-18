#!/usr/bin/env node
/**
 * test/install.test.js — smoke test do CLI.
 * Cria pasta temporaria, roda `install --yes`, verifica que arquivos chegaram,
 * roda `doctor`, depois `uninstall --yes`. Sem dependencia externa.
 *
 * v0.7.0: cobre 18 hooks bloqueadores + 5 auxiliares + test-runner = 24 arquivos no core.
 * (v0.5 tinha 14 bloqueadores; v0.6 adicionou require-readiness-before-feature e validate-story-dependencies;
 *  v0.7 adicionou require-agent-sequence-before-dev e validate-quick-dev-scope — gaps da auditoria 10-agentes round 2)
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

// 2) Arquivos esperados — versão v0.5.0 completa
const exigidos = [
  // Contratos raiz
  'AGENTS.md',
  'CLAUDE.md',
  'REGRAS-INEGOCIAVEIS.md',
  '.claude/settings.json',

  // 12 agentes (com nome + ícone, v0.5+)
  '.claude/agents/analista.md',
  '.claude/agents/gerente-produto.md',
  '.claude/agents/ux-designer.md',
  '.claude/agents/tech-lead.md',
  '.claude/agents/investigador.md',
  '.claude/agents/dev-senior.md',
  '.claude/agents/revisor.md',
  '.claude/agents/auditor-seguranca.md',
  '.claude/agents/auditor-qualidade.md',
  '.claude/agents/auditor-produto.md',
  '.claude/agents/fiscal-br.md',
  '.claude/agents/tech-writer.md',

  // 19 comandos
  '.claude/commands/inicio.md',
  '.claude/commands/brownfield.md',
  '.claude/commands/prd.md',
  '.claude/commands/epico.md',
  '.claude/commands/historia.md',
  '.claude/commands/feature.md',
  '.claude/commands/quick-dev.md',
  '.claude/commands/bug.md',
  '.claude/commands/refactor.md',
  '.claude/commands/qa.md',
  '.claude/commands/auditoria.md',
  '.claude/commands/retro.md',
  '.claude/commands/replanejar.md',
  '.claude/commands/sprint.md',
  '.claude/commands/status.md',
  '.claude/commands/checkpoint.md',
  '.claude/commands/readiness.md',
  '.claude/commands/help.md',
  '.claude/commands/shard.md',

  // 18 hooks bloqueadores
  '.claude/hooks/anti-mascaramento.sh',
  '.claude/hooks/block-destructive.sh',
  '.claude/hooks/block-mock-in-integration.sh',
  '.claude/hooks/block-todo-without-issue.sh',
  '.claude/hooks/commit-message-validator.sh',
  '.claude/hooks/fiscal-br-validator.sh',
  '.claude/hooks/no-amend-after-push.sh',
  '.claude/hooks/no-hardcoded-env-urls.sh',
  '.claude/hooks/no-test-data-in-fixtures.sh',
  '.claude/hooks/paths-frontmatter-validator.sh',
  '.claude/hooks/secrets-scanner.sh',
  '.claude/hooks/block-jargon-pt-br.sh',
  '.claude/hooks/block-secrets-in-commit-message.sh',
  '.claude/hooks/block-confirmation-questions.sh',
  '.claude/hooks/require-investigador-before-fix.sh',
  '.claude/hooks/require-readiness-before-feature.sh',
  '.claude/hooks/require-agent-sequence-before-dev.sh',
  '.claude/hooks/validate-story-dependencies.sh',
  '.claude/hooks/validate-quick-dev-scope.sh',
  '.claude/hooks/validate-test-pyramid.sh',

  // 5 auxiliares + test-runner
  '.claude/hooks/context-budget.sh',
  '.claude/hooks/mcp-validator.sh',
  '.claude/hooks/regra-zero-reminder.sh',
  '.claude/hooks/_test-runner.sh',

  // 8 skills BR no core
  '.claude/skills/gerar-adr-pt-br/SKILL.md',
  '.claude/skills/traduzir-jargao/SKILL.md',
  '.claude/skills/brainstormar-ideia/SKILL.md',
  '.claude/skills/gerar-test-fixture-br/SKILL.md',
  '.claude/skills/validar-cpf-cnpj/SKILL.md',
  '.claude/skills/validar-cpf-cnpj/scripts/validar.py',
  '.claude/skills/validar-pix/SKILL.md',
  '.claude/skills/validar-cep/SKILL.md',
  '.claude/skills/checklist-lgpd/SKILL.md',

  // .specify — constitution + 11 templates + 7 checklists + 7 KBs
  '.specify/memory/constitution.md',
  '.specify/templates/prd.md',
  '.specify/templates/story.md',
  '.specify/templates/architecture.md',
  '.specify/templates/brownfield-prd.md',
  '.specify/templates/fullstack-architecture.md',
  '.specify/templates/prd-fiscal.md',
  '.specify/templates/decision-log.md',
  '.specify/templates/prfaq.md',
  '.specify/templates/product-brief.md',
  '.specify/templates/ux-design.md',
  '.specify/templates/headless-schemas.md',
  '.specify/checklists/story-dod.md',
  '.specify/checklists/architecture-readiness.md',
  '.specify/checklists/fiscal-compliance.md',
  '.specify/checklists/lgpd-privacy-review.md',
  '.specify/checklists/pm-readiness.md',
  '.specify/checklists/release-readiness.md',
  '.specify/checklists/pix-compliance.md',
  '.specify/data/kb-pt-br.md',
  '.specify/data/kb-fiscal.md',
  '.specify/data/kb-lgpd.md',
  '.specify/data/kb-pix.md',
  '.specify/data/kb-stack-br.md',
  '.specify/data/kb-brainstorming-pt-br.md',
  '.specify/data/kb-elicitation-pt-br.md',

  // _meta
  '.claude/_meta/skills-index.csv',
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

// 5) List
try {
  const out = execSync(`node "${BIN}" list`, { stdio: 'pipe' }).toString();
  check('list mostra IDEs', /IDE/.test(out) || /Claude Code/.test(out));
  check('list mostra addons', /addon/i.test(out));
} catch (e) {
  check('list executou', false);
}

// 6) Add addon (electron-br como exemplo, sempre presente)
try {
  execSync(`node "${BIN}" add electron-br --yes`, { stdio: 'pipe' });
  check('add electron-br copiou agente', fs.existsSync(path.join(TMP, '.claude/agents/electron-arch.md')));
  check('add electron-br copiou hook', fs.existsSync(path.join(TMP, '.claude/hooks/block-ipc-without-validation.sh')));
} catch (e) {
  check('add electron-br executou', false);
}

// 7) Uninstall
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

// 8) Recusa em diretorio sensivel (root, home, Program Files) — usa --dry-run pra testar lógica sem efeito
try {
  const homedir = os.homedir();
  process.chdir(homedir);
  let blocked = false;
  try {
    execSync(`node "${BIN}" install --yes --dry-run`, { stdio: 'pipe' });
  } catch (e) {
    blocked = true;
  }
  check('install recusa rodar em $HOME', blocked);
  process.chdir(TMP);
} catch (e) {
  // se nao conseguiu testar, nao falha
  process.chdir(TMP);
}

// Cleanup
process.chdir(ROOT);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}

console.log('');
if (failures === 0) { console.log('Total OK.'); process.exit(0); }
console.log(`${failures} falha(s).`); process.exit(1);
