---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 15/17
proximo: docs/glossario.md
idioma: pt-BR
limite-linhas: 200
proposito: APIs e sistemas terceiros que o produto depende.
---

<!--
template: integracoes-externas.md
destino: docs/descoberta/integracoes-externas.md
uso: condicional — só se depende de terceiros. Marque N/A em nao-aplica.md se autocontido.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3 (condicional, 🔵)
limite: ≤200 linhas.
-->

# Integrações externas — <NomeDoProjeto>

> Cada integração é dependência. Mapear ANTES de codar para evitar surpresa de SLA, custo ou contrato.

> **O que é `ordem-descoberta 15/17`?** Os documentos da Descoberta seguem uma sequência fixa de 17 etapas. Este é o 15º. O campo `proximo` (no topo do arquivo) indica qual documento preencher logo em seguida — aqui, o glossário do produto. É só um roteiro de leitura/preenchimento, não tem nada a ver com prioridade técnica.

## Formato canônico

Cada integração tem:
- **Provedor**
- **Finalidade no produto**
- **Endpoint / método de integração** (REST, webhook, OAuth, SFTP, e-mail, etc.)
- **SLA contratado** (uptime, tempo de resposta)
- **Custo** (faixa mensal estimada V1 e V2)
- **Plano B** se cair
- **Conformidade**: LGPD (DPA assinado?), região (Brasil?), retenção
- **Status**: <contratado | em negociação | apenas avaliado | descartado>

## INT-001 — <Provedor>

- **Finalidade**: <ex.: enviar e-mail transacional>
- **Endpoint**: <ex.: REST + webhook de delivery status>
- **SLA**: <uptime 99.9% | resposta ≤500ms p95>
- **Custo (V1)**: <R$ X/mês>
- **Custo (V2)**: <R$ Y/mês>
- **Plano B**: <fallback SMTP próprio ou provider Z>
- **Conformidade**: <DPA assinado | dado no Brasil | retenção 90d>
- **Status**: <contratado>
- **Documentação**: <link>

## INT-002 — <Provedor>

[mesmo formato]

## INT-003 — <Provedor>

[mesmo formato]

## Resumo

| ID | Provedor | Finalidade | Criticidade | Plano B | Custo/mês |
|---|---|---|---|---|---|
| INT-001 | <...> | <...> | 🔴 alta | <...> | R$ <X> |
| INT-002 | <...> | <...> | 🟠 média | <...> | R$ <X> |
| INT-003 | <...> | <...> | 🟡 baixa | <...> | R$ <X> |

- **Total mensal V1**: R$ <X>
- **Total mensal V2 (com escala)**: R$ <Y>
- **% do custo fixo da empresa**: <Z%>

## Vendor lock-in

- **Crítico** (substituição custaria meses): <INT-001 ...>
- **Médio** (substituição custaria semanas): <INT-002 ...>
- **Baixo** (intercambiável): <INT-003 ...>

> Para integrações críticas, considerar **anti-corrosion layer** (ports & adapters) para que troca futura não exija reescrita do core. Detalhar em `docs/dominios/<dom>/anti-corrosion-layer.md` (C3).

## Conformidade global

- **DPAs assinados**: <quais>
- **Sub-operadores LGPD**: <quais — listar em ROPA>
- **Transferência internacional** (TIA): <se algum provedor está fora do Brasil>
- **PII compartilhada**: <quais campos vão pra qual provedor>

## Histórico de mudanças

| Data | Mudança | Motivo |
|---|---|---|
| <YYYY-MM-DD> | INT-001 contratado | <decisão D-NNN> |
| <YYYY-MM-DD> | INT-X descartado | <preço subiu / qualidade caiu> |

## Critério para promover de `draft` para `stable`

- [ ] ≥1 integração crítica mapeada com plano B.
- [ ] Custo total mensal calculado.
- [ ] DPAs identificados para todas que tocam PII.
- [ ] Vendor lock-in classificado.
