---
owner: Bruno Costa
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: estrategia tecnica de deployment do conciliab — rolling, canary, feature flags, migration Expand/Migrate/Contract no PostgreSQL, rollback
---

<!-- destino: docs/operacao/deployment-strategy.md (preenchido no exemplo saas-python-regulado) -->

# Estrategia de Deployment — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE. Complementa `release-process.md` (QUANDO/QUEM) com o COMO tecnicamente.

## 1. Estrategias suportadas

| Estrategia | O que e | Quando usar |
|---|---|---|
| **Rolling** | substitui tasks ECS Fargate N por N+1 gradualmente (deployment configuration `min=100% / max=200%`) | mudanca sem breaking, sem mudanca de schema |
| **Blue-Green** | dois target groups ALB; switch atomico de trafego | release com mudanca grande mas reversivel |
| **Canary** | ALB weighted routing — nova versao recebe 5%/25%/50%/100% gradualmente | release com risco moderado, validacao em trafego real |
| **Dark launch** | codigo novo deployado mas inativo (gated por feature flag `feature_flag_tenanted`) | preparar release grande em pedacos |
| **Shadow traffic** | requisicoes reais replicadas via Lambda para versao nova sem afetar resposta | validar performance de motor de matching novo |

Default no conciliab: **Canary** para qualquer mudanca que toca conciliacao; **Rolling** para bugfix isolado.

## 2. Criterio de escolha

| Tipo de mudanca | Estrategia | Por que |
|---|---|---|
| Bugfix simples, sem mudanca de comportamento | Rolling | mais barato, baixo risco |
| Feature nova retrocompativel | Canary 5% → 25% → 50% → 100% | valida em trafego real com baixo blast radius |
| Refator do motor de matching (`conciliab/financas/conciliacao/matcher.py`) | Shadow + Canary | confirma equivalencia funcional antes de servir cliente |
| Mudanca de schema PG | Expand → Migrate → Contract (§4) com Rolling | zero-downtime, RLS continuamente ativa |
| Mudanca grande com janela curta de rollback | Blue-Green | switch instantaneo back |
| Feature em desenvolvimento | Dark launch (flag off) | desacopla merge de release |

Decisao consta no PR/issue. Auditor `auditor-seguranca` checa via regra SEC-DEPLOY-01.

## 3. Feature flags

Tabela `feature_flag_tenanted` no PG (com RLS) + cache Redis 5min.

### 3.1 Tipos

| Tipo | Quando usar | Tempo de vida esperado |
|---|---|---|
| **Boolean global** | kill switch de feature nova | curto: < 30 dias apos GA |
| **Percentage** | canary progressivo, A/B | curto: < 30 dias apos 100% |
| **Audience (tenant_id)** | beta privado, cliente piloto | medio: ate fim do piloto |
| **Permission (plan)** | gating comercial permanente | longo: vive enquanto plano existir |

Kill switch de seguranca (desligar conciliacao em incidente) tem vida indefinida — infraestrutura, nao debito.

### 3.2 Audit log

Toda mudanca de flag em prod gera linha em `audit_log` (INV-AUDIT-001):
- `timestamp`, `flag_name`, `valor_anterior`, `valor_novo`, `quem_mudou` (sub Cognito), `motivo`, `ticket`.
- Retencao 1 ano minimo + 5 anos no `audit_log` WORM.
- Mudanca de flag e operacao de mudanca — segue [`change-management.md`](./change-management.md) §1.

### 3.3 Cadencia de limpeza (dead-code cleanup)

> Flag temporaria que vira permanente vira debito. Limpar agressivamente.

- Revisao mensal por Diego Tavares (flags-owner).
- Cada flag tem `created_at`, `owner`, `removal_target_date` cadastrados na criacao.
- Flag boolean a 100% por 14 dias consecutivos → abrir tarefa de remocao (PR que apaga flag e mantem ramo ativado).
- Auditor `auditor-seguranca` regra SEC-FLAG-01 falha build se flag > 90 dias sem `removal_target_date`.

## 4. Migracoes de banco zero-downtime (Alembic)

Padrao **Expand → Migrate → Contract** (3 releases):

| Fase | Codigo (app) | Schema (alembic) | Garantia |
|---|---|---|---|
| **Expand** | le formato antigo, escreve em ambos | adiciona coluna/tabela nova, mantem antiga; RLS policy duplicada | versao antiga continua funcionando |
| **Migrate** | le e escreve no formato novo | backfill assincrono via job Celery `backfill_<campo>` com checkpoint | nenhuma escrita no formato antigo |
| **Contract** | le e escreve so no formato novo | dropa coluna/tabela antiga | sem rollback para Expand sem restore |

Regras:
- Nunca rodar `DROP COLUMN`, `RENAME` sem alias, `ALTER COLUMN` que muda tipo incompativel em uma unica release.
- Backfill em batch de 1000 linhas com idempotencia (`UPDATE ... WHERE ... AND backfilled_at IS NULL`) e checkpoint em `migration_checkpoint`.
- Migration > 5min em prod → rodar fora do deploy via job dedicado (`alembic upgrade` + script Python).
- Migration sempre tem script de rollback testado em staging.
- Tabela com sufixo `_tenanted` exige policy RLS criada na mesma migration (verificado por `migration-rls-check.sh`).

Comandos canonicos:
- `poetry run alembic revision --autogenerate -m "<msg>"` — gera migration.
- `poetry run alembic upgrade head` — aplica.
- `poetry run alembic downgrade -1` — reverter (proibido em prod sem confirmacao explicita — INV-AGENT-001).

## 5. Janela de compatibilidade

- API publica: nao temos API publica documentada (so cliente proprio `conciliab-web`). Compatibilidade backward: 2 versoes mensais (60 dias).
- Schema PG: N-2 versoes da app rodam contra schema atual (cobertura rollout + rollback).
- Eventos Stripe (consumidor): aceitamos versao atual + N-1.

## 6. Playbook de rollback

| Estrategia | Como reverter | Tempo alvo |
|---|---|---|
| Rolling | re-deploy da task definition N-1: `aws ecs update-service --task-definition <prev>` | < 10min |
| Blue-Green | ALB rule: weight 100% → blue | < 1min |
| Canary | ALB rule: weight canary → 0 | < 1min |
| Dark launch | toggle flag para off via admin UI ou `UPDATE feature_flag_tenanted SET enabled=false WHERE name='X'` | < 30s |
| Shadow | desabilitar replicacao Lambda | < 30s |
| Migration Expand | re-deploy app N-1 (schema continua compativel) | < 10min |
| Migration Migrate | re-deploy app + restaurar de backup se backfill corrompeu | < 1h |
| Migration Contract | **sem rollback simples** — restore de backup PITR | horas (ver `runbooks/restauracao-backup.md` §4.2) |

Detalhe operacional em [`runbooks/api-erro-elevado.md`](./runbooks/api-erro-elevado.md).

## 7. Ambientes

| Ambiente | Proposito | Dados | Acesso |
|---|---|---|---|
| **dev** | local + branch preview | sinteticos (seed `conciliab.scripts.seed_dev`) | dev |
| **staging** | espelho de prod para RC + smoke test | snapshot anonimizado de prod (sem PII bruta) — refresh semanal | dev + qa |
| **prod** | clientes-piloto reais | reais | restrito, audit CloudTrail |

Regras:
- Dev nao usa dados de prod com PII (INV-AGENT-008).
- Staging refresh de schema semanal a partir de snapshot anonimizado (`anonimizador.py` mascara CPF/CNPJ/e-mail).
- Mudanca so chega em prod depois de >= 24h em staging sem alerta SEV3+.

## 8. Promotion gates

| Gate | Entre | Criterio |
|---|---|---|
| dev → staging | PR merged em `main` | unit + integration verdes, ruff, mypy --strict, build Docker, auditores Claude |
| staging → prod (RC) | RC publicado | smoke test verde + 24h sem alerta SEV3+ |
| prod canary → prod full | rollout progressivo | metricas §5 de `release-process.md` dentro do limite |

Gate falhado → bloqueia automaticamente. Bypass manual exige ADR + aprovacao §2.4 de `release-process.md`.

## 9. Stack de orquestracao

- **Computacao:** AWS ECS Fargate (cluster `conciliab-prod`), task definition versionada.
- **Load balancer:** ALB `conciliab-alb` com weighted target groups para canary.
- **Container registry:** AWS ECR `conciliab-api` com tag imutavel por release CalVer + scanning de imagem habilitado.
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml` + `release.yml` + `rollback.yml`).
- **Secret injection:** ECS task pega segredos do AWS Secrets Manager via `secrets` na task definition (nao via env file).

## 10. Vinculacao com

- [`release-process.md`](./release-process.md) — fluxo de release usa estas estrategias.
- [`change-management.md`](./change-management.md) — janela em que deploy pode ocorrer.
- [`observabilidade.md`](./observabilidade.md) — metricas que disparam rollback automatico.
- [`runbooks/api-erro-elevado.md`](./runbooks/api-erro-elevado.md) — execucao manual de rollback.
- [`ADR-0002`](../adr/ADR-0002-multi-tenant-rls.md) — RLS continuamente ativa durante migration.
- `auditor-seguranca` — valida ciclo de vida das flags + Expand/Migrate/Contract.
