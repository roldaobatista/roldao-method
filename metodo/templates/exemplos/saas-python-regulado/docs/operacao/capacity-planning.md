---
owner: Bruno Costa
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 180
proposito: forecast de crescimento, dimensionamento, auto-scaling e custo por unidade do conciliab — proximos 12 meses
---

<!-- destino: docs/operacao/capacity-planning.md (preenchido no exemplo saas-python-regulado) -->

# Capacity Planning — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE.

> Premissa de leitura: numeros baseados em dados das ultimas 12 semanas + projecao linear ajustada pela campanha de saida do beta. Revisao trimestral obrigatoria (§7).

## 1. Forecast de crescimento (12 meses)

| Dimensao | Baseline 2026-05 | +3 meses (2026-08) | +6 meses (2026-11) | +12 meses (2027-05) | Fonte |
|---|---|---|---|---|---|
| Tenants ativos (PJ contratantes) | 3 (piloto) | 12 | 40 | 150 | Stripe + `tenant` PG |
| Usuarios ativos (pessoas) | 7 | 35 | 120 | 500 | `usuario_tenanted` PG |
| Conciliacoes/dia (medio) | 6 | 40 | 180 | 800 | `conciliacao_tenanted` |
| Requests/segundo (pico) | 0.5 rps | 4 rps | 18 rps | 80 rps | Datadog `http_requests_total` |
| Requests/segundo (medio) | 0.1 rps | 1 rps | 4 rps | 20 rps | Datadog |
| Jobs Celery/dia | 50 | 400 | 2.000 | 9.000 | Datadog `jobs_processed_total` |
| Storage PG | 8 GB | 25 GB | 70 GB | 250 GB | RDS metrics |
| Storage S3 (extratos brutos) | 12 GB | 50 GB | 200 GB | 900 GB | S3 storage_class metrics |
| Egress saida AWS | 5 GB/mes | 30 GB/mes | 120 GB/mes | 500 GB/mes | AWS Cost Explorer |

Premissa de crescimento: 30% mes-a-mes nos primeiros 6 meses pos-beta (alvo: sair de beta 2026-07), estabilizando em 15% mes-a-mes apos.

> Reavaliar quando metrica real divergir > 20% do projetado.

## 2. Dimensionamento atual vs projetado (6 meses)

### 2.1 Computacao ECS Fargate

| Servico | CPU atual (vCPU) | CPU 6 meses | RAM atual (GB) | RAM 6 meses | Replicas atual | Replicas 6 meses |
|---|---|---|---|---|---|---|
| `conciliab-api` (FastAPI) | 0.5 | 1 | 1 | 2 | 2 | 4 |
| `conciliab-worker` (Celery conciliacao) | 0.5 | 1 | 1 | 2 | 2 | 5 |
| `conciliab-worker-lgpd` (jobs LGPD) | 0.25 | 0.5 | 0.5 | 1 | 1 | 2 |

### 2.2 PostgreSQL RDS

| Item | Atual | Projetado 6 meses | Limite plano atual (`db.t3.medium` 2vCPU/4GB/100GB) |
|---|---|---|---|
| Storage usado | 8 GB | 70 GB | 100 GB |
| IOPS pico | 200 | 1.500 | 3000 (baseline) + burst |
| Conexoes simultaneas (pico) | 12 | 60 | 87 (max para t3.medium) |
| Tamanho maior tabela (`conciliacao_tenanted`) | 3 GB / 500k linhas | 30 GB / 5M linhas | — |
| Replica lag p95 | 50ms | 150ms | 500ms aceitavel |

> Atingiremos 70% de conexoes em ~4 meses → planejar upgrade para `db.m5.large` (4vCPU/8GB/200GB) em 2026-09. ADR-0005 a criar.

### 2.3 Filas / cache / dependencias

| Recurso | Capacidade atual | Uso atual | Uso projetado 6 meses |
|---|---|---|---|
| Redis ElastiCache `cache.t3.micro` (0.5 GB) | 50 GB/s vazao | 5% | 30% |
| Fila Celery `conciliacao` (Redis-backed) | 10k msg/s vazao | 0.1% | 2% |
| Cognito user pool | 1k MAU free, R$0.0055/MAU acima | 7 MAU | 120 MAU (~R$0.66/mes) |
| Stripe quota | 100 req/s | < 1 req/s | 5 req/s |

## 3. Auto-scaling policies

| Servico | Min | Max | Metrica gatilho | Scale-up | Scale-down |
|---|---|---|---|---|---|
| `conciliab-api` | 2 | 10 | CPU > 65% por 3min | +2 replicas | CPU < 30% por 10min, -1 replica |
| `conciliab-worker` | 2 | 20 | `queue_depth > 1000` por 5min | +1 replica | `queue_depth < 100` por 15min, -1 replica |
| `conciliab-worker-lgpd` | 1 | 3 | manual (baixa frequencia) | manual | manual |

Regras:
- `min` sempre >= 2 para servicos com SLO (zero-downtime em rolling).
- `max` = 2x do pico projetado em 6 meses (margem de seguranca).
- Cooldown de scale-down >= 10min (evita oscilacao).
- Auto-scaling so e confiavel se o gargalo estiver no recurso medido — verificar §4 antes de subir limites.

## 4. Saturation thresholds (alarmes preventivos)

> Alerta dispara **antes** do recurso saturar.

| Recurso | Warning (SEV3) | Critical (SEV2) | Acao |
|---|---|---|---|
| CPU servico | > 70% por 15min | > 85% por 5min | escalar horizontalmente, investigar query/loop quente |
| RAM servico | > 75% por 15min | > 90% por 5min | escalar vertical/horizontal, investigar leak |
| Conexoes RDS | > 70% do max por 10min | > 85% do max por 5min | aumentar pool ou upgrade plano, investigar conexao vazada |
| Storage RDS | > 70% | > 85% | provisionar +N GB ou upgrade, revisar retencao |
| Fila Celery depth | crescente por 30min | > 5000 por 10min | escalar consumidores, investigar lentidao |
| Egress mensal | > 70% do contratado | > 90% | revisar plano, investigar trafego anormal |

Todo alerta aponta para runbook conforme [`observabilidade.md`](./observabilidade.md) §7.

## 5. Custo por unidade

Indicador para detectar regressao de eficiencia (custo crescendo mais rapido que receita = problema).

| Metrica | Valor atual (R$/mes) | Tendencia 3 meses | Alvo |
|---|---|---|---|
| Custo total infra AWS | R$ 850 | +20% (saiu de R$ 700) | — |
| Custo Datadog | R$ 280 | +5% | <= 15% do total |
| Custo por **tenant ativo** | R$ 283 (3 tenants) | -50% (esperado, escala) | <= R$ 50 com 50+ tenants |
| Custo por **1k requests** | R$ 0.10 | estavel | <= R$ 0.15 |
| Custo por **GB storage** | R$ 1.20/GB-mes (RDS) + R$ 0.10/GB-mes (S3) | estavel | — |
| Custo observabilidade / total | 33% | -10pp (esperado, escala) | <= 15% |

> Crescimento de custo/unidade > 10% trimestre a trimestre exige investigacao registrada.

> Ponto de atencao: custo observabilidade hoje em 33% e alto porque tenants ativos = 3. Com 40 tenants (6 meses), proporção cai naturalmente. Reavaliar 2026-11.

## 6. Capacidade reservada vs sob demanda

| Recurso | Reservado | Sob demanda | % reservado |
|---|---|---|---|
| Computacao ECS Fargate | 0 (Fargate nao tem RI) | 100% | 0% |
| RDS | 0 (avaliar Reserved Instance apos upgrade m5.large em 2026-09) | 100% | 0% |
| S3 | n/a (paga por uso) | 100% | n/a |

Diretriz: reservar ate o **piso historico dos ultimos 6 meses**, deixar o resto sob demanda. Renovar so quando o piso confirmar. Ainda nao reservamos nada porque produto esta em beta — piso confiavel exige 6 meses pos-beta.

## 7. Revisao trimestral (obrigatoria)

A cada 3 meses (proximo: 2026-08-27), Bruno Costa executa:

- [ ] Comparar metricas reais com forecast da revisao anterior. Divergencia > 20% → recalibrar premissa.
- [ ] Atualizar tabelas §1 e §2 com numeros do ultimo trimestre.
- [ ] Revisar policies de auto-scaling §3 — algum servico bateu max? algum nunca passou do min?
- [ ] Revisar custo/unidade §5 — alguma regressao?
- [ ] Provisionar/desprovisionar capacidade reservada §6.
- [ ] Registrar a revisao em §8.

## 8. Historico de revisoes

| Data | Revisor | Mudancas principais | Proxima revisao |
|---|---|---|---|
| 2026-02-28 | Bruno Costa | criacao inicial baseado em 4 semanas de beta | 2026-05-27 |
| 2026-05-27 | Bruno Costa | forecast revisado com 12 semanas; upgrade RDS planejado para 2026-09 | 2026-08-27 |

## 9. Vinculacao com

- [`observabilidade.md`](./observabilidade.md) — fonte das metricas de saturacao.
- [`slo-sli.md`](./slo-sli.md) — saturacao excessiva degrada SLO; capacity protege error budget.
- [`deployment-strategy.md`](./deployment-strategy.md) — auto-scaling depende de min >= 2 para rolling.
- [`performance-testing.md`](./performance-testing.md) — resultados validam capacidade projetada.
- [`runbooks/api-erro-elevado.md`](./runbooks/api-erro-elevado.md) — quando alerta de §4 dispara.
- `auditor-seguranca` — valida revisao trimestral feita no prazo.
