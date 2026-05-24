---
description: Pos-mortem obrigatorio apos incidente em produção ou hotfix. Documenta, aciona LGPD-006/ANPD se aplicavel, gera acao corretiva rastreavel.
argument-hint: "[INC-NNN ou descricao]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(touch:*), Bash(mkdir:*), Bash(ls:*), Bash(git log:*), Bash(git diff:*), Edit, Write, Task
model: opus
---

# /incident-postmortem — pos-incidente

> **Se o incidente envolve dado pessoal:** abra paralelamente o runbook em [`docs/runbooks/incident-response-lgpd.md`](../../docs/runbooks/incident-response-lgpd.md) — janela legal de 72h pra ANPD (LGPD-006) corre desde a ciencia do fato, nao desde o pos-mortem.

Use `$ARGUMENTS` como referencia do incidente (numero ou 1 frase).

Disparado por:
- `/hotfix` ja rodou e gravou marker `needs-postmortem-*`.
- Incidente de seguranca/LGPD detectado por monitoramento.
- Erro em producao com impacto a cliente (downtime > 5 min, dado vazado, transacao errada).

## Etapa 1 — Investigador (timeline + escopo)

Use o agente `investigador`. Pergunta-chave: **quem soube de que, quando, e o que cada um fez**.

Reporta:
- **Timeline:** T0 (detectado) → T+N (mitigado) → T+M (resolvido). Hora absoluta em UTC + BRT.
- **Sistemas afetados:** quais modulos, quais clientes (numero ou faixa), volume de dados.
- **Como detectamos:** alerta automatico, cliente reportou, descoberta interna.
- **Causa raiz:** dado real (banco, log, payload). Nao "provavel" — confirmado.
- **Por que escapou:** o que faltou nos testes/auditoria/codigo pra pegar antes.

## Etapa 2 — Decisao LGPD-006 (em paralelo com etapa 3)

**Se houver indicio de vazamento ou comprometimento de dado pessoal:**

- Acione o agente `auditor-seguranca` no modo "incidente LGPD-006".
- Skill `responder-incidente-anpd` gera o draft de comunicacao para ANPD (Art. 48 LGPD + Resolucao CD/ANPD 15/2024).
- Prazo: ANPD em ate **72h** apos ciencia. Comunicacao aos titulares idem.
- Decisao **NAO POSSO TOMAR SOZINHO** — usuario/DPO precisa aprovar antes do envio.

**Se NAO houver dado pessoal envolvido:** pule esta etapa, registre "LGPD-006 nao aplicavel" no doc.

## Etapa 3 — Auditores (em paralelo com etapa 2)

Em UMA mensagem invoque 3:

1. `auditor-seguranca` — o incidente expoe gap de SEC-NNN? LGPD? Supply chain? Token vazado?
2. `auditor-qualidade` — o caso tinha teste? Cobertura nesse caminho? Mascaramento? Mock que escondeu o bug?
3. `auditor-produto` — quebra de US/AC documentada? Non-goal violado?

Cada um reporta achados especificos do incidente (nao auditoria geral).

## Etapa 4 — Documento INC-NNN

Cria `docs/incidentes/INC-NNN-<slug>.md` com frontmatter obrigatorio:

```yaml
---
owner: tech-writer
revisado-em: AAAA-MM-DD
status: stable
incidente-id: INC-NNN
severidade: P0 | P1 | P2
lgpd-006: aplicavel | nao-aplicavel
anpd-notificada: SIM-em-AAAA-MM-DD | NAO
---
```

Conteudo:

1. **Resumo executivo (3 linhas)** em PT-BR claro pra leigo entender.
2. **Timeline** detalhada (UTC + BRT).
3. **Causa raiz** confirmada com dado real.
4. **Por que escapou** — gap nos testes/auditoria/codigo.
5. **Acao imediata** — o que ja foi feito (hotfix, kill switch, comunicacao).
6. **Acao corretiva** — `T-NNN` rastreavel pra story que evita repeticao. NAO "anotar mentalmente".
7. **Licao aprendida** — 1-2 frases. Cabe em retro do time.
8. **Anexos** — links pra commit do hotfix, dashboards, logs (mascarados).

## Etapa 5 — Acao corretiva (T-NNN)

Pra cada gap identificado, cria story em `docs/stories/US-NNN-corretiva-INC-NNN.md` com:
- US clara (como dev/agente, quero X pra evitar Y).
- AC testavel (como saberemos que a regressao nao volta).
- Prioridade no proximo sprint (nao "backlog eterno").
- Hook novo se aplicavel — codifica a licao, nao deixa em prosa.

## Etapa 6 — Fechar marker

```bash
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
rm -f .claude/.runtime/needs-postmortem-${SESSION_HASH}
touch .claude/.runtime/postmortem-done-${SESSION_HASH}
```

Sem este marker, hook `require-checkpoint-before-merge` continua bloqueando proximo merge na main.

## Saida final

```
POSTMORTEM INC-NNN FECHADO

Severidade: <P0/P1/P2>
Causa raiz: <1 frase>
LGPD-006 aplicavel: <SIM/NAO>  ANPD notificada: <SIM-data/NAO>
Auditores: seguranca <veredito> | qualidade <veredito> | produto <veredito>
Acao corretiva: US-NNN (T-NNN) — prazo: <sprint X>
Doc: docs/incidentes/INC-NNN-<slug>.md
```

## Regras envolvidas

LGPD-006 (notificacao ANPD 72h), LGPD-009 (DPO + canal), INV-001 (doc e estado compartilhado), INV-004 (IDs rastreaveis), INV-006 (causa raiz), FISCAL-004 (contingencia se incidente fiscal).
