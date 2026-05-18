---
tipo: headless-schemas
versao: 1.0
revisado-em: 2026-05-18
status: stable
owner: framework
---

# Headless Schemas — Validação programática dos templates

> JSON Schemas dos frontmatters de cada template `.specify/`. Permite validar artefatos via script (CI ou `npm run validar`).

## Como usar

```bash
node tools/validar-templates.js
```

O validador lê cada arquivo `docs/{prd,stories,epics,architecture,decisions,checkpoints,sprints,releases,retros,replanejamentos}/*.md`, extrai frontmatter e valida contra o schema correspondente abaixo.

## Schemas

### prd

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PRD",
  "type": "object",
  "required": ["tipo", "id", "titulo", "autor", "data", "status"],
  "properties": {
    "tipo":   { "const": "prd" },
    "id":     { "type": "string", "pattern": "^PRD-[0-9]{3,}$" },
    "titulo": { "type": "string", "minLength": 5 },
    "autor":  { "type": "string" },
    "data":   { "type": "string", "format": "date" },
    "status": { "enum": ["rascunho", "em-revisao", "aprovado", "implementado", "superseded"] },
    "patrocinador": { "type": "string" },
    "publico-alvo": { "type": "string" },
    "ids-aplicaveis": { "type": "array", "items": { "type": "string" } },
    "non-goals": { "type": "array", "items": { "type": "string" }, "minItems": 1 }
  }
}
```

### story

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Story",
  "type": "object",
  "required": ["tipo", "id", "titulo", "epico", "data", "status", "tamanho"],
  "properties": {
    "tipo":     { "const": "story" },
    "id":       { "type": "string", "pattern": "^US-[0-9]{3,}$" },
    "titulo":   { "type": "string", "minLength": 5 },
    "epico":    { "type": "string", "pattern": "^EP-[0-9]{3,}$" },
    "prd":      { "type": "string", "pattern": "^PRD-[0-9]{3,}$" },
    "data":     { "type": "string", "format": "date" },
    "tamanho":  { "enum": ["P", "M", "G"] },
    "status":   { "enum": ["pending", "em-andamento", "concluida", "bloqueada", "superseded"] },
    "ids-aplicaveis": { "type": "array", "items": { "type": "string" } },
    "depende-de": { "type": "array", "items": { "type": "string" } }
  }
}
```

### epico

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Epico",
  "type": "object",
  "required": ["tipo", "id", "titulo", "prd", "data", "status"],
  "properties": {
    "tipo":   { "const": "epico" },
    "id":     { "type": "string", "pattern": "^EP-[0-9]{3,}$" },
    "titulo": { "type": "string", "minLength": 5 },
    "prd":    { "type": "string", "pattern": "^PRD-[0-9]{3,}$" },
    "data":   { "type": "string", "format": "date" },
    "status": { "enum": ["rascunho", "em-andamento", "concluido", "superseded"] },
    "stories-previstas": { "type": "integer", "minimum": 1 }
  }
}
```

### architecture / ADR

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ADR",
  "type": "object",
  "required": ["tipo", "id", "titulo", "data", "status", "decisao"],
  "properties": {
    "tipo":   { "enum": ["adr", "architecture", "fullstack-architecture"] },
    "id":     { "type": "string", "pattern": "^(ADR|ARQ)-[0-9]{3,}$" },
    "titulo": { "type": "string", "minLength": 5 },
    "data":   { "type": "string", "format": "date" },
    "status": { "enum": ["proposto", "aceito", "rejeitado", "superseded"] },
    "decisao": { "type": "string", "minLength": 10 },
    "alternativas-consideradas": { "type": "array", "minItems": 1 },
    "non-goals": { "type": "array", "items": { "type": "string" } },
    "supersedes": { "type": "string", "pattern": "^ADR-[0-9]{3,}$" }
  }
}
```

### sprint

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Sprint",
  "type": "object",
  "required": ["sprint", "epico", "data-inicio", "data-fim", "status"],
  "properties": {
    "sprint":      { "type": "string", "pattern": "^SP-[0-9]{3,}$" },
    "epico":       { "type": "string", "pattern": "^EP-[0-9]{3,}$" },
    "data-inicio": { "type": "string", "format": "date" },
    "data-fim":    { "type": "string", "format": "date" },
    "status":      { "enum": ["planejada", "em-andamento", "concluida", "cancelada"] }
  }
}
```

### checkpoint

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Checkpoint",
  "type": "object",
  "required": ["tipo", "id", "data", "branch", "veredito"],
  "properties": {
    "tipo":     { "const": "checkpoint" },
    "id":       { "type": "string", "pattern": "^CHK-[0-9-]+" },
    "data":     { "type": "string", "format": "date" },
    "branch":   { "type": "string" },
    "veredito": { "enum": ["aprovado", "ressalvas", "bloqueado"] }
  }
}
```

### docs genéricos (qualquer outro .md em docs/)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DocGenerico",
  "type": "object",
  "required": ["owner", "revisado-em", "status"],
  "properties": {
    "owner":       { "type": "string" },
    "revisado-em": { "type": "string", "format": "date" },
    "status":      { "enum": ["draft", "rascunho", "stable", "deprecated", "superseded"] }
  }
}
```

## Como o validador resolve qual schema usar

1. Lê frontmatter
2. Se há campo `tipo:`, usa o schema com `"tipo": { "const": "X" }`
3. Senão, tenta inferir pelo path (ex: `docs/stories/*.md` → schema `story`)
4. Senão, aplica schema `DocGenerico`

## Erros de validação

`tools/validar-templates.js` printa erros no formato:

```
✗ docs/stories/US-007.md
  - falta campo obrigatório: tamanho
  - status "draft" não está em [pending, em-andamento, concluida, bloqueada, superseded]
```

CI quebra se houver qualquer erro.

## Adicionar schema novo

1. Adiciona JSON Schema neste arquivo.
2. Adiciona mapping (path glob → schema) em `tools/validar-templates.js`.
3. Roda `npm run validar` localmente.
4. Documenta no template correspondente.
