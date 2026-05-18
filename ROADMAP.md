---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# ROADMAP — ROLDAO-METHOD

> Roadmap público do que vem por aí. Não é promessa contratual — é direção. Reabra issue se precisa de algo que não está aqui.

## Versão atual: v0.4.0 (mai/2026)

Pacote sólido pós-auditoria comparativa com BMAD-METHOD:
- 11 agentes especialistas
- 11 workflows (+ `/quick-dev` para mudanças triviais)
- 10 hooks bloqueadores + 5 auxiliares
- 6 skills BR no core + skills adicionais via addons
- 5 checklists (story-dod, architecture-readiness, fiscal-compliance, lgpd-privacy-review, pm-readiness)
- 5 knowledge bases (PT-BR, fiscal, LGPD, Pix, stack-br)
- 4 addons (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br)
- 7 templates de spec (incluindo fullstack-architecture, brownfield-prd, prd-fiscal)

## v0.5.0 — "Marketplace de Addons" (alvo: jul/2026)

- [ ] `npx roldao-method addon install <nome>` — instalador interativo de addon.
- [ ] `npx roldao-method addon list` — lista addons disponíveis (locais + remotos).
- [ ] `npx roldao-method addon update <nome>` — atualiza addon.
- [ ] `npx roldao-method addon uninstall <nome>` — remove preservando customizações.
- [ ] Registry público de addons (manifesto em git público).
- [ ] Convenção formal de addon (schema validado em CI).
- [ ] Tutorial "Como criar seu próprio addon em 30 min".

## v0.6.0 — "Setor saúde + setor público" (alvo: set/2026)

- [ ] Addon `telemedicina` — LGPD Art. 11 + CFM + ANS + receita digital + prescrição assinada.
- [ ] Addon `govtech-br` — APIs do Governo, e-Protocolo, assinatura ICP-Brasil, transparência ativa.
- [ ] Addon `saude-br-completo` — TISS/EDI, ANS, CFM, dado sensível em escala.
- [ ] Skill `consultar-cnpj-receita` — wrapper RFB com cache + LGPD-004.
- [ ] Skill `validar-receita-medica-digital` — ICP-Brasil + CFM.

## v0.7.0 — "Setores produtivos" (alvo: nov/2026)

- [ ] Addon `agro-br` — CAR, nota fiscal de produtor, SISBOV, rastreabilidade.
- [ ] Addon `varejo-br` — PDV, SAT/ECF, NFC-e, controle de estoque.
- [ ] Addon `logistica-br` — CT-e + MDF-e, RNTRC, rastreamento.
- [ ] Addon `educacao-br` — ENADE, e-Docente, histórico escolar.
- [ ] Skill `migration-postgres-segura` — pattern de migration PostgreSQL com lock estudado e backup.

## v0.8.0 — "Open Finance + Fintech avançado" (alvo: jan/2027)

- [ ] Pix Automático completo no addon `fintech-br` (recorrência autorizada).
- [ ] Addon `open-banking-iniciador` — implementação completa de ITP (Iniciadora de Pagamento).
- [ ] Skill `gerar-relatorio-bacen` — relatórios obrigatórios pra fintechs.
- [ ] Addon `esocial-completo` — todos os eventos S-1000 a S-3000.

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
- [ ] Cline (`.cline`).
- [ ] Roo Code (`.roo`).
- [ ] Gemini CLI.
- [ ] GitHub Copilot Workspace (quando padrão estabilizar).
- [ ] Codex CLI.

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
2. **Não competir com BMAD em escala.** Competir em especialização, qualidade e cobertura regulatória.
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
