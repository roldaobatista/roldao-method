---
owner: <DEV-1>
ultima-conferencia: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!-- destino: docs/operacao/slo-sli.md (preenchido no exemplo saas-python-regulado) -->

# SLI/SLO — conciliab

## 1. Conceitos (em linguagem clara)

- **SLI** (Service Level Indicator) = **indicador**: numero que estamos medindo
  (ex: % de respostas HTTP bem-sucedidas).
- **SLO** (Service Level Objective) = **meta**: valor que o SLI precisa atingir
  (ex: 99,5% de sucesso no mes).
- **Error budget** = **margem aceitavel de falha**: quanto o servico pode falhar
  antes da equipe parar de lancar novidade e focar em estabilidade. SLO 99,5%
  no mes = error budget 0,5% = ~3h45min de falha por mes.
- **Janela rolante** = ultimos N dias contados para tras a partir de hoje.
- **Politica de queima**: o que a equipe faz quando o error budget esta sendo
  gasto rapido demais.

## 2. Servicos criticos

| Servico | SLI (indicador medido) | SLO (meta) | Error budget | Janela | Politica de queima |
|---|---|---|---|---|---|
| API publica `/v1/*` (todos os endpoints exceto health) | % de respostas HTTP < 500 em < 800ms (p95) | **99,5% mensal** | 0,5% (~3h45/mes) | 30 dias rolantes | queima > 2% em 1h → pausa deploy de novidade; queima > 5% em 6h → aciona on-call |
| Worker Celery `processa_conciliacao` | % de jobs concluidos com sucesso (sem retry final) em < 60s | **99,0% mensal** | 1,0% (~7h/mes) | 30 dias rolantes | queima > 5% em 24h → pausa novos uploads e abre incidente |
| Login (Cognito + nosso `/v1/auth/*`) | % de logins concluidos em < 2s | **99,5% mensal** | 0,5% | 30 dias rolantes | queima > 5% em 6h → aciona on-call + abre ticket Cognito |
| Atendimento a pedido LGPD (Art. 18, VI) | % de pedidos atendidos em ≤ 15 dias corridos | **100%** (obrigacao legal — INV-LGPD-002) | 0% — qualquer descumprimento e SEV1 | 90 dias rolantes | qualquer descumprimento aciona DPO + escala |

## 3. Como cada SLI e medido

- **API publica**: derivado dos logs do ALB (Application Load Balancer) + CloudWatch
  metrics. Filtro: `status_code >= 500 OR response_time_ms > 800`. Agregado em
  Datadog dashboard `API publica - saude`.
- **Worker `processa_conciliacao`**: metrica custom Celery exportada pra
  Datadog: `job_concluido_ok / job_concluido_total`, contado por minuto.
- **Login**: tempo total entre `POST /v1/auth/login` recebido e response
  enviado, medido em middleware. Cognito tem seus proprios SLAs (aceitos por
  contrato AWS).
- **Pedido LGPD**: tabela `audit_pedidos_titular_tenanted` — `(atendido_em -
  recebido_em) > 15 days`. Job diario alerta se prazo a vencer < 3 dias.

## 4. Metricas de negocio (complementares aos SLIs tecnicos)

| Metrica | O que mede | Meta sugerida | Origem do dado |
|---|---|---|---|
| % de conciliacoes com matching automatico ≥ 80% | qualidade do motor de matching | ≥ 80% em 90% das conciliacoes | banco (`conciliacao_tenanted.total_matches / total_linhas`) |
| Tempo medio de conciliacao | tempo entre upload e status `concluida` | < 60s para 95% dos arquivos | banco (`concluido_em - iniciado_em`) |
| % de divergencias contestadas pelo cliente | confianca do cliente nas regras de match | < 5% (alto: sinal de false positive) | banco (linhas com `contestado_em IS NOT NULL`) |
| Tenants ativos por mes (MAU) | quantidade de tenants que rodaram pelo menos 1 conciliacao no mes | crescimento positivo mes a mes | banco (`COUNT DISTINCT tenant_id WHERE iniciado_em > now() - 30d`) |
| Taxa de retencao M3 (mes 3) | % de tenants que renovam apos 3 meses | ≥ 80% | Stripe + banco |

> Metrica de negocio caindo pode ser sintoma de problema tecnico nao detectado
> pelos SLIs. Por isso entram aqui.

## 4b. Politica de queima — mapeamento para severidade

A velocidade com que o error budget esta sendo consumido define a severidade
do alerta.

| Estado do error budget | Severidade | Acao obrigatoria |
|---|---|---|
| Queima > 10% em 1h **OU** budget esgotado (saldo ≤ 0) | **CRITICO** (SEV1) | pausa imediata de deploys, aciona on-call, abre `#war-room`, comunica clientes-piloto se afetar SLA |
| Queima > 5% em 6h **OU** saldo restante < 25% | **ALTO** (SEV2) | bloqueia features novas ate saldo recuperar, prioriza correcao de estabilidade |
| Queima > 2% em 1h **OU** saldo restante < 50% | **MEDIO** (SEV3) | sinaliza em standup, investiga nas proximas 48h, ajusta backlog |
| Queima dentro do esperado, saldo > 50% | **BAIXO** (SEV4) | sem acao obrigatoria, acompanhamento normal |

> Quando o budget esgota completamente: **proibido lancar versao nova** ate
> saldo voltar a positivo na janela rolante. Excecao exige aprovacao em ADR.

## 5. Revisao dos SLOs

- Revisao **trimestral** obrigatoria pelo `<DEV-1>` + dono.
- Mudanca de meta exige ADR.
- **Ajuste para baixo** (afrouxar): exige justificativa explicita com dados das
  ultimas 3 janelas. Nao pode ser so "estamos estourando muito".
- **Ajuste para cima** (apertar): obrigatorio quando o SLI atual supera a meta
  por 3 janelas consecutivas com folga > 30% do error budget.
- **Nota especifica**: SLO de pedido LGPD (100%) **nao** pode ser afrouxado —
  e obrigacao legal.

## 6. Relacao com runbooks

Cada queima critica deve apontar para um runbook em
`docs/operacao/runbooks/`.

| Queima | Runbook a executar |
|---|---|
| API > 5% em 6h | `docs/operacao/runbooks/api-erro-elevado.md` (fora deste exemplo) |
| Worker conciliacao > 5% em 24h | `docs/operacao/runbooks/conciliacao-fila-travada.md` (fora deste exemplo) |
| Login > 5% em 6h | `docs/operacao/runbooks/cognito-degradado.md` (fora deste exemplo) |
| Backup falhou ou nao concluiu em 6h | `docs/operacao/runbooks/restauracao-backup.md` |
| Pedido LGPD nao atendido em D-3 do prazo | `docs/operacao/runbooks/atender-pedido-eliminacao.md` (escalonado) |

## 7. Postura de on-call

Time pequeno (3 devs). Escala semanal entre `<DEV-1>`, `<DEV-2>`, `<DEV-3>`.
Cobertura **horario comercial PT-BR** + best-effort fora.

24/7 dedicado **nao se aplica** por enquanto — ver justificativa em
[`nao-aplica.md`](../../nao-aplica.md) (linha "C8 / on-call 24/7"). Gatilho de
reavaliacao: sair de beta para self-service publico.

Alertas vao para PagerDuty (plano basico) → Slack `#alertas-ops` → SMS para
plantonista da semana.
