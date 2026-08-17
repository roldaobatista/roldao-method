---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 220
proposito: contrato de observabilidade do conciliab (logs, metricas, traces) — como o sistema e observado em producao e quando alguem e acordado
---

<!-- destino: docs/operacao/observabilidade.md (preenchido no exemplo saas-python-regulado) -->

# Observabilidade — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE. Operacionaliza INV-AGENT-008 (PII em logs proibida).

## 1. Os tres pilares

| Pilar | O que e | Ferramenta | Retencao padrao |
|---|---|---|---|
| **Logs** | eventos discretos JSON-line | CloudWatch Logs (hot 7d) + S3 Glacier (cold ate 5a) | §5 |
| **Metricas** | series temporais agregadas | Datadog APM + CloudWatch Metrics | 13 meses (Datadog plan) |
| **Traces** | linha do tempo de requisicao atravessando servicos | Datadog APM com instrumentacao OpenTelemetry | 30 dias (com sampling §8) |

Correlacao via **`trace_id`** propagado em header `traceparent` (W3C Trace Context). FastAPI middleware `opentelemetry-instrumentation-fastapi` injeta automaticamente.

## 2. Golden signals (por servico)

Quatro indicadores obrigatorios em todo servico critico (referencia: Google SRE Book).

| Sinal | O que mede | Como expor |
|---|---|---|
| **Latency** | tempo de resposta — separar sucesso de erro | histograma com buckets (p50, p95, p99) em `/metrics` |
| **Traffic** | demanda no servico | counter requests/segundo por rota |
| **Errors** | taxa de falhas | counter erros / counter total, por status code |
| **Saturation** | quao cheio o servico esta | gauge % CPU, RAM, pool PG, fila Celery |

Dashboards de cada servico em §6 expoem os quatro lado a lado.

## 3. Instrumentacao obrigatoria por componente

> Servico sem instrumentacao nao sobe em prod. Verificado pelo `auditor-seguranca` regra SEC-OBS-01.

| Componente | Metricas obrigatorias | Logs obrigatorios | Trace |
|---|---|---|---|
| **FastAPI server** | `http_requests_total{method,route,status,tenant_id}`, `http_request_duration_seconds` | acesso (1 linha/req) + erro detalhado | span por request |
| **HTTP client (httpx)** | `outbound_requests_total{target,status}`, `outbound_duration_seconds` | erro (timeout, 5xx) | span filho |
| **PostgreSQL (SQLAlchemy)** | `db_query_duration_seconds{operation}`, `db_pool_connections_used` | query lenta (> 500ms), erro de conexao | span por query |
| **Celery producer** | `jobs_enqueued_total{queue}`, `enqueue_duration_seconds` | falha de enqueue | span de publish |
| **Celery consumer** | `jobs_processed_total{queue,outcome}`, `processing_duration_seconds` | inicio, sucesso, erro, retry | span de consume |
| **Redis cache** | `cache_hits_total`, `cache_misses_total`, `cache_errors_total` | erro de conexao | tag em span pai |
| **AWS SDK (boto3)** | `aws_calls_total{service,operation,status}`, `aws_duration_seconds`, `circuit_breaker_state` | falha, timeout, throttling | span filho |

## 4. Schema de log estruturado

Todo log e JSON em uma linha (`ndjson`). Biblioteca: `structlog` configurada em `conciliab/observability/logger.py`.

| Campo | Obrigatorio | Tipo | Exemplo |
|---|---|---|---|
| `timestamp` | sim | ISO-8601 UTC | `2026-05-27T14:32:01.234Z` |
| `level` | sim | enum | `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `service` | sim | string | `conciliab-api` |
| `version` | sim | string | `2026.05.3` |
| `env` | sim | string | `prod` \| `staging` \| `dev` |
| `trace_id` | sim (em request) | string | `4bf92f3577b34da6a3ce929d0e0e4736` |
| `span_id` | sim (em request) | string | `00f067aa0ba902b7` |
| `tenant_id` | sim (multi-tenant) | string | `tnt_abc123` |
| `user_sub` | quando aplicavel | string | sub Cognito (opaco) — **nunca e-mail/CPF** |
| `message` | sim | string curta | `conciliacao concluida` |
| `event` | quando aplicavel | string | `conciliacao.concluida`, `pedido_lgpd.recebido` |
| `error.type`, `error.message`, `error.stack` | quando level >= error | string | — |

> Log nao-estruturado (`print()`, `logger.info(f"...")` com PII concatenado) e PROIBIDO em prod. Auditor `auditor-seguranca` regra SEC-LOG-01 falha o build se detectar.

## 5. Retencao de logs (hot/warm/cold)

| Camada | Janela | Acessibilidade | Custo relativo |
|---|---|---|---|
| **Hot** | ultimos 7 dias | CloudWatch Logs Insights interativo | alto |
| **Warm** | 8-30 dias | CloudWatch Logs busca em background | medio |
| **Cold** | 31 dias - 1 ano | S3 Standard-IA, restauracao sob demanda | baixo |
| **Glacier** | 1-5 anos | S3 Glacier Deep Archive (audit/compliance) | muito baixo |
| **Descarte** | > 5 anos | apagado conforme retencao em `retencao-dados.md` | — |

Logs marcados `audit: true` (autenticacao, autorizacao, mutacao em tabela `_fiscal_`) tem retencao 5 anos minimo conforme LGPD + obrigacao fiscal.

## 6. Dashboards minimos por servico

Cada servico tem dashboard com:

1. **Golden signals** (§2) — 4 paineis lado a lado.
2. **Top 5 endpoints/jobs por volume** e por latencia p95.
3. **Top 5 erros** (mensagem + contagem) ultimas 24h.
4. **Saturacao de dependencias** — pool RDS, Redis, fila Celery.
5. **Versao em producao** (anotacao com timestamp de cada deploy via webhook).
6. **Multi-tenant breakdown** — top 5 tenants por volume + por erro (cuidado: nao exibir nome, so ID).

Dashboards Datadog:
- `conciliab - API publica - saude`: https://app.datadoghq.com/dashboard/abc-123 (placeholder).
- `conciliab - Worker conciliacao`: https://app.datadoghq.com/dashboard/abc-456.
- `conciliab - Postgres RDS`: https://app.datadoghq.com/dashboard/abc-789.

Indice em `docs/operacao/dashboards.md` (fora deste exemplo).

## 7. Alerting (limites e runbook)

Todo alerta segue regra: **dispara → aponta pra runbook**. Alerta sem runbook e proibido.

| Alerta | Condicao | Severidade | Runbook |
|---|---|---|---|
| API erro elevado | error_rate > 1% por 5min | SEV2 | [`runbooks/api-erro-elevado.md`](./runbooks/api-erro-elevado.md) |
| API latencia degradada | p95 > 800ms por 10min | SEV3 | `runbooks/api-latencia.md` (a criar) |
| Fila Celery travada | depth crescente por 15min OU > 5000 jobs | SEV2 | `runbooks/conciliacao-fila-travada.md` (a criar) |
| RDS saturado | `pool_used > 85%` por 5min | SEV2 | `runbooks/db-saturado.md` (a criar) |
| Servico down | health check `/v1/health` falha 3x consecutivas | SEV1 | `runbooks/servico-down.md` (a criar) |
| Error budget queima > 10%/1h | ver `slo-sli.md` §4b | SEV1 | `runbooks/error-budget-critico.md` (a criar) |
| Backup falhou ou nao concluiu em 6h | CloudWatch metric `rds_backup_age_hours > 6` | SEV2 | [`runbooks/restauracao-backup.md`](./runbooks/restauracao-backup.md) |
| Cognito indisponivel | `cognito_5xx_rate > 5%` por 5min | SEV2 | [`runbooks/cognito-degradado.md`](./runbooks/cognito-degradado.md) |
| Pedido LGPD em D-3 | job diario `alerta_lgpd_sla` | SEV2 | [`runbooks/atender-pedido-eliminacao.md`](./runbooks/atender-pedido-eliminacao.md) |
| Regiao sa-east-1 degradada | AWS Health Dashboard | SEV1 | [`runbooks/failover-regiao.md`](./runbooks/failover-regiao.md) |

Severidades e escalonamento em [`on-call.md`](./on-call.md).

## 8. Sampling e custo de traces

Trace 100% e caro no plano Datadog atual. Politica:

- **Erros (status >= 500)**: sempre 100% (head-based).
- **Requisicoes lentas (> p95)**: 100%.
- **Trafego normal**: 5% sampling (ajustar conforme custo mensal).
- **Health checks `/v1/health`, `/v1/ready`**: 0% (excluir).

Revisao trimestral do custo de observabilidade contra valor entregue. Owner: Ana Silva. Meta: <= 15% do custo total de infra (ver `capacity-planning.md` §5).

## 9. PII e segredo em logs — PROIBIDO (INV-AGENT-008)

> **Regra dura:** PII (CPF, CNPJ, e-mail, nome, telefone, endereco, conta bancaria) e segredo (token Cognito, chave Stripe) **NUNCA** podem aparecer em log, mesmo em `debug`.

Mitigacoes obrigatorias:
- `structlog` com processor `mask_pii()` aplicado antes do `json.dumps` (`conciliab/observability/pii_masker.py`).
- Testes em `tests/unit/test_pii_masker.py` cobrem CPF, CNPJ, e-mail, telefone, conta bancaria, cartao.
- Hook `secrets-scanner.sh` (Gitleaks com regras BR custom) varre PR contra padroes CPF/CNPJ/telefone.
- Em caso de vazamento detectado: rotacao imediata do segredo, purge do log (CloudWatch Logs delete-log-events), incidente SEV1 (`resposta-incidente.md`).

Vinculado a INV-AGENT-008 + INV-LGPD-001.

## 10. Onboarding de novo servico (checklist)

Antes do primeiro deploy em prod:

- [ ] `/v1/health` e `/v1/ready` implementados e respondendo.
- [ ] Logs estruturados ndjson conforme §4 via `structlog`.
- [ ] `trace_id` propagado em todos handlers de entrada e saida.
- [ ] Golden signals (§2) expostos em `/metrics` (Prometheus format).
- [ ] Instrumentacao por componente (§3) para os componentes que usa.
- [ ] Dashboard criado conforme §6 e linkado em `docs/operacao/dashboards.md`.
- [ ] Pelo menos 1 alerta por golden signal com runbook vinculado.
- [ ] Filtro de PII configurado no logger (§9).
- [ ] SLI/SLO definido em [`slo-sli.md`](./slo-sli.md).
- [ ] Owner tecnico identificado em [`AGENTS.md`](../../AGENTS.md) §5.

Auditor `auditor-seguranca` regra SEC-OBS-01 valida no CI.

## 11. Vinculacao com

- [`slo-sli.md`](./slo-sli.md) — SLIs derivam destas metricas.
- [`on-call.md`](./on-call.md) — severidade dos alertas e escalonamento.
- [`runbooks/`](./runbooks/) — todo alerta de §7 aponta para um arquivo.
- [`capacity-planning.md`](./capacity-planning.md) — metricas de saturacao alimentam forecast.
- [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — INV-AGENT-008.
- [`docs/conformidade/lgpd/retencao-dados.md`](../conformidade/lgpd/retencao-dados.md) — retencao de logs.
