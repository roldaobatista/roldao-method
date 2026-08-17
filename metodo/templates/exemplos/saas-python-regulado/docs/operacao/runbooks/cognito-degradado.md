---
owner: Ana Silva
ultima-conferencia: 2026-05-27
severidade-procedimento: emergencia
status: stable
idioma: pt-BR
limite-linhas: 130
proposito: runbook quando AWS Cognito (IdP) esta degradado ou indisponivel — clientes nao conseguem logar
---

<!-- destino: docs/operacao/runbooks/cognito-degradado.md (preenchido no exemplo saas-python-regulado) -->

# Runbook — AWS Cognito degradado

## 1. Objetivo

Mitigar impacto de degradacao/indisponibilidade do AWS Cognito (user pool `conciliab-tenants` em sa-east-1) sobre login dos clientes, comunicar status, escalar com AWS Support.

> Conciliab depende criticamente do Cognito para autenticacao (ADR-0001). Sem fallback IdP — risco aceito documentado em ADR-0001 §Riscos.

## 2. Quando rodar

- **Gatilho 1**: alerta Datadog `Cognito indisponivel` — `cognito_5xx_rate > 5%` por 5min (SEV2).
- **Gatilho 2**: alerta `Login SLO queimando` — `login_p95 > 2s` por 6h (ver `slo-sli.md` §2).
- **Gatilho 3**: AWS Health Dashboard reporta evento em `Cognito sa-east-1`.
- **Gatilho 4**: clientes reportam "nao consigo logar" em `#suporte`.
- **Janela**: imediato.

## 3. Pre-condicoes

- [ ] Acesso AWS Console + permissao Cognito + IAM confirmado.
- [ ] Acesso AWS Health Dashboard.
- [ ] AWS Support case aberto se confirmado problema AWS.
- [ ] `#war-room` Slack aberto.

## 3.5 Diagnostico rapido

- [ ] **AWS Health Dashboard**: https://health.aws.amazon.com/ — alguma degradacao Cognito reportada?
- [ ] **Twitter/AWS Status**: @AWSCloud, @AWS_HealthStatus.
- [ ] **Logs CloudWatch `/aws/cognito/userpools/conciliab-tenants`**: padroes de erro? throttling (`TooManyRequestsException`)?
- [ ] **Datadog**: `cognito_5xx_rate`, `cognito_4xx_rate`, `login_p95`. Quando comecou?
- [ ] **Confirmar reproducao**: tentar login com usuario de teste em staging (mesma regiao) — falha tambem?
- [ ] **Outras regioes**: cognito em `us-east-1` esta OK? Se sim, e degradacao regional.

## 4. Passos

### 4.1 Comunicacao imediata (D+0min)

1. Atualizar status page https://status.conciliab.com.br para "Login degradado — investigando".
2. Notificar `#suporte` Slack para alinhar resposta a clientes que reportarem.
3. Texto para suporte: "Estamos cientes de instabilidade no servico de login (provedor externo AWS Cognito). Acompanhe https://status.conciliab.com.br para atualizacoes."

### 4.2 Abrir caso AWS Support (D+5min)

1. AWS Console → Support → Create case → Technical → Service: Cognito User Pools.
2. Severidade: **Production system impaired** (Business plan tem resposta em 1h).
3. Anexar: graficos Datadog, IDs de request com erro, timestamps.
4. Registrar numero do caso em `#war-room` (`AWS Support Case ID: <ID>`).

### 4.3 Mitigacao interna (paralelo)

Conciliab nao tem IdP fallback (ADR-0001 §Riscos). Acoes possiveis:

1. **Estender TTL de token JWT** em emergencia (usuarios ja logados continuam funcionando):
   - Cognito Console → User Pool → App client → Refresh token expiration → estender temporariamente.
   - **Cuidado**: aumenta janela de comprometimento se token vazar.
2. **Desativar features que dependem de Cognito API direta** (ex: criacao de usuario novo): toggle feature flag `feature_flag_tenanted` `criacao_usuario = false`.
3. **NAO desativar JWT validation no backend** — risco de seguranca inaceitavel.

### 4.4 Se degradacao regional confirmada (sa-east-1 fora, us-east-1 OK)

Cenario raro (Cognito nao tem multi-region nativo). Acoes:

1. Acionar [`failover-regiao.md`](./failover-regiao.md) — mas Cognito user pool e regional, **nao replica automaticamente**.
2. Plan B: usar export/import de usuarios para us-east-1 (procedimento longo, ~horas). Decisao de Roldao + Ana Silva.
3. Aceitar downtime ate AWS resolver e comunicar clientes (modelo: incidente AWS prolongado).

## 5. Verificacao de sucesso

- [ ] `cognito_5xx_rate < 1%` por 15min consecutivos.
- [ ] `login_p95 < 2s` por 15min.
- [ ] Teste manual em conta de QA: `POST /v1/auth/login` retorna 200 com token valido.
- [ ] AWS Health Dashboard sem mais eventos ativos.
- [ ] Status page atualizada para "operacional".

## 6. Rollback

- Reverter TTL de token JWT se foi estendido (segurança).
- Reabilitar features desativadas em §4.3 quando Cognito normalizar.
- Fechar AWS Support case com resumo.

## 7. Escalonamento em camadas

| Camada | Quem | Quando acionar |
|---|---|---|
| **L1 — Plantonista** | escala em `on-call.md` | imediato |
| **L2 — Owner auth** | Ana Silva | imediato (Cognito e dominio dela) |
| **L3 — Dono** | Roldao | > 30min sem mitigacao OU SEV1 |
| **AWS Support** | Business plan | sempre que confirmado evento AWS — open Premium case se > 2h |
| **DPO** | Carlos Mendes | se diagnostico apontar exposicao de credencial/PII (paralelo) |

## 8. Historico de execucao

| Data | Operador | Motivo | Resultado | Observacoes |
|---|---|---|---|---|
| 2026-03-22 | Ana Silva | falso positivo de alerta (3 req timed out em 1min) | sem acao, ajustado threshold de `cognito_5xx_rate` de 1% para 5% | — |

## 9. Pos-execucao

Se houve impacto real em cliente:
- Post-mortem em <= 48h.
- Atualizar §8.
- Avaliar criacao de IdP secundario (revisar ADR-0001) — gatilho: 2+ incidentes Cognito em 6 meses.

## 10. Vinculacao com

- [`ADR-0001`](../../adr/ADR-0001-stack-python-fastapi.md) §Riscos — dependencia critica Cognito.
- [`slo-sli.md`](../slo-sli.md) §2 — SLO login.
- [`observabilidade.md`](../observabilidade.md) §7 — alerta.
- [`failover-regiao.md`](./failover-regiao.md) — se degradacao regional AWS.
- [`api-erro-elevado.md`](./api-erro-elevado.md) — pode disparar em paralelo se backend ficar instavel.
- [`resposta-incidente.md`](../../seguranca/resposta-incidente.md) — fluxo IR geral.
