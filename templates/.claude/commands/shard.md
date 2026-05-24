---
description: Quebra documento longo (PRD/ARQ/CHANGELOG) em chunks navegáveis com índice raiz. Evita estourar contexto do agente.
argument-hint: "[caminho/do/documento.md]"
disable-model-invocation: true
allowed-tools: Task, Read, Glob, Grep, Edit, Write, Bash(mkdir:*), Bash(git:*)
---

# /shard — quebra documento grande em chunks navegáveis

Use quando um PRD/ARQ/CHANGELOG passa de ~500 linhas e fica difícil:
- pro agente carregar inteiro (estoura contexto)
- pro humano achar a seção (busca lenta)
- pra git diff (revisão difícil)

`$ARGUMENTS` = caminho do documento a fatiar.

## Etapa 1 — Análise (investigador)

Invoque `investigador`:
- Conta linhas do documento.
- Identifica seções de nível 2 (`##`) como pontos naturais de quebra.
- Lista quem cita esse documento (`grep -r` por nome) — esses precisam continuar funcionando.

Se documento tem menos de 500 linhas → recomendar **NÃO fatiar** (custo de manutenção > benefício).

## Etapa 2 — Plano de fatiamento

Saída pro usuário:

```
Documento: docs/prd/PRD-007.md (2.143 linhas)
Seções de nível 2: 14
Proposta de fatiamento:

docs/prd/PRD-007/index.md          (50 linhas)   ← índice + frontmatter
docs/prd/PRD-007/01-contexto.md    (180 linhas)
docs/prd/PRD-007/02-personas.md    (120 linhas)
docs/prd/PRD-007/03-jornadas.md    (220 linhas)
docs/prd/PRD-007/04-frs.md         (450 linhas)
docs/prd/PRD-007/05-non-goals.md   (80 linhas)
docs/prd/PRD-007/06-metricas.md    (90 linhas)
docs/prd/PRD-007/07-ux.md          (160 linhas)
docs/prd/PRD-007/08-tecnico.md     (290 linhas)
... etc

Referências que apontam pro PRD-007.md original (15):
  - docs/stories/US-101.md
  - docs/stories/US-102.md
  - ...

Vão ser atualizadas pra apontar pro novo index.md.
```

Execute o sharding direto — é refactor de doc, aditivo e reversível (INV-AGENT-006). Reporte: pasta criada, fatias geradas, referências atualizadas. Se o usuário discordar, ele reverte.

## Etapa 3 — Execução

1. Cria pasta `docs/prd/PRD-007/`.
2. Gera `index.md` com frontmatter original + sumário com links pra cada fatia.
3. Move cada seção `##` pra arquivo separado nomeado `NN-slug.md`.
4. Cada fatia tem frontmatter próprio (`parent: index.md`, `slice: NN`).
5. Atualiza todas as 15 referências pra novo `index.md`.
6. Marca documento original como `status: superseded` e adiciona pointer pro novo index.
7. Roda hook `paths-frontmatter-validator` em todas as fatias novas.

## Etapa 4 — Verificação

- `git diff --stat` — número de arquivos novos.
- `grep -r "PRD-007.md"` — confirma que todas referências viraram `PRD-007/index.md`.
- Re-conta linhas: nenhuma fatia > 500.

## Saída final

```
DOCUMENTO FATIADO

Original: docs/prd/PRD-007.md (2.143 linhas)
Fatias criadas: 11
Maior fatia: 04-frs.md (450 linhas)
Referências atualizadas: 15
Original marcado como: superseded -> docs/prd/PRD-007/index.md
```

## Importante

- **Não fatiar templates** (`.specify/templates/`) — eles são copiados, não consumidos pelo agente.
- **Não fatiar arquivos < 500 linhas** — overhead maior que ganho.
- **CHANGELOG nunca deve passar de 500 linhas** — use `/shard` pra criar `CHANGELOG/2026.md`, `CHANGELOG/2025.md`.
