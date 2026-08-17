---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 220
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: REGRAS-INEGOCIAVEIS.md do projeto-exemplo tempo-cli.
contexto: CLI Rust solo. INVs originais de multi-tenant e PII saíram (ver nao-aplica.md).
-->

# Regras inegociáveis — tempo-cli

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence.

> Fonte única de verdade das invariantes operacionalizáveis deste projeto. Toda outra doc referencia por ID, nunca redeclara. Invariantes do método original que não se aplicam ao `tempo-cli` estão registradas em [`nao-aplica.md`](./nao-aplica.md), não foram apenas omitidas.

## 1. Invariantes de produto (INV-NNN)

Projeto solo, sem servidor, sem multi-tenant. Muitas INVs do método original (INV-001, INV-TENANT-001, etc.) não se aplicam — ver `nao-aplica.md`. As que permanecem:

| ID | Regra | Por que (motivação) | Hook que aplica | Auditor relacionado |
|---|---|---|---|---|
| SEC-001 | Nenhum secret (chave de API do Toggl, token) em código-fonte ou histórico git. | Repositório é público; vazamento é irreversível. | `secrets-scanner.sh` (a configurar em `.git/hooks/pre-commit` antes de v0.3) | dono (revisão humana) |
| TST-001 | Teste não pode ser silenciado, pulado (`#[ignore]`) ou afrouxado sem ADR. | Esconde bug e quebra confiança na suite. | `cargo test` em CI falha se algum `#[ignore]` aparecer sem comentário `// ADR-NNNN` | dono (revisão humana) |
| DAT-001 | Schema do SQLite só evolui via migration versionada em `migrations/NNN-<slug>.sql`. Reverter exige migration nova; nunca editar migration aceita. | Usuários atualizam de versões antigas; uma migração reescrita quebra base instalada. | revisão humana no PR de migration | dono |

## 2. Invariantes para agentes IA (INV-AGENT-NNN)

| ID | Regra | Por que (motivação) | Hook que aplica | Auditor relacionado |
|---|---|---|---|---|
| INV-AGENT-001 | Agente IA NÃO deleta dado de "produção" sem confirmação humana. Aqui "produção" = `~/.tempo-cli/db.sqlite` do próprio dono (é o registro de tempo real dele, não dá pra recuperar). | Perda irreversível do histórico de tempo do dono. | `block-destructive.sh` (lista inclui `rm ~/.tempo-cli/*`, `DROP TABLE` em conexão real) | limites-agente-ia |
| INV-AGENT-002 | Proibido `--no-verify`, `--force`, `--force-with-lease` em `main`. Override exige entrada em override-ledger. | Pula quality gate e/ou destrói histórico compartilhado. | `block-destructive.sh` | limites-agente-ia |
| INV-AGENT-003 | Investigar antes de mexer em lógica de negócio: ler banco SQLite (`sqlite3 ~/.tempo-cli/db.sqlite ".schema"` e `SELECT`s relevantes), logs do CLI (`RUST_LOG=debug`) **antes** de editar código. | Mudar lógica do CLI sem confirmar estado real do banco produz voltas. | `pre-edit-evidence.sh` (PreToolUse Edit\|Write) | auditor-doc-quality (regra B) |
| INV-AGENT-004 | Pró-atividade: executar ações reversíveis sem perguntar. Confirmar antes para: `cargo publish`, `cargo yank`, `git push --force`, `rm -rf`, deleção do banco do dono, criação de release, mudança de visibilidade do repo. | Empurrar tarefa executável pro dono quebra fluxo. | `override-ledger.sh` (a configurar) | limites-agente-ia |
| INV-AGENT-005 | Validar antes de afirmar: nunca dizer "pronto/implementado/corrigido" sem rodar `cargo test` + `cargo clippy` e mostrar resultado. | Afirmação sem evidência erode confiança. | `post-claim-evidence.sh` (Stop hook) | auditor-revisao |
| INV-AGENT-006 | Causa raiz, nunca sintoma. Proibido `#[ignore]` sem ADR, `assert!(true)`, `#[allow(...)]` sem comentário justificando, baseline pra esconder erro, `-q`/`--quiet` mascarando saída, `&& true` no CI. | Mascarar erro transforma bug pequeno em incidente caro. | `anti-mascaramento.sh` (busca padrões Rust) | revisão humana |
| INV-AGENT-007 | Commits atômicos. Antes de `git commit`: `git status` + `git diff --staged` + `git log -3 --oneline`. Proibido `git add .` / `git add -A` cego. Stage seletivo por arquivo. | Commit misto polui histórico e impede revert cirúrgico. | `auditor-commit-hygiene.sh` (PreToolUse Bash) | auditor-commit-hygiene |
| INV-AGENT-009 | Nenhum segredo (chave Toggl, token GitHub, etc.) em arquivo versionado. Usa `~/.tempo-cli/config.toml` com `chmod 600`. | Histórico git é eterno; segredo vazado em repo público = rotação imediata. | `secrets-scanner.sh` (a configurar) | revisão humana |
| INV-AGENT-010 | Linguagem acessível: traduzir jargão técnico na primeira ocorrência. Dono não programa. Tabela canônica no anexo 2.A abaixo. | Jargão sem tradução exclui o tomador de decisão do loop. | revisão humana | revisão humana |
| INV-AGENT-011 | Alteração de qualquer INV-AGENT-NNN exige PR dedicado + aprovação do dono. | INV é contrato; mudança silenciosa destrói o contrato. | `inv-change-guard.sh` (a configurar) | revisão humana |

**Removidas neste projeto** (ver [`nao-aplica.md`](./nao-aplica.md)):

- INV-001 (tenant_id) — não há multi-tenant.
- INV-TENANT-001 (RLS) — N/A.
- INV-AGENT-008 (PII em logs) — não trata PII de terceiros; o dono é o único usuário do próprio dado.

### 2.A — Anexo da INV-AGENT-010: tradução canônica de jargão

A fonte única de tradução de jargão **vive em** [`../../../GLOSSARIO-ROLDAO.md`](../../../GLOSSARIO-ROLDAO.md) (no projeto destino real: `GLOSSARIO-ROLDAO.md` da raiz). Não duplicar aqui.

Termos específicos de Rust (`crate`, `cargo build/test/clippy/publish/yank`) e CLI são glossados em `CLAUDE.md §1` quando aparecem pela primeira vez na sessão.

## 3. Processo de alteração das INVs

1. PR dedicado, **um INV por PR**, mensagem cita o ID alterado.
2. Aprovação do dono obrigatória (não há override por agente).
3. Entrada em `docs/governanca/decisoes-inv.md` (criar quando o primeiro INV mudar) com data, ID, motivo, antes/depois.
4. Atualização (ou criação) do hook/auditor correspondente no mesmo PR.
5. `CHANGELOG.md` registra a mudança.

## 4. Referências

- [`.claude/memory/constitution.md`](./.claude/memory/constitution.md) — princípios fundadores.
- [`AGENTS.md`](./AGENTS.md) — canônico de produto.
- [`CLAUDE.md`](./CLAUDE.md) — adendo do harness Claude Code.
- [`nao-aplica.md`](./nao-aplica.md) — INVs e camadas pulados, com justificativa e gatilho de reavaliação.
