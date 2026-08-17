---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 60
proposito: espelho do nao-aplica.md raiz do conciliab — listagem resumida das camadas puladas para o índice da pasta docs/ enxergar
---

<!--
arquivo: docs/nao-aplica.md
projeto: conciliab (exemplo didático — SaaS B2B regulado)
proposito: espelho resumido do nao-aplica.md da raiz, para o INDICE da pasta docs/ encontrar.
nota: a fonte de verdade é ../nao-aplica.md na raiz. Manter em sincronia.
-->

# Não aplica — conciliab (índice em `docs/`)

> Este arquivo é um **espelho** de [`../nao-aplica.md`](../nao-aplica.md) (raiz do projeto). A fonte de verdade vive na raiz; este existe só para o `docs/INDICE.md` encontrar.
>
> Em caso de divergência, [`../nao-aplica.md`](../nao-aplica.md) vence.

## Resumo do que não se aplica neste SaaS

Como produto regulado (LGPD, fiscal) em regime completo, o conciliab materializa praticamente todas as camadas do método. A lista de exceções é curta:

| Camada | Não aplica porque (resumo) |
|---|---|
| C5 / `docs/i18n/` | Produto monolíngue pt-BR para PME brasileira. Sem cliente fora do Brasil no pipeline. |
| C9b / `.cursorrules` | Time pequeno (3 devs) usa só Claude Code como harness. |
| C9b / `.windsurfrules` | Mesmo motivo — time padronizado em Claude Code. |
| C9b / `kiro-steering` | Mesmo motivo — não usamos Kiro. |
| C8 / on-call 24/7 com pager dedicado | Time de 3 devs e produto em beta privado (sem SLA contratual de 24/7). Cobertura horário comercial pt-BR + best-effort fora. SLO 99,5%/mês permite janela noturna. |
| C12 / RFCs + governança comunitária | Produto fechado (SaaS proprietário), não open-source. Decisões arquiteturais usam ADR, não RFC pública. |
| C7 / `model-card.md` + `data-card.md` | Conciliab não usa modelo de IA/ML em produção. Matcher é heurística determinística (regras + fuzzy string matching), não ML. |
| C4 / `data-contract.md` | Sem produtor/consumidor interno separado por contrato versionado. Fila Celery é consumo interno do mesmo monolito. |
| C1 / vários canvas opcionais (jornadas, BMC, VPC, concorrentes, riscos, etc.) | Conteúdo essencial vive em `descoberta/problema.md`, `personas.md`, `nao-fazer.md`, `metricas-chave.md`, `sintese-final.md`. Os outros 10 canvas ficam como dívida documentada — exemplo ilustrativo, não produto real. |

Para evidência, responsável, data de revalidação e gatilho de reavaliação, ver [`../nao-aplica.md`](../nao-aplica.md).

> **Link bidirecional:** quando alguma destas camadas entrar em vigor (ex: sair de beta privado → on-call 24/7), mover a linha pra histórico em [`../nao-aplica.md`](../nao-aplica.md) e atualizar este espelho.
