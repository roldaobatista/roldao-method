---
owner: <DEV-1>
ultima-conferencia: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 120
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!-- destino: docs/operacao/backup.md (preenchido no exemplo saas-python-regulado) -->

# Politica de Backup — conciliab

> **Backup** = copia de seguranca dos dados, guardada em outro lugar, para
> usar se o original for perdido ou corrompido. Esta politica diz **o que** e
> copiado, **quando**, **por quanto tempo guardamos** e **quem** valida.

## 1. Escopo

| Categoria | Inclui no backup? | Observacao |
|---|---|---|
| Banco de producao (`conciliab-prod-rds`) | sim | snapshot diario + WAL continuo via pgbackrest |
| Arquivos brutos S3 (`conciliab-uploads-saeast1`) | sim | versionamento + replicacao cross-region |
| Configuracoes da aplicacao | sim | tudo em AWS Secrets Manager + IaC versionado em Git |
| Segredos (chaves de API, certificados) | sim, no Secrets Manager | nunca no mesmo bucket dos dados |
| Logs de aplicacao (CloudWatch) | sim, retencao curta | uteis para auditoria pos-incidente (6 meses) |
| Logs de seguranca (Cognito + WAF) | sim | retencao 12 meses (Marco Civil) |
| Caches Redis | nao | regerar a partir da fonte |
| Build artifacts (Docker images ECR) | sim, retencao 90 dias | rollback de versao |
| `audit_log` (WORM) | sim, retencao 5 anos (obrigacao fiscal) | snapshot mensal congelado |

Exemplo preenchido:
- `conciliab-prod-rds` (PostgreSQL 16, db.m5.large, multi-AZ): snapshot diario
  automatico via RDS + WAL continuo via `pgbackrest` para bucket
  `s3://conciliab-pgbackrest-saeast1`.

## 2. Frequencia

| Categoria | Frequencia | Tipo |
|---|---|---|
| Banco de producao | diario | full snapshot RDS + WAL continuo |
| Arquivos S3 | continuo | versionamento + replicacao cross-region |
| Configs / segredos | a cada mudanca | versionado em Secrets Manager (10 versoes mantidas) |
| Snapshot semanal consolidado | semanal (domingo 03:00 -03) | full de tudo |
| Snapshot mensal arquivado | mensal (dia 1 04:00 -03) | full, congelado em Glacier |

## 3. Retencao

| Tipo | Retencao | Justificativa |
|---|---|---|
| Diario (RDS snapshot) | 30 dias | recuperacao rapida de erro recente |
| Semanal | 12 semanas | cobrir trimestre |
| Mensal | 12 meses | conformidade contratual com clientes-piloto |
| Anual (Glacier) | 5 anos | obrigacao fiscal (Lei 8.846/94 + Decreto 70.235/72) — cobre `audit_log` e snapshots fiscais |
| Versoes S3 (uploads cliente) | 5 anos (Glacier apos 90 dias) | obrigacao fiscal |
| Logs CloudWatch | 6 meses | investigacao de incidente |
| Logs de seguranca (Cognito) | 12 meses | Marco Civil Art. 15 |

## 4. Localizacao — regra 3-2-1

Manter sempre:
- **3** copias dos dados (1 original + 2 backups)
- em **2** midias diferentes (RDS storage + S3)
- com **1** copia offsite (regiao diferente)

Implementacao no conciliab:
- **Copia 1 (original):** RDS `conciliab-prod-rds` em sa-east-1 (multi-AZ — ja
  e 2 copias sincronas, mas conta como 1 "logica").
- **Copia 2 (online, mesma regiao, midia diferente):** bucket
  `s3://conciliab-pgbackrest-saeast1` + bucket `s3://conciliab-uploads-saeast1`.
- **Copia 3 (offsite):** bucket `s3://conciliab-uploads-useast1` (regiao
  diferente, replicacao cross-region ativa) + snapshots RDS replicados para
  us-east-1 (cross-region snapshot copy semanal).

## 5. Criptografia

- **Em transito:** TLS 1.2+ obrigatorio entre origem e destino. RDS exige TLS
  (parameter group `rds.force_ssl=1`).
- **Em repouso:** AES-256 via AWS KMS. Chaves: `arn:aws:kms:sa-east-1:...:key/conciliab-prod-rds`
  e `arn:aws:kms:sa-east-1:...:key/conciliab-prod-s3`.
- Chaves de criptografia tem rotacao anual automatica via KMS.
- Backup NUNCA gravado em texto claro, nem em ambiente de staging.

## 6. Teste de restore

> Backup que nunca foi restaurado nao e backup, e esperanca.

- **Frequencia minima:** mensal.
- **Executor:** plantonista da semana (escala em `slo-sli.md` §7).
- **Procedimento:** runbook
  [`docs/operacao/runbooks/restauracao-backup.md`](./runbooks/restauracao-backup.md).
- **Aceite:** restore termina em < RTO definido (ver `disaster-recovery.md`),
  dados validados por checksum (`pg_dump | md5sum`) + 3 queries de sanidade
  (count em `tenant`, `conciliacao_tenanted`, `audit_log`).
- **Registro:** linha em `docs/operacao/historico-restore.md` (fora deste
  exemplo) com data, executor, tempo gasto, resultado.

## 7. Monitoramento

- **CRITICO** se ultimo backup diario falhar ou nao concluir em 6h
  (CloudWatch alarm + PagerDuty).
- **ALTO** se replicacao cross-region atrasar mais de 2h.
- **MEDIO** se uso de storage do bucket de backup crescer > 20% mes-a-mes
  (possivel vazamento de retencao).
- **MEDIO** se teste de restore mensal falhar OU se o mes virar sem teste de
  restore registrado.
- Canal de alerta: `#alertas-ops` + PagerDuty para o plantonista da semana.

## 8. Responsaveis

| Papel | Quem | O que faz |
|---|---|---|
| Dono do processo | <DEV-1> | aprova mudancas na politica, revisa anualmente |
| Executor | plantonista da semana | acompanha alertas, executa restore de teste mensal |
| Auditor | <DPO-nome> (DPO) | verifica trimestralmente se a politica esta sendo seguida (LGPD: integridade do dado pessoal) |

## 9. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-22 | <DEV-1> | criacao inicial junto com ADR-0003 |
| 2026-04-18 | <DEV-1> | adicionada replicacao cross-region us-east-1 apos primeiro teste de DR (cenario DR-2) |
