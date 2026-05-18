#!/usr/bin/env node
/**
 * test/install.test.js — smoke test do CLI.
 * Cria pasta temporaria, roda `install --yes`, verifica que arquivos chegaram,
 * roda `doctor`, depois `uninstall --yes`. Sem dependencia externa.
 *
 * v0.10.0: cobre 21 hooks bloqueadores + 5 auxiliares + test-runner + _lib = 28 arquivos no core.
 * Histórico: v0.5 (14 bloq) -> v0.6 (+readiness, +dependencies) -> v0.7 (+agent-sequence, +quick-dev-scope) ->
 * v0.8 (+checkpoint, +auditors-pass, +story-approvals) -> v0.9 (hardening) -> v0.10 (adapters fix, install seletivo).
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

  // 21 comandos
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
  '.claude/commands/clarificar.md',
  '.claude/commands/consistencia.md',

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

// 4b) Override do projeto sobrevive ao update
try {
  const ovDir = path.join(TMP, '.specify/overrides/templates');
  fs.mkdirSync(ovDir, { recursive: true });
  const ovFile = path.join(ovDir, 'prd.md');
  const marker = 'CAMPO CUSTOMIZADO DO PROJETO — nao remover';
  fs.writeFileSync(ovFile, `# PRD override\n\n${marker}\n`);
  execSync(`node "${BIN}" update --yes`, { stdio: 'pipe' });
  check('override sobrevive ao update', fs.existsSync(ovFile) && fs.readFileSync(ovFile, 'utf8').includes(marker));
  check('update NAO cria .bak no override', !fs.existsSync(ovFile + '.bak'));
} catch (e) {
  check('override preservado no update', false);
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

// 6b) search lista addons (sem termo) e filtra por termo
try {
  const sAll = execSync(`node "${BIN}" search --no-color`, { stdio: 'pipe' }).toString();
  check('search lista electron-br', /electron-br/.test(sAll));
  check('search marca instalado', /\[instalado\][^\n]*electron-br/.test(sAll));
  const sFilter = execSync(`node "${BIN}" search fiscal --no-color`, { stdio: 'pipe' }).toString();
  check('search fiscal filtra fiscal-br-completo', /fiscal-br-completo/.test(sFilter));
  check('search fiscal NAO lista lgpd-compliance', !/lgpd-compliance/.test(sFilter));
} catch (e) {
  check('search executou', false);
}

// 6c) remove tira só o addon, preserva o core
try {
  execSync(`node "${BIN}" remove electron-br --yes`, { stdio: 'pipe' });
  check('remove tirou agente do addon', !fs.existsSync(path.join(TMP, '.claude/agents/electron-arch.md')));
  check('remove tirou hook do addon', !fs.existsSync(path.join(TMP, '.claude/hooks/block-ipc-without-validation.sh')));
  check('remove preservou core (dev-senior)', fs.existsSync(path.join(TMP, '.claude/agents/dev-senior.md')));
  check('remove preservou core (block-destructive)', fs.existsSync(path.join(TMP, '.claude/hooks/block-destructive.sh')));
} catch (e) {
  check('remove executou', false);
}

// 6d) remove de addon desconhecido falha com mensagem
try {
  execSync(`node "${BIN}" remove inexistente-xyz --yes`, { stdio: 'pipe' });
  check('remove addon inexistente deveria falhar', false);
} catch (e) {
  check('remove addon inexistente falha (esperado)', true);
}

// 6e) tasks-to-issues sem docs/stories (ou sem gh) falha de forma controlada
try {
  execSync(`node "${BIN}" tasks-to-issues --yes --dry-run`, { stdio: 'pipe' });
  check('tasks-to-issues sem stories deveria falhar', false);
} catch (e) {
  const out = ((e.stdout || '') + (e.stderr || '')).toString();
  check('tasks-to-issues falha com mensagem clara', /docs\/stories|GitHub CLI \(gh\)/.test(out));
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

// 8a) Adapter resolution: instala só .claude/ por padrão (sem --all-adapters)
try {
  const tmpDefault = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-adapter-default-'));
  process.chdir(tmpDefault);
  execSync(`node "${BIN}" install --yes`, { stdio: 'pipe' });
  check('default: instala .claude/', fs.existsSync(path.join(tmpDefault, '.claude/settings.json')));
  check('default: NAO instala .cursor/', !fs.existsSync(path.join(tmpDefault, '.cursor')));
  check('default: NAO instala .windsurf/', !fs.existsSync(path.join(tmpDefault, '.windsurf')));
  check('default: NAO instala .clinerules', !fs.existsSync(path.join(tmpDefault, '.clinerules')));
  check('default: NAO instala .aider.conf.yml', !fs.existsSync(path.join(tmpDefault, '.aider.conf.yml')));
  check('default: NAO instala GEMINI.md', !fs.existsSync(path.join(tmpDefault, 'GEMINI.md')));
  check('default: NAO instala .codex/', !fs.existsSync(path.join(tmpDefault, '.codex')));
  process.chdir(TMP);
  try { fs.rmSync(tmpDefault, { recursive: true, force: true }); } catch {}
} catch (e) {
  check('adapter resolution default', false);
  process.chdir(TMP);
}

// 8b) --all-adapters instala TODOS
try {
  const tmpAll = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-adapter-all-'));
  process.chdir(tmpAll);
  execSync(`node "${BIN}" install --yes --all-adapters`, { stdio: 'pipe' });
  check('--all-adapters: .clinerules', fs.existsSync(path.join(tmpAll, '.clinerules')));
  check('--all-adapters: .roorules', fs.existsSync(path.join(tmpAll, '.roorules')));
  check('--all-adapters: .aider.conf.yml', fs.existsSync(path.join(tmpAll, '.aider.conf.yml')));
  check('--all-adapters: .cursor/', fs.existsSync(path.join(tmpAll, '.cursor')));
  check('--all-adapters: GEMINI.md', fs.existsSync(path.join(tmpAll, 'GEMINI.md')));
  check('--all-adapters: .codex/instructions.md', fs.existsSync(path.join(tmpAll, '.codex/instructions.md')));
  process.chdir(TMP);
  try { fs.rmSync(tmpAll, { recursive: true, force: true }); } catch {}
} catch (e) {
  check('--all-adapters', false);
  process.chdir(TMP);
}

// 8c) --adapters=cursor,windsurf instala só esses + claude (sempre)
try {
  const tmpSel = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-adapter-sel-'));
  process.chdir(tmpSel);
  execSync(`node "${BIN}" install --yes --adapters=cursor,windsurf`, { stdio: 'pipe' });
  check('--adapters=cursor,windsurf: .cursor/', fs.existsSync(path.join(tmpSel, '.cursor')));
  check('--adapters=cursor,windsurf: .windsurf/', fs.existsSync(path.join(tmpSel, '.windsurf')));
  check('--adapters=cursor,windsurf: .claude/ (sempre)', fs.existsSync(path.join(tmpSel, '.claude')));
  check('--adapters=cursor,windsurf: NAO instala .clinerules', !fs.existsSync(path.join(tmpSel, '.clinerules')));
  process.chdir(TMP);
  try { fs.rmSync(tmpSel, { recursive: true, force: true }); } catch {}
} catch (e) {
  check('--adapters=cursor,windsurf', false);
  process.chdir(TMP);
}

// 8d) --adapters=gemini-cli,codex-cli instala só esses + claude (sempre)
try {
  const tmpGC = fs.mkdtempSync(path.join(os.tmpdir(), 'roldao-adapter-gc-'));
  process.chdir(tmpGC);
  execSync(`node "${BIN}" install --yes --adapters=gemini-cli,codex-cli`, { stdio: 'pipe' });
  check('--adapters=gemini-cli: GEMINI.md', fs.existsSync(path.join(tmpGC, 'GEMINI.md')));
  check('--adapters=codex-cli: .codex/instructions.md', fs.existsSync(path.join(tmpGC, '.codex/instructions.md')));
  check('--adapters=gemini-cli,codex-cli: .claude/ (sempre)', fs.existsSync(path.join(tmpGC, '.claude')));
  check('--adapters=gemini-cli,codex-cli: NAO instala .cursor/', !fs.existsSync(path.join(tmpGC, '.cursor')));
  process.chdir(TMP);
  try { fs.rmSync(tmpGC, { recursive: true, force: true }); } catch {}
} catch (e) {
  check('--adapters=gemini-cli,codex-cli', false);
  process.chdir(TMP);
}

// 9) Recusa em diretorio sensivel (root, home, Program Files) — usa --dry-run pra testar lógica sem efeito
{
  const homedir = os.homedir();
  let canTest = true;
  try {
    process.chdir(homedir);
  } catch (e) {
    // Só ISTO é "não consegui montar o cenário" — não falha o teste.
    canTest = false;
    console.log(`  SKIP install recusa rodar em $HOME (não foi possível chdir pra ${homedir}: ${e.message})`);
  }
  if (canTest) {
    let blocked = false;
    try {
      execSync(`node "${BIN}" install --yes --dry-run`, { stdio: 'pipe' });
    } catch (e) {
      blocked = true;
    }
    // Se chegou aqui e NÃO bloqueou, a proteção falhou — FAIL incondicional.
    check('install recusa rodar em $HOME', blocked);
  }
  process.chdir(TMP);
}

// Cleanup
process.chdir(ROOT);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}

console.log('');
if (failures === 0) { console.log('Total OK.'); process.exit(0); }
console.log(`${failures} falha(s).`); process.exit(1);
