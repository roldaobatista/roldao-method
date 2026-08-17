---
owner: Bruno Costa
ultima-conferencia: 2026-05-27
severidade-procedimento: destrutivo
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: runbook de DR (Disaster Recovery) regional — failover de sa-east-1 para us-east-1 apos perda prolongada da regiao primaria
---

<!-- destino: docs/operacao/runbooks/failover-regiao.md (preenchido no exemplo saas-python-regulado) -->

# Runbook — Failover regional (sa-east-1 → us-east-1)

## 1. Objetivo

Restaurar operacao do conciliab em regiao secundaria `us-east-1` apos perda confirmada de `sa-east-1` por mais de 1 hora (cenario DR-2 de `disaster-recovery.md`, fora deste exemplo).

> **Decisao destrutiva** — implica transferencia internacional de dados (Art. 33 LGPD). DPO Carlos Mendes deve aprovar antes de executar. Failover NAO e silencioso: clientes-piloto comunicados antes da virada do DNS.

## 2. Quando rodar

- **Gatilho 1**: AWS Health Dashboard reporta perda de `sa-east-1` confirmada > 60min.
- **Gatilho 2**: alerta interno `regiao-sa-east-1-down` (Datadog cross-region probe falha).
- **Gatilho 3**: aprovado por Roldao + Bruno Costa + Carlos Mendes (DPO) — failover regional **NUNCA** roda sem aprovacao tripla, mesmo com gatilho automatico.
- **Janela**: imediato (apos aprovacao).

## 3. Pre-condicoes

- [ ] Acesso AWS Console + permissoes em `us-east-1` (IAM role `dr-operator`).
- [ ] Acesso ao Route 53 (DNS `conciliab.com.br`).
- [ ] Acesso ao Terraform DR module em `infra/dr/` confirmado (`terraform init`).
- [ ] Snapshot cross-region recente: `aws rds describe-db-snapshots --region us-east-1 --db-snapshot-identifier conciliab-prod-rds-cross-region-snapshot --max-records 1` → ultimo < 24h.
- [ ] Status page atualizada para "Indisponibilidade — DR em andamento".
- [ ] `#war-room` Slack + Google Meet aberto.
- [ ] **2-eyes obrigatorio em CADA passo destrutivo** (Bruno Costa + Ana Silva ou Roldao).
- [ ] **Aprovacao DPO Carlos Mendes registrada em `#war-room`** antes do passo 4.5 (transferencia internacional inicia).

## 3.5 Diagnostico rapido

- [ ] **Confirmar perda regional**: AWS Health Dashboard + AWS Status Twitter + tentar acessar console em sa-east-1.
- [ ] **Confirmar duracao prevista**: AWS support case PRIORITY aberto. ETA AWS para resolucao?
- [ ] **Se ETA < 60min**: NAO fazer failover (custo > beneficio). Manter status page atualizada, aguardar.
- [ ] **Se ETA > 2h OU sem ETA**: proceder com failover apos aprovacoes.

## 4. Passos

### 4.1 Aprovacoes formais (D+0 a D+15min)

1. **[2-eyes]** Bruno Costa documenta em `#war-room`: "Proponho failover regional sa-east-1 → us-east-1. AWS Health: <evidencia>. ETA AWS: <X>. Impacto: indisponibilidade ~30-60min ate DNS propagar."
2. Ana Silva ou Roldao confirma "+1 failover regional".
3. **[critico]** Carlos Mendes DPO aprova transferencia internacional: "DPO aprova Art. 33 II — clausulas-padrao AWS cobrem; comunicarei clientes-piloto em D+1."
4. Sem TODAS as 3 aprovacoes (incluindo DPO): PARAR.

### 4.2 Comunicacao previa (D+15min)

1. Atualizar status page: "Em manutencao emergencial — DR em andamento. ETA 60min."
2. E-mail aos 3 clientes-piloto: modelo em `docs/conformidade/lgpd/modelos/dr-comunicacao-cliente.md` (fora exemplo). Mencao explicita: "Por DR emergencial, seus dados serao processados temporariamente em servidores AWS us-east-1 (EUA). Transferencia internacional autorizada por Art. 33 II LGPD — clausulas-padrao contratuais com AWS. Apos resolucao, dados retornam a sa-east-1."

### 4.3 Restore do banco em us-east-1 (D+15min a D+45min)

> **[2-eyes]** em cada comando.

1. Identificar snapshot cross-region mais recente:
   ```
   aws rds describe-db-snapshots --region us-east-1 \
     --db-snapshot-identifier conciliab-prod-rds-cross-region-snapshot \
     --max-records 1
   ```
2. Restaurar para nova instancia em us-east-1:
   ```
   aws rds restore-db-instance-from-db-snapshot --region us-east-1 \
     --db-instance-identifier conciliab-prod-rds-dr \
     --db-snapshot-identifier <snapshot-id> \
     --db-instance-class db.m5.large \
     --multi-az \
     --storage-encrypted --kms-key-id <us-east-1-kms-cmk-arn>
   ```
3. Aguardar status `available` (~25min para ~50GB).
4. Conectar com `psql` e rodar queries de sanidade (ver `restauracao-backup.md` §4.1 passo 5).

### 4.4 Subir aplicacao em us-east-1 (D+45min a D+60min)

1. Aplicar Terraform DR module:
   ```
   cd infra/dr/us-east-1
   terraform apply -auto-approve -var "rds_endpoint=<us-east-1-rds-endpoint>"
   ```
2. Modulo provisiona:
   - VPC + subnets + security groups equivalentes.
   - ECS cluster `conciliab-dr` + tasks `conciliab-api` + `conciliab-worker`.
   - ALB `conciliab-alb-dr`.
   - Replicar segredos do AWS Secrets Manager para us-east-1 (`replicate-secrets.sh`).
3. Confirmar `/v1/health` retorna 200 em ALB us-east-1:
   ```
   curl https://<alb-dr-dns>/v1/health
   ```

### 4.5 Virar DNS (D+60min a D+90min)

> **[2-eyes]** + DPO ja aprovou em §4.1.

1. Atualizar Route 53 `api.conciliab.com.br` para apontar para ALB us-east-1:
   ```
   aws route53 change-resource-record-sets --hosted-zone-id <ZONE> \
     --change-batch file://route53-failover-us-east-1.json
   ```
   (TTL 60s ja configurado pra failover rapido)
2. Aguardar propagacao DNS (1-5min).
3. Confirmar `dig api.conciliab.com.br` retorna IP do ALB us-east-1.

### 4.6 Cognito (PONTO DE ATENCAO)

Cognito user pool e regional e NAO replica. Opcoes:

- **Opcao A — aceitar perda de login temporaria**: clientes-piloto recebem instrucoes para esperar volta de sa-east-1.
- **Opcao B — export/import**: rodar export do user pool sa-east-1 (se acessivel) + import em us-east-1 (~horas, complexo).

Decisao em `#war-room`. Default: Opcao A — explicar a 3 clientes-piloto que login retorna quando sa-east-1 voltar (Cognito) ou em janela longa (export).

## 5. Verificacao de sucesso

- [ ] `GET /v1/health` em `api.conciliab.com.br` retorna 200 (apontando para us-east-1).
- [ ] Queries de sanidade no PG retornam contagens esperadas.
- [ ] Worker Celery em us-east-1 processa conciliacao de teste em < 90s.
- [ ] Status page atualizada para "DR ativo — operacional em us-east-1".
- [ ] E-mail enviado para 3 clientes-piloto com confirmacao.
- [ ] Audit log registra failover (`event: dr.failover.executado`).

## 6. Rollback (volta para sa-east-1)

Apos AWS restaurar sa-east-1:

1. Confirmar sa-east-1 estavel por >= 4h.
2. Sincronizar dados us-east-1 → sa-east-1 via `pg_dump`/`pg_restore` ou replicacao logica.
3. Janela de manutencao agendada (terca janela §1 `change-management.md`).
4. Virar DNS de volta para ALB sa-east-1.
5. Manter instancia us-east-1 ativa por 24h apos cutover (rollback rapido se algo der errado).
6. Deletar recursos us-east-1 apos 7 dias estaveis.
7. Comunicar clientes: "DR encerrado, operacao normalizada em sa-east-1."

## 7. Escalonamento em camadas

| Camada | Quem | Quando acionar |
|---|---|---|
| **L1 — Plantonista** | escala on-call.md | imediato, abre `#war-room` |
| **L2 — Owner infra** | Bruno Costa | aprovacao tecnica do failover |
| **L3 — Owner API** | Ana Silva | 2-eyes para passos destrutivos |
| **L4 — Dono** | Roldao | aprovacao final + comunicacao com clientes-piloto |
| **DPO** | Carlos Mendes | aprovacao para transferencia internacional Art. 33 |
| **AWS Support** | Premium (escalar de Business para Premium em emergencia DR) | sempre |

## 8. Historico de execucao

| Data | Operador | Motivo | Resultado | Observacoes |
|---|---|---|---|---|
| 2026-04-18 | Bruno Costa + Ana Silva | tabletop DR-2 (simulado) | parcial (sem automacao cross-region snapshot completa) | resolvido — snapshot cross-region passou a ser diario automatico |
| 2026-05-22 | Bruno Costa | simulado DR-4 em staging | ok (47min) | ajustou RTO em `disaster-recovery.md` §9 (fora exemplo) |

## 9. Pos-execucao

Failover real (nao simulado) **sempre** exige:
- Post-mortem em <= 48h.
- Comunicacao formal a ANPD se houve exposicao de PII (INV-LGPD-003 — 72h).
- Atualizacao de `disaster-recovery.md` se RTO real divergiu do contratado.
- Revisao do contrato com clientes-piloto sobre transferencia internacional.

## 10. Vinculacao com

- [`disaster-recovery.md`](../disaster-recovery.md) — cenarios DR e RTO/RPO.
- [`restauracao-backup.md`](./restauracao-backup.md) §4.3 — passos detalhados de restore cross-region.
- [`cognito-degradado.md`](./cognito-degradado.md) — Cognito nao replica entre regioes.
- [`resposta-incidente.md`](../../seguranca/resposta-incidente.md) — fluxo IR geral.
- [`ropa.md`](../../conformidade/lgpd/ropa.md) — base legal transferencia internacional (Art. 33 II — clausulas-padrao).
- [`REGRAS-INEGOCIAVEIS.md`](../../../REGRAS-INEGOCIAVEIS.md) — INV-AGENT-001 + INV-LGPD-003.
