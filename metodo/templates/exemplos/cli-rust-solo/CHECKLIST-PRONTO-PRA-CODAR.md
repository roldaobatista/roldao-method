---
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: tasks.md
proximo: kickoff-fase.md
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: CHECKLIST-PRONTO-PRA-CODAR.md do projeto-exemplo tempo-cli.
contexto: CLI Rust solo. Vários itens viram "não se aplica" — registrados em nao-aplica.md.
-->

# Checklist — pronto pra codar — tempo-cli

> Todos os itens precisam estar marcados antes do primeiro commit de código de produto. Marcar exige link OU caminho de arquivo OU comando que comprova. Itens que não se aplicam neste projeto remetem a `nao-aplica.md`.

## Documentação canônica

| Item | Status | Evidência |
|---|---|---|
| `README.md` existe e está em status `stable` | [x] | [`README.md`](./README.md) — status `stable` no frontmatter |
| `AGENTS.md` existe e está em status `stable` | [x] | [`AGENTS.md`](./AGENTS.md) — status `stable` |
| `CONTRIBUTING.md` existe | [N/A] | Projeto solo OSS. PRs externos serão tratados quando o primeiro chegar; por ora `AGENTS.md` cobre. Registrado em [`nao-aplica.md`](./nao-aplica.md) com gatilho "primeiro PR externo". |
| `SECURITY.md` existe | [x] | [`SECURITY.md`](./SECURITY.md) — política de divulgação privada (e-mail + GitHub Security Advisory), safe-harbor, janelas de resposta de boa-fé. Versão mínima adequada para projeto OSS solo. |
| `REGRAS-INEGOCIAVEIS.md` tem ≥10 IDs, cada um com hook OU auditor mapeado | [x] | [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) — 10 IDs vigentes (3 INV de produto + 7 INV-AGENT após remover INV-AGENT-008). Hooks `secrets-scanner`, `block-destructive`, `anti-mascaramento` configurados; demais são revisão humana (projeto solo). |

## Discovery e decisões fundadoras

| Item | Status | Evidência |
|---|---|---|
| Descoberta: `descoberta/sintese-final.md` em status `stable` | [N/A] | Projeto solo: descoberta é o próprio dono identificando dor própria. [`docs/descoberta/problema.md`](./docs/descoberta/problema.md) cobre. Sem síntese formal — registrado em `nao-aplica.md`. |
| `ADR-0000` (uso de IA) aceita | [x] | [`docs/adr/ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md) — status `aceita` |
| `ADR-0001` (stack) aceita | [x] | [`docs/adr/ADR-0001-stack-rust.md`](./docs/adr/ADR-0001-stack-rust.md) — status `aceita` |
| Glossário (`docs/glossario.md`) tem ≥20 termos | [N/A] | Domínio pequeno (tempo, tarefa, sessão, relatório). Termos cabem na tabela 2.A da INV-AGENT-010. Registrado em `nao-aplica.md`. |

## Produto e domínio

| Item | Status | Evidência |
|---|---|---|
| PRD raiz (`docs/PRD.md`) lista módulos com prioridade | [N/A] | Projeto pequeno: prioridade vive no `README.md` da seção "Rodar localmente" + roadmap simples nas Issues do GitHub. Registrado em `nao-aplica.md`. |
| `docs/testes/estrategia.md` definida | [x] | Pirâmide: testes unitários por módulo (`#[cfg(test)]`), 1 teste de integração por comando do CLI usando `assert_cmd`. Sem E2E (CLI não tem UI). Tudo via `cargo test`. |
| Primeira fase (`F-1`) tem `spec.md` + `plan.md` + `tasks.md` preenchidos | [N/A] | F-1 é "comandos básicos: start/stop/list/report". Spec cabe no `docs/descoberta/problema.md` + `README.md`. Tarefas vivem nas Issues do GitHub. Versão simplificada — registrada em `nao-aplica.md`. |
| `tasks.md` referencia ACs do `spec.md` | [N/A] | Sem `spec.md`/`tasks.md` formais; ACs viram critérios em cada Issue. |
| `plan.md` referencia ACs do `spec.md` | [N/A] | idem acima. |
| Testes 1:1 com ACs existem | [x] | Cada comando do CLI tem 1+ teste de integração em `tests/`. Critério de aceite = teste passa. |
| `kickoff-fase.md` da primeira fase está pronto | [N/A] | Projeto solo sem cerimônia de fase. Próximo passo lógico vive como Issue marcada `next` no GitHub. |

## Governança técnica

| Item | Status | Evidência |
|---|---|---|
| Verificações pre-commit ativadas | [x] | `.git/hooks/pre-commit` roda `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`. |
| Núcleo: `block-destructive`, `secrets-scanner`, `frontmatter-validator`, `anti-mascaramento`, `override-ledger` | [N/A] | `block-destructive` + `secrets-scanner` rodando. `frontmatter-validator` opcional (poucos docs sob `docs/`). `anti-mascaramento` rodando como grep simples por `#[ignore]` sem comentário ADR. `override-ledger` será criado no primeiro override. |
| Extensão: `large-file-blocker`, etc. | [N/A] | Projeto pequeno; vai ativar conforme aparecer necessidade. Registrado em `nao-aplica.md`. |
| CI rodando os mesmos hooks + SBOM | [x] | GitHub Actions roda `cargo fmt --check && cargo clippy && cargo test` em Linux/macOS/Windows. SBOM via `cargo auditable` + `cargo audit` em CI. |
| Pelo menos 5 auditores em `.claude/agents/` | [N/A] | Projeto solo: 1 auditor humano (dono). Subagentes serão criados se complexidade aumentar. Registrado em `nao-aplica.md`. |
| `CODEOWNERS` cobre paths críticos | [N/A] | Projeto solo: `CODEOWNERS` global `* @roldao`. Registrado em `nao-aplica.md`. |

## Configuração do repositório

| Item | Status | Evidência |
|---|---|---|
| `.gitignore` cobre a stack + `.claude/settings.local.json` | [x] | `.gitignore` inclui `target/`, `Cargo.lock` (debate — mantido pra reprodutibilidade do binário), `.claude/settings.local.json`, `~/.tempo-cli/` referência local. |
| `.mcp.json` + `docs/governanca/politica-mcp.md` | [N/A] | Projeto não usa MCP. Registrado em `nao-aplica.md`. |
| `docs/nao-aplica.md` lista camadas puladas com justificativa + gatilho de reavaliação | [x] | [`docs/nao-aplica.md`](./docs/nao-aplica.md) — espelha [`nao-aplica.md`](./nao-aplica.md) da raiz. |

## Como usar este checklist

1. Marcar cada item APENAS com evidência (link, caminho, comando).
2. Item sem evidência ou com `[N/A]` fica registrado em `nao-aplica.md` com gatilho de reavaliação.
3. Quando todos marcados ou justificados, mudar `status` no frontmatter para `stable` e abrir o primeiro PR de código.

**Resultado para este projeto:** todos os itens estão `[x]` ou `[N/A]` justificado em `nao-aplica.md`. Pronto para codar.

> **Status aceitos:** somente `[x]` e `[N/A]`. `[parcial]` não é estado válido — ou item está pronto com evidência (`[x]`), ou é decisão de não-aplicar registrada (`[N/A]`), ou continua em aberto (desmarcado, não pode fechar o checklist).
