---
description: Cria um arquivo de user story (US-NNN) em docs/stories/ preenchendo o template .specify/templates/story.md. Persiste a story em disco — nao deixa na conversa.
argument-hint: "[descricao-curta-da-historia]"
disable-model-invocation: true
---

# /historia — gravar user story em disco

Voce vai pegar uma demanda informal e transformar em arquivo `docs/stories/US-NNN-slug.md` rastreavel. Documento e estado compartilhado (INV-001).

Use `$ARGUMENTS` como descricao inicial.

## Etapa 1 — Numero e slug

1. Liste `docs/stories/` (criar se nao existir).
2. Identifique o maior `US-NNN` existente; o numero novo e o proximo.
3. Slug em kebab-case curto (3-5 palavras) a partir de `$ARGUMENTS`.

Exemplo: `docs/stories/US-007-cadastro-cliente-pj.md`.

## Etapa 2 — Gerente de Produto (modo C)

Invoque `gerente-produto` em **modo C (story)**:
- Le `.specify/templates/story.md` como base.
- Preenche todos os campos do template usando `$ARGUMENTS` + perguntas de desambiguacao.
- Lista AC testaveis (AC-NNN-1, AC-NNN-2, ...).
- Declara non-goals.
- Cita regulamentacao BR aplicavel (LGPD-NNN, FISCAL-NNN).

Salva em `docs/stories/US-NNN-slug.md`.

## Etapa 3 — Investigador (preenche contexto tecnico)

Invoque `investigador`:
- Le codigo nas areas tocadas pela story.
- Preenche a secao "Contexto tecnico" do story file:
  - Arquivos afetados
  - Entidades/handlers
  - Migrations necessarias
  - ADRs relacionados

**Nao escreve codigo.** So preenche o arquivo.

## Etapa 4 — Validar com usuario

Apresente:
```
Story criada: docs/stories/US-NNN-slug.md

Resumo:
- Como: <persona>
- Quero: <acao>
- Para: <beneficio>

AC: <N> criterios
Non-goals: <N> itens
Regras BR aplicaveis: <lista>

Esta correto? Algum AC esta vago ou faltando?
```

Confirmar antes de seguir.

## Saida final

```
HISTORIA CRIADA

Arquivo: docs/stories/US-NNN-slug.md
Status: draft
Proximos passos:
  - revisar com gerente-produto se algo precisa ajustar
  - chamar /feature US-NNN quando for implementar
  - chamar tech-lead se exigir ADR
```

## Importante

- **Sem jargao tecnico** com usuario nao-tecnico.
- **Nao codar** nesta etapa. So spec.
- **Frontmatter completo** (hook `paths-frontmatter-validator` exige).
