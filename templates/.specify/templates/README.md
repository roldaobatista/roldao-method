---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Templates de spec

Moldes prontos pra **spec-driven development** (INV-002).

| Template | Quando usar | Tamanho médio |
|---|---|---|
| `prd.md` | Iniciativa nova grande (vários meses de trabalho) | 1-3 páginas |
| `story.md` | User story rastreável (`US-NNN`). Gerado por `/historia` | 1 página |
| `architecture.md` | Documento de arquitetura do projeto (1 só por repo) | 2-4 páginas |
| `decision-log.md` | Log cronológico de decisões pequenas/médias | linha única por decisão |

ADR continua em `.claude/skills/gerar-adr-pt-br/templates/adr.md`.

## Override por projeto (sem fork)

Precisa de um template diferente do oficial pro **seu** projeto (campo extra no PRD, seção própria na story)? **Não edite os arquivos desta pasta** — `update` sobrescreve. Coloque sua versão em:

```
.specify/overrides/templates/<nome>.md     ← ex.: .specify/overrides/templates/prd.md
```

**Regra de precedência (aplicada por agentes e comandos):** ao buscar um template, sempre olhe `.specify/overrides/templates/<nome>.md` **primeiro**; só caia em `.specify/templates/<nome>.md` se não houver override. Tudo sob `.specify/overrides/` é tratado como do projeto e **nunca** é tocado por `install`/`update`. Veja `.specify/overrides/README.md`.

## Convenção de IDs

| Prefixo | Significado |
|---|---|
| `PRD-NNN` | Product Requirements Document |
| `US-NNN` | User Story |
| `AC-NNN-N` | Acceptance Criteria (filho da US-NNN) |
| `T-NNN` | Task (filho da US-NNN) |
| `ARQ-NNN` | Documento de arquitetura |
| `ADR-NNNN` | Architecture Decision Record |

## Frontmatter obrigatório

Todo arquivo de spec tem frontmatter com:

```yaml
---
tipo: prd | story | architecture | decision-log
id: <ID>
versao: <inteiro>
status: draft | stable | deprecated
owner: <nome>
revisado-em: AAAA-MM-DD
---
```

Hook `paths-frontmatter-validator.sh` verifica.

## Versionamento

Spec é **viva**. Mudou requisito → incrementar `versao:` + nova linha em "Histórico". Não apagar versão antiga sem deprecar.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
