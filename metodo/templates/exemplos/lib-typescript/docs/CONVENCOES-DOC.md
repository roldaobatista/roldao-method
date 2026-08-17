---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 120
proposito: convenções de documentação do @conciliab/csv-parser — nomenclatura, idioma misto PT-BR+EN, frontmatter
---

# Convenções de documentação — @conciliab/csv-parser

Lib OSS publicada em npm. Convenções alinhadas com comunidade JavaScript/TypeScript.

## 1. Nomenclatura de arquivo

- `.md` em **kebab-case**: `dependency-policy.md`, não `DependencyPolicy.md`.
- ADRs: `ADR-NNNN-<slug>.md`.
- CHANGELOG seguindo `changesets` (gerado automático).

## 2. Idioma (atenção: misto)

- Documentação em `.md`: **PT-BR** (`README.md` tem tradução EN no fim para comunidade).
- README na raiz: **PT-BR** principal + seção `## English version` no fim.
- Código, identificadores, JSDoc, error messages: **inglês** (compat npm + comunidade OSS internacional).
- Mensagens de commit: **inglês** (alinhamento com Conventional Commits + changesets).
- Mensagens de PR: **inglês** (visíveis a contribuidores externos).

## 3. Frontmatter

```yaml
---
owner: <slug>
revisado-em: <YYYY-MM-DD>
status: draft | stable | deprecated
idioma: pt-BR
limite-linhas: <N>
proposito: <1 frase>
---
```

Campos obrigatórios todos. ADRs usam schema próprio (ver [`adr/ADR-0000-uso-de-ia.md`](./adr/ADR-0000-uso-de-ia.md)).

## 4. Limites

- README: 150.
- AGENTS: 250.
- ADR: 100.
- Spec/plan/tasks: 100.

## 5. Snapshots de teste

- Localização: `tests/__snapshots__/`.
- Conteúdo: **apenas sintético**, gerado por `tests/fixtures/builders.ts`.
- **Proibido** commitar extrato bancário real (INV-AGENT-008 especializada — ver REGRAS).

## 6. Sem emoji em docs técnicos

Marcações universais do método (🟢🟡🔵⚪) permitidas em listas de "obrigatório/recomendado/condicional/opcional". README pode usar badges (shield.io) — eles não são emoji.

## 7. Markdown style

- Cabeçalhos ATX.
- Listas com `-`.
- Bloco de código com linguagem (` ```ts `, ` ```bash `).
- Tabelas com cabeçalho.
