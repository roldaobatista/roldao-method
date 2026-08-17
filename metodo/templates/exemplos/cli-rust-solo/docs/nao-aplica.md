---
owner: roldao
revisado-em: 2026-05-27
idioma: pt-BR
status: stable
limite-linhas: 80
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/nao-aplica.md
proposito: espelho do nao-aplica.md da raiz, para o INDICE da pasta docs/ enxergar.
nota: a fonte de verdade é ../nao-aplica.md na raiz. Manter em sincronia.
-->

# Não aplica — tempo-cli (índice em `docs/`)

> Este arquivo é um **espelho** de [`../nao-aplica.md`](../nao-aplica.md) (raiz do projeto). A fonte de verdade vive na raiz; este existe só para o `docs/INDICE.md` (a criar) encontrar.
>
> Em caso de divergência, [`../nao-aplica.md`](../nao-aplica.md) vence.

## Resumo do que não se aplica

| Camada | Não aplica porque (resumo) |
|---|---|
| C5 / Faseamento formal | Solo dev, backlog em Issues. |
| C6 / LGPD (`docs/lgpd/`) | Não trata PII de terceiros. |
| C7 / Catálogo de auditores em escala | 1 auditor humano (o dono). |
| C8 / on-call, SLO/SLI, change-management | Programa de usuário sem SLA. |
| C0 / `CONTRIBUTING.md` | Sem colaborador externo ainda. |
| C0 / `docs/glossario.md` ≥20 termos | Domínio trivial. |
| C0 / `docs/PRD.md` | Visão cabe no README + problema. |
| C0 / Multi-tenant (INV-001, INV-TENANT-001) | 1 instalação = 1 usuário. |
| C0 / INV-AGENT-008 (PII em logs) | Sem PII de terceiros. |
| C9 / `.mcp.json` | Projeto não usa MCP. |
| C0 / Hooks de extensão | Risco baixo; ativar sob demanda. |

Para evidência, responsável, data de revalidação e gatilho de reavaliação, ver [`../nao-aplica.md`](../nao-aplica.md).
