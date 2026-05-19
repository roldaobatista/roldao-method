---
tipo: headless-schemas
versao: 2
revisado-em: 2026-05-18
status: stable
owner: framework
---

# Contrato de frontmatter dos artefatos `.specify/`

> **Fonte de verdade:** os próprios templates em `.specify/templates/` **e** os hooks que os aplicam mecanicamente. Este documento só **espelha** esse contrato — se divergir do template/hook, o template/hook vence. Não existe validação por JSON Schema; a validação real é feita pelos hooks abaixo (exit 2 = bloqueio).

## Quem aplica o quê

| Hook | O que exige | Onde |
|---|---|---|
| `paths-frontmatter-validator.sh` | Todo `.md` em `docs/` começa com `---` e tem `owner`, `revisado-em`, `status` | qualquer `docs/**/*.md` |
| `validate-story-approvals.sh` | Story só vira `status: entregue` com bloco `aprovacoes:` completo | `docs/stories/US-*.md` |
| `validate-story-dependencies.sh` | `depende-de:` aponta para stories já entregues | `docs/stories/US-*.md` |

`tools/validar-templates.js` valida os **templates do framework** (frontmatter presente, contagens, versão, doc-vs-código) — ele **não** lê `docs/` do projeto-cliente. A validação dos artefatos do cliente é a dos hooks acima, em tempo de escrita.

## Contrato por tipo (campos reais dos templates)

### Spec-as-source — vão para `docs/`, exigem `owner`/`revisado-em`/`status`

**prd** (`docs/prd/PRD-NNN-*.md`) — também `prd-fiscal`, `brownfield-prd` (com `subtipo:`)
```yaml
tipo: prd            # subtipo: fiscal | brownfield (opcional)
id: PRD-NNN
versao: 1
status: draft        # draft | aprovado | em-andamento | entregue | arquivado
owner: <responsável>
revisado-em: AAAA-MM-DD
```

**epico** (`docs/epicos/EP-NNN-*.md`)
```yaml
tipo: epico
id: EP-NNN
versao: 1
status: draft        # draft | aprovado | em-andamento | entregue | arquivado
prd: PRD-NNN
owner: <responsável>
revisado-em: AAAA-MM-DD
tamanho: G           # M | G | XG (soma das stories)
```

**story** (`docs/stories/US-NNN-*.md`)
```yaml
tipo: story
id: US-NNN
versao: 1
status: draft        # draft | em-andamento | entregue | bloqueada
prd: PRD-NNN
epico: EP-NNN
tamanho: P           # P | M | G
owner: <responsável>
revisado-em: AAAA-MM-DD
depende-de: []        # lista de US-NNN que precisam vir antes
aprovacoes: []        # audit trail — ver checklist audit-trail.md
```

**architecture / ADR** (`docs/arquitetura/ARQ-NNN.md`, `docs/decisions/ADR-NNN-*.md`)
```yaml
tipo: architecture   # subtipo: fullstack (opcional) — ADR usa o template gerar-adr-pt-br
id: ARQ-NNN          # ADR: ADR-NNN
versao: 1
status: draft        # draft | aceito | superseded
owner: tech-lead
revisado-em: AAAA-MM-DD
```

**decision-log** (`docs/decisions/LOG-DECISOES.md`)
```yaml
tipo: decision-log
id: LOG-DECISOES
versao: 1
status: stable
owner: <responsável>
revisado-em: AAAA-MM-DD
```

### Pré-spec / descoberta — usam `autor`/`data` (não vão para `docs/` versionado de spec)

`product-brief`, `prfaq`, `ux-design` usam `tipo / versao / data / autor / status: rascunho`. **Não** colocar em `docs/` sem adicionar `owner`/`revisado-em`/`status` — o hook `paths-frontmatter-validator.sh` bloqueia. O lugar deles é `docs/research/` (brief) ou anexo da story; ao promover para spec, converter o frontmatter para o formato spec-as-source acima.

## Regra de ouro

Um campo só é "obrigatório" se um hook o exige. Tudo aqui foi derivado dos templates e dos hooks reais — ao mudar um template, atualize esta tabela na mesma mudança (o gate doc-vs-código não cobre este texto; é disciplina de quem edita o template).
