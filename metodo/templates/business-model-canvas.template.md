---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 04/17
proximo: docs/descoberta/value-proposition-canvas.md
idioma: pt-BR
limite-linhas: 180
proposito: Business Model Canvas — 9 blocos do modelo de negócio.
---

<!--
template: business-model-canvas.md
destino: docs/descoberta/business-model-canvas.md
uso: Canvas clássico de Osterwalder. Curto, factual, sem prosa filosófica.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤180 linhas. Se passar, blocos estão verbosos — encurtar.
-->

# Business Model Canvas — <NomeDoProjeto>

> Preencha aqui apenas o **modelo econômico completo**. Detalhe de dor/ganho fica em `value-proposition-canvas.md`; tática de preço/canal fica em `gtm-pricing.md`.

## 1. Proposta de valor (centro do canvas)

- <frase única que diz: para QUEM, resolvo QUE problema, com QUAL diferencial>
- 3-5 bullets de valor concreto (não jargão "facilita", "automatiza" — quanto, em quê).

## 2. Segmentos de cliente

- <segmento 1 — quem, tamanho, geografia>
- <segmento 2>
- Anti-segmentos (não-clientes): <quem fica fora>.

## 3. Canais

- **Aquisição** (como chegam até o produto): <orgânico SEO, indicação, parceria, ads, ...>
- **Entrega** (como recebem o valor): <web app, mobile, API, on-prem, ...>
- **Pós-venda**: <suporte por e-mail, chat, telefone, SLA>

## 4. Relacionamento com cliente

- **Onboarding**: <self-service, com hand-holding, treinamento presencial>
- **Suporte recorrente**: <reativo, proativo, customer success>
- **Comunidade**: <fórum, Discord, eventos — ou nenhum>

## 5. Fontes de receita

| Linha | Modelo | Faixa | Volume estimado (V1) |
|---|---|---|---|
| <ex.: assinatura PRO> | <mensal por usuário/tenant> | <R$ X-Y> | <N clientes> |
| <add-on Z> | <consumo> | <R$/unidade> | — |

- **Ticket médio**: <R$/mês>.
- **LTV estimado**: <R$> (retenção × ticket).
- **CAC alvo**: <R$> (≤ 1/3 do LTV).

## 6. Recursos-chave

- **Equipe**: <quem precisa estar, em que momento>
- **Tecnologia**: <stack crítica, dependências externas>
- **Dados**: <bases proprietárias, modelos treinados>
- **Propriedade intelectual / parcerias exclusivas**: <se houver>

## 7. Atividades-chave

- <atividade que o produto FAZ pelo cliente>
- <atividade operacional contínua do time>
- <atividade de aquisição>

## 8. Parcerias-chave

- <fornecedor 1 — o que entrega, criticidade>
- <integração 2 — o que entrega, plano B se cair>

## 9. Estrutura de custos

| Linha | Tipo | Faixa mensal estimada (V1) |
|---|---|---|
| Infra cloud | variável | <R$> |
| Equipe | fixo | <R$> |
| Aquisição | variável | <R$> |
| Ferramentas SaaS | fixo | <R$> |
| **Total** | | **R$ <X>** |

- **Break-even estimado**: <N clientes / R$ X de MRR>.

## Hipóteses-mais-arriscadas-do-canvas

Cada bloco pode estar errado. Marcar os 3 mais arriscados em [`hipoteses-a-validar.md`](./hipoteses-a-validar.md).

- H-001: <hipótese arriscada — ex.: "PMEs pagam R$ 199/mês — não validado">
- H-002: <hipótese arriscada>
- H-003: <hipótese arriscada>

## Critério para promover de `draft` para `stable`

- [ ] Todos os 9 blocos preenchidos (mesmo que com "investigar").
- [ ] Pelo menos 2 hipóteses arriscadas identificadas e amarradas a `hipoteses-a-validar.md`.
- [ ] Break-even calculado.
