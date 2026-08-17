---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 11/17
proximo: docs/descoberta/metricas-chave.md
idioma: pt-BR
limite-linhas: 150
proposito: hipóteses do produto/negócio com critério objetivo de validação.
---

<!--
template: hipoteses-a-validar.md
destino: docs/descoberta/hipoteses-a-validar.md
uso: cada hipótese com critério VERIFICÁVEL de validação. Recomendado (🟡).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤150 linhas.
-->

# Hipóteses a validar — <NomeDoProjeto>

> Cada hipótese é uma APOSTA. Se errar, muda o produto. Critério de validação tem que ser MENSURÁVEL, com prazo e responsável.

## Formato

```
H-NNN: <hipótese — afirmação testável>
- categoria: problema | solução | mercado | crescimento | pricing
- risco: alto | médio | baixo
- como validar: <experimento concreto>
- critério (mensurável): <número, %, prazo>
- prazo: <YYYY-MM-DD>
- responsável: <nome>
- status: pendente | em validação | confirmada | refutada
- resultado (após validação): <dado coletado + decisão tomada>
```

## Hipóteses ativas

### H-001: <ex.: "PMEs do varejo pagam R$ 199/mês por conciliação automática">
- **Categoria**: pricing
- **Risco**: 🔴 alto — bate na receita
- **Como validar**: vender beta pago R$ 49/mês por 6 meses para 5 PMEs antes de F-2.
- **Critério**: ≥3 das 5 PMEs aceitam pagar, e ≥2 renovam ao fim do beta (sinal de disposição a pagar R$ 199 estável).
- **Prazo**: <YYYY-MM-DD>
- **Responsável**: <dono>
- **Status**: pendente
- **Resultado**: —

### H-002: <ex.: "Open Finance vai estar maduro o suficiente para o nosso uso em Q3/2026">
- **Categoria**: solução
- **Risco**: 🟠 alto técnico, fora de controle
- **Como validar**: testar API homologação do Bacen com 1 banco-piloto até <YYYY-MM-DD>.
- **Critério**: 95% das requisições de extrato em <2s, taxa de erro <5%, sem fricção de certificação ICP-Brasil que dure >2 meses.
- **Prazo**: <YYYY-MM-DD>
- **Responsável**: <tech-lead>
- **Status**: pendente
- **Resultado**: —

### H-003: <ex.: "O usuário aceita upload CSV manual no V1 enquanto Open Finance não chega">
- **Categoria**: solução
- **Risco**: 🟡 médio
- **Como validar**: protótipo Figma + 5 entrevistas no segmento alvo.
- **Critério**: ≥4 de 5 entrevistados aceitam upload CSV como "ok no V1" desde que tenha automação total da conciliação.
- **Prazo**: <YYYY-MM-DD>
- **Responsável**: <dono>
- **Status**: pendente
- **Resultado**: —

### H-004: <hipótese>

[mesmo formato]

## Hipóteses confirmadas (histórico)

| ID | Hipótese | Validada em | Como | Decisão |
|---|---|---|---|---|
| H-X | <...> | <YYYY-MM-DD> | <experimento> | <feature aprovada/escopo mantido> |

## Hipóteses refutadas (histórico — IMPORTANTE)

> Erros são aprendizado. Não apagar — mover pra cá com motivo.

| ID | Hipótese | Refutada em | Por quê | Decisão (mudança de rumo) |
|---|---|---|---|---|
| H-Y | <...> | <YYYY-MM-DD> | <dado coletado> | <feature removida / pivot / etc.> |

## Critério para promover de `draft` para `stable`

- [ ] ≥3 hipóteses ativas, sendo ≥1 de risco 🔴 alto.
- [ ] Cada hipótese tem critério numérico (não "validar com o time").
- [ ] Cada hipótese tem responsável + prazo.
- [ ] Cruzar hipóteses arriscadas com `business-model-canvas.md` (cada bloco do BMC com risco alto vira H-NNN aqui).
