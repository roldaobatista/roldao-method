---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 12/17
proximo: docs/descoberta/mercado-regulatorio.md
idioma: pt-BR
limite-linhas: 150
proposito: North Star Metric + guardrails do produto.
---

<!--
template: metricas-chave.md
destino: docs/descoberta/metricas-chave.md
uso: 1 North Star + 3-5 guardrails. Cada métrica com fonte, fórmula e cadência.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤150 linhas.
-->

# Métricas-chave — <NomeDoProjeto>

> Métricas de produto/negócio. Distinguir de SLI/SLO (operacionais) — esses ficam em `docs/operacao/slo-sli.md`.

## 1. North Star Metric (NSM) — 1 só

- **Métrica**: <ex.: número de conciliações fechadas por mês>
- **Por que esta**: <reflete valor entregue ao cliente E correlaciona com receita>
- **Fonte**: <onde mede — DB query, evento de produto, dashboard>
- **Fórmula**: `<expressão concreta — ex.: COUNT(conciliacao) WHERE status='fechada' AND mes=<período>>`
- **Cadência de leitura**: <diária / semanal>
- **Meta V1**: <X até <YYYY-MM-DD>>
- **Meta V2**: <Y até <YYYY-MM-DD>>

## 2. Guardrails (3-5 métricas)

> Métricas que NÃO podem degradar quando a NSM sobe. Se cair, alarme.

### G-001: <ex.: % de conciliações com erro >5%>
- **Fórmula**: `<...>`
- **Fonte**: <...>
- **Cadência**: <diária>
- **Limite (alarme)**: <quando subir acima de X%, alarme>

### G-002: <ex.: NPS ≥40>
- **Fórmula**: <...>
- **Fonte**: <pesquisa trimestral via Typeform>
- **Cadência**: <trimestral>
- **Limite**: <quando cair abaixo de 30, alarme>

### G-003: <ex.: churn mensal ≤5%>
- **Fórmula**: `<clientes que cancelaram no mês / clientes ativos no início do mês>`
- **Fonte**: <DB query>
- **Cadência**: <mensal>
- **Limite**: <≤5%>

### G-004: <ex.: CAC ≤ 1/3 do LTV>
- **Fórmula**: `<gasto com aquisição no mês / clientes novos no mês>`
- **Fonte**: <planilha financeira + DB>
- **Cadência**: <mensal>
- **Limite**: <≤ 1/3 do LTV calculado>

### G-005: <ex.: tempo de resposta da API p95 ≤ 500ms>
- **Fórmula**: <...>
- **Fonte**: <APM (Datadog/NewRelic)>
- **Cadência**: <contínua, alerta em tempo real>
- **Limite**: <p95 > 500ms por 5 min>

## 3. Métricas de uso (operacionais — segunda linha)

- **MAU** (monthly active users / tenants): <fórmula, fonte>
- **DAU/MAU ratio** (engajamento): <fórmula, fonte>
- **Tempo até primeiro valor** (TTFV): <ex.: tempo entre signup e primeira conciliação fechada>
- **Adoção de funcionalidade-chave**: <% de tenants que usaram feature X em últimos 30 dias>

## 4. Anti-métricas (NÃO usar)

- <ex.: "número de cliques na landing" — vaidade, não correlaciona com receita>
- <ex.: "tempo gasto no app" — em produto B2B operacional, MENOS tempo é melhor>

## 5. Dashboards

- **Operacional** (time interno): <link/caminho>
- **Cliente** (se aplicável): <link/caminho>
- **Investidor** (se aplicável): <link/caminho>

## Critério para promover de `draft` para `stable`

- [ ] 1 NSM definida com fonte e fórmula.
- [ ] ≥3 guardrails (qualidade, satisfação, retenção/churn).
- [ ] Cada métrica tem fonte concreta (não "estimativa").
- [ ] Limites de alarme numéricos (não "muito alto").
