---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# ROADMAP — ROLDAO-METHOD

> Roadmap público do que vem por aí. Não é promessa contratual — é direção. Reabra issue se precisa de algo que não está aqui.

## Versão atual: v0.14.4 (mai/2026)

Pacote pós **sucessivas** rodadas de auditoria 10-agentes (round 10 — v0.14.4 — P0 de segurança + P0 de docs zerados):
- 12 agentes especialistas (com nome + ícone)
- 22 workflows (incluindo `/clarificar`, `/consistencia`, `/replanejar`, `/sprint`, `/status`, `/checkpoint`, `/readiness`, `/help`, `/shard`, `/quick-dev`, `/release`)
- 22 hooks bloqueadores + 4 auxiliares + 2 infra (`_lib.sh`, `_test-runner.sh`) = **28 arquivos no core** (+5 em addons). Evolução: v0.6 readiness+dependencies; v0.7 agent-sequence+quick-dev-scope; v0.8 checkpoint+auditors+story-approvals+sanitização PROJDIR; v0.9 hooks Node 18 check+UTF-8 skills Python; v0.10 install seletivo+adapters Cline/Aider/Roo na raiz+SHA-256 NF-e+TxId Pix+Art. 7 V LGPD; v0.13 paridade SDD + Gemini/Codex; v0.14 hardening cumulativo + regex de secrets cobrindo `sk-proj-*`/`github_pat_`/PEM PKCS8 + path traversal blindado em `remove <addon>`.
- 8 skills BR no core + 14 nos addons = **22 skills**
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
- **v0.14.4** "Auditoria round 10" — path traversal blindado em `remove <addon>`, regex de secrets cobrindo `sk-proj-*`, `github_pat_*` real, PEM PKCS8; contagem de testes consistente (`EXPECTED_TOTAL=161`); docs em paridade com release (versão, contagens, badges dinâmicos npm).

## Próximas releases

## v0.14.0 — "Setor saúde + setor público" (alvo: set/2026)

- [ ] Addon `telemedicina` — LGPD Art. 11 + CFM + ANS + receita digital + prescrição assinada.
- [ ] Addon `govtech-br` — APIs do Governo, e-Protocolo, assinatura ICP-Brasil, transparência ativa.
- [ ] Addon `saude-br-completo` — TISS/EDI, ANS, CFM, dado sensível em escala.
- [ ] Skill `consultar-cnpj-receita` — wrapper RFB com cache + LGPD-004.
- [ ] Skill `validar-receita-medica-digital` — ICP-Brasil + CFM.

## v0.15.0 — "Setores produtivos" (alvo: nov/2026)

- [ ] Addon `agro-br` — CAR, nota fiscal de produtor, SISBOV, rastreabilidade.
- [ ] Addon `logistica-br` — CT-e + MDF-e, RNTRC, rastreamento.
- [ ] Addon `educacao-br` — ENADE, e-Docente, histórico escolar.
- [ ] Skill `migration-postgres-segura` — pattern de migration PostgreSQL com lock estudado e backup.

## v0.16.0 — "Open Finance + Fintech avançado" (alvo: jan/2027)

- [ ] Pix Automático completo no addon `fintech-br` (recorrência autorizada).
- [ ] Addon `open-banking-iniciador` — implementação completa de ITP (Iniciadora de Pagamento).
- [ ] Skill `gerar-relatorio-bacen` — relatórios obrigatórios pra fintechs.
- [ ] eSocial S-3000 (exclusão) completo.

## v1.0.0 — "Estabilidade + comunidade" (alvo: abr/2027)

Pré-requisitos para 1.0:
- [ ] Pacote publicado no npm e estável (sem breaking change em minor).
- [ ] Pelo menos 3 cases de uso público (empresas usando, autorizado a citar).
- [ ] 10+ contribuidores externos.
- [ ] Discord ativo (>500 membros).
- [ ] Documentação completa em pt-BR + en (tradução automática mantida).
- [ ] 1 conferência apresentando o método (RustConf BR, The Developers Conference, Brasil JS).
- [ ] RFC process estabelecido.

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
