---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: convenções de documentação do conciliab — nomenclatura, frontmatter, idioma, schemas alternativos para ADR
---

# Convenções de documentação — conciliab

Ler **antes** de criar qualquer arquivo `.md`. Auditor `auditor-doc-quality` valida.

## 1. Nomenclatura de arquivo

- **kebab-case** para todos os `.md`: `atender-pedido-eliminacao.md`, não `AtenderPedidoEliminacao.md` nem `atender_pedido_eliminacao.md`.
- ADRs: `ADR-NNNN-<slug-kebab>.md` com NNNN sequencial 4 dígitos.
- Runbooks: nome do procedimento em kebab-case.
- Post-mortems: `YYYY-MM-DD-slug-do-incidente.md`.

## 2. Idioma

- Documentação: **PT-BR**.
- Identificadores no código, comentários inline em código: **inglês**.
- Mensagens de commit: **PT-BR** (commits são lidos pelo Roldão, que não programa).
- Mensagens de PR: PT-BR.

## 3. Frontmatter padrão

Todos os `.md` em `docs/` e raiz têm frontmatter no formato:

```yaml
---
owner: <slug-curto>
revisado-em: <YYYY-MM-DD>
status: draft | stable | deprecated
idioma: pt-BR
limite-linhas: <inteiro>
proposito: <1 frase curta — usada por auditor-doc-quality e índice>
---
```

Campos obrigatórios: `owner`, `revisado-em`, `status`, `idioma`, `limite-linhas`, `proposito`.

## 4. Schemas alternativos permitidos

- **ADRs** (em `docs/adr/`) usam schema próprio (`id`, `titulo`, `data-proposta`, `data-aceite`, `depende-de`, `bloqueia-fase`, `superseded-by`, `revisado-em`) em vez do padrão. Decisão registrada em [`adr/ADR-0000-uso-de-ia.md`](./adr/ADR-0000-uso-de-ia.md).
- **Manifestos de agente** (em `.claude/agents/*.md`) usam `name`, `description`, `tools`, `model` no nível raiz com bloco `metadata:` aninhado.

## 5. Limite de linhas

`limite-linhas` declarado no frontmatter é enforçado pelo hook `doc-line-counter.sh` em PreToolUse, antes de salvar. Se passar, fatiar o documento em sub-docs e linkar via `INDICE.md`.

Limites recomendados:
- README/AGENTS/CLAUDE: 200-300.
- ADR: 100.
- Spec/plan/tasks: 100-150.
- Threat-model/ROPA: 250-280.
- Runbook: 100.

## 6. Ordem das seções obrigatórias

Top-down em todo `.md`:

1. Frontmatter (entre `---`).
2. Cabeçalho HTML opcional: `<!-- template: ... | uso: ... | referência: ... -->`.
3. Título principal (`# <Título>`).
4. Quote de hierarquia (quando aplicável: AGENTS/CLAUDE/REGRAS/SECURITY).
5. Corpo numerado por seções (`## 1.`, `## 2.`...).

## 7. Links

- Sempre relativos dentro do mesmo repositório (`./docs/...`, `../REGRAS-INEGOCIAVEIS.md`).
- Links externos devem ter texto descritivo, não URL crua.
- Anchors válidos: lowercase, hífen no lugar de espaços (`#secao-titulo`).

## 8. Markdown style

- Cabeçalhos em ATX (`#`, `##`), nunca setext.
- Listas com `-` (hífen), nunca `*` nem `+`.
- Tabela sempre com cabeçalho alinhado e `|---|` separador.
- Bloco de código sempre com linguagem declarada (` ```python `, ` ```bash `).

## 9. Sem emoji

Documentação técnica não usa emoji. Exceção: marcações universais do manual canônico (🟢 OBRIGATÓRIO, 🟡 RECOMENDADO, 🔵 CONDICIONAL, ⚪ OPCIONAL).

## 10. Atualização

- `revisado-em` sempre atualizado no mesmo PR que muda o conteúdo.
- Doc com `revisado-em > 365 dias` em path crítico gera warning de staleness na abertura da sessão (hook `staleness-checker.sh`).
