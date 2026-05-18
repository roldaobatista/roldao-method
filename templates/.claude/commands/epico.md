---
description: Decompoe iniciativa grande em multiplas stories (US-NNN) com dependencias. Use quando o pedido e "modulo financeiro completo", "refacar checkout", "adicionar painel administrativo" — coisa que nao cabe em 1 story.
argument-hint: "[descricao-do-epico]"
disable-model-invocation: true
---

# /epico — decompor iniciativa grande em stories

Voce vai pegar uma iniciativa grande e quebrar em stories filhas rastreaveis.

Use `$ARGUMENTS` como descricao do epico.

## Etapa 0 — Detectar contexto pre-existente (sem perguntar)

Antes de invocar agente, ROTEIE:

1. Liste `docs/prd/` — existe algum `PRD-NNN-*.md` cujo titulo/conteudo bate com o que `$ARGUMENTS` descreve? Use grep curto pra confirmar.
2. Liste `docs/research/` — existe `epico-<slug>.md` recente sobre o tema?
3. Verifique se `$ARGUMENTS` ja vem com contexto rico (>=3 frases descrevendo problema + objetivo + restricoes).

**Decida sozinho** (sem pergunta proibida — INV-AGENT-006):

- **Caso A — Tem PRD existente alinhado:** pule Etapas 1-2 e va direto pra Etapa 3 (decomposicao) usando o PRD existente.
- **Caso B — Tem research mas sem PRD:** pule Etapa 1 (analista), va pra Etapa 2 (gerente-produto cria PRD com base no research).
- **Caso C — `$ARGUMENTS` ja e rico mas sem doc:** pule Etapa 1, va pra Etapa 2 com o proprio `$ARGUMENTS` como brief.
- **Caso D — Pedido seco, sem contexto:** rode Etapa 1 (analista — brief) primeiro.

Reporte ao usuario nao-tecnico em 1 frase o caminho escolhido: "Vou direto pra decomposicao porque ja temos PRD-007" ou "Como nao tem brief, vou comecar pesquisando". **Nao pergunte se pode** — execute.

## Etapa 1 — Analista (brief curto) — opcional

Aplicavel apenas no Caso D acima. Invoque `analista` em **modo 1 (brief)**:
- Problema, mercado, concorrentes, regulamentacao aplicavel.
- Vai pra `docs/research/epico-<slug>.md`.

## Etapa 2 — Gerente de Produto (modo B — PRD)

Invoque `gerente-produto` em **modo B**:
- Le `templates/.specify/templates/prd.md` como base.
- Preenche tudo, mas SEM listar US ainda na secao 4 (vai vir da decomposicao).
- Salva em `docs/prd/PRD-NNN-slug.md`.

## Etapa 3 — Gerente de Produto (modo D — decomposicao)

Mesmo agente, modo D:
- Olha o PRD recem-criado.
- Quebra em stories filhas (US-NNN, US-NNN+1, ...).
- Para cada story: titulo, papel, acao, beneficio, **dependencias** (quais US precisam vir antes).
- Tamanho relativo: P (1-2 dias), M (3-5 dias), G (1-2 semanas).
- Atualiza secao 4 do PRD com a tabela de stories.

Saida em tabela:

```
| US     | titulo                          | depende | tamanho |
|--------|---------------------------------|---------|---------|
| US-010 | cadastro de cliente PJ          | -       | M       |
| US-011 | validacao de CNPJ (alfanum.)    | US-010  | P       |
| US-012 | emissao de NF-e basica          | US-010  | G       |
| US-013 | contingencia SVC-AN             | US-012  | M       |
```

## Etapa 4 — Tech Lead (architecture impact)

Invoque `tech-lead`:
- Le PRD + tabela de stories.
- Identifica decisoes arquiteturais que precisam ADR.
- Lista 1-3 ADRs a escrever ANTES de comecar a primeira story.
- Atualiza `docs/arquitetura/ARQ-001.md` se necessario.

## Etapa 5 — Criar arquivo do epico (EP-NNN.md)

Antes de criar as stories filhas, criar o arquivo do **proprio epico**:

1. Numero novo: olhe `docs/epicos/` e pegue o proximo `EP-NNN`.
2. Use `templates/.specify/templates/epico.md` como base.
3. Preencher: PRD pai, stories filhas (tabela), ADRs bloqueantes, readiness pendente, non-goals, metricas.
4. Salvar em `docs/epicos/EP-NNN-slug.md`.

> Esse arquivo e a unidade operacional — agrupa stories, declara ordem e ADRs bloqueantes. O hook `require-readiness-before-feature.sh` le `docs/readiness/EP-NNN-status.md` para autorizar `/feature`; o arquivo EP-NNN.md e a referencia narrativa do epico.

## Etapa 6 — Criar arquivos das stories

Para cada US listada na tabela, criar arquivo `docs/stories/US-NNN-slug.md` via `/historia` (skeleton minimo, status `draft`). O frontmatter de cada US deve apontar `epico: EP-NNN` corretamente para que o hook `require-readiness-before-feature.sh` consiga rastrear de volta.

## Saida final

```
EPICO DECOMPOSTO

PRD: docs/prd/PRD-NNN-slug.md
Epico: docs/epicos/EP-NNN-slug.md
Stories criadas: <N> arquivos em docs/stories/
ADRs pendentes: <lista>

Ordem sugerida de execucao:
  1. ADR-NNNN: <decisao bloqueante 1>
  2. US-010 (tamanho M)
  3. US-011 (tamanho P, depende US-010)
  ...

Proximo passo: rodar /readiness EP-NNN antes da primeira /feature.
```

## Importante

- **Nao implementar nada.** So spec + decomposicao.
- **Ordem importa.** Stories com dependencia nao podem comecar antes da dependencia.
- **Estimativa relativa, nao absoluta.** P/M/G, nao "12 horas".
- **EP-NNN.md e separado de PRD-NNN.md.** PRD descreve a iniciativa; epico e a unidade operacional com tabela de stories e ordem de execucao.
