---
owner: Carlos Mendes
ultima-conferencia: 2026-05-27
severidade-procedimento: destrutivo
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: runbook LGPD Art. 18 VI — atender pedido de eliminacao do titular em ate 15 dias corridos (INV-LGPD-002)
---

<!-- destino: docs/operacao/runbooks/atender-pedido-eliminacao.md (preenchido no exemplo saas-python-regulado) -->

# Runbook — Atender pedido de eliminacao do titular (LGPD Art. 18, VI)

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE. Operacionaliza INV-LGPD-002 (SLA 15 dias) + INV-AGENT-001 (deletar exige confirmacao).

## 1. Objetivo

Atender pedido do titular (pessoa fisica) para apagar seus dados pessoais conforme LGPD Art. 18, VI, dentro do prazo legal de **15 dias corridos** desde o recebimento, respeitando excecoes de retencao obrigatoria (obrigacao fiscal de 5 anos — ver [`retencao-dados.md`](../../conformidade/lgpd/retencao-dados.md) §5).

## 2. Quando rodar

- **Gatilho 1**: pedido recebido em `lgpd@conciliab.com.br`.
- **Gatilho 2**: pedido recebido via endpoint `POST /v1/lgpd/pedidos` (autenticado).
- **Gatilho 3**: alerta `pedido_lgpd_sla` job diario — D-3 do prazo de 15 dias com pedido ainda nao atendido (SEV2).
- **Janela**: imediato. Pedido nao espera janela de mudanca de `change-management.md` — atendimento e obrigacao legal e tem freeze override (§3 do change-management).

## 3. Pre-condicoes

- [ ] Acesso ao banco prod RDS confirmado (role `dpo_lgpd` com permissoes restritas a `usuario_tenanted`, `audit_pedidos_titular_tenanted`).
- [ ] Acesso ao bucket `s3://conciliab-uploads-saeast1` (IAM role `lgpd-operator`).
- [ ] DPO Carlos Mendes ou suplente Roldao notificado.
- [ ] Identidade do titular confirmada (§4.1).
- [ ] **2-eyes obrigatorio**: outro dev (Ana Silva ou Bruno Costa) confirma o plano em `#war-room` Slack antes de qualquer DELETE.

## 3.5 Diagnostico rapido (antes de mexer)

Antes de executar acao destrutiva:

- [ ] **Confirmar identidade**: titular enviou CPF + documento (RG/CNH) + confirmacao via e-mail cadastrado. Documento e arquivado em S3 `lgpd-evidences/<pedido-id>/` (retencao 5 anos).
- [ ] **Verificar excecoes (§5 retencao-dados.md)**: titular tem dado em `audit_log` ou `fiscal_export_snapshot` (5 anos obrigatorio)? Tem ticket de suporte ativo? Esta em investigacao judicial?
- [ ] **Confirmar escopo**: pedido pede eliminacao TOTAL ou apenas de campo especifico? Ler texto literal do e-mail.
- [ ] **Conferir vinculo**: titular e socio responsavel de um tenant PJ? Se sim, eliminacao implica cancelamento do contrato (comunicar antes).
- [ ] **Registrar em `audit_pedidos_titular_tenanted`** com status `recebido` (gera ID `PED-YYYY-NNNN`).

Registrar em §8 mesmo que nao exija acao.

## 4. Passos

### 4.1 Confirmacao de identidade (D+0 a D+2)

1. Responder titular pelo canal de origem confirmando recebimento + ID do pedido (`PED-YYYY-NNNN`).
2. Solicitar documento de identidade (RG/CNH) + selfie segurando documento (se houver duvida).
3. Verificar contra cadastro: CPF bate? E-mail confere com `usuario_tenanted.email`?
4. Se identidade NAO confirmada: registrar tentativa, solicitar prova adicional. Prazo de 15 dias suspende ate confirmacao (Art. 9, § 2 Decreto 11.245/2022 — orientacao ANPD).

### 4.2 Analise de excecoes (D+2 a D+5)

Query de descoberta (executar com role `dpo_lgpd`, NUNCA com role `app`):

```sql
-- 1. Verificar se titular tem dado em tabelas com retencao obrigatoria
SELECT 'audit_log' as tabela, count(*) FROM audit_log WHERE user_sub = (SELECT sub FROM usuario_tenanted WHERE cpf_hash = sha256('<CPF>'));
SELECT 'fiscal_export_snapshot' as tabela, count(*) FROM fiscal_export_snapshot WHERE tenant_id IN (SELECT tenant_id FROM tenant_admin WHERE cpf_hash = sha256('<CPF>'));
SELECT 'ticket_suporte' as tabela, count(*) FROM ticket_suporte_tenanted WHERE titular_cpf_hash = sha256('<CPF>') AND status != 'fechado';
```

Se houver excecao aplicavel, redigir resposta ao titular citando o fundamento legal (Lei 8.846/94, Decreto 70.235/72, Art. 18 § 4 LGPD).

### 4.3 Execucao da eliminacao (D+5 a D+12)

> **[2-eyes]** Cada DELETE confirmado por outro dev em `#war-room` antes de executar.

1. **Snapshot RDS imediatamente antes** (preserva estado para reverter erro):
   ```
   aws rds create-db-snapshot \
     --db-instance-identifier conciliab-prod-rds \
     --db-snapshot-identifier pre-lgpd-<PED-ID>
   ```
2. Identificar todas as linhas referentes ao titular (idempotente, retomavel):
   ```sql
   BEGIN;
   SET app.current_tenant_id = '<tenant_id_afetado>';
   -- Confirmar count antes do delete
   SELECT count(*) FROM usuario_tenanted WHERE cpf_hash = sha256('<CPF>');
   ```
3. **[2-eyes]** Executar hard-delete em tabelas SEM excecao:
   ```sql
   DELETE FROM usuario_tenanted WHERE cpf_hash = sha256('<CPF>') RETURNING id;
   DELETE FROM tenant_admin WHERE cpf_hash = sha256('<CPF>') RETURNING id;
   -- (audit_log NAO entra — INV-AUDIT-002 + obrigacao fiscal)
   ```
4. Apagar objetos S3 com PII do titular (ex: extratos OFX que contem CPF):
   ```
   aws s3 ls s3://conciliab-uploads-saeast1/<tenant_id>/ | grep <CPF>
   aws s3 rm s3://conciliab-uploads-saeast1/<tenant_id>/<arquivo> --dryrun
   # [2-eyes confirmar] rodar sem --dryrun
   ```
5. Anonimizar campos em tabelas com excecao (manter linha, ocultar identificacao):
   ```sql
   UPDATE audit_log SET user_sub = 'anonimizado:' || sha256(user_sub) WHERE user_sub IN (SELECT sub FROM ...);
   ```
6. `COMMIT;` apos confirmacao 2-eyes.
7. Atualizar `audit_pedidos_titular_tenanted`:
   ```sql
   UPDATE audit_pedidos_titular_tenanted 
   SET atendido_em = now(), status = 'concluido', resumo = '<o que foi apagado, o que foi anonimizado, o que foi retido com fundamento>'
   WHERE id = '<PED-ID>';
   ```

### 4.4 Comunicacao ao titular (D+12 a D+15)

Enviar e-mail formal (modelo em `docs/conformidade/lgpd/modelos/resposta-eliminacao.md`, fora deste exemplo) informando:

- O que foi apagado (lista de categorias).
- O que foi anonimizado e por que (audit_log e fiscal_export_snapshot por Art. 16 + obrigacao fiscal 5 anos).
- O que foi retido por excecao legal, com fundamento.
- ID do pedido + data de conclusao.
- Direito de recorrer a ANPD se discordar (https://www.gov.br/anpd).

DPO Carlos Mendes assina o e-mail.

## 5. Verificacao de sucesso

- [ ] `SELECT count(*) FROM usuario_tenanted WHERE cpf_hash = sha256('<CPF>')` retorna 0.
- [ ] `SELECT count(*) FROM tenant_admin WHERE cpf_hash = sha256('<CPF>')` retorna 0.
- [ ] `aws s3 ls s3://conciliab-uploads-saeast1/<tenant_id>/ | grep <CPF>` retorna vazio.
- [ ] `audit_pedidos_titular_tenanted.status = 'concluido'` e `atendido_em` preenchido.
- [ ] E-mail de confirmacao enviado e arquivado em S3 `lgpd-evidences/<PED-ID>/resposta.eml`.
- [ ] Job diario `alerta_lgpd_sla` nao mais lista este pedido.
- [ ] Prazo cumprido: `atendido_em - recebido_em <= 15 days`.

## 6. Rollback

> Cenario raro: erro de identificacao apagou dado de OUTRO titular.

1. **Pausar** todas as operacoes LGPD em curso.
2. Restaurar do snapshot `pre-lgpd-<PED-ID>` para instancia separada (`conciliab-restore-lgpd-<PED-ID>`):
   ```
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier conciliab-restore-lgpd-<PED-ID> \
     --db-snapshot-identifier pre-lgpd-<PED-ID>
   ```
3. Extrair as linhas corretas com `pg_dump --data-only --table=usuario_tenanted` filtrando por CPF correto.
4. Aplicar `pg_restore` seletivo em prod (com 2-eyes).
5. Notificar imediatamente DPO + dono + titular do erro.
6. Comunicar ANPD em 72h (INV-LGPD-003) — erro humano em operacao LGPD pode caracterizar incidente notificavel.

## 7. Escalonamento em camadas

| Camada | Quem | Quando acionar |
|---|---|---|
| **L1 — Operador LGPD** | Carlos Mendes (DPO) ou suplente Roldao | imediato, faz a resposta inicial |
| **L2 — Owner tecnico** | Ana Silva | duvida sobre escopo tecnico OU 2-eyes para DELETE |
| **L3 — Juridico** | escritorio Pereira & Castro Advocacia | duvida sobre fundamento legal de excecao |
| **L4 — Dono** | Roldao | cliente PJ contestar cancelamento implicito do contrato |
| **ANPD** | DPO Carlos Mendes | se titular reclamar formalmente |

## 8. Historico de execucao

| Data | Operador | ID pedido | Resultado | Observacoes |
|---|---|---|---|---|
| 2026-03-12 | Carlos Mendes | PED-2026-0001 | concluido (D+8) | primeiro pedido real; titular era ex-funcionario do cliente piloto #2 |
| 2026-04-25 | Carlos Mendes | PED-2026-0002 | concluido (D+11) | titular era contraparte em extrato; anonimizado em audit_log conforme Art. 16 |

## 9. Pos-execucao

Atendimento de pedido LGPD NAO exige post-mortem em condicoes normais. Exige se:
- Houve erro que apagou dado de OUTRO titular (rollback acionado).
- Prazo de 15 dias foi descumprido (SEV1 automatico — descumprimento de obrigacao legal).
- Titular recorreu a ANPD apos resposta.

Auditoria trimestral pelo DPO (`docs/conformidade/lgpd/auditoria-pedidos-<trimestre>.md`, fora exemplo) revisa todos os pedidos e tempos de atendimento.

## 10. Vinculacao com

- [`retencao-dados.md`](../../conformidade/lgpd/retencao-dados.md) §5 — excecoes que impedem eliminacao total.
- [`ropa.md`](../../conformidade/lgpd/ropa.md) §7 — operacao "Atendimento a pedido do titular".
- [`resposta-incidente.md`](../../seguranca/resposta-incidente.md) — se erro acionar incidente.
- [`REGRAS-INEGOCIAVEIS.md`](../../../REGRAS-INEGOCIAVEIS.md) — INV-LGPD-002 + INV-AGENT-001.
- [`slo-sli.md`](../slo-sli.md) — SLO 100% pedido LGPD em <= 15 dias.
