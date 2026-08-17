---
owner: <PRODUCT>
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 100
proposito: NSM + guardrails do conciliab.
---

# Métricas-chave — conciliab

## 1. North Star Metric (NSM)

- **Métrica**: conciliações fechadas com sucesso por mês (`status=reconciled`).
- **Por que esta**: representa valor entregue ao cliente E correlaciona com retenção/upsell.
- **Fonte**: PostgreSQL — `SELECT COUNT(*) FROM transactions WHERE status='reconciled' AND tenant_id IS NOT NULL AND reconciled_at BETWEEN <mês>`.
- **Cadência**: diária no dashboard interno.
- **Meta V1 (F-1)**: 500 conciliações/mês (≥10 clientes ativos × 50 transações).
- **Meta V2 (F-2)**: 5.000 conciliações/mês (≥30 clientes × 150 transações).
- **Meta self-service (F-4)**: 25.000/mês.

## 2. Guardrails

### G-001: taxa de erro na conciliação automática ≤ 2%
- **Fórmula**: `transactions com status='failed' / total conciliadas no mês`.
- **Fonte**: PostgreSQL.
- **Cadência**: diária.
- **Limite (alarme)**: > 5% por 3 dias seguidos → PagerDuty.

### G-002: NPS ≥ 40 (pesquisa trimestral)
- **Fonte**: Typeform enviado trimestralmente.
- **Cadência**: trimestral.
- **Limite**: < 30 → alerta produto.

### G-003: churn mensal ≤ 5%
- **Fórmula**: clientes cancelados no mês / ativos no início do mês.
- **Fonte**: tabela `tenant_subscription`.
- **Cadência**: mensal.
- **Limite**: > 7% → revisão de retenção.

### G-004: CAC ≤ 1/3 do LTV
- **Fórmula**: gasto com aquisição / clientes novos.
- **Fonte**: planilha financeira (mensal).
- **Cadência**: mensal.
- **Limite**: razão pior que 1/3 → reunião de aquisição.

### G-005: API p95 ≤ 500ms
- **Fonte**: Datadog APM.
- **Cadência**: contínua.
- **Limite**: p95 > 500ms por 5 min → on-call.

## 3. Métricas de uso

- **MAU (tenants ativos)**: número de tenants com ≥1 conciliação no mês.
- **TTFV** (tempo até primeira conciliação): meta ≤30 min após signup.
- **DAU/MAU ratio**: indicador de engajamento; em SaaS B2B operacional, ≥30% é bom.
- **Adoção de Open Finance** (quando ativo): % de tenants conectados.

## 4. Anti-métricas

- "Tempo gasto no app" — em produto operacional, MENOS tempo é melhor.
- "Cliques na landing" — vaidade, sem correlação com receita.

## 5. Dashboards

- **Operacional**: Grafana `conciliab-ops` (link interno).
- **Cliente**: dentro do produto, página `/dashboard`.
