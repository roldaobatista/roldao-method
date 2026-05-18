---
description: Decompoe iniciativa grande em multiplas stories (US-NNN) com dependencias. Use quando o pedido e "modulo financeiro completo", "refacar checkout", "adicionar painel administrativo" — coisa que nao cabe em 1 story.
argument-hint: "[descricao-do-epico]"
disable-model-invocation: true
---

# /epico — decompor iniciativa grande em stories

Voce vai pegar uma iniciativa grande e quebrar em stories filhas rastreaveis.

Use `$ARGUMENTS` como descricao do epico.

## Etapa 1 — Analista (brief curto)

Invoque `analista` em **modo 1 (brief)**:
- Problema, mercado, concorrentes, regulamentacao aplicavel.
- Vai pra `docs/research/epico-<slug>.md`.

Se o usuario ja deu contexto suficiente, voce pode pular essa etapa — pergunte antes.

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

## Etapa 5 — Criar arquivos das stories

Para cada US listada, criar arquivo `docs/stories/US-NNN-slug.md` via `/historia` (skeleton minimo, status `draft`).

## Saida final

```
EPICO DECOMPOSTO

PRD: docs/prd/PRD-NNN-slug.md
Stories criadas: <N> arquivos em docs/stories/
ADRs pendentes: <lista>

Ordem sugerida de execucao:
  1. ADR-NNNN: <decisao bloqueante 1>
  2. US-010 (tamanho M)
  3. US-011 (tamanho P, depende US-010)
  ...

Proximo passo: rodar /feature US-010 quando ADR-NNNN estiver aceito.
```

## Importante

- **Nao implementar nada.** So spec + decomposicao.
- **Ordem importa.** Stories com dependencia nao podem comecar antes da dependencia.
- **Estimativa relativa, nao absoluta.** P/M/G, nao "12 horas".
