---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 03/17
proximo: docs/descoberta/business-model-canvas.md
idioma: pt-BR
limite-linhas: 250
proposito: fluxos ponta-a-ponta do usuário HOJE (sem produto) e DEPOIS (com produto).
---

<!--
template: jornadas.md
destino: docs/descoberta/jornadas.md
uso: 3-7 jornadas, 1 página por jornada. Marca momentos de DOR e DELIGHT.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤250 linhas. Se passar, fatiar em docs/descoberta/jornadas/<slug>.md.
-->

# Jornadas — <NomeDoProjeto>

> Cada jornada amarra uma persona (`P-NNN`) a um fluxo concreto. Foco em comportamento real, não desejado.

## J-001 — <título curto> — persona P-NNN

### Hoje (sem o produto)

| Passo | O que a persona faz | Quanto tempo | Dor? |
|---|---|---|---|
| 1 | <ação> | <ex.: 10 min> | — |
| 2 | <ação> | <ex.: 30 min> | 🔴 dor: <descrição> |
| 3 | <ação> | <ex.: 5 min> | — |
| 4 | <ação> | <ex.: 1 dia> | 🔴 dor: <descrição> |

**Total hoje**: <tempo total>, <X reais/mês>, <Y horas/semana>.

**Momentos de dor (resumo)**:
- 🔴 <dor 1 — quando, por que dói, custo>
- 🔴 <dor 2>

### Depois (com o produto)

| Passo | O que a persona faz | Quanto tempo | Delight? |
|---|---|---|---|
| 1 | <ação> | <ex.: 2 min> | 🟢 delight: <descrição> |
| 2 | <ação> | <ex.: 5 min> | — |
| 3 | <ação> | <ex.: instantâneo> | 🟢 delight: <descrição> |

**Total depois**: <tempo total>, <X reais/mês>, <Y horas/semana>.

**Economia**: <X horas/semana, Y% redução de erro, Z reais/mês>.

**Momentos de delight (resumo)**:
- 🟢 <delight 1 — o que torna esse passo prazeroso>
- 🟢 <delight 2>

### Risco da migração

- <fricção pra largar o método atual>
- <treinamento necessário>
- <integração com sistema legado>

---

## J-002 — <título curto> — persona P-NNN

[mesmo formato]

## J-003 — <título curto> — persona P-NNN

[mesmo formato]

## Jornadas fora do escopo (V1)

> Jornadas que existem mas serão tratadas em versão futura. Mapear evita virem como "esqueceram".

- <jornada — por que pulou>
- <jornada — por que pulou>

## Critério para promover de `draft` para `stable`

- [ ] Cada jornada tem coluna "tempo" preenchida com número concreto.
- [ ] Pelo menos 1 dor por jornada (sem dor, não é jornada relevante).
- [ ] Pelo menos 1 delight no fluxo "depois" — produto sem delight é commodity.
- [ ] Custos do "hoje" quantificados em R$ ou horas.
