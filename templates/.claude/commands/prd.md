---
description: Cria um PRD (Product Requirements Document) em docs/prd/ usando o template oficial. Use quando uma iniciativa e grande o suficiente pra justificar planejamento formal (mais de 3 stories ou mais de 2 semanas de trabalho).
argument-hint: "[descricao-da-iniciativa]"
disable-model-invocation: true
---

# /prd — gerar Product Requirements Document

Voce vai conduzir a criacao de um PRD completo em PT-BR.

Use `$ARGUMENTS` como descricao inicial da iniciativa.

## Etapa 1 — Validar tamanho

Antes de tudo, pergunte ou avalie:
- E uma iniciativa que cabe em 1 story? Use `/historia` em vez disso.
- E uma feature de 3-5 stories? Use `/feature` ou `/epico`.
- E uma iniciativa de varias semanas / multiplos modulos? **Entao SIM, PRD.**

Se for muito pequeno, redirecione.

## Etapa 2 — Analista (modo 1 — brief)

Invoque `analista` em **modo 1**:
- Problema, mercado, concorrentes BR, regulamentacao aplicavel.
- Salva `docs/research/<slug>.md`.

Apresentar brief ao usuario, confirmar antes de prosseguir.

## Etapa 3 — Gerente de Produto (modo B — PRD)

Invoque `gerente-produto` em **modo B**:
- Le brief do analista.
- Le `templates/.specify/templates/prd.md` como base.
- Numero PRD novo: olhe `docs/prd/` e pegue o proximo `PRD-NNN`.
- Slug em kebab-case curto.
- Preenche todas as 9 secoes do template.
- Salva em `docs/prd/PRD-NNN-slug.md`.

## Etapa 4 — Tech Lead (impacto arquitetural)

Invoque `tech-lead`:
- Le PRD.
- Identifica decisoes arquiteturais que precisam ADR.
- Lista 1-3 ADRs a serem escritos antes de comecar implementacao.
- Atualiza `docs/arquitetura/ARQ-001.md` (componente novo, integracao nova, etc.) se aplicavel.

## Etapa 5 — UX Designer (se a iniciativa toca interface)

Se a iniciativa tem telas/forms/fluxos visiveis, invocar `ux-designer`:
- Gera wireframes ASCII em `docs/ux/UX-NNN-<slug>.md`.
- Estados (vazio/preenchendo/validando/erro/sucesso).
- Mensagens PT-BR.

Pular se for backend puro / integracao / fiscal.

## Etapa 6 — Decomposicao em stories

Mesmo PM (modo D):
- Olha o PRD.
- Quebra em stories filhas (US-NNN, US-NNN+1, ...).
- Atualiza secao 4 do PRD.
- Para cada story, criar arquivo skeleton em `docs/stories/US-NNN-slug.md`.

## Saida final

```
PRD CRIADO

Arquivo: docs/prd/PRD-NNN-slug.md
Brief de pesquisa: docs/research/<slug>.md
UX (se aplicavel): docs/ux/UX-NNN-<slug>.md
Stories filhas: <N> em docs/stories/
ADRs pendentes: <lista>

Proximo passo:
  1. revisar PRD com voce
  2. escrever ADRs bloqueantes
  3. rodar /feature US-NNN da primeira story
```

## Importante

- **PT-BR puro.** Sem "stakeholders", "MVP", "OKR" sem traduzir.
- **Non-goals explicitos** (INV-003). Sempre.
- **Metricas de sucesso** com numero concreto, nao "melhorar a experiencia".
- **Regulamentacao BR** citada na secao 8 (LGPD-NNN, FISCAL-NNN).
