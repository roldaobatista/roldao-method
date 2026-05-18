---
description: Gate mecânico entre épico e implementação — checa se PRD/ARQ/stories estão prontos e GRAVA arquivo de status que /feature consome.
argument-hint: "[epico-id]"
disable-model-invocation: true
---

# /readiness — gate antes de partir de épico pra dev

Use depois de `/epico` e antes de `/feature` (primeira story do épico). **Sem o arquivo de status gerado aqui, `/feature` recusa rodar** — o hook `require-readiness-before-feature.sh` bloqueia.

`$ARGUMENTS` = épico de referência (`EP-NNN`).

## Etapa 1 — Coletar (investigador)

Invoque `investigador`:
- Localiza `docs/epicos/EP-NNN-*.md` (glob — o arquivo tem slug) e stories filhas em `docs/stories/US-*.md`.
- Localiza PRD-NNN se referenciado no frontmatter do épico.
- Localiza ADRs criados pro épico (`docs/decisions/`).
- Lista artefatos por status.

## Etapa 2 — Rodar checklists em paralelo

Rode em paralelo os checklists obrigatórios do `.specify/checklists/`:

1. **pm-readiness.md** — PRD pronto? (auditor-produto)
2. **architecture-readiness.md** — ARQ pronta? ADR escrito pros pontos com tradeoff real? (tech-lead)
3. **story-dod.md** — cada story tem AC testável, non-goals, estimativa? (gerente-produto)

Adicional se aplicável:

4. **lgpd-privacy-review.md** se feature toca dado pessoal (addon `lgpd-compliance`).
5. **fiscal-compliance.md** se feature toca NF-e/NFS-e/Reforma (addon `fiscal-br-completo`).
6. **pix-compliance.md** se feature toca Pix (addon `fintech-br`).

## Etapa 3 — Veredito consolidado (relatório humano)

Salve em `docs/readiness/EP-NNN-relatorio-AAAA-MM-DD.md`:

```markdown
# READINESS REPORT — EP-NNN

## Resumo
- 🟢 N checklists passados
- 🟡 N com ressalvas
- 🔴 N bloqueando

## Gaps bloqueantes (precisam resolver ANTES de dev começar)

| Item | Origem | Ação |
|---|---|---|

## Ressalvas (não bloqueia, mas anotar)

| Item | Origem |
|---|---|

## Veredito final
- [ ] PRONTO PRA DEV
- [ ] NÃO PRONTO

## Próximo passo
<ação concreta>
```

## Etapa 4 — Gerar arquivo de status mecânico (OBRIGATÓRIO)

**Sempre** gerar `docs/readiness/EP-NNN-status.md` com este frontmatter — é o que `/feature` lê:

```markdown
---
tipo: readiness-status
epico: EP-NNN
status: PRONTO    # ou NAO_PRONTO — único campo lido pelo hook
data: AAAA-MM-DD
relatorio: docs/readiness/EP-NNN-relatorio-AAAA-MM-DD.md
checklists-passados: [pm-readiness, architecture-readiness, story-dod]
ressalvas: []     # lista textual, opcional
---

# Status de readiness — EP-NNN

Gerado por `/readiness` em AAAA-MM-DD.

Status: PRONTO PRA DEV | NÃO PRONTO

Ver relatório completo em [link].
```

> **Importante:** se há ALGUM gap bloqueante, `status: NAO_PRONTO`. Não tem meio termo. Ressalvas não-bloqueantes ficam listadas mas não impedem `PRONTO`.

## Etapa 5 — Decisão

- **Tudo verde (`status: PRONTO`):** mover primeira story pra "em andamento" e rodar `/feature US-NNN`. Hook libera.
- **Bloqueio (`status: NAO_PRONTO`):** voltar pra `/prd` ou `/epico` pra resolver. Hook recusa `/feature` até atualização do status. NÃO começar dev.
- **Só ressalvas:** seguir como `PRONTO`, mas registrar em `docs/epicos/EP-NNN-*.md` na seção `## Débito conhecido`.

## Importante

- **Não vale aprovar com "vamos resolver durante dev"** — o ponto do gate é separar planejamento de execução.
- **O `status:` no frontmatter é o que o hook valida.** Não escreva `status: PRONTO` se há gaps bloqueantes — você está enganando o gate, não passando dele.
- **REGRA #0 vale aqui também** — se há ambiguidade no estado dos artefatos, ler primeiro (não chutar).
- Re-rodar `/readiness EP-NNN` quando ressalvas viram bloqueio ou escopo muda — sobrescreve o status anterior.
