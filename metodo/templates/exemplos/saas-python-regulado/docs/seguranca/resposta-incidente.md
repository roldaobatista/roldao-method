---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 220
proposito: playbook de resposta a incidente de seguranca do conciliab, incluindo comunicacao a ANPD em 72h para vazamento de PII (Art. 48 LGPD)
---

<!-- destino: docs/seguranca/resposta-incidente.md (preenchido no exemplo saas-python-regulado) -->

# Plano de Resposta a Incidente (IR) — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE. Operacionaliza INV-LGPD-003 (comunicacao ANPD em 72h) + INV-AGENT-001 (preservar dado).

> **Incidente de seguranca** = qualquer evento que comprometa confidencialidade, integridade, disponibilidade ou autenticidade dos dados/sistema. Inclui: vazamento de PII, comprometimento de credencial, ransomware, indisponibilidade prolongada por ataque, manipulacao indevida de `audit_log`.

## 1. Severidades

| Severidade | Definicao curta | Exemplo conciliab | SLA primeira resposta |
|---|---|---|---|
| **SEV1 CRITICO** | Vazamento confirmado de PII OU sistema comprometido OU dado fiscal manipulado | Dump de `tenant_admin` exposto, credencial RDS na nuvem publica, trigger WORM bypassada | 15 min (ack) / 1h (acao) |
| **SEV2 ALTO** | Suspeita forte de vazamento OU CVE critico em producao sem mitigacao | Log de query suspeita atravessando RLS, CVE 9.8 em FastAPI ativa | 30 min / 4h |
| **SEV3 MEDIO** | Tentativa detectada mas bloqueada OU dependencia vulneravel sem exposicao | Bot tentando bruteforce em `/v1/auth/login`, dep com CVE ALTO sem prova de exploit | 4h / proximo dia util |
| **SEV4 BAIXO** | Achado de pentest sem exploit demonstravel | Header `Server` exposto, finding informativo de auditor | proximo dia util / sprint |

> SEV1 com PII envolvida = relogio LGPD 72h dispara automaticamente (§4).

## 2. Papeis durante o incidente

| Papel | Quem (titular / substituto) | Responsabilidade |
|---|---|---|
| Incident Commander (IC) | Ana Silva / Bruno Costa | conduz war room, decide acao, comunica status |
| Operador tecnico | plantonista da semana (escala `on-call.md`) | executa runbooks, coleta evidencia |
| DPO | Carlos Mendes (DPO terceirizado) | comunicacao ANPD + titular, avaliacao LGPD |
| Comunicacao externa | Roldao (dono) | aprova texto antes de ir pra cliente/imprensa |
| Juridico | escritorio externo Pereira & Castro Advocacia | revisa texto ANPD antes do envio |
| Owner do servico | Ana Silva (API), Bruno Costa (infra/DB) | conhece o sistema, propoe contencao |

## 3. Fluxo geral (SEV1/SEV2)

```
DETECCAO --> ACK 15min --> WAR ROOM --> CONTENCAO --> ERRADICACAO --> RECUPERACAO --> POST-MORTEM
                                            |
                                            +--(se PII)--> RELOGIO ANPD 72h
                                            +--(se cliente afetado)--> COMUNICACAO EM PARALELO
```

### 3.1 Deteccao e classificacao

Fontes possiveis: alerta Datadog, finding de auditor, denuncia em `security@conciliab.com.br`, reporte de cliente, monitoramento AWS GuardDuty.

Quem detecta:
1. Abre incidente em `#war-room` Slack com template: `[SEV?] [titulo curto] [hora UTC] [o que foi visto] [link evidencia]`.
2. Aciona Incident Commander via PagerDuty (paging primario celular).
3. NAO toca em log / dado afetado sem aprovacao do IC (preservar evidencia).

### 3.2 War room

War room = canal Slack `#war-room` + (se SEV1) Google Meet aberto continuo `conciliab-warroom`.

Regras:
- Todo comando executado e colado no canal antes/depois (timeline reproduzivel).
- IC anuncia status a cada 30min mesmo sem novidade.
- Ninguem entra em outro canal pra discutir o incidente — tudo no `#war-room`.
- Decisao destrutiva (restore de backup, rotacao de credencial em massa, isolar regiao) exige 2-eyes registrado no canal.

### 3.3 Contencao

Objetivo: parar o sangramento, mesmo que sem entender 100% da causa.

Acoes tipicas:
- Rotacionar segredo afetado em AWS Secrets Manager (runbook `rotacao-secrets.md`, fora deste exemplo).
- Suspender tenant comprometido (`UPDATE tenant SET suspenso_em = now() WHERE id = ?`).
- Bloquear IP atacante no WAF (`aws wafv2 update-ip-set`).
- Pausar workers Celery (`aws ecs update-service --desired-count 0`).
- Em vazamento de credencial RDS: rotacionar imediatamente + reiniciar tasks ECS.

### 3.4 Erradicacao

Remover a causa raiz: patch de dep, fix de codigo, revogacao de acesso interno, hardening de config.

### 3.5 Recuperacao

Voltar operacao normal apos validar contencao + erradicacao:
- Religar workers gradualmente, monitorar metricas.
- Confirmar que indicadores de comprometimento (IoC) nao reaparecem nas proximas 24h.
- Status page volta a "operacional" apos 4h sem reincidencia.

### 3.6 Post-mortem

Obrigatorio para SEV1 e SEV2 em ate 48h apos recuperacao. Template em `templates/post-mortem.template.md`. Sem busca de culpado — foco em fator contribuinte e acao corretiva sistemica.

## 4. Comunicacao a ANPD (Art. 48 LGPD)

> **Relogio dispara no momento em que o time tem ciencia do incidente** (nao na deteccao automatica — na confirmacao de que ha tratamento de PII envolvido). **Prazo: 72h.**

### 4.1 Criterio para notificar (INV-LGPD-003)

Notificar a ANPD quando o incidente envolver pelo menos um:
- Vazamento de dado bancario (numero de conta, agencia, valor de transacao com identificacao da contraparte).
- Vazamento de CPF de pessoa fisica em volume (>= 100 titulares).
- Vazamento que permita fraude financeira (combinacao de e-mail + senha hash + identificacao).
- Vazamento de `audit_log` (compromete capacidade de comprovar Art. 7 V/IX).
- **Em duvida: notificar.** Omissao e punida (Art. 52 LGPD: multa ate 2% faturamento, teto R$ 50M); notificacao preventiva nao gera penalidade.

### 4.2 Conteudo da comunicacao (Art. 48 §1)

Modelo em https://www.gov.br/anpd/comunicacao-de-incidente. Obrigatorio incluir:
- Descricao da natureza dos dados afetados.
- Numero de titulares afetados (estimativa minima se ainda investigando).
- Tecnologia usada para tratamento dos dados.
- Medidas de seguranca tecnicas e administrativas utilizadas antes do incidente.
- Riscos ao titular.
- Motivos da demora caso > 72h (raro — ANPD aceita justificativa fundamentada).
- Medidas adotadas para reverter ou mitigar os efeitos.

Texto e sempre revisado pelo escritorio Pereira & Castro Advocacia ANTES do envio (juridico). DPO Carlos Mendes assina e envia.

### 4.3 Comunicacao ao titular (Art. 48 caput)

Quando o risco ao titular for confirmado:
- Modelo em [`docs/conformidade/lgpd/ropa.md`](../conformidade/lgpd/ropa.md) §5.3.
- Canal: e-mail cadastrado no `tenant_admin` + e-mail dos usuarios afetados.
- Aprovacao final do texto: Roldao + Carlos Mendes DPO.

## 5. Coleta de evidencia (forense leve)

- Logs CloudWatch da janela do incidente: exportar para S3 isolado `s3://conciliab-incident-evidence-saeast1/<incidente-id>/`.
- Snapshot RDS antes de qualquer remediacao (preserva estado): `aws rds create-db-snapshot --db-snapshot-identifier conciliab-incident-<id>`.
- Captura de configuracao IAM/SG no momento (CloudTrail + `aws iam get-account-authorization-details`).
- Hash SHA-256 de cada evidencia coletada, registrado em `incidente-<id>-chain-of-custody.txt`.
- Retencao: 5 anos minimo (acompanha `audit_log`).

## 6. Comunicacao externa

| Audiencia | Quando | Canal | Aprovador final |
|---|---|---|---|
| Cliente afetado (PJ contratante) | dentro de 24h da confirmacao | e-mail + telefone direto se SEV1 | Roldao |
| Titular pessoa fisica afetado | "tao logo investigacao confirme risco" (Art. 48) | e-mail | Roldao + Carlos Mendes DPO |
| ANPD | <= 72h apos ciencia | formulario gov.br/anpd | Carlos Mendes DPO |
| Imprensa | so se vazar publicamente OU > 1.000 titulares afetados | comunicado oficial | Roldao + juridico |
| Cliente nao-afetado | resumo no status page apos resolucao | https://status.conciliab.com.br | Ana Silva |

> Nada vai pro publico antes de ir pro cliente afetado.

## 7. Post-mortem (blameless)

Estrutura obrigatoria em `docs/operacao/incidentes/<YYYY-MM-DD>-<slug>.md`:

1. Resumo executivo (3 linhas).
2. Timeline minuto a minuto.
3. Impacto: tenants afetados, dados envolvidos, duracao.
4. Causa raiz tecnica + fator contribuinte humano/processual.
5. O que funcionou bem.
6. O que nao funcionou.
7. Acoes corretivas (cada uma com owner + prazo + issue aberta).
8. Acoes preventivas (incluir nova INV em REGRAS-INEGOCIAVEIS.md se aplicavel — INV-AGENT-011).

Apresentacao em reuniao all-hands na semana seguinte. Sem busca de culpado — foco em sistema.

## 8. Testes (tabletop)

- Tabletop trimestral simula 1 cenario (rotacao: vazamento RDS, comprometimento Cognito, ransomware S3, insider).
- Participantes: IC + DPO + plantonista + 1 dev. Cronometrado.
- Resultado registrado em `docs/operacao/incidentes/tabletop-<YYYY-MM-DD>.md` com licoes aprendidas.

## 9. Vinculacao com

- [`threat-model.md`](./threat-model.md) — perfis de atacante e vetores que justificam este plano.
- [`docs/conformidade/lgpd/ropa.md`](../conformidade/lgpd/ropa.md) §5 — comunicacao a ANPD detalhada.
- [`docs/operacao/runbooks/`](../operacao/runbooks/) — runbooks tecnicos invocados em §3.3.
- [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — INV-LGPD-003 (72h ANPD).
- [`docs/operacao/on-call.md`](../operacao/on-call.md) — escala que detecta e aciona.
- Templates: `post-mortem.template.md`, `runbook.template.md`.
