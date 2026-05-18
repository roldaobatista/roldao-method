---
description: Planeja a próxima sprint a partir do épico aberto — sequencia stories por dependência, identifica bloqueios e gera plano executável.
argument-hint: "[epico-id | epico-N | sprint-N]"
disable-model-invocation: true
---

# /sprint — planejamento da próxima sprint

Use depois de `/epico` quando precisar sequenciar a execução das próximas N stories com dependências, tamanho e ordem clara.

`$ARGUMENTS` = épico de referência (ex: `EP-007`) e/ou tamanho-alvo da sprint (ex: `7 dias`, `5 stories`).

## Etapa 1 — Coletar estado (investigador + gerente-produto)

Invoque `investigador`:
- Lê `docs/stories/` e identifica quais stories existem, status (pending / em-andamento / concluida).
- Lê `docs/epicos/EP-NNN.md` referenciado.
- Lê commits recentes que tocam stories desse épico.

Invoque `gerente-produto`:
- Identifica stories sem AC clara (bloqueador) — listar.
- Identifica stories sem estimativa (P/M/G) — listar.
- Sugere ordem por dependência técnica + valor de negócio.

## Etapa 2 — Plano (tech-lead + gerente-produto)

Saída obrigatória: arquivo `docs/sprints/SP-NNN-AAAA-MM-DD.md` com:

```markdown
---
sprint: SP-NNN
epico: EP-NNN
data-inicio: AAAA-MM-DD
data-fim: AAAA-MM-DD
status: planejada
---

# Sprint NNN

## Capacidade
- Devs disponíveis: X
- Dias úteis: Y
- Capacidade total: X*Y story-points (ou P/M/G equivalente)

## Stories sequenciadas

1. **US-NNN — Título** (P) — sem dependência → começa dia 1
2. **US-NNN — Título** (M) — depende de #1 → começa quando #1 termina
3. **US-NNN — Título** (G) — depende de #2 → ...

## Bloqueios identificados

- US-NNN: falta AC clara → resolver antes de iniciar
- US-NNN: aguardando aprovação de DPO → escalar com X
- US-NNN: depende de cliente externo → confirmar deadline

## Riscos

- Risco 1 + mitigação
- Risco 2 + mitigação

## Saída esperada da sprint

- N stories entregues + 1 release.
- ADR-NNN criado se decisão arquitetural aparecer.
- Nenhuma story carry-over (se houver, motivo na retro).
```

## Etapa 3 — Confirmar e abrir trabalho

- Mostrar plano pro usuário em PT-BR claro (sem story points crus — usar "pequena/média/grande").
- Após confirmação, marcar primeira story como "em andamento".
- Recomendar: rodar `/feature` na primeira story.

> **Sequenciamento mecânico:** o hook `validate-story-dependencies.sh` valida o campo `depende-de:` no frontmatter da story-alvo. Se US-002 declara `depende-de: [US-001]` e US-001 não está com `status: entregue`, o hook recusa Edit/Write em código quando `/feature US-002` está ativo. Não é convenção — é gate.

## Saída final

```
SPRINT SP-NNN PLANEJADA

Epico: EP-NNN
Stories sequenciadas: N
Bloqueios pendentes: N (resolver antes de iniciar)
Documento: docs/sprints/SP-NNN-AAAA-MM-DD.md
Próximo passo: /feature US-NNN (primeira da sequência)
```

## Importante

- **Sem jargão** ("story points" → "tamanho P/M/G", "carry-over" → "stories que sobraram").
- **Se há bloqueios não-resolvíveis pelo agente** (depende de cliente externo, aprovação humana), listá-los explicitamente — não fingir que dá pra continuar.
