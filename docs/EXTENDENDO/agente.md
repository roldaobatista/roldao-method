---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Criar um agente novo

Em `.claude/agents/<nome>.md`:

```markdown
---
name: nome-do-agente
description: 1 frase em PT-BR sobre quando invocar.
tools: Read, Glob, Grep, Edit, Write
model: inherit
color: blue
identity:
  nome: "Camila"
  icone: "📝"
---

# Nome do agente

Você é a Camila 📝 — _(papel curto)_.

## Princípios
1. PT-BR sem jargão.
2. Verifica antes de afirmar.

## Modos
(se houver — gatilho de cada)

## Saída esperada
(formato exato — bloco markdown, JSON, etc.)
```

## Checklist

- Frontmatter completo (`name`, `description`, `tools`, `model`, `color`)
- `tools:` restrito ao mínimo (SEC-004)
- Não duplica agente existente — leia os 13 antes
- Inclui exemplo de saída

Valide com `node tools/validar-templates.js`.

## Referência

- `templates/.claude/agents/dev-senior.md` — exemplo de agente operacional
- `templates/.claude/agents/analista.md` — exemplo de agente de pesquisa
- `templates/.claude/agents/maestro.md` — exemplo de orquestrador
