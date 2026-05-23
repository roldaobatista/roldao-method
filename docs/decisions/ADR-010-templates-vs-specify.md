---
id: ADR-010
titulo: Duas camadas de template — bootstrap (`templates/`) vs spec-as-source (`.specify/`)
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-010 — Duas camadas de template

## Contexto

Olhando o repositorio, ha dois diretorios com nome semelhante a "template":

- `templates/` na raiz — contem `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`, `.claude/**`, `.specify/**`, `.cursor/**`, `.windsurf/**`, etc.
- `.specify/templates/` (dentro de `templates/`) — contem `prd.md`, `story.md`, `architecture.md`, `decision-log.md`, etc.

Sem ADR explicita, parecia sobreposicao. Na pratica sao camadas diferentes com proposito distinto.

## Decisao

### Camada 1 — `templates/` (bootstrap do projeto)

E o **stub que o `npx roldao-method install` copia integralmente** pro projeto novo. Define:
- Documentos-contrato (`AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`).
- `.claude/` completo (agents, commands, hooks, skills, output-styles, rules, settings.json).
- `.specify/` completo (memory/constitution, templates de spec, checklists, data/KB).
- Adapters multi-IDE (.cursor/, .windsurf/, etc.).

Quem mantem: framework (a cada release).
Quem altera: o usuario, **apos** instalar, no projeto dele.
Override sem fork: nao se aplica aqui — o usuario pode editar livremente.

### Camada 2 — `.specify/templates/` (spec-as-source artifacts)

Sao os **moldes preenchidos pelos agentes a cada PRD/story/ADR**. Define o ESQUELETO de artefatos:
- `prd.md` — molde do Product Requirements Document.
- `story.md` — molde da user story.
- `architecture.md` — molde do design tecnico.
- `decision-log.md` — molde do ADR.
- `prfaq.md`, `ux-design.md`, etc.

Quem mantem: framework (formato canonico) + usuario via `.specify/overrides/templates/<nome>.md` (adaptacao ao dominio sem fork).
Quem usa: agente (le o molde + escreve em `docs/<area>/`).
Override sem fork: **aplica aqui** (ADR-003). `update` nunca toca `overrides/`.

### Resumo da divisao

| Camada | Conteudo | Como vira artefato | Override sem fork? |
|---|---|---|---|
| `templates/` (raiz) | Docs-contrato + `.claude/` + `.specify/` completos | Copiado uma vez pelo install | Nao — usuario edita direto |
| `.specify/templates/<X>.md` | Moldes de PRD/story/ADR | Preenchido pelo agente a cada execucao | Sim, via `.specify/overrides/templates/<X>.md` |

## Consequencias

**Positivas:**
- Divisao explicita evita refactor errado ("vou unificar pra simplificar").
- `update` sabe o que pode tocar (templates raiz) e o que nunca toca (overrides + docs do usuario).
- Cliente que precisa de molde de PRD especifico (ex: PRD fiscal) sobrescreve em `.specify/overrides/templates/prd.md` sem perder atualizacao do framework.

**Negativas:**
- Nomes parecidos confundem ate quem le o codigo. Mitigado por (a) `docs/ARQUITETURA.md` documenta, (b) `docs/EXTENDENDO.md` explica passo a passo.

## Alternativas descartadas

- **Unificar em `templates/` so:** descartado. Spec-as-source precisa de override sem fork; bootstrap nao.
- **Mover `.specify/templates/` pra fora de `templates/`:** descartado. `templates/` e o que o install copia — `.specify/` precisa viver dentro.

## Como aplicar

- Template novo de bootstrap: adicionar em `templates/<area>/<nome>`.
- Molde novo de spec-as-source: adicionar em `templates/.specify/templates/<nome>.md` E declarar suporte a override em `bin/install.js` (resolve `.specify/overrides/templates/<nome>.md` primeiro).

## Relacionado

- [[ADR-003]] override sem fork (`.specify/overrides/`).
- [[ADR-004]] spec-driven com IDs.
- [[ADR-005]] dogfooding.
