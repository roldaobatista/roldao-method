---
description: Correcao urgente em produção (cliente parado, SEFAZ caiu, Pix duplicado). Pipeline reduzido mas auditavel — nunca pular investigador.
argument-hint: "[descricao-do-incidente]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(touch:*), Bash(mkdir:*), Bash(grep:*), Bash(git diff:*), Bash(git log:*), Edit, Write, Task
model: opus
---

# /hotfix — correcao urgente

> **Se o incidente envolve dado pessoal (vazamento, acesso indevido, exposicao):** abra paralelamente o runbook LGPD em [`docs/runbooks/incident-response-lgpd.md`](../../docs/runbooks/incident-response-lgpd.md) — voce tem 72h pra notificar ANPD (LGPD-006).

Use `$ARGUMENTS` como descricao do incidente em 1 frase. **Este workflow nao substitui `/bug`** — use so quando:

- Cliente esta parado AGORA (downtime ativo).
- SLA legal em risco (SEFAZ off + nota fiscal travada, Pix duplicado, vazamento LGPD em andamento).
- Decisao consciente de priorizar correcao sobre processo completo.

Para bug normal (cliente reportou mas operacao continua), use `/bug`.

## REGRA #0 continua ativa

Mesmo em emergencia, o investigador roda. A diferenca pro `/bug` e:
- Investigacao em modo "10 minutos" — quais dados estao errados AGORA, qual flag/coluna mostra o sintoma, onde a regressao foi introduzida.
- Sem ADR completo no momento (apenas marker no codigo + commit).
- Auditores rodam DEPOIS do fix em producao, nao antes — em `/incident-postmortem`.

## Fluxo (mantenha esta ordem)

1. **Sessao + marker.** Marca a sessao como bug-trigger (mesmo marker que `/bug` usa — hook `require-investigador-before-fix` arma sobre isso). Marker `hotfix-active-*` adicional é doc-only — nenhum hook consome, serve so de breadcrumb visivel:
   ```bash
   SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
   mkdir -p .claude/.runtime
   touch .claude/.runtime/bug-trigger-${SESSION_HASH}     # arma require-investigador-before-fix
   touch .claude/.runtime/bug-active-${SESSION_HASH}      # arma GATE 2 (shape JSON)
   touch .claude/.runtime/hotfix-active-${SESSION_HASH}   # breadcrumb (so visivel; sem hook consumindo)
   ```

2. **Investigador (5-10 min).** Le banco/log/payload. Reporta:
   - Sintoma observavel no cliente (mensagem, tela, comportamento).
   - Causa raiz (nao sintoma) — qual coluna/flag/condicao esta errada.
   - Janela de impacto (desde quando, quantos clientes, dados afetados).
   - Sugestao de fix MINIMO (so o suficiente pra estancar — refactor depois).

   Se ambiguidade no relato → `AskUserQuestion` curta antes de seguir.

3. **Dev-senior aplica fix minimo.** Sem refactor. Sem "ja que estou aqui". So a linha que resolve. Teste unitario do caso especifico se possivel (15 min max).

4. **Revisor (5 min).** Confirma:
   - Fix esta no ponto raiz (nao no sintoma).
   - Nao introduz novo bug obvio.
   - Commit com `T-NNN` rastreavel + tag `hotfix:` no prefixo.

5. **Marker de pos-incidente (doc-only).** Cria `.claude/.runtime/needs-postmortem-<sess>` como **breadcrumb visivel**. Atencao: hoje nenhum hook do core consome esse marker — o gate de "rodar postmortem em 48h" depende de DISCIPLINA, nao de bloqueio mecanico. Se voce quer enforcement automatico, instale o addon `lgpd-compliance` que adiciona `require-postmortem-before-release.js`.

   ```bash
   touch .claude/.runtime/needs-postmortem-${SESSION_HASH}
   ```

## Apos o fix em producao

**Obrigatorio em ate 48h:** rode `/incident-postmortem` pra:
- Auditoria de seguranca (especialmente se LGPD-006 — vazamento).
- Auditoria de qualidade (cobertura do caso que escapou).
- Documentacao do incidente em `docs/incidentes/INC-NNN-*.md`.
- Acao corretiva com `T-NNN` rastreavel (nao "anota mentalmente").

Atencao: o **gate de 48h** e disciplinar, nao mecanico no core. `require-checkpoint-before-merge.js` valida o checkpoint do diff atual, nao o postmortem. Para enforcement automatico de postmortem (LGPD-006 + ciclo de 48h), instale o addon `lgpd-compliance`.

## Saida final do `/hotfix`

```
HOTFIX APLICADO

Incidente: <1 frase>
Causa raiz: <1 frase, identificada pelo investigador>
Fix: <arquivo:linha, em 1 frase>
Commit: <hash> (T-NNN)
Pos-incidente: <SIM/NAO> — postmortem em ate 48h obrigatorio se SIM
```

## O que este workflow NAO faz (non-goals)

- Nao pula investigador (REGRA #0 vale sempre — INV-006).
- Nao roda auditores antes do fix (eles rodam em `/incident-postmortem`).
- Nao gera ADR no momento (gera-se no postmortem).
- Nao subiu sozinho pra producao — quem faz deploy e o operador humano com autorizacao explicita.

## Regras envolvidas

INV-006 (causa raiz), INV-AGENT-002 (investigar antes), LGPD-006 (incidente = notificar ANPD em 72h), FISCAL-004 (contingencia prevista).
