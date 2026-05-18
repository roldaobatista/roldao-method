# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.3.0] — 2026-05-18

Major expansão do framework após auditoria comparativa com BMAD-METHOD (10 agentes em paralelo).

### Adicionado

**Agentes (3 novos, total 11):**
- `analista` — pesquisa de mercado, brief, PRFAQ, regulamentação BR (4 modos).
- `ux-designer` — wireframes ASCII, 5 estados por tela, mensagens PT-BR.
- `fiscal-br` — NF-e, certificado A1, eSocial, REINF, SPED, Reforma Tributária 2026-2033.

**Comandos (6 novos, total 11):**
- `/historia` — cria `US-NNN-slug.md` em `docs/stories/`.
- `/brownfield` — onboarding em projeto legado (investigador + tech-lead geram doc).
- `/epico` — decompõe iniciativa grande em stories com dependências.
- `/qa` — gera/audita testes de uma área.
- `/retro` — retrospectiva 4L pós-marco.
- `/prd` — gera Product Requirements Document completo em PT-BR.

**Hooks (5 novos, total 7 bloqueadores + 5 auxiliares):**
- `block-mock-in-integration.sh` — barra mock em integration/e2e (TST-003).
- `block-todo-without-issue.sh` — exige ID rastreável em TODO/FIXME.
- `commit-message-validator.sh` — barra commit misturando prefixos ou >72 chars.
- `no-amend-after-push.sh` — barra `--amend` em commit já pushado.
- `mcp-validator.sh` — avisa sobre MCP fora da allowlist (SessionStart).

**Skills BR (3 novas, total 6):**
- `validar-pix` — chave Pix + EndToEndId + TxId.
- `validar-cep` — formato + opcional ViaCEP.
- `checklist-lgpd` — árvore de decisão de base legal + 10 checks.

**Templates de spec (.specify/templates/):**
- `prd.md` — Product Requirements Document.
- `story.md` — User Story rastreável.
- `architecture.md` — Documento de Arquitetura.
- `decision-log.md` — Log cronológico de decisões pequenas/médias.

**Regras BR profundas:**
- `LGPD-006` a `LGPD-010` — incidente/ANPD 72h, base legal explícita, RIPD, DPO, decisão automatizada art. 20.
- `FISCAL-001` a `FISCAL-007` — imutabilidade NF-e, certificado por tenant, homologação, contingência, CNPJ alfanumérico, Reforma Tributária, obrigação acessória.

**CLI (`bin/install.js`):**
- Comandos novos: `update`, `doctor`, `uninstall`.
- Flags: `--yes`/`-y`, `--force`, `--dry-run`.
- Resumo final consolidado (em vez de 50 linhas amarelas).
- Detecção de Cursor, Windsurf, Continue, Aider além do Claude Code.
- Backup automático em `.bak` antes de sobrescrever em `update`.
- Preserva customizações do usuário em `update` e `uninstall` (AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md, settings.local.json, .mcp.json).
- Erro claro se sem TTY e sem `--yes` (não trava em CI).

**Validação e CI:**
- `tools/validar-templates.js` — audita frontmatter, refs, JSON, package.json.
- `test/install.test.js` — smoke test (install → arquivos → doctor → reinstall → uninstall preserva).
- `.github/workflows/validar.yml` — 4 jobs (validar templates, hooks 35 casos, smoke install, skills Python).

**Docs novos:**
- `FAQ.md` — perguntas frequentes.
- `TROUBLESHOOTING.md` — erros e soluções.
- `EXEMPLO-FEATURE-COMPLETA.md` — transcrição realista de `/feature`.
- `COMO-FUNCIONA.md` — estrutura + fluxo dos comandos.
- `MIGRACAO-BMAD.md` — guia pra migrar do BMAD-METHOD.
- `CASOS-DE-USO-BR.md` — NF-e, telemedicina, Pix, eSocial, e-commerce, EAD, Open Finance.
- `ARQUITETURA.md` — como o framework está organizado.

**Addons:**
- `addons/README.md` — schema `addon.yaml`, como instalar/criar.
- `addons/electron-br/` — primeiro addon de referência (agente `electron-arch`, hook `block-ipc-without-validation`, skill `migration-sqlite-segura`, regras `ELECTRON-001..003`).

**Agentes reforçados:**
- `gerente-produto` — 4 modos (brief, PRD, story, decomposição), salva em disco.
- `tech-lead` — checklist de "Implementation Readiness" + documento de arquitetura vivo.
- `dev-senior` — disciplina TDD explícita para lógica crítica.

### Corrigido
- **Bug crítico:** skill `validar-cpf-cnpj` não suportava CNPJ alfanumérico (vigor jul/2026 — IN RFB 2.229/2024). Algoritmo agora usa `ord(c) - 48`, mantém retrocompatibilidade com CNPJ numérico.

### Mudado
- Hook `_test-runner.sh` agora cobre 35 casos (era 22) incluindo os 5 hooks novos.
- Hooks `_test-runner.sh` mantém ordem retrocompatível mas adiciona seção dos novos no final.
- README reescrito com tabela de hooks/agents/skills + diferencial vs BMAD detalhado.

### Não mudado (compatibilidade)
- `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md` na raiz do projeto do usuário continuam preservados em `update` e `uninstall`.
- IDs antigos (`INV-001..006`, `SEC-001..004`, `TST-001..003`, `LGPD-001..005`, `INV-AGENT-001..006`) continuam válidos.

## [0.2.0] — 2026-05-17

### Adicionado
- 8 agentes iniciais (investigador, PM, tech-lead, dev-senior, revisor, 3 auditores).
- 5 hooks (anti-mascaramento, block-destructive, secrets-scanner, paths-frontmatter-validator, context-budget) + `_test-runner.sh`.
- 5 workflows (`/inicio`, `/feature`, `/bug`, `/refactor`, `/auditoria`).
- 3 skills BR (gerar-adr-pt-br, traduzir-jargao, validar-cpf-cnpj).
- Constituição (6 princípios) + REGRAS-INEGOCIAVEIS com IDs.
- CLI `bin/install.js` básico.
- Hook `regra-zero-reminder` (UserPromptSubmit).
- Doc inicial (README, QUICKSTART, MCP-GUIA-BR, PUBLICAR).
