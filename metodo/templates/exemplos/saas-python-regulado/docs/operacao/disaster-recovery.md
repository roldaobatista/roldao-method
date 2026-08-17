---
owner: <DEV-1>
ultima-conferencia: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 190
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!-- destino: docs/operacao/disaster-recovery.md (preenchido no exemplo saas-python-regulado) -->

# Plano de Disaster Recovery — conciliab

> **Disaster Recovery (DR)** = "recuperacao de desastre". Plano para reerguer
> o servico quando algo grande quebra: servidor caiu, regiao da nuvem ficou
> offline, ataque de ransomware, alguem apagou tabela em producao por engano.
>
> Define **quanto tempo aceitamos ficar fora** (RTO), **quanto dado aceitamos
> perder** (RPO), e o **passo-a-passo** para voltar.

## 1. Cenarios cobertos

| ID | Cenario | Probabilidade | Impacto |
|---|---|---|---|
| DR-1 | Perda do banco primario (RDS sa-east-1a corrompeu ou ficou offline) | media | alto |
| DR-2 | Perda da regiao sa-east-1 inteira (raro mas catastrofico) | baixa | critico |
| DR-3 | Ransomware (dados criptografados por atacante; cenario nuclear) | baixa | critico |
| DR-4 | Erro humano (DROP TABLE acidental, alembic downgrade em prod, etc.) | media | alto |
| DR-5 | Vazamento de dados / acesso indevido confirmado | baixa | critico |

Exemplo: DR-1 cobre falha do banco primario `conciliab-prod-rds` na regiao
sa-east-1.

## 2. RTO — Recovery Time Objective

> **RTO** = tempo MAXIMO aceitavel entre o desastre e o servico voltar.

| Cenario | RTO definido | Justificativa |
|---|---|---|
| DR-1 (perda de servidor) | 1 hora | failover automatico para multi-AZ do RDS |
| DR-2 (perda de regiao) | 4 horas | promover snapshot cross-region em us-east-1 |
| DR-3 (ransomware) | 8 horas | restaurar de backup limpo offsite (Glacier) |
| DR-4 (erro humano) | 2 horas | point-in-time-recovery do RDS via pgbackrest |
| DR-5 (vazamento) | imediato (isolar) + 24h (analise) | conter primeiro, depois apurar |

## 3. RPO — Recovery Point Objective

> **RPO** = quantidade MAXIMA de dados aceitavel perder (medida em tempo).

| Cenario | RPO definido | Como atingimos |
|---|---|---|
| DR-1 | 5 minutos | replicacao sincrona multi-AZ |
| DR-2 | 15 minutos | replicacao assincrona cross-region + cross-region S3 replication |
| DR-3 | 24 horas | ultimo backup diario offsite limpo (Glacier) |
| DR-4 | 5 minutos | WAL continuo via pgbackrest permite PITR |
| DR-5 | n/a | conter eh prioridade; dado nao foi perdido, foi exposto |

## 4. Procedimento de ativacao

1. **Quem decide acionar DR:** `<DEV-1>` (owner infra) OU plantonista da
   semana se nao alcancar `<DEV-1>` em 10 min.
2. **Como aciona:** mensagem em `#war-room` (Slack) com `@here` + PagerDuty
   page para os 3 devs + Roldao.
3. **Confirmacao:** abrir incidente no PagerDuty com severidade SEV1.
4. **Comunicacao interna:** atualizacao a cada 30 min em `#war-room` ate
   resolucao.
5. **Comunicacao externa:** ver §6.

## 5. Passos por cenario

### DR-1 — Perda do servidor primario

1. Confirmar via console RDS que o primary nao responde (3 tentativas, 30s).
2. RDS multi-AZ promove standby automaticamente — esperar (geralmente < 2 min).
   Se nao promover sozinho em 5 min, forcar manualmente.
3. Validar connection string da aplicacao (deve resolver para novo primary).
4. Rodar queries de sanidade (`SELECT count(*) FROM tenant`, `SELECT count(*)
   FROM conciliacao_tenanted WHERE iniciado_em > now() - interval '1 hour'`).
5. Comunicar status no `#war-room`.

### DR-2 — Perda de regiao sa-east-1

1. Promover snapshot RDS replicado em us-east-1 a partir do
   `conciliab-prod-rds-cross-region-snapshot` (semanal + diario via Lambda).
2. Trocar DNS principal (`api.conciliab.com.br`) para apontar para us-east-1.
3. Avisar clientes: latencia maior (us-east-1 vs sa-east-1 = ~120ms vs ~30ms
   do RJ/SP).
4. Validar com queries de sanidade.
5. Runbook detalhado em `docs/operacao/runbooks/failover-regiao.md` (fora
   deste exemplo).

### DR-3 — Ransomware

1. **Isolar imediatamente**: cortar acesso de rede do ambiente comprometido
   (security group → 0 ingress/egress).
2. **NAO pagar resgate** (politica da empresa).
3. Restaurar a partir do backup offsite mais recente conhecidamente limpo
   (Glacier — pode demorar ate 12h para "thaw").
4. Acionar resposta a incidente: `docs/seguranca/resposta-incidente.md`
   (fora deste exemplo).
5. **Comunicar ANPD em ate 72h** (LGPD Art. 48 + INV-LGPD-003) — dados
   pessoais foram afetados.

### DR-4 — Erro humano

1. Pausar deploys imediatamente (lock `ci/lock-deploy` no GitHub Actions).
2. Identificar timestamp exato do erro (CloudWatch logs + audit_log do PG).
3. Point-in-time-recovery para timestamp imediatamente anterior via pgbackrest.
4. Validar.
5. Runbook: `docs/operacao/runbooks/restauracao-backup.md`.

### DR-5 — Vazamento confirmado

1. **Conter**: rotacionar credenciais expostas (Secrets Manager → forca rotacao);
   revogar tokens; invalidar sessoes Cognito.
2. **Preservar evidencias**: snapshot dos logs (CloudWatch export para S3
   imutavel).
3. **Acionar DPO `<DPO-nome>` e juridico**.
4. **Comunicar ANPD em ate 72h** (LGPD Art. 48 + INV-LGPD-003).
5. Comunicar titulares afetados assim que investigacao confirmar risco (ver
   modelo em `docs/conformidade/lgpd/ropa.md` §5.3).

## 6. Comunicacao ao cliente

- **Canal:** status page publica em `status.conciliab.com.br` (StatusPage.io) +
  e-mail para contatos cadastrados.
- **Antecedencia:** primeira atualizacao em ate 30 min apos confirmacao.
- **Mensagem padrao inicial:**
  > "Estamos investigando uma indisponibilidade no conciliab. Equipe acionada.
  >  Proxima atualizacao em 30 minutos."
- **Mensagem padrao de resolucao:**
  > "Servico restabelecido as <HH:MM>. Causa: <resumo de 1 linha>. Post-mortem
  >  completo em ate 5 dias uteis no nosso blog."

## 7. Teste de DR

> Plano de DR que nunca foi testado nao e plano, e ficcao.

- **Frequencia minima:** trimestral.
- **Tipos:**
  - **Tabletop** (mesa-redonda, sem mexer no sistema): trimestral. Equipe
    discute cenario hipotetico (rolar dado 1d5 para escolher).
  - **Simulado** (executa em staging): semestral.
  - **Real** (em producao, com janela agendada — geralmente DR-1 ou DR-4):
    anual.
- **Aceite:** RTO e RPO observados ≤ RTO e RPO definidos.
- **Registro:** post-mortem do teste em
  `docs/operacao/testes-dr/<YYYY-MM-DD>.md` (fora deste exemplo).

Historico:
- 2026-04-12: tabletop DR-2, equipe completa. Identificada lacuna: cross-region
  snapshot do RDS nao estava automatizado. Resolvido em 2026-04-18 (ver
  `backup.md` §9).
- 2026-05-22: simulado DR-4 em staging, RTO observado 47min (dentro do 2h
  definido).

## 8. Pos-DR — post-mortem obrigatorio

Apos qualquer ativacao real OU teste:
1. Post-mortem em ate 5 dias uteis (template `templates/post-mortem.template.md`).
2. Revisao deste plano (precisa ajustar RTO/RPO? cenario novo descoberto?).
3. Acoes de melhoria com owner e prazo.
4. Compartilhamento interno do aprendizado em standup.

## 9. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-22 | <DEV-1> | criacao inicial junto com ADR-0003 |
| 2026-04-18 | <DEV-1> | apos tabletop DR-2, adicionada automacao de cross-region snapshot |
| 2026-05-22 | <DEV-1> | apos simulado DR-4, RTO ajustado de 4h para 2h (sobrou folga) |
