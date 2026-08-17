---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: escala e protocolo de plantao do conciliab — quem atende alerta, como passa bastao, SLA por severidade. Cobertura horario comercial + best-effort fora (24/7 dedicado nao se aplica, ver nao-aplica.md).
---

<!-- destino: docs/operacao/on-call.md (preenchido no exemplo saas-python-regulado) -->

# Plantao (On-Call) — conciliab

> **On-call** (plantao) = profissional de sobreaviso responsavel por atender alerta critico e responder cliente fora do horario normal.

> **Postura atual:** time de 3 devs, cobertura horario comercial PT-BR (09:00-19:00 dias uteis) + best-effort fora. 24/7 dedicado com pager nao se aplica — ver [`nao-aplica.md`](../../nao-aplica.md) linha "C8 / on-call 24/7". Gatilho de reavaliacao: sair de beta para self-service publico.

## 1. Escala

Turno semanal (segunda 09:00 ate segunda seguinte 09:00, fuso `America/Sao_Paulo`).

| Semana | Inicio | Fim | Plantonista | Backup |
|---|---|---|---|---|
| 2026-S22 | 2026-05-25 | 2026-06-01 | Ana Silva | Bruno Costa |
| 2026-S23 | 2026-06-01 | 2026-06-08 | Bruno Costa | Diego Tavares |
| 2026-S24 | 2026-06-08 | 2026-06-15 | Diego Tavares | Ana Silva |
| 2026-S25 | 2026-06-15 | 2026-06-22 | Ana Silva | Bruno Costa |

Escala publicada com 30 dias de antecedencia em `docs/operacao/escala-oncall.md` (fora deste exemplo) + calendario compartilhado Google.

## 2. Handover (passagem de turno)

Toda segunda 09:00, plantonista que sai entrega para quem entra.

Mensagem obrigatoria em `#oncall-handover` Slack cobrindo:
- **Pendencias:** incidentes ainda abertos, com link e status.
- **Contexto recente:** deploys da ultima semana que podem causar alerta (consultar `gh release list --limit 5`).
- **Alertas ativos:** rules silenciados temporariamente (com prazo para reativar).
- **Aviso de manutencao:** janelas agendadas para a semana (ver `change-management.md`).
- **Saude geral:** algo do sistema esta instavel? alguma metrica degradando?

## 3. Resposta esperada (SLA)

| Severidade | Definicao curta | Ack | Comeco da acao | Resolucao alvo |
|---|---|---|---|---|
| **SEV1 CRITICO** | servico fora, perda de dado, vazamento PII confirmado | 15 min | 1 hora | 4 horas |
| **SEV2 ALTO** | degradacao seria, error budget queimando > 5%/6h | 30 min (horario comercial) / 1h (fora) | 2h / 4h | 8h |
| **SEV3 MEDIO** | bug afetando cliente especifico, alerta de saturacao | 4 horas | proximo dia util | 3 dias uteis |
| **SEV4 BAIXO** | cosmetico, sem impacto operacional | proximo dia util | sprint atual | sem SLA rigido |

> **Ack** = "acknowledge", confirmar que recebeu o alerta e esta cuidando. Nao significa que ja resolveu.

> **SEV1 com PII** dispara automaticamente relogio LGPD 72h. Ver [`resposta-incidente.md`](../seguranca/resposta-incidente.md).

## 4. Escalonamento

| Nivel | Quem | Quando acionar | Como |
|---|---|---|---|
| L1 | plantonista da semana | primeiro a atender qualquer alerta | PagerDuty push |
| L2 | engenheiro especialista do dominio (Ana Silva = API/LGPD; Bruno Costa = infra/DB; Diego Tavares = frontend/integracao) | L1 nao identificou causa em 30min | mensagem direta + paging manual |
| L3 | dono (Roldao) | L2 nao resolveu em 1h **OU** SEV1 com cliente-piloto impactado | telefonema direto |
| DPO (paralelo) | Carlos Mendes | sempre que houver suspeita de exposicao de PII | telefone + e-mail |
| Fornecedor externo | AWS Support (Business plan) | diagnostico aponta AWS | abrir caso PRIORITY |

Contatos atualizados em `docs/operacao/contatos.md` (fora deste exemplo — telefone pessoal NAO commitado).

## 5. Compensacao

Politica para quem entra de plantao:

- **Folga compensatoria:** 1 dia util de folga a cada semana de plantao, usavel em ate 90 dias.
- **Acionamento fora do horario:** se chamado fora do horario comercial (19:00-09:00 ou fim de semana/feriado), conta hora extra com adicional de 50%.
- **Plantao em feriado nacional:** adicional de 100% sobre hora normal.
- **Revisao:** politica revisada anualmente com Roldao.

> Como time esta em beta e cobertura e best-effort fora do horario, acionamento noturno e considerado evento excepcional — se ocorrer > 1x/mes durante 3 meses, gatilho de reavaliacao de `nao-aplica.md` dispara e pode promover 24/7 dedicado.

## 6. Ferramenta de paging

> **Paging** = sistema que aciona o plantonista (telefone, SMS, app).

- **Ferramenta:** PagerDuty plano basico (1 schedule, 3 usuarios).
- **Canal primario:** notificacao push no celular do plantonista.
- **Canal secundario:** SMS apos 5min sem ack.
- **Canal terciario:** ligacao telefonica apos 10min sem ack, depois aciona backup.
- **Testes:** simulacao mensal de paging (primeira segunda do mes) para confirmar celular recebendo.

## 7. Pos-plantao (relato semanal)

Toda segunda 10:00, plantonista que terminou publica relato em `#oncall-relato`:

- **Incidentes atendidos:** lista com SEV, tempo de resolucao, link do post-mortem (se SEV1/SEV2).
- **Falsos positivos:** alertas que dispararam mas nao eram problema real. Sugerir ajuste de threshold.
- **Sugestoes de melhoria:** runbook que faltou, metrica que ajudaria, automacao que evitaria acionamento.
- **Carga subjetiva:** noite mal dormida? muitas interrupcoes? sinalizar para evitar burnout.

## 8. Vinculacao com

- [`slo-sli.md`](./slo-sli.md) §7 — postura de on-call que justifica esta escala.
- [`observabilidade.md`](./observabilidade.md) §7 — alertas que disparam paging.
- [`change-management.md`](./change-management.md) §2 — janelas de freeze.
- [`runbooks/`](./runbooks/) — procedimentos invocados em cada alerta.
- [`docs/seguranca/resposta-incidente.md`](../seguranca/resposta-incidente.md) — fluxo IR.
- [`nao-aplica.md`](../../nao-aplica.md) — justificativa para nao ter 24/7 dedicado.

## 9. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-28 | Ana Silva | criacao inicial junto com saida de discovery |
| 2026-05-27 | Ana Silva | atualizada escala 2026-S22..S25, ajustado SLA SEV2 fora do horario |
