---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Templates de spec

Moldes prontos pra **spec-driven development** (INV-002).

| Template | Quando usar |
|---|---|
| `product-brief.md` | Brief exploratório inicial (descoberta) — gerado pelo `analista` |
| `prfaq.md` | Press-release + FAQ (validar ideia antes de PRD) |
| `prd.md` | Iniciativa nova grande (vários meses) |
| `prd-fiscal.md` | PRD de feature fiscal (NF-e/tributo/SPED) |
| `brownfield-prd.md` | PRD para adoção em projeto que já existe |
| `epico.md` | Épico (`EP-NNN`) agrupando stories — gerado por `/epico` |
| `story.md` | User story rastreável (`US-NNN`) — gerado por `/historia` |
| `architecture.md` | Documento de arquitetura do projeto (1 por repo) |
| `fullstack-architecture.md` | Arquitetura fullstack (front + back + dados) |
| `ux-design.md` | Wireframe + estados + mensagens PT-BR (feature com UI) |
| `decision-log.md` | Log cronológico de decisões pequenas/médias |
| `headless-schemas.md` | Referência do contrato de frontmatter (espelha templates + hooks) |

ADR continua em `.claude/skills/gerar-adr-pt-br/templates/adr.md` (gravado em `docs/decisions/`).

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
| `EP-NNN` | Épico (agrupa stories) |
| `ARQ-NNN` | Documento de arquitetura |
| `ADR-NNNN` | Architecture Decision Record (em `docs/decisions/`) |

## Frontmatter obrigatório

Todo arquivo de spec tem frontmatter com:

```yaml
---
tipo: prd | story | epico | architecture | decision-log | ux-design | prfaq | product-brief | headless-schemas
id: <ID>   # alguns tipos de descoberta (prfaq, product-brief, ux-design) usam autor/data — ver headless-schemas.md
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
