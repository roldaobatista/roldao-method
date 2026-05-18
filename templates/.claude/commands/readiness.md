---
description: Gate entre épico e implementação — checa se PRD/ARQ/stories estão prontos pra dev começar sem ambiguidade.
argument-hint: "[epico-id]"
disable-model-invocation: true
---

# /readiness — gate antes de partir de épico pra dev

Use depois de `/epico` e antes de `/feature` (primeira story). Garante que o trabalho de descoberta/planejamento está mesmo concluído e que dev não vai parar 10 vezes pra perguntar.

`$ARGUMENTS` = épico de referência (`EP-NNN`).

## Etapa 1 — Coletar (investigador)

Invoque `investigador`:
- Localiza `docs/epics/EP-NNN.md` e stories filhas.
- Localiza PRD-NNN se referenciado.
- Localiza ADRs criados pro épico.
- Lista artefatos por status.

## Etapa 2 — Rodar checklists em paralelo

Rode os 3 checklists do `.specify/checklists/`:

1. **pm-readiness.md** — PRD pronto? (auditor-produto)
2. **architecture-readiness.md** — ARQ pronta? ADR escrito pros pontos com tradeoff real? (tech-lead)
3. **story-dod.md** — cada story tem AC testável, non-goals, estimativa? (gerente-produto)

Adicional se aplicável:
4. **lgpd-privacy-review.md** se feature toca dado pessoal (dpo-virtual, se addon instalado)
5. **fiscal-compliance.md** se feature toca NF-e/NFS-e/Reforma (fiscal-br)
6. **pix-compliance.md** se feature toca Pix (pix-arch, se addon instalado)

## Etapa 3 — Veredito consolidado

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

## Veredito
- [ ] PRONTO PRA DEV — pode rodar `/feature US-NNN`
- [ ] NÃO PRONTO — resolver bloqueios primeiro

## Próximo passo
<ação concreta>
```

## Etapa 4 — Decisão

- **Tudo verde:** mover primeira story pra "em andamento" e rodar `/feature US-NNN`.
- **Bloqueio:** voltar pra `/prd` ou `/epico` pra resolver. NÃO começar dev.
- **Só ressalvas:** seguir, mas registrar em `docs/epics/EP-NNN.md` como `## Débito conhecido`.

## Importante

- **Não vale aprovar com "vamos resolver durante dev"** — o ponto do gate é separar planejamento de execução.
- **REGRA #0 vale aqui também** — se há ambiguidade no estado dos artefatos, ler primeiro (não chutar).
