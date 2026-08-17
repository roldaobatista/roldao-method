---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 300
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: AGENTS.md do projeto-exemplo tempo-cli.
contexto: CLI Rust solo, sem LGPD, sem multi-tenant, sem servidor.
-->

# AGENTS.md — tempo-cli

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md é o mais específico (canal Claude Code) e o mais fácil de mudar.

**Status:** stable · **Última revisão:** 2026-05-27

## 1. Identidade do produto
- Nome: `tempo-cli`
- Escopo: ferramenta de linha de comando para registrar tempo gasto em tarefas no terminal. Armazena tudo localmente em SQLite. Sem servidor, sem conta, sem cadastro. Sincronização opcional com Toggl planejada para v0.3 (ADR futura).
- Modelo de negócio: open source (MIT). Sem monetização.
- Cliente piloto: o próprio dono (Roldão). Distribuição pública via crates.io e GitHub Releases.

## 2. Stack candidata
| Camada | Escolha | Notas |
|---|---|---|
| Linguagem | Rust 1.78+ | decidido em ADR-0001 |
| CLI parser | `clap` v4 (derive) | comunidade ativa, doc boa |
| Serialização | `serde` + `serde_json` | export/import |
| HTTP cliente (futuro) | `reqwest` + `tokio` | só quando integrar Toggl |
| Banco | SQLite via `rusqlite` (bundled) | arquivo local em `~/.tempo-cli/db.sqlite` |
| Distribuição | `cargo install` + GitHub Releases | decidido em ADR-0002 |

## 3. Princípios não-negociáveis

Detalhes completos em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md). Resumo dos IDs vigentes neste projeto (várias INVs originais do método não se aplicam — ver `nao-aplica.md`):

- **INV-AGENT-001** — agente IA não deleta dado de produção sem confirmação. Aqui "produção" = banco SQLite do próprio dono.
- **INV-AGENT-002** — proibido `--no-verify`, `--force` em `main`.
- **INV-AGENT-003** — investigar (banco/log/payload) antes de editar lógica.
- **INV-AGENT-004** — pró-atividade: executa reversíveis; confirma só destrutivos.
- **INV-AGENT-005** — validar antes de afirmar "pronto"; evidência obrigatória.
- **INV-AGENT-006** — causa raiz, nunca sintoma; sem `#[ignore]`, sem `assert!(true)`.
- **INV-AGENT-007** — commits atômicos; sem `git add .` cego.
- **INV-AGENT-009** — segredos nunca em arquivo versionado (futura chave Toggl).
- **INV-AGENT-010** — linguagem acessível; traduzir jargão na 1ª ocorrência.
- **INV-AGENT-011** — alteração de qualquer INV-AGENT exige PR dedicado.

**Removidas neste projeto** (ver `nao-aplica.md`):
- INV-001, INV-TENANT-001 (multi-tenant — não se aplica).
- INV-AGENT-008 (PII em logs — projeto não trata dado de terceiros).

## 4. Decisões fundadoras (D-NNN)
| ID | Decisão | Status |
|---|---|---|
| D-001 | Banco local por instalação (sem servidor) | aceita |
| D-002 | Open source MIT desde o dia 1 | aceita |
| D-003 | Sem cadastro de usuário; identidade = máquina | aceita |

## 5. Modelo de agentes
Projeto solo: 1 auditor humano (o próprio dono). Não há `docs/governanca/catalogo-auditores.md` em escala — ver `nao-aplica.md`. O agente IA opera com Claude Code via `CLAUDE.md`.

## 6. Comandos canônicos
| Operação | Comando |
|---|---|
| Build dev | `cargo build` |
| Build release | `cargo build --release` |
| Rodar testes | `cargo test` |
| Lint | `cargo clippy --all-targets -- -D warnings` |
| Formatar | `cargo fmt` |
| Conferência completa local | `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test` |
| Publicar versão | `cargo publish` (exige confirmação humana — gasto reputacional, irreversível) |

## 7. Política de commits
- Atômicos. Mensagem cita o módulo afetado (ex: `cli:`, `storage:`, `report:`).
- `--no-verify` PROIBIDO (ver INV-AGENT-002).
- `git push --force` em `main` PROIBIDO (ver INV-AGENT-002).
- Stage seletivo por arquivo; nada de `git add .` cego (INV-AGENT-007).

## 8. Convenções
- Idioma: PT-BR na documentação e mensagens de commit. Código, identificadores e mensagens visíveis ao usuário (`--help`, erros) em **inglês** — convenção da comunidade Rust e de CLIs em geral.
- Documentação segue `docs/CONVENCOES-DOC.md` (a criar se o projeto crescer; por ora as convenções vivem em `AGENTS.md` + `CLAUDE.md`).

## 9. Segurança/dados
- Multi-tenant: **N/A** (1 instalação = 1 usuário; ver `nao-aplica.md`).
- Secrets: futura chave de API do Toggl vai em `~/.tempo-cli/config.toml` com `chmod 600`. NUNCA em arquivo versionado (INV-AGENT-009).
- WORM: N/A.
- PII em logs: **N/A** — projeto não coleta PII de terceiros; o único "PII" é o nome da tarefa que o próprio usuário digita, e ele vê o log dele mesmo. Ainda assim, `--verbose` não imprime conteúdo de tarefa sensível por default.

## 10. ADRs ativas

| # | Tema | Arquivo | Status | Bloqueia fase | Depende de |
|---|---|---|---|---|---|
| 0000 | Uso de IA | [`docs/adr/ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md) | aceita | — | — |
| 0001 | Stack Rust | [`docs/adr/ADR-0001-stack-rust.md`](./docs/adr/ADR-0001-stack-rust.md) | aceita | F-1 | — |
| 0002 | Distribuição | [`docs/adr/ADR-0002-distribuicao.md`](./docs/adr/ADR-0002-distribuicao.md) | aceita | F-2 | ADR-0001 |

## 11. Pendências (GATEs)
- GATE-PUBLISH-1: `cargo publish --dry-run` passa sem warnings antes de qualquer publicação real.
- GATE-RELEASE-1: changelog atualizado e tag git criada antes do release.

## 12. ROPA / LGPD

**Não se aplica.** O `tempo-cli` não trata dado pessoal de terceiros — só registra tempo gasto do próprio usuário, localmente, no computador dele. Não há banco compartilhado, não há servidor recebendo dados, não há outra pessoa cujo dado seja processado. Registro completo da justificativa em [`nao-aplica.md`](./nao-aplica.md) com gatilho de reavaliação (quando/se integrar sincronização com serviço que envolva dados de outros usuários — ex: relatório de equipe).

## 13. Pró-atividade e autorização

O agente IA opera com pró-atividade ampla. Ver INV-AGENT-004.

**Ações que o agente FAZ sem perguntar** (reversíveis, sem custo financeiro, sem perda de dado):

- Editar/criar/atualizar arquivos, configs, docs, memórias.
- Rodar `cargo build`, `cargo test`, `cargo clippy`, `cargo fmt`.
- Criar branch, fazer commit atômico, abrir PR.
- Criar issue, comentar em PR via `gh`.
- `git push origin <branch>` em fast-forward (não force).
- Aplicar correções identificadas em revisão.
- Setar topics no repo, atualizar README, adicionar badges.
- Continuar o próximo passo lógico de qualquer sequência iniciada.

**Ações que o agente também faz sem perguntar** (revertíveis, alinhadas com CLAUDE.md global):

- `gh release create <tag>` — release no GitHub é reversível com `gh release delete`; agente cria e reporta.

**Ações que EXIGEM confirmação humana explícita** (destrutivas, custosas ou irreversíveis):

- `cargo publish` (publicação em crates.io — irreversível: a versão N nunca pode ser republicada).
- `cargo yank` (afeta usuários que já dependem da versão).
- `git push --force` puro em qualquer branch. `git push --force-with-lease` em `main`/`master`/`release/*` exige `.claude/.override-reason`; em branch própria (feature/*, fix/*) passa direto.
- `git reset --hard` em `origin/*`. `git reset --hard` em ref local exige `.claude/.override-reason`.
- `rm -rf`, `git branch -D` em `main`.
- Deletar arquivo `~/.tempo-cli/db.sqlite` do próprio dono (INV-AGENT-001).
- Mudança de visibilidade do repositório (público ↔ privado).
- Apagar repositório.

Qualquer override desta política exige entrada em `docs/governanca/override-ledger.md` (a criar quando o primeiro override acontecer).
