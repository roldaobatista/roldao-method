---
id: ADR-0003
titulo: Storage primario em PostgreSQL; arquivos brutos em S3
status: aceita
data-proposta: 2026-02-23
data-aceite: 2026-02-25
depende-de: [ADR-0001, ADR-0002]
bloqueia-fase: F-A
superseded-by:
owner: <DEV-1>
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 140
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0003: Storage primario em PostgreSQL; arquivos brutos em S3

## Contexto

O conciliab manipula 2 tipos de dado:

1. **Estruturado** (transacoes parsadas, conciliacoes, regras de match,
   `audit_log`, snapshots fiscais): dados relacionais, consultados com filtro,
   participam de relatorios e joins.
2. **Bruto** (arquivos CSV/OFX/PDF originais enviados pelo cliente): arquivos
   binarios, ate 50MB cada, raramente lidos apos parse (so para auditoria do
   cliente). Volume estimado: 10-50 arquivos por tenant por mes.

Premissas (constitution + ADR-0002):
- Trilha imutavel (`audit_log` WORM, INV-AUDIT-002).
- Multi-tenant com RLS no banco relacional (ADR-0002).
- LGPD: arquivos com dado pessoal precisam de prazo de retencao definido +
  expurgo (ver `retencao-dados.md`).
- Backup tem que cobrir os dois tipos (ver `backup.md`).

## Opcoes consideradas

### Opcao 1: PostgreSQL para estruturado + S3 para arquivos brutos

- **Pros:** cada storage no seu forte; PG e otimo para query relacional; S3 e
  otimo para object storage (lifecycle policy automatica, SSE-KMS,
  versionamento opcional); custo previsivel; backup separado mas coordenado.
- **Contras:** dois sistemas para operar; consistencia eventual entre PG e S3
  (mitigado por padrao: gravar S3 primeiro com `Content-MD5`, depois inserir
  linha em `arquivo_recebido_tenanted` com path + hash).
- **Custo:** baixo. AWS sa-east-1 ja tem RDS Postgres e S3 disponiveis.

### Opcao 2: PostgreSQL com `bytea` para arquivos tambem

- **Pros:** um storage so; transacao atomica garante consistencia; backup
  unico cobre tudo.
- **Contras:** tabela cresce muito rapido (50 arquivos × 10MB × 100 tenants =
  50GB/mes so de bruto); backup vira pesado; restore lento; PG nao e
  desenhado para blob de 50MB; dump fica enorme.
- **Custo:** medio. Operacionalmente piora rapido.

### Opcao 3: S3 para tudo (objeto + JSON estruturado)

- **Pros:** um storage so; barato; escala infinita.
- **Contras:** S3 nao serve para query relacional; precisaria reinventar
  indice; sem RLS; sem ACID; LGPD vira pesadelo (busca por titular vira full-scan).
- **Custo:** alto. Inviavel para o dominio.

## Decisao

Escolhemos a **Opcao 1: PostgreSQL para estruturado + S3 para arquivos brutos**.

**Padrao adotado:**

- Banco relacional: `RDS PostgreSQL 16` em sa-east-1, multi-AZ, com replica de
  leitura. Backup: snapshot diario (retencao 30 dias) + WAL contínuo via
  `pgbackrest` (point-in-time-recovery em ate 7 dias).
- S3: bucket `conciliab-uploads-saeast1` (privado, SSE-KMS, versionamento
  ligado). Path `s3://<bucket>/<tenant_id>/<yyyy>/<mm>/<uuid>.<ext>`.
- Replicacao cross-region: PG → snapshot replica em us-east-1 (assincrono,
  apenas DR). S3 → `replication rule` cross-region para `conciliab-uploads-useast1`.
- Tabela `arquivo_recebido_tenanted` guarda metadados: `id`, `tenant_id`,
  `s3_path`, `sha256`, `tamanho_bytes`, `recebido_em`, `parsed_em`.
- LGPD: prazo de retencao de arquivo bruto = 5 anos (obrigacao fiscal,
  ver retencao-dados.md §2). Lifecycle policy do bucket move para Glacier apos
  90 dias.

## Consequencias

### Positivas
- Cada storage usado no seu ponto forte.
- Backup PG fica leve (so estruturado).
- S3 lifecycle policy resolve expurgo automatico.
- LGPD: para atender pedido de eliminacao do titular, sabemos exatamente quais
  objetos S3 + linhas PG apagar.

### Negativas
- Operar dois sistemas (mitigado por usar AWS gerenciado).
- Consistencia eventual: precisa job de reconciliacao mensal entre tabela
  `arquivo_recebido_tenanted` e bucket (orphan detector). Runbook em
  `docs/operacao/runbooks/reconciliar-s3-pg.md`.

### Reversibilidade
**Media**. Migrar S3 para outro provider de object storage e factivel
(rclone + reescrever paths). Migrar PG para outro engine relacional (Aurora,
por exemplo) e factivel mas perderia detalhes de RLS-no-PG-vanilla — exigiria
ADR nova.

## Non-goals

Esta ADR NAO decide:
- Estrategia de cache (Redis ja em ADR-0001).
- CDN para frontend (CloudFront, em projeto separado).
- Backup detalhado (ver `docs/operacao/backup.md`).
- DR detalhado (ver `docs/operacao/disaster-recovery.md`).

## Como validar (gates)

- [x] PG em multi-AZ + replica de leitura ativa em sa-east-1.
- [x] S3 com SSE-KMS + versionamento + cross-region replication ativos.
- [x] `arquivo_recebido_tenanted` criada com `_tenanted` (ADR-0002).
- [x] Job orphan-detector rodando mensalmente (cron K8s).
- [x] Runbook de restore testado: `docs/operacao/runbooks/restauracao-backup.md`.

## Referencias

- ADR-0001 (stack), ADR-0002 (RLS).
- INV-AUDIT-001..003.
- `docs/operacao/backup.md`, `docs/operacao/disaster-recovery.md`.
- `docs/conformidade/lgpd/retencao-dados.md`.
