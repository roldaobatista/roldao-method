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
arquivo: CHECKLIST-PRONTO-PRA-CODAR.md — projeto @conciliab/csv-parser
gate único antes de abrir o primeiro PR de código de produto.
-->

# Checklist — pronto pra codar — @conciliab/csv-parser

> Todos os itens precisam estar marcados antes do primeiro commit de código de produto.
> Marcar exige link OU caminho de arquivo OU comando que comprova.

> **Este CHECKLIST vs `kickoff-fase.md` — dois gates, dois momentos.**
> - CHECKLIST (este doc) é o gate de **PROJETO**: roda uma única vez antes do primeiro PR.
> - `kickoff-fase.md` é o gate de **FASE**: roda ao iniciar cada nova fase (F-1, F-2, ...).

## Documentação canônica

| Item | Evidência | OK |
|---|---|---|
| `README.md` existe e está em status `stable` | [`README.md`](./README.md) — frontmatter status: stable | [x] |
| `AGENTS.md` existe e está em status `stable` | [`AGENTS.md`](./AGENTS.md) — frontmatter status: stable | [x] |
| `CONTRIBUTING.md` existe | [`CONTRIBUTING.md`](./CONTRIBUTING.md) | [x] |
| `SECURITY.md` existe | [`SECURITY.md`](./SECURITY.md) | [x] |
| `MAINTAINERS.md` existe e declara owner + sucessão | [`MAINTAINERS.md`](./MAINTAINERS.md) — Roldão como owner solo; política de sucessão (§3) e contato de emergência (§4) preenchidos | [x] |
| `REGRAS-INEGOCIAVEIS.md` tem ≥10 IDs, cada um com hook OU auditor mapeado | [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) — 5 INV de produto + 11 INV-AGENT = 16 IDs; cada um tem coluna "Hook que aplica" ou "Auditor relacionado" preenchida | [x] |

## Discovery e decisões fundadoras

| Item | Evidência | OK |
|---|---|---|
| Descoberta: `docs/descoberta/problema.md` em status `stable` | [`docs/descoberta/problema.md`](./docs/descoberta/problema.md) — frontmatter status: stable. (Lib pequena pulou síntese-final formal; `nao-aplica.md` registra) | [x] |
| ADR-0000 (uso de IA) aceita | [`docs/adr/ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md) — status: aceita | [x] |
| ADR-0001 (stack) aceita | [`docs/adr/ADR-0001-stack-typescript-tsup.md`](./docs/adr/ADR-0001-stack-typescript-tsup.md) — status: aceita | [x] |
| Glossário (`docs/glossario.md`) tem ≥20 termos | Lib pequena — glossário inline em `CONTRIBUTING.md §0` (12 termos) + tabela canônica em `REGRAS-INEGOCIAVEIS.md §2.A` (24 termos). Total ≥ 20. Registrado em `nao-aplica.md` (sem arquivo separado) | [x] |

## Produto e domínio

| Item | Evidência | OK |
|---|---|---|
| PRD raiz (`docs/PRD.md`) lista módulos com prioridade | Lib pequena, único módulo `parser`. PRD substituído por seção §1 do `AGENTS.md` (identidade do produto) + spec do módulo. Registrado em `nao-aplica.md` | [x] |
| `docs/testes/estrategia.md` definida | Lib pequena — estratégia inline: vitest unitário + snapshots golden em `tests/__snapshots__/` + matriz multi-runtime no CI. Documentado em `CONTRIBUTING.md §6` e `AGENTS.md §6` | [x] |
| Primeira fase (F-1) tem `spec.md` + `plan.md` + `tasks.md` preenchidos | [`docs/dominios/core/modulos/parser/`](./docs/dominios/core/modulos/parser/) — 3 arquivos presentes | [x] |
| `tasks.md` referencia ACs do `spec.md` (coluna `ac-cobertos`) | [`docs/dominios/core/modulos/parser/tasks.md`](./docs/dominios/core/modulos/parser/tasks.md) — coluna preenchida | [x] |
| `plan.md` referencia ACs do `spec.md` | [`docs/dominios/core/modulos/parser/plan.md`](./docs/dominios/core/modulos/parser/plan.md) — seção "Testes 1:1 com ACs" preenchida | [x] |
| Testes 1:1 com ACs existem | Mapeamento em `plan.md → Testes 1:1 com ACs` aponta para `tests/parsers/ofx.spec.ts::AC-PARSER-001-N` | [x] |
| `kickoff-fase.md` da primeira fase está pronto | Lib pequena — kickoff F-1 substituído pelo próprio `tasks.md` (10 tasks). Registrado em `nao-aplica.md` | [x] |

## Governança técnica

| Item | Evidência | OK |
|---|---|---|
| Verificações automáticas pre-commit ativadas | `.husky/pre-commit` roda: `pnpm run lint --fix`, `pnpm run typecheck`, `pnpm test --changed`, `gitleaks protect --staged` | [x] |
| ↳ Núcleo: block-destructive, secrets-scanner, frontmatter-validator, anti-mascaramento, override-ledger | `block-destructive` + `secrets-scanner` (gitleaks) + `anti-mascaramento` (`scripts/anti-mascaramento.sh` rodando em pre-commit). `frontmatter-validator` e `override-ledger` — registrados em `nao-aplica.md` como pendência (lib pequena, baixa prioridade) | [parcial — registrado em nao-aplica] |
| ↳ Extensão: large-file-blocker, merge-conflict-marker, lockfile-tampering, env-file-leak | `large-file-blocker` (limite 500 KB) + `merge-conflict-marker` + `lockfile-tampering` (alerta se `pnpm-lock.yaml` mudar sem mudança em `package.json`) + `env-file-leak` (gitleaks pega `.env`) — todos em `.husky/pre-commit` | [x] |
| CI rodando os mesmos hooks + auditores + SBOM | `.github/workflows/ci.yml` roda matriz Node 20/22 × {lint, typecheck, test, build, api-check}; `security.yml` roda gitleaks + Dependabot; `release.yml` gera SBOM CycloneDX em `dist/sbom.cdx.json` | [x] |
| Pelo menos 5 auditores em `.claude/agents/` | Lib pequena — usamos skills embutidas (`code-review`, `security-review`) em vez de auditores customizados. Registrado em `nao-aplica.md` com gatilho de reavaliação (5+ contribuidores externos) | [parcial — registrado em nao-aplica] |
| `CODEOWNERS` cobre paths críticos | `.github/CODEOWNERS` — `@roldao` cobre `REGRAS-INEGOCIAVEIS.md`, `.claude/memory/constitution.md`, `docs/adr/`, `package.json`, `.github/workflows/`, `tsup.config.ts` | [x] |
| `docs/operacao/release-process.md` consolida fluxo de release | [`docs/operacao/release-process.md`](./docs/operacao/release-process.md) — changesets, version-packages PR, tag, npm publish, rollback via `npm deprecate`, suporte N/N-1 | [x] |
| `docs/seguranca/dependency-policy.md` formaliza zero-runtime-deps + SBOM + scanning | [`docs/seguranca/dependency-policy.md`](./docs/seguranca/dependency-policy.md) — política zero-runtime-deps + max-age 24m + licenças MIT/Apache/BSD/ISC + `pnpm cyclonedx` + gitleaks + `pnpm audit` | [x] |
| `docs/seguranca/threat-model.md` STRIDE por componente | [`docs/seguranca/threat-model.md`](./docs/seguranca/threat-model.md) — STRIDE para parser (ReDoS, prototype pollution), API pública, build pipeline npm, supply chain de dev-deps, typo-squatting do nome no npm | [x] |

## Configuração do repositório

| Item | Evidência | OK |
|---|---|---|
| `.gitignore` cobre a stack + `.claude/settings.local.json` | `.gitignore` cobre `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `.env`, `.env.*.local`, `.claude/settings.local.json` | [x] |
| `.mcp.json` + `docs/governanca/politica-mcp.md` | Projeto não usa MCP. Registrado em `nao-aplica.md` | [parcial — registrado em nao-aplica] |
| `docs/nao-aplica.md` lista camadas puladas com justificativa + gatilho de reavaliação | [`nao-aplica.md`](./nao-aplica.md) — 8 linhas na tabela, todas com evidência, responsável e revalidacao-em | [x] |

## Como usar este checklist

1. Marcar cada item APENAS com evidência (link, caminho, comando).
2. Item sem evidência fica desmarcado, mesmo que pareça pronto.
3. Itens marcados como `[parcial — registrado em nao-aplica]` são aceitos quando a justificativa em `nao-aplica.md` tem data de revalidação e gatilho de reavaliação concretos.
4. Quando todos marcados, mudar `status` no frontmatter para `stable` e abrir o primeiro PR de código.

**Status atual deste checklist: stable** — projeto pronto para desenvolvimento. Próximo passo: executar `tasks.md` de `docs/dominios/core/modulos/parser/`.
