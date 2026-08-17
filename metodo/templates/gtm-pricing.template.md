---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 06/17
proximo: docs/descoberta/concorrentes.md
idioma: pt-BR
limite-linhas: 180
proposito: estratégia de go-to-market e pricing — pilares, planos, aquisição.
---

<!--
template: gtm-pricing.md
destino: docs/descoberta/gtm-pricing.md
uso: planos, free vs pago, canal de aquisição, ciclo de venda.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3 (recomendado, 🟡)
limite: ≤180 linhas.
-->

# GTM e Pricing — <NomeDoProjeto>

> Preencha aqui a **execução comercial**: planos, preço, canais, funil e venda. Não repetir dores/ganhos do VPC nem os 9 blocos do BMC; só referencie quando necessário.

## 1. Posicionamento

- **Para quem**: <segmento>
- **Que problema resolve**: <1 frase>
- **Diferencial defensável**: <o que ninguém copia em 6 meses>
- **Promessa central**: <ex.: "conciliar bancos em 30 min em vez de 4 horas">

## 2. Estratégia de pricing

### 2.1. Modelo

- **Tipo**: <SaaS por assinatura | freemium | consumo | one-time | híbrido>
- **Unidade**: <por tenant | por usuário | por transação | por GB>
- **Cobrança**: <mensal | anual com desconto | trimestral>
- **Moeda**: BRL (default); USD/EUR <quando aplicável>.

### 2.2. Planos

| Plano | Preço (R$/mês) | Inclui | Limite | Público |
|---|---|---|---|---|
| Free / Trial | R$ 0 | <funcionalidades core, sem suporte> | <14 dias / até X usos> | <descoberta>  |
| Starter | R$ <X> | <ex.: 1 tenant, 100 transações/mês> | <...> | <PMEs pequenas> |
| Pro | R$ <Y> | <ex.: 5 tenants, 5k transações, suporte prioritário> | <...> | <PMEs médias> |
| Enterprise | R$ <Z>+ | <ex.: ilimitado, SLA, dedicated CSM> | <sob contrato> | <PMEs grandes> |

### 2.3. Add-ons

| Add-on | Preço | Quando faz sentido |
|---|---|---|
| <ex.: integração customizada> | <R$/mês> | <...> |
| <ex.: relatório customizado> | <R$/único> | <...> |

### 2.4. Descontos & promoções

- **Anual**: <ex.: 2 meses grátis na assinatura anual>
- **Beta/piloto**: <R$ 49/mês fixo por 6 meses para os 3 primeiros>
- **Indicação**: <ex.: 1 mês grátis para quem indica + indicado>
- **Educação / ONG**: <ex.: 50% desconto>

## 3. Estratégia de aquisição

### 3.1. Canais

| Canal | Custo (CAC alvo) | Volume esperado (mês 6) | Status |
|---|---|---|---|
| SEO orgânico | <R$ X> | <N leads> | <ativo / planejado> |
| Conteúdo (blog, YouTube) | <R$ X> | <N leads> | <...> |
| Indicação | <R$ X> | <N leads> | <...> |
| Parceria (contadores, ERP) | <R$ X> | <N leads> | <...> |
| Ads (Google, LinkedIn) | <R$ X> | <N leads> | <...> |
| Outbound (cold e-mail, ligação) | <R$ X> | <N leads> | <...> |

- **CAC total alvo**: ≤ 1/3 do LTV.

### 3.2. Funil

- **Visitante** → <atrai por conteúdo / ad>
- **Lead** → <preenche formulário / agenda demo>
- **Trial / piloto** → <usa o produto por 14 dias>
- **Cliente pagante** → <converte em plano pago>
- **Defensor** → <indica outros>

**Taxa de conversão alvo entre cada etapa**: <Visitante→Lead: X%, Lead→Trial: Y%, Trial→Pago: Z%>

### 3.3. Ciclo de venda

- **Self-serve** (Starter): <minutos a horas>
- **Sales-assisted** (Pro): <dias>
- **Enterprise**: <semanas a meses, 2-3 reuniões>

## 4. Onboarding

- **Tempo até primeiro valor** (TTFV) alvo: <30 min>
- **Fluxo**: <signup → seed dev/dados de exemplo → primeira ação chave → resultado visível>
- **Suporte no onboarding**: <self-serve com vídeos / com hand-holding humano>

## 5. Retenção

- **Churn alvo**: <≤5%/mês>
- **Sinais de risco** (churn iminente): <queda de uso, suporte aberto sem resposta, ...>
- **Playbook de retenção**: <quando soar alarme, ação concreta>

## Critério para promover de `draft` para `stable`

- [ ] Pricing tabelado (≥2 planos pagos definidos).
- [ ] Canais de aquisição priorizados (≥3 canais com CAC estimado).
- [ ] Funil com taxas de conversão alvo.
- [ ] Churn alvo numérico.
