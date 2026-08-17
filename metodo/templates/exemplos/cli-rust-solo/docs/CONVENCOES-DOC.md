---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 80
proposito: convenções de documentação do tempo-cli — modo enxuto, projeto solo
---

# Convenções de documentação — tempo-cli

Modo enxuto. Sem time, sem comunidade externa, sem deploy. Convenções minimalistas.

## 1. Nomenclatura

- `.md` em kebab-case.
- ADRs: `ADR-NNNN-<slug>.md`.

## 2. Idioma

- Documentação: **PT-BR**.
- Código, mensagens visíveis ao usuário do CLI (`--help`, erros): **inglês** (convenção CLI).
- Mensagens de commit: **PT-BR** com prefixo curto em inglês (`fix:`, `feat:`, `docs:`).

## 3. Frontmatter

```yaml
---
owner: roldao
revisado-em: <YYYY-MM-DD>
status: draft | stable | deprecated
idioma: pt-BR
limite-linhas: <N>
proposito: <1 frase>
---
```

ADRs usam schema próprio. Demais arquivos seguem o padrão acima.

## 4. Limites

- README: 150.
- AGENTS/CLAUDE/REGRAS: 200.
- ADR: 100.

## 5. Sem emoji

Documentação técnica sem emoji. Exceções: marcações universais do método (🟢🟡🔵⚪).

## 6. Markdown style

- ATX, listas com `-`, blocos de código com linguagem, tabelas com cabeçalho.
