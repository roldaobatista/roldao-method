---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: politica de janela de mudanca e freeze do conciliab (quando pode subir versao nova em producao, quando nao pode)
---

<!-- destino: docs/operacao/change-management.md (preenchido no exemplo saas-python-regulado) -->

# Janela de Mudanca e Freeze — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE.

> **Janela de mudanca** = periodo em que e permitido subir versao nova (deploy) ou aplicar mudanca em producao.
> **Freeze** = "congelamento", periodo em que NADA nao-critico sobe (mesmo dentro da janela).

Objetivo: reduzir risco de quebrar em horario com impacto maior ou time indisponivel (cobertura best-effort fora do horario — ver `on-call.md`).

## 1. Janela padrao

| Item | Definicao |
|---|---|
| Dias permitidos | terca, quarta, quinta |
| Horario permitido | 10:00 - 16:00 (fuso `America/Sao_Paulo`) |
| Dias bloqueados sempre | sexta, sabado, domingo, segunda |
| Vesperas de feriado nacional | bloqueado nas 24h anteriores |
| Vesperas de feriado bancario (BR) | bloqueado nas 24h anteriores (impacta conciliacao bancaria) |

Justificativa:
- Sexta: se quebrar, fim de semana sem time (only best-effort).
- Segunda: primeira hora de operacao do cliente PME com volume alto.
- Feriado bancario: clientes PME aproveitam para fechar conciliacao mensal; queda impacta direto.

> Exemplo: deploy `2026.06.3` agendado para terca 2026-06-02 11:00.

## 2. Freeze (congelamento)

Periodos em que NADA nao-critico sobe, mesmo dentro da janela padrao:

| Tipo de freeze | Quando | Quem aprova |
|---|---|---|
| Freeze fiscal | ultimo dia util do mes + primeiros 2 dias uteis (fechamento contabil dos clientes) | Roldao + Ana Silva |
| Freeze de release importante | vespera e dia de release de versao major (CalVer com prefixo `Y` indicando breaking) | Ana Silva |
| Freeze de fim de ano | 20 de dezembro a 05 de janeiro (clientes fechando exercicio fiscal) | Roldao + Ana Silva |
| Freeze a pedido do cliente | conforme contrato beta (ex: cliente em auditoria externa) | comercial + Ana Silva |
| Freeze por incidente | apos SEV1 nao totalmente compreendido, ate post-mortem fechar acoes corretivas | Ana Silva |

## 3. Quem aprova mudanca dentro de freeze

> Em freeze, o padrao e **nao subir**. Excecao precisa de aprovacao formal.

| Tipo de mudanca | Pode subir em freeze? | Quem aprova |
|---|---|---|
| Nova feature | nao | n/a |
| Refator interno (sem mudanca de comportamento) | nao | n/a |
| Bug nao-critico | nao, espera passar o freeze | n/a |
| Bug critico afetando producao (SEV1/SEV2) | sim, com processo expresso §4 | Ana Silva + 1 revisor (2-eyes) |
| Correcao de seguranca CRITICA (CVE 9.0+) | sim, com processo expresso §4 | Ana Silva + Roldao |
| Pedido LGPD em prazo (INV-LGPD-002) | sim, sempre | DPO Carlos Mendes + Ana Silva |

## 4. Processo expresso (correcao critica em freeze)

> "2-eyes" = duas pessoas validam antes de subir. Evita decisao solitaria sob pressao.

1. Abrir incidente classificado SEV1/SEV2 OU vulnerabilidade CRITICA.
2. Ana Silva aprova explicitamente em `#change-approvals` Slack.
3. Segundo revisor valida o diff em ate 30min (Bruno Costa ou Diego Tavares).
4. Deploy executado com rollback plan pronto + `#war-room` aberto.
5. Smoke test pos-deploy obrigatorio (§8).
6. Comunicacao ao cliente se houver indisponibilidade prevista.
7. Registro em `docs/operacao/historico-mudancas.md` (fora deste exemplo) justificando quebra de freeze.

## 5. Comunicacao da mudanca

| Tipo | Antecedencia minima | Canal |
|---|---|---|
| Mudanca de rotina (janela padrao) | 24h | `#change-announcements` |
| Mudanca com indisponibilidade prevista | 72h | `#change-announcements` + e-mail cliente |
| Mudanca destrutiva (migration Contract, mudanca de comportamento de conciliacao) | 1 semana | release notes + e-mail cliente + aviso in-app |
| Correcao expressa em freeze | imediato (apos aprovacao) | `#war-room` + status page https://status.conciliab.com.br |

## 6. Registro de mudancas

Toda mudanca em producao gera linha em `docs/operacao/historico-mudancas.md`:

| Campo | Conteudo |
|---|---|
| Data/hora | YYYY-MM-DD HH:MM (UTC-3) |
| Versao | tag CalVer (ex: `2026.06.3`) |
| Tipo | feature \| bugfix \| seguranca \| refator \| infra |
| Autor | nome do dev |
| Aprovador | nome (Ana Silva default) |
| Link da decisao | ADR se for decisao arquitetural |
| Resultado | ok \| rollback \| parcial |

## 7. Plano de rollback (obrigatorio)

Toda mudanca, sem excecao, sobe com plano de rollback pronto:
- **Como reverter:** comando exato (`gh workflow run rollback.yml --ref <tag-anterior>`).
- **Tempo esperado de rollback:** < 5min para deploy rolling, < 1min para canary.
- **Sinal de quando reverter:** error_rate > 1% por 5min (ver `release-process.md` §6).
- **Testado em staging:** rollback do deploy anterior exercitado em staging na semana anterior.

Migration de banco segue Expand → Migrate → Contract — ver `deployment-strategy.md` §4. Rollback de Contract exige restore de backup (runbook `restauracao-backup.md`).

## 8. Pos-mudanca (verificacao obrigatoria)

Apos qualquer deploy em prod:
1. Smoke test automatico passou (suite minima `tests/smoke/`).
2. Metricas SLO dentro do alvo (ver `slo-sli.md`).
3. Sem alerta novo nos 15min seguintes.
4. Operador permanece "de prontidao" por 1h apos deploy (nao iniciar outra tarefa pesada).

Se algum passo falhar → rollback imediato. Investigacao depois.

## 9. Vinculacao com

- [`release-process.md`](./release-process.md) — fluxo de release que respeita estas janelas.
- [`deployment-strategy.md`](./deployment-strategy.md) — como o deploy e executado tecnicamente.
- [`slo-sli.md`](./slo-sli.md) §4b — error budget pode pausar deploy automaticamente.
- [`on-call.md`](./on-call.md) — escala que da suporte pos-deploy.
- [`runbooks/api-erro-elevado.md`](./runbooks/api-erro-elevado.md) — invocado em rollback automatico.

## 10. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-28 | Ana Silva | criacao inicial |
| 2026-05-27 | Ana Silva | adicionado freeze por feriado bancario apos incidente 2026-04-30 (queda durante fechamento de mes) |
