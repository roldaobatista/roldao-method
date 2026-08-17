---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 110
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: README-EXEMPLO.md (meta-readme do exemplo)
proposito: explicar que esta pasta NÃO é um projeto real, mas o estado FINAL
           de um projeto-exemplo (tempo-cli, CLI Rust solo) APÓS aplicar o
           método ROLDAO-METHOD (camada metodo/).
não confundir com: README.md (que é o README do projeto-exemplo em si).
-->

# Exemplo: `tempo-cli` — CLI Rust solo (estado final após aplicar o método)

> Este diretório é um **exemplo materializado**. Não é um projeto rodando.
> Mostra como ficariam os arquivos canônicos do método ROLDAO-METHOD (camada metodo/)
> quando aplicados a um caso simples: ferramenta de linha de comando, 1
> desenvolvedor (solo), sem LGPD, sem multi-tenant, sem operação 24/7.
>
> Voltar para o catálogo: [`../../README.md`](../../README.md).

## Por que este exemplo existe

A auditoria do método identificou que faltava um exemplo fim-a-fim
preenchido. Templates sozinhos têm placeholders `<...>` e cabe ao usuário
inferir o que cada campo quer dizer no contexto dele. Este exemplo mostra
**um caso real preenchido até o fim**, incluindo as decisões de "isso
não se aplica" (LGPD, multi-tenant, on-call, etc.) com justificativa.

## Contexto inventado coerente

| Campo | Valor |
|---|---|
| Nome do projeto | `tempo-cli` |
| Propósito | CLI para registrar tempo gasto em tarefas a partir do terminal |
| Time | 1 dev (Roldão) — solo, open source |
| Licença | MIT |
| Stack | Rust + clap + serde + rusqlite (SQLite local) |
| Storage | `~/.tempo-cli/db.sqlite` |
| Distribuição | `cargo install tempo-cli` + binários pré-compilados em GitHub Releases |
| Dados pessoais | apenas do próprio usuário, no próprio computador — **fora do escopo da LGPD** |
| Multi-tenant | não — 1 instalação = 1 usuário |
| Servidor próprio | não — sem backend, sem deploy |
| On-call / SLO | não — programa de usuário, sem SLA |

## Leitura recomendada para entender o exemplo

A ordem abaixo casa com a hierarquia de precedência do método
(`constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE`) e ajuda a ver
como cada camada se conecta:

1. [`README.md`](./README.md) — o README do projeto-exemplo em si.
2. [`.claude/memory/constitution.md`](./.claude/memory/constitution.md) — princípios fundadores. Curto.
3. [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) — INVs aplicáveis (várias INVs originais aqui viram "não se aplica").
4. [`AGENTS.md`](./AGENTS.md) — canônico de produto.
5. [`CLAUDE.md`](./CLAUDE.md) — adendo do harness Claude Code.
6. [`nao-aplica.md`](./nao-aplica.md) e [`docs/nao-aplica.md`](./docs/nao-aplica.md) — registro explícito do que foi pulado e por quê.
7. [`CHECKLIST-PRONTO-PRA-CODAR.md`](./CHECKLIST-PRONTO-PRA-CODAR.md) — gate de entrada em código, marcado para um projeto solo.
8. [`docs/descoberta/problema.md`](./docs/descoberta/problema.md) — a dor real que motivou o `tempo-cli`.
9. [`docs/adr/ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md)
10. [`docs/adr/ADR-0001-stack-rust.md`](./docs/adr/ADR-0001-stack-rust.md)
11. [`docs/adr/ADR-0002-distribuicao.md`](./docs/adr/ADR-0002-distribuicao.md)

## O que este exemplo PROPOSITALMENTE não tem

Esses artefatos do método foram justificados em `nao-aplica.md`:

- `docs/lgpd/` — não há PII de terceiros.
- `docs/faseamento/` — projeto solo cabe em backlog plano, sem fases formais.
- `docs/operacao/on-call.md`, `slo-sli.md`, `runbooks/`, `change-management.md` — não há produção 24/7 nem cliente com SLA.
- `docs/governanca/catalogo-auditores.md` em escala — só 1 auditor humano (o próprio dono); detalhes em `nao-aplica`.

## Como usar este exemplo num projeto seu

1. **NÃO copie esta pasta inteira** para um projeto novo. Use os templates
   em `templates/*.template.md` como ponto de partida.
2. **Use este exemplo como referência visual** ao preencher os templates.
   Quando bater dúvida em "como ficaria o INV-001 num projeto sem
   multi-tenant?", abra `REGRAS-INEGOCIAVEIS.md` daqui.
3. **Compare seu `nao-aplica.md` com este.** Se o seu projeto se parece
   com um CLI solo, o `nao-aplica.md` daqui é um bom espelho.

---

> Voltar para o catálogo de templates: [`../../README.md`](../../README.md).
