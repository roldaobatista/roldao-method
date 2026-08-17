---
owner: Ana Silva
ultima-conferencia: 2026-05-27
severidade-procedimento: emergencia
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: runbook quando alerta "API erro elevado" dispara (error_rate > 1% por 5min) — diagnostico, contencao, rollback
---

<!-- destino: docs/operacao/runbooks/api-erro-elevado.md (preenchido no exemplo saas-python-regulado) -->

# Runbook — API erro elevado (error_rate > 1%)

## 1. Objetivo

Mitigar e diagnosticar surto de erros 5xx na API publica `api.conciliab.com.br`, decidir se executa rollback automatico/manual ou se mantem versao e investiga.

## 2. Quando rodar

- **Gatilho 1**: alerta Datadog `API erro elevado` — `error_rate > 1%` por 5min (SEV2).
- **Gatilho 2**: alerta error budget queima > 10%/1h (SEV1).
- **Gatilho 3**: cliente reporta "sistema fora" via `#suporte`.
- **Janela**: imediato.

## 3. Pre-condicoes

- [ ] Acesso Datadog confirmado.
- [ ] Acesso AWS Console + permissao ECS confirmado.
- [ ] Acesso ao GitHub para disparar `rollback.yml`.
- [ ] Comunicar `#war-room` Slack antes de iniciar.
- [ ] Plantonista da semana acionado (ver `on-call.md`).

## 3.5 Diagnostico rapido (antes de mexer)

> **CAUSA #1 DE INCIDENTE: deploy recente.** Sempre checar releases das ultimas 24h ANTES de qualquer outra hipotese.

- [ ] **Ultimo deploy**: `gh release list --repo conciliab/conciliab-api --limit 5`. Houve release nas ultimas 24h?
- [ ] **Dashboard Datadog `conciliab - API publica - saude`**: qual rota concentra os erros? qual status code (500/502/503/504)?
- [ ] **Logs CloudWatch ultimos 30min**: filtrar `level=error`. Qual `error.type`/`error.message` se repete? Tenant especifico?
- [ ] **Metricas RDS**: `pool_used`? `cpu`? alguma query lenta no slow log?
- [ ] **Metricas fila Celery**: `queue_depth` crescendo? workers travados?
- [ ] **Dependencias externas**: Cognito (`cognito_5xx_rate`)? Stripe webhook? Status AWS sa-east-1 (https://health.aws.amazon.com/)?
- [ ] **Alertas correlatos**: outros alertas dispararam junto?

Registrar observacao em §8.

## 4. Passos

### 4.1 Decisao 1: rollback ou seguir investigando?

| Sinal | Decisao |
|---|---|
| Deploy < 1h + erros comecaram apos deploy | **rollback imediato** (§4.2) |
| Deploy < 24h + erros correlacionados com release | **rollback** (§4.2) |
| Sem deploy recente + erro em rota especifica | seguir §4.3 (contencao parcial) |
| Sem deploy + erro generalizado + RDS saturado | seguir §4.4 (escalar/restart) |
| Cognito 5xx | abrir runbook [`cognito-degradado.md`](./cognito-degradado.md) em paralelo |

### 4.2 Rollback de release (rolling)

1. Identificar versao anterior estavel:
   ```
   gh release list --limit 5
   ```
2. Disparar workflow de rollback:
   ```
   gh workflow run rollback.yml --ref v<versao-anterior>
   ```
3. OU manual via AWS CLI (task definition anterior):
   ```
   aws ecs update-service --cluster conciliab-prod --service conciliab-api \
     --task-definition conciliab-api:<revision-anterior>
   ```
4. Observar Datadog `conciliab - API publica - saude` — `error_rate` deve cair em < 5min.
5. Notificar `#war-room` com timestamp e tag da versao revertida.
6. Marcar release problematica em GitHub: `gh release edit v<problematica> --notes "ROLLBACK em 2026-MM-DD HH:MM por <motivo>"`.

### 4.3 Contencao parcial (rota especifica)

1. Identificar rota afetada (ex: `POST /v1/conciliacoes`).
2. Se possivel, desabilitar feature flag relacionada:
   ```
   UPDATE feature_flag_tenanted SET enabled = false WHERE name = '<feature>';
   ```
3. Aplicar rate-limit mais restritivo no WAF temporariamente:
   ```
   aws wafv2 update-rule-group --name conciliab-api-prod --rules <file-com-limite-temp>
   ```
4. Continuar diagnostico em paralelo.

### 4.4 Escalar ou restart

1. Se CPU/RAM alto em tasks ECS: aumentar `desired-count` temporariamente.
   ```
   aws ecs update-service --cluster conciliab-prod --service conciliab-api --desired-count 6
   ```
2. Se pool RDS saturado: investigar conexao vazada (`SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';`). Killar sessoes orfas:
   ```
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND query_start < now() - interval '5 min';
   ```
3. Se workers Celery travados: `aws ecs update-service --service conciliab-worker --force-new-deployment`.

## 5. Verificacao de sucesso

- [ ] `error_rate < 0.5%` por 15min consecutivos no dashboard Datadog.
- [ ] `GET /v1/health` retorna 200: `curl https://api.conciliab.com.br/v1/health`.
- [ ] Logs CloudWatch sem novo padrao de erro nos ultimos 10min.
- [ ] Cliente-piloto afetado confirmou retorno ao normal (telefone direto se houve impacto).
- [ ] Status page https://status.conciliab.com.br atualizada para "operacional".

## 6. Rollback do rollback

Cenario raro: rollback piorou (incompatibilidade de schema PG com versao N-1):

1. Re-deployar versao N (a problematica) imediatamente.
2. Aplicar contencao parcial §4.3 + investigar urgente.
3. Acionar L3 (Roldao).

## 7. Escalonamento em camadas

| Camada | Quem | Quando acionar |
|---|---|---|
| **L1 — Plantonista** | escala em `on-call.md` | imediato, segue este runbook |
| **L2 — Owner API** | Ana Silva | L1 nao identificou causa em 30min |
| **L3 — Dono** | Roldao | SEV1 com cliente afetado > 30min |
| **DPO** | Carlos Mendes | se logs revelarem exposicao de PII (paralelo) |
| **AWS Support** | Business plan | diagnostico aponta AWS |

## 8. Historico de execucao

| Data | Operador | Motivo | Resultado | Observacoes |
|---|---|---|---|---|
| 2026-04-30 | Ana Silva | error_rate 8% apos release 2026.04.4 | rollback OK (12min) | post-mortem em `docs/operacao/incidentes/2026-04-30-conciliacao-fecho-mes.md` (fora exemplo); causa: query nova sem index disparou full scan durante pico de fechamento de mes |
| 2026-05-20 | Diego Tavares | error_rate 3% apos release 2026.05.2 | rollback OK (8min) | regressao de performance — ver `performance-reports/2026-05-20.md` |

## 9. Pos-execucao

Se runbook foi acionado por incidente real (nao false positive de alerta):
- Post-mortem em <= 48h usando template.
- Atualizar §8 com link para post-mortem.
- Considerar nova INV ou ajuste de auditor se causa raiz aponta padrao recorrente.

## 10. Vinculacao com

- [`observabilidade.md`](../observabilidade.md) §7 — alerta que dispara este runbook.
- [`release-process.md`](../release-process.md) §6 — rollback automatico por metricas.
- [`deployment-strategy.md`](../deployment-strategy.md) §6 — playbook detalhado de rollback por estrategia.
- [`slo-sli.md`](../slo-sli.md) §4b — politica de queima.
- [`cognito-degradado.md`](./cognito-degradado.md) — paralelo se Cognito for causa.
- [`failover-regiao.md`](./failover-regiao.md) — se erro for por regiao AWS degradada.
