---
tipo: postmortem
id: POSTMORTEM-AAAA-MM-DD-_(slug)_
versao: 1
status: draft
owner: _(nome de quem conduz)_
revisado-em: AAAA-MM-DD
---

# Postmortem — _(título do incidente em PT-BR claro)_

> Template oficial pra `/incident-postmortem`. Grava em `docs/postmortems/`.
> Postmortem é **sem culpa** (blameless): foca no sistema, não na pessoa.
>
> **Prazo:** preencher em até **48h** após contenção do incidente (regra do
> `/hotfix`). LGPD-006 exige notificar ANPD + titulares em **prazo razoável**
> (até 72h após ciência) — se houver dado pessoal afetado, o item "Comunicação
> ANPD" abaixo é obrigatório.

## Resumo executivo (3 linhas)

- **O que aconteceu:** _(1 frase em PT-BR claro, sem jargão)_
- **Quem foi afetado:** _(quantidade de clientes / qual área / período)_
- **Status atual:** _(resolvido / mitigado / em monitoramento)_

## Linha do tempo (UTC-3)

| Hora | O que aconteceu | Quem detectou / agiu |
|---|---|---|
| HH:MM | _(evento inicial — primeiro sinal)_ | _(monitoramento / cliente / alerta)_ |
| HH:MM | _(escalação)_ | _(quem chamou)_ |
| HH:MM | _(diagnóstico — causa identificada)_ | _(investigador)_ |
| HH:MM | _(mitigação aplicada)_ | _(dev-senior / devops)_ |
| HH:MM | _(confirmação de resolução)_ | _(QA / monitoramento)_ |
| HH:MM | _(comunicação aos afetados — se houver)_ | _(comunicação / DPO)_ |

## Impacto

- **Duração total:** _(HHmin do primeiro sinal até resolução)_
- **Clientes afetados:** _(número estimado + critério)_
- **Receita impactada:** _(estimativa, se quantificável — ou "N/A")_
- **Dados afetados:** _(volume e tipo — anonimizado/pessoal/sensível)_
- **SLA quebrado?:** _(sim/não — qual SLA contratual)_

## Causa raiz

_(Análise dos 5 Porquês até chegar à causa real, não no sintoma.
Investigador (Detetive) entrega isso pré-mortem. Não copiar stack trace
cru — explicar em PT-BR claro o que estava errado no sistema.)_

1. **Por que aconteceu?** _(resposta)_
2. **Por que isso?** _(resposta)_
3. **Por que isso?** _(resposta)_
4. **Por que isso?** _(resposta)_
5. **Por que isso?** _(causa raiz — sistêmica, não pessoal)_

## O que funcionou bem

- _(detecção rápida via X)_
- _(time respondeu no SLA)_
- _(rollback funcionou de primeira)_

## O que não funcionou

- _(alerta que devia ter disparado e não disparou)_
- _(documentação faltava ou estava errada)_
- _(processo lento de aprovação)_

## Comunicação ANPD (LGPD-006) — _(preencher SE houve dado pessoal afetado)_

- [ ] Avaliado pela DPO em: _(data/hora)_
- [ ] Risco aos titulares: _(baixo / médio / alto + justificativa)_
- [ ] Notificação à ANPD em: _(data/hora — até 72h após ciência)_
- [ ] Notificação aos titulares em: _(data/hora — meio: e-mail/SMS/portal)_
- [ ] Conteúdo da comunicação aprovado por: _(jurídico/DPO)_

Se **não** se aplica (sem dado pessoal): marcar com "N/A" e justificar em 1 linha.

## Ações corretivas

| ID | Ação | Responsável | Prazo | Status |
|---|---|---|---|---|
| AC-1 | _(o que vai mudar pra não acontecer de novo)_ | _(nome)_ | AAAA-MM-DD | pendente |
| AC-2 | _(reforço de monitoramento / alerta novo)_ | _(nome)_ | AAAA-MM-DD | pendente |
| AC-3 | _(teste de regressão pra cobrir o caso)_ | _(nome)_ | AAAA-MM-DD | pendente |

**Cada ação deve virar T-NNN rastreável.** Postmortem sem ação corretiva é
documento morto — vire ticket.

## Vincula

- Hotfix: _(commit/PR/tag)_
- Stories: _(US-NNN se houver)_
- ADRs: _(ADR-NNN se decisão arquitetural saiu daqui)_

## Histórico

| versao | data | autor | mudanca |
|---|---|---|---|
| 1 | AAAA-MM-DD | _(autor)_ | rascunho inicial |
