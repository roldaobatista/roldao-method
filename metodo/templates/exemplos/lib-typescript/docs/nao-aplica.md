---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 60
proposito: espelho do nao-aplica.md raiz desta lib — listagem resumida das camadas pulada para o índice da pasta docs/ enxergar
---

<!--
arquivo: docs/nao-aplica.md
projeto: @conciliab/csv-parser (exemplo didático)
proposito: espelho resumido do nao-aplica.md da raiz, para o INDICE da pasta docs/ encontrar.
nota: a fonte de verdade é ../nao-aplica.md na raiz. Manter em sincronia.
-->

# Não aplica — @conciliab/csv-parser (índice em `docs/`)

> Este arquivo é um **espelho** de [`../nao-aplica.md`](../nao-aplica.md) (raiz do projeto). A fonte de verdade vive na raiz; este existe só para o `docs/INDICE.md` encontrar.
>
> Em caso de divergência, [`../nao-aplica.md`](../nao-aplica.md) vence.

## Resumo do que não se aplica nesta lib

Biblioteca npm pura, função pura sem I/O, sem servidor, sem dado de pessoa física tocado pelo código. Por isso muitas camadas do método canônico não fazem sentido aqui.

| Camada | Não aplica porque (resumo) |
|---|---|
| C6 / LGPD (ROPA, retenção, DPO) | Lib não persiste, não loga, não transmite dado pessoal. Responsabilidade LGPD é de quem chama a função, não da biblioteca. |
| C8 / Runbooks, on-call, SLO, dashboards de produção | Não é serviço hospedado. Não há servidor pra monitorar nem cliente conectado a uma instância nossa. Resposta a incidente = publicar patch no npm. |
| C8b / SLA de uptime, métricas Prometheus, monitoring de latência | Mesma razão do C8 — não há serviço pra monitorar. SLA da lib é "responder report de bug em 72h" (em `SECURITY.md`). |
| C9b / `.cursorrules`, `.continuerc` | Projeto usa só Claude Code como harness de IA. |
| C5 / `docs/i18n/` (internacionalização) | Documentação em pt-BR; mensagens de erro em inglês (padrão comunidade OSS). Sem plano de localização. |
| C0 / `docs/glossario.md` arquivo separado | Glossário inline em `CONTRIBUTING.md §0` + tabela canônica em `REGRAS-INEGOCIAVEIS.md §2.A` somam 36 entradas. |
| C0 / `docs/PRD.md` | Lib pequena, módulo único (`parser`). PRD substituído por §1 do `AGENTS.md` + `spec.md` do módulo. |
| Hooks `frontmatter-validator` e `override-ledger.sh` | Lib pequena com 1 mantenedor. Custo de implementação alto, ROI baixo nesta escala. Hooks de segurança continuam ativos. |
| Auditores customizados em `.claude/agents/` (≥5 com golden cases) | Projeto solo. Usamos as skills embutidas do Claude Code (`code-review`, `security-review`). |
| `.mcp.json` + política MCP | Lib não usa nenhum MCP. |
| `kickoff-fase.md` para F-1 | Conteúdo já distribuído em `spec.md` + `plan.md` + `tasks.md` do módulo. |
| `docs/testes/estrategia.md` arquivo separado | Estratégia inline em `CONTRIBUTING.md §6` + `AGENTS.md §6` + `plan.md`. |
| C12 / RFCs + governança comunitária | Projeto solo (1 mantenedor). Fluxo de decisão é PR + ADR. |
| C4 / `data-contract.md` | Lib pura sem contrato produtor↔consumidor de eventos/APIs internas. API pública governada por SemVer + `api-extractor`. |

Para evidência, responsável, data de revalidação e gatilho de reavaliação, ver [`../nao-aplica.md`](../nao-aplica.md).

> **Link bidirecional:** quando alguma destas camadas entrar em vigor, mover a linha pra histórico em [`../nao-aplica.md`](../nao-aplica.md) e atualizar este espelho.
