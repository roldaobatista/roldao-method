---
owner: tech-lead
revisado-em: AAAA-MM-DD
status: proposta
decidido-em: _(quando aceito)_
decidido-por: _(quem aprovou)_
prd: PRD-NNN
epico: EP-NNN
story: US-NNN
supersedes: []
superseded-by: null
origem:
  data: AAAA-MM-DD
  incidente-ou-feedback: _(o que motivou — auditoria LGPD, incidente, ANPD)_
  sintoma-observado: _(em 1 frase)_
---

# ADR-NNN — Retencao de dados — _(area/tabela/log)_

> Template especifico pra decisao de **retencao de dados pessoais ou sensiveis**. Codifica LGPD-002 (direito ao esquecimento) + LGPD-011 (mascaramento em log livre).

---

## Contexto

_(2-3 paragrafos. Que dados sao armazenados? Em que tabela/log/arquivo? Volume? Quanto tempo crescem sem politica?)_

**Inventario de dados:**

| Onde | O que | Volume estimado | Crescimento mensal | PII envolvida |
|---|---|---|---|---|
| `messages` (banco) | conversa livre do cliente | _(GB)_ | _(GB)_ | sim — texto pode ter CPF/nome/email |
| `audit_log` | acessos a recursos sensiveis | _(GB)_ | _(GB)_ | parcial — IDs de usuario |
| `pipeline_phase_metrics` | metricas de execucao | _(GB)_ | _(GB)_ | nao |
| `logs/*.jsonl` | logs do app | _(GB)_ | _(GB)_ | sim — `user_input` em log |

**Por que precisa de politica:**

- LGPD-002 — direito ao esquecimento: usuario solicita exclusao → sistema precisa apagar OU anonimizar
- LGPD-003 — minimizacao: nao reter mais que necessario
- Custo de storage cresce indefinidamente
- Crash recovery (resume de pipeline antigo) so vale por janela razoavel — depois fica overhead

---

## Decisao

**Politica de retencao por categoria de dado:**

### Categoria 1 — Dados operacionais (sem PII direta)

| Tabela/log | Retencao | Mecanismo |
|---|---|---|
| `pipeline_phase_metrics` | 90 dias | DELETE WHERE created_at < NOW() - 90d, weekly cron |
| `hook-stats.jsonl` | rotacao em 30MB OU 90 dias | rotacao automatica pelo hook contador |

### Categoria 2 — Dados pessoais com base legal contratual

| Tabela/log | Retencao | Mecanismo |
|---|---|---|
| `usuarios` | enquanto contrato ativo + 5 anos pos-encerramento (CC + obrigacao fiscal) | DELETE acionado por job legal/contabil |
| `transacoes_financeiras` | 5 anos (obrigacao fiscal BR — manter sempre) | NUNCA apagar, mas anonimizar campos PII apos 5 anos |

### Categoria 3 — Log livre (conteudo do usuario)

| Tabela/log | Retencao | Mecanismo |
|---|---|---|
| `messages` (chat) | 90 dias texto puro + anonimizacao apos | job mensal que mascara PII apos prazo |
| `logs/app-*.jsonl` | 30 dias com PII mascarado | mascaramento na escrita (LGPD-011) + rotacao mensal |

### Categoria 4 — Trilha de auditoria (LGPD-004)

| Tabela/log | Retencao | Mecanismo |
|---|---|---|
| `audit_log` | **5 anos** (obrigacao acessoria fiscal/contabil) | NUNCA apagar — append-only |

### Mascaramento (LGPD-011)

Toda escrita em `messages`, `audit_log`, `logs/*.jsonl` que recebe texto livre passa por `mascarar-dado-pessoal` (skill BR ja existente) ANTES de persistir:

- CPF visivel: `***.***.***-99`
- Email: `***@***.com`
- Telefone: `+55 (XX) ***`
- Chave Pix: `***@***`

Hook `block-pii-in-audit-log.js` (US-122 AC-122-20) bloqueia INSERT sem chamada previa de `mascarar-dado-pessoal`.

### Direito ao esquecimento (LGPD-002)

Comando administrativo: `npx <projeto> esquecer-cliente <user_id>` faz:

1. `UPDATE usuarios SET nome='<esquecido>', cpf=NULL, email=NULL WHERE id=<user_id>`
2. `UPDATE transacoes_financeiras SET nome_pagador='<esquecido>', cpf_pagador=NULL WHERE user_id=<user_id>` (mantem registro fiscal mas anonimiza)
3. `DELETE FROM messages WHERE user_id=<user_id>`
4. `UPDATE audit_log SET payload='<esquecido>' WHERE actor_id=<user_id> AND created_at > NOW() - 5y` (audit_log nao se apaga — anonimiza)

---

## Alternativas consideradas

### Alternativa 1 — Manter tudo indefinidamente

**Recusada:** LGPD-002 + LGPD-003 violadas. Custo de storage cresce sem limite.

### Alternativa 2 — Apagar tudo apos 30 dias (politica unica)

**Recusada:** viola obrigacao fiscal (transacoes precisam de 5 anos) E quebra auditoria (audit_log precisa de 5 anos).

### Alternativa 3 — Politica por categoria (esta ADR)

**Aceita.**

### Alternativa 4 — Anonimizar tudo logo na coleta

Vantagens: sem retencao de PII.
Desvantagens: perde rastreio operacional util (debug, customer success).
**Recusada parcialmente:** anonimizacao acontece apos prazo, nao na coleta.

---

## Consequencias

### Positivas

- LGPD-002 viavel via comando `esquecer-cliente`
- Custo de storage controlado
- Trilha de auditoria preservada por 5 anos (obrigacao acessoria)
- Mascaramento na escrita (LGPD-011) reduz risco em vazamento

### Negativas

- 4 jobs cron novos (rotacao de logs, mascaramento mensal, etc.)
- Comando `esquecer-cliente` exige autorizacao especifica (papel administrador)
- Texto mascarado nao pode ser revertido — perda de detalhe apos prazo

### Compativel com

- LGPD-001 (base legal declarada na coleta)
- LGPD-002 (direito ao esquecimento implementavel)
- LGPD-003 (minimizacao apos prazo)
- LGPD-004 (trilha de auditoria — 5 anos)
- LGPD-011 (mascaramento em log livre)
- FISCAL-002 (5 anos pra dado fiscal)

---

## Gatilhos de reabertura

- ANPD publicar guideline mais restritivo sobre retencao
- Cliente solicitar prazo customizado (caso a caso vira ADR proprio)
- Custo de storage explodir → reduzir prazo de categoria 1/3

---

## Como verificar

- Job cron de retencao roda e marca em log: `cat logs/retention-job.log | tail`
- `npx <projeto> esquecer-cliente <test_id>` em sandbox → dados anonimizados conforme matriz
- `audit_log` continua intacto mesmo apos esquecer-cliente (audit nao apaga — anonimiza payload)
- Hook `lgpd-pipeline-payload-reminder.js` (US-122 AC-122-21) avisa em tabelas sem `purge_after_days`

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | proposta inicial |
