---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# ROADMAP — ROLDAO-METHOD

> Roadmap público do que vem por aí. Não é promessa contratual — é direção. Reabra issue se precisa de algo que não está aqui.

## Versão atual: v0.15.0 (mai/2026)

Pacote pós auditoria **10-agentes vs documentação oficial Claude Code** (`code.claude.com/docs`): 10 dimensões cruzadas (subagents, hooks, slash commands, memory, skills, settings/permissions, MCP, output styles/status line, SDK/headless, plan mode/worktrees), **todos os achados resolvidos** nesta release. Histórico cumulativo (round 10 — v0.14.4 fechou P0; v0.14.5 fechou P2 estruturais; v0.14.6 fechou cobertura de addons e adapters; v0.15.0 fecha paridade com a doc oficial):
- 14 agentes especialistas (com nome + ícone)
- 22 workflows (incluindo `/clarificar`, `/consistencia`, `/replanejar`, `/sprint`, `/status`, `/checkpoint`, `/readiness`, `/help`, `/shard`, `/quick-dev`, `/release`)
- 26 hooks bloqueadores (23 via `exit 2` + 3 via JSON `decision:block`) + 2 soft warnings + 5 lifecycle/automação + 2 infra (`_lib.sh`, `_test-runner.sh`) = **35 arquivos no core** (+5 em addons). Evolução: v0.6 readiness+dependencies; v0.7 agent-sequence+quick-dev-scope; v0.8 checkpoint+auditors+story-approvals+sanitização PROJDIR; v0.9 hooks Node 18 check+UTF-8 skills Python; v0.10 install seletivo+adapters Cline/Aider/Roo na raiz+SHA-256 NF-e+TxId Pix+Art. 7 V LGPD; v0.13 paridade SDD + Gemini/Codex; v0.14 hardening cumulativo + regex de secrets cobrindo `sk-proj-*`/`github_pat_`/PEM PKCS8 + path traversal blindado em `remove <addon>`; v0.15 lifecycle hooks (PostToolUse/SubagentStop/PreCompact/SessionEnd) + 3 hooks JSON `decision:block` (jargão, confirmação, pipeline).
- 12 skills BR no core + 16 nos addons = **28 skills** (inclui `calculadora-reforma-paralela`)
- 8 checklists (story-dod, architecture-readiness, fiscal-compliance, lgpd-privacy-review, pm-readiness, release-readiness, pix-compliance, audit-trail)
- 7 knowledge bases (PT-BR, fiscal, LGPD, Pix, stack-br, brainstorming, elicitation)
- 6 addons (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br)
- **12 templates de spec** (PRD, story, architecture, brownfield-prd, prd-fiscal, fullstack-architecture, decision-log, prfaq, product-brief, ux-design, headless-schemas, épico)
- CLI completo: `add`, `remove`, `search`, `list`, `tasks-to-issues`, update check, wizard, alias `roldao`, **`--adapters` / `--all-adapters`** (instala seletivo)
- Overrides por projeto sem fork (`.specify/overrides/`) + adapters Gemini CLI/Codex CLI = **9 IDEs**
- **Adapters Cline/Aider/Roo** com paths corretos (`.clinerules`, `.aider.conf.yml`, `.roorules` na raiz — antes ficavam em subpastas inertes)
- **161/161 testes** (hooks) + suíte de install ampliada (paridade SDD, overrides, adapters Gemini/Codex)
- CI matriz Windows/macOS/Linux
- Governança (SECURITY.md, CONTRIBUTORS.md, `.claude-plugin/plugin.json`)
- Suite de evals (lint estrutural) dos agentes — cobertura parcial, ver `evals/README.md`

## Rodadas de auditoria entregues

- **v0.5.0** "Marketplace de Addons" — `add`, `list`, schema, wizard.
- **v0.6.0** "Gates mecânicos" — readiness, dependências, auditores obrigatórios.
- **v0.7.0** "Pipeline Sofia/Detetive/Rafael" — agent-sequence, quick-dev-scope, T-NNN no commit.
- **v0.8.0** "Audit trail" — checkpoint/auditores como exit 2, story-approvals persistente, EP-NNN.md dedicado.
- **v0.9.0** "Hardening" — sanitização PROJDIR, Node 18 check, Windows shell warning, encoding UTF-8 skills.
- **v0.10.0** "Adapters multi-IDE reais + correção regulatória" — paths Cline/Aider/Roo, install seletivo, LGPD Art. 7 V, SHA-256 NF-e, TxId Pix.
- **v0.11.0** "Auditoria round 6 sem viés (P0)" — P0 + ondas 1/2 fechados, 132/132.
- **v0.12.0** "Round 6 ondas 3–6" — P1/P2 fechados, checklist audit-trail, 147/147.
- **v0.13.0** "Paridade SDD" — `/consistencia`, `/clarificar`, `remove`/`search`/`tasks-to-issues`, overrides sem fork, adapters Gemini/Codex CLI, constituição indexável. 147/147.
- **v0.13.1** "Auditoria round 7" — REGRA #0 destravada no `/bug`, hash de sessão consistente, CNPJ base repetida, hooks de segurança endurecidos, imprecisões legais eSocial/LGPD, `test/` no pacote, deriva de versão sincronizada. 147/147.
- **v0.14.0** "Paridade adapters sem hooks" — sequência obrigatória de agentes nos 7 adapters sem hooks (texto reforça o que o hook bloqueia em Claude Code).
- **v0.14.1** "Regressões round 8" — 8 testes de regressão dos furos da round 8 (147 → 155).
- **v0.14.2** "Débito + precisão jurídica round 8" — texto de regulação alinhado a fonte primária.
- **v0.14.3** "Varredura final round 9" — P1/P2/P3 não retomados (precisão jurídica de Pix/LGPD/eSocial; CNPJ alfanumérico corrigido onde divergia do validador oficial). 161/161.
- **v0.14.4** "Auditoria round 10 — P0" — path traversal blindado em `remove <addon>`, regex de secrets cobrindo `sk-proj-*`, `github_pat_*` real, PEM PKCS8; contagem de testes consistente (`EXPECTED_TOTAL=161`); docs em paridade com release (versão, contagens, badges dinâmicos npm).
- **v0.14.5** "Auditoria round 10 — P2" — evals modo live (chama API Anthropic se `ANTHROPIC_API_KEY`); job CI `empacotamento` (`npm pack --dry-run` + sanidade tamanho/conteúdo); E2E hooks no `install.test.js` (invoca `block-destructive.sh` recém-instalado com input real); `docs/REGRESSIONS.md` rastreando evolução do `EXPECTED_TOTAL`; requisitos Perl/Python explícitos no README; `docs/PUBLICAR.md` obsoleto removido; `main` em `package.json`.
- **v0.14.6** "Auditoria round 10 — cobertura addons/adapters" — `test/addons.test.js` (97 checagens: 6 addons, YAML/refs/smoke dos hooks); `test/adapters.test.js` (53 checagens: 8 adapters, conteúdo — REGRA #0, sequência, anti-mascaramento, PT-BR); `.aider.conf.yml` ganhou resumo da sequência obrigatória (gap pego pelo novo teste); `skills.test.js` detecta `py` (Python Launcher Windows); `TROUBLESHOOTING.md` com instruções Python/Perl passo-a-passo.
- **v0.15.0** "Paridade com doc oficial Claude Code" — auditoria 10-agentes vs `code.claude.com/docs` em paralelo nas 10 dimensões da harness. Fechou: status line nativa PT-BR; 2 output styles especializados (`dpo-lgpd`, `fiscal-br`); 4 hooks lifecycle (`PostToolUse` auto-format, `SubagentStop` audit, `PreCompact`/`SessionEnd` snapshot, `SessionStart` restore); `defaultMode: acceptEdits` + `permissions.ask` + deny de certificados A1/A3; 22 commands com `allowed-tools` + model seletivo (opus/sonnet/haiku); 18 agentes com `model: inherit`; 4 skills Python com `allowed-tools`; 4 presets MCP BR (Asaas, Focus NFe, Omie, Postgres read-only) + allowlist com 30+ fornecedores BR; 2 GitHub Action workflows PT-BR (review @claude e LGPD headless); `CLAUDE.md` com `@import` REGRAS-INEGOCIAVEIS + rules; `docs/PLAN-MODE-E-SESSOES.md`; `CLAUDE.local.md.example`. **161 → 167 testes**.

## Próximas releases

## v0.16.0 — "Setor saúde + setor público" (alvo: set/2026)

- [ ] Addon `telemedicina` — **Definição de pronto:** ≥3 agentes (médico-relator, dpo-saúde, fiscal-saúde), ≥4 hooks (consentimento Art. 11, log de acesso PHI, anonimização export, retention CFM), ≥3 skills (validar-CRM, gerar-receita-digital-assinada, validar-CID-10), ≥12 testes verdes.
- [ ] Addon `govtech-br` — **Definição de pronto:** ≥2 agentes (proc-public, transparência-ativa), ≥3 hooks (LAI-prazo, assinatura ICP-Brasil obrigatória, e-Protocolo no fluxo), ≥3 skills (validar-CPF-funcionário, gerar-protocolo, consultar-e-CAC), ≥10 testes verdes.
- [ ] Addon `saude-br-completo` — **Definição de pronto:** suporte TISS 4.x + EDI ANS, ≥3 hooks (TUSS obrigatório, prontuário CFM 1.821 mínimo, dado sensível em escala = RIPD), ≥10 testes verdes.
- [ ] Skill `consultar-cnpj-receita` — **Definição de pronto:** wrapper RFB com cache 24h, LGPD-004 (auditado), fallback offline com dados sintéticos pra teste, 4 testes verdes.
- [ ] Skill `validar-receita-medica-digital` — **Definição de pronto:** valida assinatura ICP-Brasil + carimbo de tempo + CRM ativo, 5 testes verdes.

## v0.17.0 — "Setores produtivos" (alvo: nov/2026)

- [ ] Addon `agro-br` — **Definição de pronto:** ≥2 agentes (rural-fiscal, rastreabilidade), ≥3 hooks (CAR obrigatório em pessoa-rural, SISBOV em bovino, nota fiscal de produtor com IE rural), ≥3 skills (validar-CAR, validar-SISBOV, calcular-funrural), ≥10 testes verdes.
- [ ] Addon `logistica-br` — **Definição de pronto:** CT-e 4.0 + MDF-e 3.0, ≥4 hooks (RNTRC obrigatório, MDF-e antes do tráfego, CT-e por trecho, CIOT em sub-contratação), ≥10 testes verdes.
- [ ] Addon `educacao-br` — **Definição de pronto:** ENADE/SISTEC/Censo MEC, ≥3 hooks (matrícula INEP obrigatória, histórico CONAES, e-Docente sincronizado), ≥10 testes verdes.
- [ ] Skill `migration-postgres-segura` — **Definição de pronto:** detecta lock longo, valida backup ≤24h, gera DDL com `CONCURRENTLY` quando aplicável, 6 testes verdes.

## v0.18.0 — "Open Finance + Fintech avançado" (alvo: jan/2027)

- [ ] Pix Automático no addon `fintech-br` — **Definição de pronto:** suporte a recorrência autorizada (Resolução BCB 80/2021 atualizada), 2 hooks novos (recorrência precisa contrato, cancelamento sob pedido), ≥8 testes verdes.
- [ ] Addon `open-banking-iniciador` — **Definição de pronto:** fluxo ITP completo (consent → autorização → SCA → pagamento), ≥3 hooks (consent expirado bloqueia, SCA obrigatório, idempotência por ConsentId), ≥10 testes verdes.
- [ ] Skill `gerar-relatorio-bacen` — **Definição de pronto:** cobre DLO, SCR, IF.DATA, 3 testes verdes com fixture validada.
- [ ] eSocial S-3000 (exclusão) — **Definição de pronto:** evento gerado + XML válido + assinatura + retransmissão, 4 testes verdes.

## v1.0.0 — "Estabilidade + comunidade" (alvo: abr/2027)

Pré-requisitos técnicos (controláveis pelo time):
- [ ] Pacote publicado no npm com ≥6 meses sem breaking change em minor.
- [ ] `bin/install.js` modularizado com ≥80% de cobertura de teste unitário.
- [ ] Documentação completa em pt-BR + en (com `tools/sincronizar-traducao.js --check`).
- [ ] RFC process estabelecido (`docs/RFC-PROCESS.md` + template em `.specify/templates/`).
- [ ] Skill `validar-chave-acesso-nfe` no core.
- [ ] Test runner com ≥300 casos cobertos.

Sinais de tração (dependem da comunidade — separados pra não bloquear release técnica):
- [ ] Pelo menos 3 cases de uso público (empresas usando, autorizado a citar).
- [ ] 10+ contribuidores externos com PR merged.
- [ ] Discord ativo (>500 membros).
- [ ] 1 conferência apresentando o método (The Developers Conference, BrasilJS, RustConf BR).

## Pendências contínuas (sem versão alvo)

### Documentação
- [ ] Vídeo demo 5 min em PT-BR no YouTube.
- [ ] Diagramas SVG dos fluxos `/feature`, `/bug`, `/brownfield`.
- [ ] Casos de sucesso reais (precisa autorização de cliente).
- [ ] Guia "ROLDAO-METHOD pra times de PME" (versão executiva).

### Suporte a mais IDEs
- [x] Cline (`.clinerules` na raiz — v0.10.0).
- [x] Roo Code (`.roorules` na raiz — v0.10.0).
- [x] Gemini CLI (`GEMINI.md` na raiz — v0.13.0).
- [x] Codex CLI (`.codex/instructions.md` + `AGENTS.md` nativo — v0.13.0).
- [ ] GitHub Copilot Workspace (quando padrão estabilizar).

### Ferramentas
- [ ] `npx roldao-method doctor --fix` — corrige problemas detectados automaticamente.
- [ ] `npx roldao-method audit` — audita projeto contra regras inegociáveis.
- [ ] Hook em GitHub Actions: validador de AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md.
- [ ] Plugin VS Code com snippets dos templates.

### Comunidade
- [ ] Discord oficial.
- [ ] Newsletter mensal sobre regulação BR + atualizações do framework.
- [ ] Programa de "early adopter" (acesso a addons em desenvolvimento).
- [ ] Sponsorship via GitHub Sponsors / Open Collective.

## Princípios do roadmap

1. **PT-BR e BR-first sempre.** Tradução para inglês quando houver tração internacional, nunca antes.
2. **Especialização vence escala.** Foco em qualidade vertical e cobertura regulatória BR, não em paridade horizontal global.
3. **Hooks bloqueadores são identidade.** Nenhum hook crítico vira opcional.
4. **Addons antes de tudo no core.** Antes de adicionar agente/skill no framework, perguntar: "Isso é addon?".
5. **Quality gates antes de quantidade.** Melhor ter 10 skills sólidas que 50 medíocres.

## Como influenciar o roadmap

- **Issues abertos**: <https://github.com/roldaobatista/roldao-method/issues>
- **Discussions**: <https://github.com/roldaobatista/roldao-method/discussions>
- **Pull requests** de addons-piloto são bem-vindos — abra discussion antes pra alinhar escopo.

## Não é roadmap, é antigoal

O que **NÃO** está no plano:

- ❌ Não vamos virar runtime de IA — somos framework, dependemos de Claude Code / Cursor / Windsurf.
- ❌ Não vamos virar editor / IDE.
- ❌ Não vamos cobrar pelo core — sempre será MIT.
- ❌ Não vamos virar consultoria — framework é produto, consultoria é outra empresa.
- ❌ Não vamos suportar idiomas além de PT-BR no core (addons podem traduzir).
- ❌ Não vamos certificar conformidade legal — orientamos, não certificamos.
