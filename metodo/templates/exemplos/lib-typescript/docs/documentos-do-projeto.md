---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 80
proposito: tabela de docs obrigatórios do @conciliab/csv-parser — regime enxuto (lib OSS, sem LGPD, sem multi-tenant)
---

# Documentos do projeto — @conciliab/csv-parser

Regime enxuto: lib OSS, sem dado pessoal, sem multi-tenant. Camadas C6 (LGPD), C7 (governança), C8 (operação) **muito reduzidas** — ver `nao-aplica.md`.

| Doc | Camada | Status | Obs |
|---|---|---|---|
| README.md | C0 | stable | tem seção EN no fim |
| AGENTS.md | C0 | stable | — |
| CLAUDE.md | C0 | stable | — |
| REGRAS-INEGOCIAVEIS.md | C0 | stable | inclui INV-PARSER-*, INV-SEMVER-* específicos |
| SECURITY.md | C0 | stable | safe-harbor + canal vulnerabilidades |
| CONTRIBUTING.md | C0 | stable | fluxo PR externo |
| MAINTAINERS.md | C0 | stable | declara dono + bus factor |
| CHECKLIST-PRONTO-PRA-CODAR.md | C0 | stable | — |
| nao-aplica.md | C10 | stable | LGPD, multi-tenant, on-call, ROPA N/A |
| .claude/memory/constitution.md | C11 | stable | — |
| descoberta/problema.md | C1 | stable | — |
| adr/ADR-0000-uso-de-ia.md | C2 | stable | — |
| adr/ADR-0001-stack-typescript-tsup.md | C2 | stable | — |
| adr/ADR-0002-distribuicao-npm.md | C2 | stable | — |
| adr/ADR-0003-versionamento-semver.md | C2 | stable | — |
| adr/ADR-0004-suporte-runtime-node-deno-bun.md | C2 | stable | — |
| dominios/core/modulos/parser/spec.md | C4 | stable | — |
| dominios/core/modulos/parser/plan.md | C4 | stable | — |
| dominios/core/modulos/parser/tasks.md | C4 | stable | — |
| operacao/release-process.md | C8 | stable | changesets + npm publish manual |
| seguranca/dependency-policy.md | C6 | stable | — |
| CONVENCOES-DOC.md | C10 | stable | — |
| INDICE.md | C10 | stable | este arquivo |
| documentos-do-projeto.md | C10 | stable | este arquivo |

## Gate PASS ZERO

Para fechar marco F-1 (primeiro release minor estável): todos `stable`.
