---
owner: roldao
revisado-em: 2026-05-27
idioma: pt-BR
status: stable
limite-linhas: 80
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: nao-aplica.md (RAIZ) do projeto-exemplo tempo-cli.
proposito: registrar tudo do método canônico que NÃO se aplica a um CLI Rust solo.
nota: existe um espelho em docs/nao-aplica.md para o INDICE da pasta docs/.
-->

# Não aplica — tempo-cli

> O que este projeto deliberadamente NÃO faz da estrutura canônica do método, e quando reavaliar.

## Regras de uso

- Toda entrada exige evidência concreta.
- Toda entrada exige `revalidacao-em` (data concreta).
- Toda entrada exige `responsavel-revalidacao`.
- Gatilho de reavaliação é **evento observável**, não "talvez no futuro".

## Tabela de exceções

| Camada / Artefato | Não aplica porque | Evidência | Responsável | Revalidação em | Reavaliar quando |
|---|---|---|---|---|---|
| C5 — Faseamento formal (`docs/faseamento/`, `kickoff-fase.md`) | Projeto solo, 1 dev. Backlog cabe em Issues do GitHub marcadas com label `next`. Cerimônia de fase é overhead sem ganho. | Repositório usa só labels `now`, `next`, `later`. Sem pasta `docs/faseamento/`. | roldao | 2026-11-27 | Entrar 2º colaborador OU passar de 50 issues abertas. |
| C6 — Conformidade LGPD (`docs/lgpd/`, ROPA, plano de incidente, DPO) | Projeto não trata dado pessoal de terceiros. Dado do próprio dono no próprio computador dele = uso pessoal, fora do escopo da LGPD (Art. 4, II — tratamento por pessoa natural para fins exclusivamente particulares). ROPA (*Record of Processing Activities*, exigido pelo Art. 37 da LGPD) só faz sentido quando há operação de tratamento a registrar. | Schema do banco (`migrations/001-initial.sql`) tem só campos técnicos: `task_name`, `start_at`, `stop_at`, `tag`. Não há campo de identidade de outra pessoa. Sem servidor recebendo dados. | roldao | 2026-11-27 | Implementar sincronização com serviço de terceiros (Toggl) que envolva dados de outros usuários (ex: relatórios de equipe). Nesse momento abrir `docs/lgpd/ROPA.md` e plano de incidente. |
| C7 — Catálogo de auditores em escala (`docs/governanca/catalogo-auditores.md`) | Projeto solo: 1 auditor humano (o próprio dono). Subagentes IA são gatilhados via Claude Code conforme necessidade, sem catálogo formal. | Único revisor de PR é `@roldao` (definido no `CODEOWNERS` global `* @roldao`). | roldao | 2026-11-27 | Entrar 2º revisor humano OU criar 2º subagente especializado (ex: `auditor-rust-perf`). |
| C8 — Partes operacionais 24/7: on-call (`on-call.md`), SLO/SLI (`slo-sli.md`), change-management (`change-management.md`), runbooks de produção | Programa de usuário (CLI desktop) não tem SLA, não tem produção 24/7, não tem cliente pagante esperando uptime. Quebra em release nova = usuário fica em release anterior até o `cargo install --force` ou novo binário sair. | Não há servidor. Distribuição é via `cargo install` e GitHub Releases — usuário escolhe quando atualizar. Sem dashboards de saúde. Sem pager. | roldao | 2027-05-27 | Lançar serviço hospedado próprio (não Toggl-como-cliente) com cliente pagante esperando SLA. |
| C0 — `CONTRIBUTING.md` | Sem colaborador externo no horizonte. AGENTS.md cobre quem vai trabalhar (o dono + IA). | Repositório público mas sem PRs externos abertos. | roldao | 2026-11-27 | Chegada do 1º PR externo. |
| C0 — `docs/glossario.md` com ≥20 termos | Domínio é trivial (tempo, tarefa, sessão, tag, relatório). Cabe na tabela 2.A da INV-AGENT-010 + comentários no código. | `REGRAS-INEGOCIAVEIS.md` §2.A cobre o jargão técnico. Domínio "tempo gasto em tarefa" não tem jargão de negócio. | roldao | 2027-05-27 | Adicionar conceitos de domínio não-óbvios (ex: integração com sistema de billing, conceito de "billable vs non-billable", projeto/cliente). |
| C0 — `docs/PRD.md` | Visão de produto cabe no `README.md` + `docs/descoberta/problema.md`. Sem múltiplos módulos para priorizar. | Único "módulo" é o CLI. Funcionalidades vivem como Issues. | roldao | 2027-05-27 | Adicionar 2º módulo (ex: TUI interativa, integração Toggl como módulo separado). |
| C0 — Multi-tenant (INV-001, INV-TENANT-001) | 1 instalação = 1 usuário. Sem banco compartilhado. Cada usuário tem o próprio `~/.tempo-cli/db.sqlite`. | Código não tem coluna `tenant_id` em nenhuma tabela; conexão SQLite usa caminho fixo no home do usuário. | roldao | nunca (decisão de design, não temporária) | Mudar modelo de produto para SaaS hospedado (seria projeto novo, não evolução deste). |
| C0 — INV-AGENT-008 (PII em logs) | Não há PII de terceiros. O nome da tarefa que o dono digita é dado dele mesmo, no log dele mesmo. Risco zero de vazamento entre pessoas. | `cargo run -- --verbose` mostra apenas dados do dono no terminal dele. Sem envio externo. | roldao | quando integrar Toggl (v0.3) | Habilitar sincronização com Toggl. A partir daí, nomes de tarefa podem identificar clientes/colegas; reabrir INV-AGENT-008. |
| C9 — `.mcp.json` e política MCP | Projeto não usa MCP para nada. | Não há `.mcp.json` no repositório; nenhum conector MCP referenciado em `.claude/`. | roldao | 2026-11-27 | Decisão de plugar Claude Code num conector MCP específico (ex: GitHub MCP server). |
| C0 — Hooks de extensão (`large-file-blocker`, `lockfile-tampering`, `migration-direction`, etc.) | Projeto pequeno; risco baixo. Ativaremos conforme aparecer incidente. | `.git/hooks/pre-commit` só roda os do núcleo. | roldao | 2027-05-27 | Primeiro incidente de cada tipo (ex: alguém commitou binário gigante = ativar `large-file-blocker`). |
| C0 — `CONTRIBUTING.md`, modelo de PR template, issue template | OSS pequeno; cabe configurar quando 1º PR externo chegar. | Repositório usa templates default do GitHub. | roldao | 2026-11-27 | 1º PR externo OU 1ª issue de contribuidor externo. |

## Histórico (camadas reativadas)

| Camada | Data reativação | Motivo (gatilho que disparou) |
|---|---|---|
| (nenhuma ainda) | | |

---

> **Link bidirecional:** revisar este NÃO-APLICA na próxima `revalidacao-em` — quando o gatilho disparar, mover a linha para "Histórico" e implementar a camada (ou abrir nova entrada com novo prazo).
