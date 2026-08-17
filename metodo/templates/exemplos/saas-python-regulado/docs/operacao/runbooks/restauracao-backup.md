---
owner: <DEV-1>
ultima-conferencia: 2026-05-27
severidade-procedimento: destrutivo
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!-- destino: docs/operacao/runbooks/restauracao-backup.md (preenchido no exemplo saas-python-regulado) -->

# Runbook — Restauracao de backup do PostgreSQL (`conciliab-prod-rds`)

## 1. Objetivo

Restaurar o banco `conciliab-prod-rds` a partir de backup, em 3 modos:
1. **Restore de teste** (mensal, sobre instancia separada `conciliab-restore-test`) — NAO destrutivo.
2. **Point-in-time-recovery (PITR)** em producao apos erro humano (cenario DR-4) — DESTRUTIVO.
3. **Restore cross-region** sobre us-east-1 apos perda de regiao (cenario DR-2) — DESTRUTIVO.

## 2. Quando rodar

- **Gatilho 1**: dia 1 do mes — restore de teste mensal (rotina, executor: plantonista).
- **Gatilho 2**: alerta CRITICO "backup diario falhou ou nao concluiu em 6h" (ver `backup.md` §7).
- **Gatilho 3**: incidente confirmado DR-1, DR-2, DR-3 ou DR-4 (ver `disaster-recovery.md`).
- **Janela recomendada**: fora do horario comercial PT-BR (apos 19:00 ou antes
  das 09:00) para restore destrutivo em producao. Restore de teste pode ser a
  qualquer hora.

## 3. Pre-condicoes

- [ ] Acesso a AWS Console + permissao RDS confirmado.
- [ ] Backup recente verificado: ultimo snapshot RDS < 24h, status `available`.
- [ ] Comunicar `#alertas-ops` antes de iniciar (mesmo se for restore de teste).
- [ ] Para modos 2 e 3 (destrutivos): **2-eyes obrigatorio** — outro dev confirma
      em `#alertas-ops` apos ver o plano.
- [ ] Owner do servico (`<DEV-1>`) notificado.
- [ ] Para modo 2 e 3: status page atualizada com "manutencao em andamento".

## 3.5 Diagnostico rapido (antes de mexer)

Antes de executar qualquer acao corretiva, conferir o estado real do sistema.

- [ ] **Logs recentes**: ultimos 30 min do RDS (CloudWatch Logs) + ECS (Datadog).
      O que mudou no padrao? Houve `ERROR` antes do incidente?
- [ ] **Metricas / dashboard Datadog `conciliab - producao`**: CPU, memoria,
      latencia, taxa de erro, fila Celery pendente. Comparar com baseline da
      semana passada.
- [ ] **Ultimos deploys**: houve release nas ultimas 24h? Qual?
      (`gh release list --limit 5`)
- [ ] **Alertas correlatos**: outros servicos / alertas dispararam junto?
- [ ] **Status AWS sa-east-1**: https://health.aws.amazon.com/ — alguma
      degradacao reportada?
- [ ] **Reproducao**: o problema e confirmavel agora? Em qual ambiente?

Registrar o que foi observado em §8 (Historico) mesmo que nao exija acao.

## 4. Passos

### 4.1 Restore de teste (mensal, NAO destrutivo)

1. Listar snapshots recentes:
   `aws rds describe-db-snapshots --db-instance-identifier conciliab-prod-rds --max-records 10`.
2. Escolher o ultimo snapshot `automated` com status `available`.
3. Restaurar para nova instancia separada (NAO sobrescreve producao):
   ```
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier conciliab-restore-test \
     --db-snapshot-identifier <snapshot-id> \
     --db-instance-class db.t3.medium \
     --no-multi-az --no-publicly-accessible
   ```
4. Aguardar status `available` (geralmente 10-15min).
5. Conectar com `psql` (read-only role) e rodar queries de sanidade:
   - `SELECT count(*) FROM tenant;` — esperado: > 3 (3 piloto + dev/seed).
   - `SELECT count(*) FROM conciliacao_tenanted WHERE iniciado_em > now() - interval '7 days';` — esperado: > 0.
   - `SELECT count(*) FROM audit_log;` — esperado: > 0.
6. Comparar checksum: `pg_dump --schema-only` da instancia restaurada vs `pg_dump --schema-only` da producao. Deve ser identico (exceto comentarios de migration).
7. Deletar instancia de teste apos validacao:
   `aws rds delete-db-instance --db-instance-identifier conciliab-restore-test --skip-final-snapshot`.
8. Registrar em §8.

### 4.2 PITR em producao (DESTRUTIVO — cenario DR-4)

> Confirmar com **2-eyes** antes de cada passo marcado com `[2-eyes]`.

1. **[2-eyes]** Identificar timestamp exato do erro (logs + `audit_log`).
2. **[2-eyes]** Confirmar com o dono (Roldao) por mensagem direta antes de prosseguir — perda de dado e potencial.
3. Pausar todos os workers Celery:
   `aws ecs update-service --cluster conciliab-prod --service worker --desired-count 0`.
4. Renomear instancia atual (preserva como referencia):
   `aws rds modify-db-instance --db-instance-identifier conciliab-prod-rds --new-db-instance-identifier conciliab-prod-rds-prior-restore --apply-immediately`.
5. **[2-eyes]** Restaurar para PITR:
   ```
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier conciliab-prod-rds-prior-restore \
     --target-db-instance-identifier conciliab-prod-rds \
     --restore-time <ISO-8601 timestamp anterior ao erro> \
     --db-instance-class db.m5.large \
     --multi-az
   ```
6. Aguardar `available` (~30min para tamanho atual ~50GB).
7. Atualizar connection string da aplicacao (ECS task definition):
   `aws ecs update-service --cluster conciliab-prod --service api --force-new-deployment`.
8. Religar workers: `aws ecs update-service --cluster conciliab-prod --service worker --desired-count 3`.
9. Rodar queries de sanidade (§4.1, passo 5).
10. Verificar `#war-room` + status page.

### 4.3 Restore cross-region us-east-1 (DESTRUTIVO — cenario DR-2)

1. Identificar snapshot cross-region mais recente em us-east-1:
   `aws rds describe-db-snapshots --region us-east-1 --db-instance-identifier conciliab-prod-rds-cross-region-snapshot`.
2. Restaurar para nova instancia em us-east-1:
   `aws rds restore-db-instance-from-db-snapshot --region us-east-1 --db-instance-identifier conciliab-prod-rds-dr --db-snapshot-identifier <snapshot-id> --db-instance-class db.m5.large --multi-az`.
3. Aguardar `available`.
4. Subir copia da aplicacao em us-east-1 (Terraform module `conciliab-dr` em
   `infra/dr/`, ja preparado).
5. Apontar DNS `api.conciliab.com.br` para o ALB de us-east-1 (Route 53 weighted
   routing 0 → 100% us-east-1).
6. Rodar queries de sanidade.

## 5. Verificacao de sucesso

- [ ] Queries de sanidade retornam contagens esperadas (vide §4.1 passo 5).
- [ ] Endpoint `GET /v1/health` responde 200 em verificacao manual:
      `curl https://api.conciliab.com.br/v1/health`.
- [ ] Log `ERROR` parou de aparecer em volume anormal.
- [ ] Worker Celery processa uma conciliacao de teste em < 60s.
- [ ] Cliente-piloto confirmou retorno ao normal (telefone direto se DR-1+).
- [ ] Status page atualizada para "operacional".

## 6. Rollback

### Para modo 4.2 (PITR)

1. Restaurar a instancia `conciliab-prod-rds-prior-restore` (renomear de volta).
2. Atualizar connection string para a instancia original.
3. Reproduzir o estado anterior — observacao: o erro humano original ainda esta
   la; aceitar como conhecido e reabrir incidente com plano alternativo.
4. **Confirmar com 2-eyes antes de cada passo de rollback**.

### Para modo 4.3 (cross-region)

1. Voltar Route 53 para sa-east-1 (peso 100/0).
2. Manter `conciliab-prod-rds-dr` em us-east-1 ate post-mortem decidir
   destino.

## 7. Escalonamento em camadas

| Camada | Quem | Quando acionar |
|---|---|---|
| **L1 — Plantonista da semana** | escala em `slo-sli.md` §7 | imediato: faz a resposta inicial e segue este runbook |
| **L2 — Owner de infra** | `<DEV-1>` | se L1 falhar 2 vezes consecutivas em mitigar **OU** 30 min sem mitigacao |
| **L3 — Dono** | Roldao | se L2 nao responder em 15 min **OU** se o incidente afeta cliente pagante por > 30 min |
| **DPO** | `<DPO-nome>` | sempre que houver suspeita de exposicao de PII (paralelo, nao espera escalada tecnica) |
| **Fornecedor externo** | AWS Support (Business plan ativo) | quando o diagnostico apontar problema na AWS — abrir caso PRIORITY |

> Acionar significa: ligar (nao so mensagem) + abrir thread no `#war-room`.

## 8. Historico de execucao

| Data | Operador | Motivo | Resultado | Observacoes |
|---|---|---|---|---|
| 2026-03-05 | <DEV-1> | restore de teste mensal #1 | ok (12min) | primeiro teste apos setup do pgbackrest |
| 2026-04-05 | <DEV-2> | restore de teste mensal #2 | ok (11min) | — |
| 2026-04-18 | <DEV-1> | apos tabletop DR-2, simulou cross-region | parcial | sem automacao de cross-region snapshot; resolvido no mesmo dia |
| 2026-05-05 | <DEV-3> | restore de teste mensal #3 | ok (14min) | — |
| 2026-05-22 | <DEV-1> | simulado DR-4 em staging | ok (47min) | RTO ajustado em `disaster-recovery.md` §9 |

## 9. Pos-execucao

Se este runbook foi acionado por **incidente real** (nao execucao de rotina):
- Post-mortem em ate 48h usando `templates/post-mortem.template.md`.
- Atualizar §8 com link para o post-mortem.

Criterio para abrir post-mortem:
- Houve impacto perceptivel ao cliente.
- Houve perda ou corrupcao de dado.
- O runbook precisou de rollback (§6).
- A causa raiz ainda e desconhecida ao fim da execucao.

Restore de teste mensal sem ocorrencia NAO exige post-mortem (so atualizar §8).
