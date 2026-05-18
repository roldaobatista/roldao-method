# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.6.0] — 2026-05-18

**Gates mecânicos** — pacote pós-auditoria 10-agentes (terceira rodada). Tornou mecânico o que era convencional: readiness, dependências entre stories e auditores no `/feature`. Sem breaking changes em hooks existentes.

### Corrigido (gaps da auditoria)

- **Gate `/readiness` agora é mecânico, não convencional.** `/feature` ganhou Etapa 0 obrigatória que lê `docs/readiness/EP-NNN-status.md`. Novo hook `require-readiness-before-feature.sh` bloqueia Edit/Write em código de negócio se `status ≠ PRONTO`. `/readiness` agora **sempre** grava o arquivo de status com frontmatter `status: PRONTO|NAO_PRONTO`.
- **Auditores obrigatórios no `/feature`.** Removido "(opcional, mas recomendado pra feature crítica)" da Etapa 6 — os 3 auditores (`auditor-seguranca`, `auditor-qualidade`, `auditor-produto`) rodam **sempre** em paralelo, sem critério de dispensa.
- **`depende-de:` validado mecanicamente.** Novo hook `validate-story-dependencies.sh` lê o frontmatter da US ativa, percorre `depende-de:` e bloqueia se alguma dep não está `status: entregue`. `/sprint.md` documenta o gate.
- **PIX-NNN consolidado no core REGRAS-INEGOCIAVEIS.md.** Adicionados `PIX-001..005` como IDs canônicos citáveis sem o addon instalado. Implementação operacional (hooks, agentes, skills) permanece no addon `fintech-br` com referência explícita.
- **Contagem real de hooks declarada.** Eram "16 bloqueadores + 3 auxiliares" — eram na verdade 14 bloqueadores + 5 auxiliares + 1 test-runner = 20 no core. Pós-v0.6: **16 bloqueadores + 5 auxiliares + 1 test-runner = 22 hooks core** (+5 em addons).
- **Story de exemplo materializada.** `docs/examples/stories/US-001-cadastro-cliente-pj-cnpj-alfa.md` — referência canônica de US preenchida (todos os campos vivos, Dev Agent Record com hooks que dispararam). Resolve achado da auditoria de que `docs/stories/` era só template, sem demonstração viva do output.

### Adicionado

**Hooks (2 novos bloqueadores, total 16):**
- `require-readiness-before-feature.sh` — Edit/Write em código com `/feature` ativo mas sem `docs/readiness/EP-NNN-status.md = PRONTO` → exit 2.
- `validate-story-dependencies.sh` — Edit/Write quando US ativa tem `depende-de:` apontando pra US não-entregue → exit 2.

**Documentação:**
- `docs/examples/README.md` + `docs/examples/stories/US-001-*.md` — exemplos materializados.
- Auditoria documentada em `docs/AUDITORIA-10-AGENTES-2026-05-18.md` (já existia, agora referenciada).

### Test coverage

- `_test-runner.sh` ganhou 9 casos novos cobrindo os 2 hooks adicionados. **59/59 OK** (era 50/50).
- `test/install.test.js` exige os 2 hooks novos — falha se framework instalar sem eles.

## [0.5.0] — 2026-05-18

Entrega completa das 25 ações priorizadas da auditoria 10-agentes (segunda rodada). Sem breaking changes — toda funcionalidade v0.4.0 preservada.

### Corrigido (P0 — bloqueadores)

- **Contagem real de hooks** atualizada em README/ROADMAP/CHANGELOG/CLAUDE.md/package.json: eram **11 bloqueadores + 3 auxiliares + 1 test-runner** (não "10+5" como anunciado).
- **`test/install.test.js`** atualizado pra exigir todos os 14 hooks ativos pré-v0.5 (regressão silenciosa desde v0.3).
- **`addons/lgpd-compliance/templates/`** — criados os 6 templates prometidos no README mas que não existiam: `ripd-modelo.md`, `politica-privacidade.md`, `dpa-operador.md`, `resposta-titular/{acesso,exclusao,portabilidade}.md`.
- **Documentação Git Bash no Windows** — README + TROUBLESHOOTING agora declaram explicitamente que hooks dependem de bash+perl e PowerShell puro não funciona.
- **CI cross-platform** — workflow `validar.yml` agora roda matriz Windows/macOS/Linux pra hooks e instalador.

### Corrigido (hooks bugados)

- `block-destructive.sh` — regex `git push -f` agora casa quando `-f` está no fim da linha.
- `no-amend-after-push.sh` — compara HEAD com `@{u}` em vez de exigir `git fetch` recente.
- `no-test-data-in-fixtures.sh` — reescrito sem substring expansion bash-4-only (roda em bash 3.2).
- `mcp-validator.sh` — allowlist ampliada pra incluir top-20 MCPs reais (Slack, Linear, Brave Search, GitHub, Notion, etc).
- `commit-message-validator.sh` — agora trata commits feitos via editor (sem `-m` inline).
- `fiscal-br-validator.sh` — `tpAmb=1` não dispara em comentário explicativo.

### Adicionado

**Hooks (5 novos bloqueadores, total 16):**
- `block-jargon-pt-br.sh` — detecta "commit", "branch", "deploy" em resposta ao usuário (INV-AGENT-001).
- `block-secrets-in-commit-message.sh` — secret na mensagem do commit (gap do secrets-scanner).
- `block-confirmation-questions.sh` — "quer que eu...?" em resposta (viola INV-AGENT-006).
- `require-investigador-before-fix.sh` — Edit em código de negócio sem investigador quando bug foi reportado (REGRA #0).
- `validate-test-pyramid.sh` — E2E sem unit no mesmo módulo.

**Comandos (7 novos, total 19):**
- `/replanejar` — correct-course quando escopo muda no meio do épico.
- `/sprint` — plano sequencial das próximas N stories com dependências.
- `/status` — progresso em PT-BR sem jargão.
- `/checkpoint` — walkthrough de PR/branch antes de merge.
- `/readiness` — gate entre épico e dev.
- `/help` — catálogo dos comandos com códigos curtos.
- `/shard` — quebra PRD/ARQ longo em chunks navegáveis.

**Agentes (1 novo, total 12):**
- `tech-writer` (Camila 📝) — CHANGELOG, README, docs de release.
- Frontmatter dos 12 agentes expandido com `identity`, `communication_style`, `principles`, `menu`, `skills`. Nomes PT-BR + ícones (Sofia 📋, Bruno 💻, Dona Marta 🧾, etc).

**Skills (2 novas no core, total 8):**
- `brainstormar-ideia` — menu de 15 técnicas BR (Seis Chapéus, SCAMPER, 5 Porquês, Pre-mortem, etc).
- `gerar-test-fixture-br` — gera CPFs/CNPJs/CEPs/E.164 válidos pra mocks.

**Knowledge bases (2 novas, total 7):**
- `kb-brainstorming-pt-br.md` — 15 técnicas adaptadas ao contexto BR.
- `kb-elicitation-pt-br.md` — 10 métodos críticos (Pre-mortem, Stakeholder Round Table, Red/Blue Team, Crítica Socrática, etc).

**Templates (4 novos, total 11):**
- `prfaq.md` — Working Backwards style Amazon em PT-BR.
- `product-brief.md` — brief curto de iniciativa.
- `ux-design.md` — wireframe ASCII + 5 estados por tela.
- `headless-schemas.md` — JSON Schema dos frontmatter de cada template (validação programática).
- **Story estendida** com `Dev Agent Record` (modelo usado, arquivos tocados, hooks bloqueados, custo).
- **PRD expandido** com "Menu de Adaptação por Domínio" (SaaS B2B, mobile consumer, sistema regulado, CLI/lib).

**Checklists (2 novos, total 7):**
- `release-readiness.md` — gates pré-deploy.
- `pix-compliance.md` — checklist Pix completo (Bacen Resolução 1, MED, devolução, HMAC).

**Addons (2 novos, total 6):**
- `esocial-completo` — eventos S-1000 a S-3000, CIPA, NRs, prazo legal, retificação.
- `varejo-pdv-br` — SAT-CF-e, NFC-e, TEF, MFE-CE, ECF, integração com balança/impressora.

**CLI (`bin/install.js`):**
- `add <addon>` — instala addon com `doctor` reconhecendo.
- `list` — lista IDEs detectadas + addons disponíveis + versão atual vs remota.
- Update check assíncrono via `https://registry.npmjs.org/roldao-method/latest`.
- Wizard interativo (readline puro com menu numerado) na primeira instalação: escolha de IDE + perfil (web/electron/fiscal/fintech/LGPD-strict) + addons.
- Alias bin `roldao` (curto) além de `roldao-method`.

**Adapters reais de IDE:**
- `templates/.cursor/` — regras em `.cursorrules` + agentes traduzidos pra prompt
- `templates/.windsurf/` — `.windsurfrules` + commands
- `templates/.cline/` — `.clinerules` + agents YAML
- `templates/.roo/` — formato Roo Code
- `templates/.continue/` — formato Continue
- `templates/.aider/` — `.aider.conf.yml` + convenções

**Governança e distribuição:**
- `SECURITY.md` — política de divulgação responsável.
- `CONTRIBUTORS.md` — créditos e processo de PR.
- `.claude-plugin/plugin.json` — distribuição como plugin nativo Claude Code.

**Evals:**
- `evals/` — testes de qualidade dos 12 agentes (input → resposta esperada).
- CI obrigatório.

**Orquestração:**
- `_meta/skills-index.csv` — `skill,phase,preceded-by,followed-by,required,outputs` (modelo BMAD `bmad-help.csv`).

**Skills — correção:**
- `validar-pix/scripts/validar-pix.py` — path hardcoded substituído por embedding da lógica de CPF/CNPJ (sem `sys.path` frágil).

**KBs — correções de conteúdo:**
- `kb-pix.md`: TxId restrito a `[A-Za-z0-9]{1,35}` conforme Manual Pix Bacen.
- `kb-fiscal.md`: DIRF — citado prazo final (extinta para fatos geradores ≥ 2025).
- `kb-fiscal.md`: cancelamento NF-e — citada exceção SEFAZ-SP (extensão em casos específicos).

### Mudado

- README reescrito: hero com "Por que ROLDAO vs BMAD" no topo, bloco "Novidades v0.5.0", contagens corrigidas, nomes+ícones dos agentes, tabela vs BMAD expandida com 24 dimensões.
- Badge "Hooks: 50/50" renomeado pra "test_runner: 50/50" + badge novo "hooks_bloqueadores: 16".
- ROADMAP marcado como v0.5.0 entregue; metas v0.6+ ajustadas.
- `package.json`: bin alias `roldao`, description atualizada, `files` inclui evals/SECURITY/CONTRIBUTORS.

### Preservado

Zero breaking change. Toda funcionalidade da v0.4.0 mantida. Customizações do usuário continuam protegidas no `update`.

## [0.4.0] — 2026-05-18

Expansão pós-auditoria comparativa profunda com BMAD-METHOD (10 agentes em paralelo, segunda rodada). Foco em fechar gaps de qualidade auditável, knowledge base estruturada, addons especializados BR, e melhorias de DX no CLI. Sem breaking changes.

### Adicionado

**Comandos (1 novo, total 12):**
- `/quick-dev` — atalho explícito para mudanças triviais (≤ 3 arquivos, ≤ 50 linhas). Pula investigador + auditores. Mantém disciplina sem erosão silenciosa do `/feature`.

**Hooks bloqueadores (3 novos, total 10 bloqueadores + 5 auxiliares):**
- `no-test-data-in-fixtures.sh` — bloqueia CPF/email/telefone de provedor real em fixture/seed/test (TST-004).
- `no-hardcoded-env-urls.sh` — bloqueia URL de SEFAZ, Pix Bacen, gateways pagos, OpenAI/Anthropic hardcoded em código (SEC-005).
- `fiscal-br-validator.sh` — bloqueia ambiente SEFAZ=1 hardcoded, senha de certificado em texto puro, regex CNPJ apenas numérica (FISCAL-001/002/003/005).

**Regras inegociáveis novas:**
- `SEC-005` — URLs/hosts de serviço externo via variável de ambiente, nunca hardcoded.
- `TST-004` — Dados de teste sempre sintéticos (sem CPF/email/telefone real em fixture).

**Checklists auditáveis (5 novos em `templates/.specify/checklists/`):**
- `story-dod.md` — Definition of Done de user story.
- `architecture-readiness.md` — quality gate de ADR / iniciativa grande.
- `fiscal-compliance.md` — compliance NF-e/NFS-e + Reforma Tributária.
- `lgpd-privacy-review.md` — review LGPD de feature com dado pessoal.
- `pm-readiness.md` — PRD pronto pra dev.

**Knowledge bases (5 novos em `templates/.specify/data/`):**
- `kb-pt-br.md` — glossário PT-BR + tabela de tradução de jargão.
- `kb-fiscal.md` — NF-e/NFS-e/NFC-e/CT-e, ambientes SEFAZ, Reforma Tributária 2026-2033, CNPJ alfanumérico.
- `kb-lgpd.md` — bases legais Art. 7/11, direitos do titular, RIPD, incidente 72h, sanções, anti-padrões.
- `kb-pix.md` — 5 tipos de chave, EndToEndId, TxId, BR Code EMV, Open Finance, DICT.
- `kb-stack-br.md` — stack recomendada BR, anti-padrões de locale/fuso/moeda.

**Templates de spec (3 novos em `templates/.specify/templates/`):**
- `fullstack-architecture.md` — arquitetura completa frontend + backend + banco + integrações.
- `brownfield-prd.md` — PRD para projeto legado (com seções de débito técnico, breaking changes, migração).
- `prd-fiscal.md` — PRD para iniciativa fiscal com compliance NF-e + Reforma.

**Addons BR (3 novos, total 4):**
- `fiscal-br-completo` — agente `nfe-arch`, hook `require-sefaz-env`, skills `emitir-nfe-55` + `validar-cnpj-alfanumerico`, regras NFE-001/002/003.
- `lgpd-compliance` — agente `dpo-virtual`, command `/lgpd-audit`, skills `gerar-ripd` + `gerar-canal-dpo` + `resposta-titular`, regras LGPD-EXT-001/002.
- `fintech-br` — agente `pix-arch`, hook `validate-webhook-signature`, skills `gerar-br-code` + `validar-webhook-pix` + `estruturar-open-finance`, regras PIX-001/002/003.

**CLI (`bin/install.js`):**
- Cores ANSI puras (sem nova dependência — `--no-color` ou `NO_COLOR=1` desativa).
- Banner do framework em comandos interativos.
- Suporte a `.cline` (Cline) e `.roo` (Roo) na detecção de IDE.
- Mensagens com hierarquia visual (✓ verde para sucesso, ⚠ amarelo para opcional, ✗ vermelho para erro).
- `doctor` checa arquivos opcionais novos (v0.4.0+) sem falhar a verificação.

**Documentação:**
- `ROADMAP.md` — roadmap público até v1.0.0 (abr/2027).
- `docs/AUDITORIA-BMAD-2026-05-18.md` — auditoria comparativa de 10 dimensões.
- README atualizado: tabela vs BMAD expandida (20 dimensões), diagrama ASCII do fluxo `/feature`, lista de 4 addons.

**Tests:**
- `_test-runner.sh` agora tem 50 casos (era 35) — cobertura dos 3 hooks novos.

### Mudado

- `_test-runner` agora tem 50 casos (era 35). Todos passando.
- README: badge de versão atualizado, badge de hooks atualizado (35→50), badge novo de addons (4).
- `REGRAS-INEGOCIAVEIS.md` documenta SEC-005 e TST-004.

### Preservado

Zero breaking change. Toda funcionalidade da v0.3.0 mantida intacta. Customizações do usuário (`AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`, `.claude/settings.local.json`, `.mcp.json`) continuam protegidas no `update`.

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
