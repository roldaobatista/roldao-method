---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 180
proposito: contrato de performance do conciliab — baseline, regressao, ferramentas (Locust, pytest-benchmark), gates de release
---

<!-- destino: docs/operacao/performance-testing.md (preenchido no exemplo saas-python-regulado) -->

# Performance Testing — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE.

> Sem baseline gravado, nao existe regressao detectavel. Coletar antes de comparar.

## 1. Tipos de teste

| Tipo | O que mede | Quando rodar |
|---|---|---|
| **Load** | comportamento sob carga **esperada** (cenario tipico) | a cada release candidate |
| **Stress** | onde o sistema **quebra** (carga crescente ate falhar) | trimestral OU antes de campanha grande |
| **Soak** (endurance) | comportamento sob carga sustentada por 4-8h (leak de memoria, conexao, disco) | mensal em staging |
| **Spike** | resposta a subida abrupta (10x em segundos) | trimestral OU antes de campanha de marketing |
| **Scalability** | quanto o auto-scaling responde corretamente | sempre que policy §3 de `capacity-planning.md` mudar |

## 2. Baseline e regressao

### 2.1 Baseline atual

Baseline medido em 2026-05-15 em staging com dataset padrao §5 (50 tenants sinteticos, 100k conciliacoes, 500k linhas em `audit_log`):

| Servico | Cenario | p50 | p95 | p99 | Throughput | Error rate |
|---|---|---|---|---|---|---|
| `conciliab-api` | `GET /v1/conciliacoes?tenant_id=X` (lista) | 45ms | 180ms | 320ms | 200 rps | 0.0% |
| `conciliab-api` | `POST /v1/conciliacoes` (upload CSV 5MB) | 380ms | 720ms | 1100ms | 30 rps | 0.0% |
| `conciliab-api` | `POST /v1/auth/login` | 220ms | 480ms | 850ms | 50 rps | 0.0% |
| `conciliab-worker` | processa 1k jobs de conciliacao | — | 8s/job | 14s/job | 5 jobs/s | 0.1% |
| `conciliab-worker-lgpd` | atender pedido eliminacao (Art. 18, VI) | — | 12s | 25s | 0.2 jobs/s | 0.0% |

Baseline atualizado **so** quando mudanca intencional de performance e aprovada. Nunca atualizar baseline para esconder regressao (INV-AGENT-006).

### 2.2 Degradacao maxima aceitavel

| Metrica | Degradacao maxima entre release N-1 e N |
|---|---|
| p50 | + 10% |
| p95 | + 15% |
| p99 | + 20% |
| Throughput | - 10% |
| Error rate sob carga | + 0 (zero tolerancia a aumento) |
| Uso de CPU/RAM ao mesmo trafego | + 15% |

Acima do limite → **bloqueia release** (gate §7). Bypass exige ADR justificando trade-off.

## 3. Ferramentas

| Camada | Ferramenta | Quando |
|---|---|---|
| HTTP/API load | **Locust** (Python, mesma stack do produto) | scripts em `tests/load/locustfile.py` |
| Banco isolado | **pgbench** | medir RDS sem ruido da aplicacao |
| Micro-benchmark de funcoes (matcher de conciliacao) | **pytest-benchmark** | regressao em funcao quente em `tests/perf/` |
| Stress de fila | script Python custom + `celery_app.send_task` em loop | medir consumidor isolado |
| Browser end-to-end (UX percebida) | **Playwright** (repo `conciliab-web`) | medir tempo de fluxo real |

Ferramenta escolhida deve gerar relatorio comparavel entre execucoes (CSV/JSON exportavel). Locust gera HTML + CSV nativamente.

## 4. Cenarios obrigatorios por servico critico

Cada servico critico tem **no minimo** os 4 cenarios:

| Cenario | Tipo | Carga | Duracao | Aprovacao se |
|---|---|---|---|---|
| Carga esperada (dia normal) | Load | 100 rps total | 15 min | p95 dentro de baseline + 15% |
| Pico previsto (campanha) | Load | 200 rps total | 15 min | p95 dentro de baseline + 25% |
| Stress ate quebrar | Stress | rampa 0 → 1000 rps | ate quebrar | sistema degrada graciosamente (sem erro 500 em massa antes do limite documentado em `capacity-planning.md` §4) |
| Endurance | Soak | 50 rps constante | 4-8h | sem leak de memoria (RSS estavel), sem crescimento de latencia |
| Spike (pre-campanha marketing) | Spike | 50 rps → 500 rps em 30s | 5 min sustentados | autoscaling responde em < 3min, error rate < 1% durante a subida |

Cenarios especificos do conciliab:
- Upload simultaneo de CSV por 20 tenants diferentes (testa isolamento RLS sob carga).
- Conciliacao de OFX grande (50MB) sem timeout do worker.

## 5. Dados de teste

| Origem | Permitido? | Condicao |
|---|---|---|
| **Sinteticos** (`tests/load/factories.py` com Faker locale `pt_BR`) | sim | preferencia para reproducibilidade |
| **Anonimizados** de prod (`anonimizador.py` mascara CPF/CNPJ/e-mail) | sim | passou pelo processo validado, sem PII bruta |
| **Brutos de prod com PII** | **NAO** | proibido em qualquer ambiente nao-prod — viola INV-AGENT-008 + INV-LGPD-001 |

Dataset versionado em `s3://conciliab-test-fixtures-saeast1/` com tamanho representativo: 50 tenants, 100k conciliacoes, 500k linhas em `audit_log`, 100k linhas em `usuario_tenanted`.

## 6. Execucao

| Item | Padrao |
|---|---|
| Frequencia | Load: por RC. Stress/Spike/Scalability: trimestral. Soak: mensal. |
| Ambiente | **staging** com escala equivalente a prod (mesma task definition, mesmo plano RDS) |
| Janela | fora do horario de uso de staging por dev (preferencia: madrugada, agendado via GitHub Actions cron) |
| Quem analisa | Ana Silva com revisao de Bruno Costa |
| Relatorio | publicado em `docs/operacao/performance-reports/<YYYY-MM-DD>-<release>.md` |
| Retencao do relatorio | 1 ano minimo (comparacao historica) |

> Rodar performance test em prod e PROIBIDO salvo com canary muito limitado + aprovacao explicita de Roldao + Ana Silva. Risco de impactar cliente-piloto.

## 7. Criterio de aprovacao para release (gate)

Release **so passa** o gate de performance se:

- [ ] Cenarios de §4 marcados como obrigatorios executados na RC.
- [ ] Resultados dentro dos limites de §2.2 contra baseline atual.
- [ ] Relatorio §6 publicado e linkado no PR/issue da release.
- [ ] Em caso de degradacao acima do limite: ADR aprovado **antes** do release explicando trade-off (e atualizando baseline §2.1).
- [ ] Endurance (Soak) executado nos ultimos 30 dias sem leak detectado.

Falha do gate → bloqueia promotion staging → prod conforme [`deployment-strategy.md`](./deployment-strategy.md) §8.

## 8. Resposta a regressao detectada

1. **Identificar** ponto de introducao: comparar com release anterior e bissecionar commits (`git bisect`) se necessario.
2. **Classificar**: intencional (otimizacao adiada) ou nao-intencional (bug de performance).
3. **Decisao**:
   - Nao-intencional + acima do limite → **rollback ou correcao antes do release**.
   - Intencional + aceita → ADR + atualizacao de baseline.
4. **Registrar** em `docs/operacao/performance-reports/` com link para fix ou ADR.

## 9. Historico de execucao

| Data | Release | Tipo | Resultado | Link relatorio |
|---|---|---|---|---|
| 2026-04-22 | `2026.04.2` | Load + Soak | ok (sem regressao) | `docs/operacao/performance-reports/2026-04-22-2026.04.2.md` (fora exemplo) |
| 2026-05-15 | baseline | Load + Stress | baseline coletado (3 cenarios) | `docs/operacao/performance-reports/2026-05-15-baseline.md` (fora exemplo) |
| 2026-05-20 | `2026.05.2` | Load | regressao p95 +18% em `POST /v1/conciliacoes` (acima do limite) | rollback executado, fix em `2026.05.3` |
| 2026-05-22 | `2026.05.3` | Load + Soak | ok | linkado no GitHub release |

## 10. Vinculacao com

- [`release-process.md`](./release-process.md) §6 — gate §7 e pre-condicao para tag.
- [`deployment-strategy.md`](./deployment-strategy.md) §8 — gate staging → prod.
- [`capacity-planning.md`](./capacity-planning.md) — resultados alimentam forecast.
- [`observabilidade.md`](./observabilidade.md) — metricas do teste sao as mesmas medidas em prod.
- [`slo-sli.md`](./slo-sli.md) — limites §2.2 compativeis com SLOs publicados.
- [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — INV-AGENT-008 (PII em dataset).
- `auditor-seguranca` — valida cenarios obrigatorios na RC.
