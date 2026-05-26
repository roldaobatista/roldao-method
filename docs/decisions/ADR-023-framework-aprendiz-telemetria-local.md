---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-117, US-121
supersedes: []
superseded-by: null
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — secao 11 do `docs/analises/2026-05-26-melhorias-fluxo-roldao.md`"
  sintoma-observado: "Framework nao se observa nem aprende com o uso. Quais hooks disparam mais? Quais sao falso positivo? Quais sao mortos? Hoje opacidade total."
---

# ADR-023 — Framework Aprendiz: telemetria local opt-in + meta-cetico nunca aplica sozinho

> Decisao **aceita** em 2026-05-26 pelo Roldao a partir do PRD-004.

---

## Contexto

A v2.0.0 entregou 44 hooks bloqueadores + 28 comandos + 17 agentes. Eles funcionam. Mas o framework **nao sabe quais funcionam bem** porque nao mede o proprio uso:

- Hook que dispara 200x/mes pode ser util OU falso positivo — sem dado, ninguem sabe.
- Hook que nunca disparou em 6 meses pode ser regra essencial dormente OU codigo morto — sem dado, ninguem sabe.
- Regra contornada via `--bypass` 50x num projeto e sinal de regra ruim OU regra critica que o agente esta sabotando — sem dado, ninguem sabe.

A auditoria de 2026-05-26 (`docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §11) diagnosticou:

> "Framework nao se observa nem aprende com o uso. Quais hooks disparam mais? Quais sao falso positivo? Quais sao mortos? Hoje opacidade total."

Sem dado real de uso, **o framework so evolui por intuicao do Roldao**. Isso e fragil: Roldao acaba esquecendo dor que viveu 2 meses atras, ou nao percebendo padrao que esta repetindo nos ultimos 10 bugs.

Tres caminhos sao possiveis. Cada um tem custo arquitetural diferente.

## Decisao

**Telemetria local-first opt-in. Zero rede. Zero servidor. Zero PII. Meta-cetico (Otavio) sempre PROPOE — nunca aplica sozinho.**

### Comportamento

1. **Coleta local em JSONL** em `.claude/.runtime/`:
   - `hook-stats.jsonl` — `{hook_id, decision, ts, projeto_hash, duration_ms}` por disparo
   - `dismissed.jsonl` — `{regra, motivo_opcional, ts, projeto_hash}` quando usuario contorna soft warning ou desliga hook
   - `usage.jsonl` — `{cmd, ts, success, duration_ms, session_hash}` por SlashCommand
   - `audit-bias.json` — `{rule_id: {miss_count, last_miss_at}}` historico de misses
   - `bug-pattern-${US}.jsonl` — `{us_id, dominio, classificacao}` quando investigador marca `padrao_recorrente`

2. **`projeto_hash` = SHA-256 do path absoluto do projeto**, truncado em 12 chars. NAO e PII. Permite separar dados entre projetos sem revelar identidade.

3. **Rotacao automatica** em 30MB OU 90 dias por arquivo. Hook `purge-old-runtime.js` (lifecycle).

4. **Todos os JSONL no `.gitignore`.** Nunca saem do disco local.

5. **Agente `meta-cetico` (Otavio)** novo. Acionado por `/auto-auditar-framework` (manual ou mensal via `/loop`). Le os JSONL + `docs/retros/*.md` + `docs/incidentes/INC-NNN-*.md`. Saida em `docs/learning/<data>-meta-cetico-r<N>.md`:
   - **3 candidatos a regra nova** (padrao repetiu 3x no mesmo dominio)
   - **3 candidatas a sunset** (regra que nunca disparou em 90 dias OU contornada >50% das vezes)
   - **Justificativa por candidato** + comando pra Roldao aceitar/rejeitar

6. **INV-AGENT-005 preservada integralmente.** Otavio NUNCA aplica sozinho — sempre propoe via doc + Roldao decide com 1 sim/nao.

7. **Opt-in via flag `ROLDAO_TELEMETRIA_LOCAL=1`** (default `=1` em v3.0.0 — ativo). Usuario que quer desligar coloca `=0` no `.claude/settings.local.json`. Nada quebra — hooks que dependem da telemetria (Otavio) param de propor candidatos, mas o framework segue funcionando.

### Mensagem inicial (primeira sessao apos update v3)

```
Aviso: v3.0.0 ativou telemetria LOCAL pra ajudar o framework a aprender com seu uso.
- Dados ficam SO no seu disco (.claude/.runtime/*.jsonl)
- Zero rede, zero servidor, zero dado pessoal
- Otavio (meta-cetico) le esses dados e te propoe melhorias 1x/mes
- Pra desligar: setar ROLDAO_TELEMETRIA_LOCAL=0 em .claude/settings.local.json
Documentacao: docs/decisions/ADR-023-framework-aprendiz-telemetria-local.md
```

Aparece **1 vez** apos update (hook usa marker `.claude/.runtime/v3-telemetria-aviso-mostrado` pra deduplicar).

## Alternativas consideradas

### Alternativa 1 — Telemetria remota anonima (recusada)

Enviar `hook-stats` agregado pra servidor central do framework. Vantagem: Roldao se beneficia do aprendizado de OUTROS usuarios. Desvantagens:

- Quebra premissa `Node puro, zero deps runtime` (memoria `project-stack.md`).
- Exige servidor de coleta + politica de privacidade publica + LGPD compliance pro proprio framework.
- Adiciona dependencia de rede em ferramenta CLI que precisa funcionar offline.
- Roldao foi explicito em `feedback-npm-publish.md`: zero infraestrutura sem confirmacao dele.

**Recusada.** Local-first e nao-negociavel.

### Alternativa 2 — Sem telemetria, so retro manual (recusada)

Continuar como v2.0.0: framework evolui so via `/retro` + `/incident-postmortem`. Vantagem: zero risco de telemetria mal-configurada. Desvantagens:

- Retro depende do Roldao lembrar das dores. Auditoria de 2026-05-26 mostrou que 76+ pontos foram esquecidos ate 30 agentes auditarem em paralelo.
- Sem dado, meta-cetico nao tem materia-prima — proposta cai por terra.
- Framework continua opaco a si mesmo (diagnostico que motivou esse ADR).

**Recusada.** Custo de oportunidade alto demais.

### Alternativa 3 — Telemetria local com agente aplicando regras automaticamente (recusada)

Otavio detecta padrao e **aplica** regra nova direto (cria hook + atualiza REGRAS-INEGOCIAVEIS.md). Vantagem: framework evolui sem ciclo de aprovacao manual. Desvantagens:

- Viola INV-AGENT-005 (confirmar antes de mudanca de regra — equivalente a "mudanca legal-ish do framework").
- Risco de agente alucinar padrao em dado ruim e criar regra que prejudica.
- Roldao perde controle sobre o que o framework prega.

**Recusada.** Otavio sempre propoe — Roldao decide.

## Consequencias

### Positivas

- Framework comeca a **observar a si mesmo** sem rede.
- Otavio gera proposta mensal de regra nova + sunset — Roldao decide com base em dado, nao palpite.
- Auditoria humana externa (DPO terceirizado, contador) ganha dossier centralizado por sessao via `dismissed.jsonl`.
- Custo zero de infraestrutura. Compativel com `Node puro zero-deps`.
- Reversibilidade total: `ROLDAO_TELEMETRIA_LOCAL=0` desliga tudo, JSONL ficam intactos pro caso de querer religar.

### Negativas

- 5 arquivos JSONL novos em `.claude/.runtime/` — mais espaco em disco (estimado: 1-5MB/mes em uso moderado, rotacao em 30MB).
- Cada hook ganha overhead de ~2-5ms pra anexar linha em JSONL (mitigado por buffer assincrono).
- Otavio precisa ler grande volume de JSONL no `/auto-auditar-framework` — primeira execucao em projeto antigo pode demorar 30-60s.
- Roldao tem que ler proposta de Otavio mensalmente. Custo de atencao real.

### Compativel com

- **ADR-001** (Node puro zero-deps) — telemetria implementada com `fs.appendFileSync` puro.
- **ADR-016** (Politica SemVer) — v3.0.0 e major bump; telemetria justifica.
- **ADR-021** (Flag legacy markers) — `ROLDAO_TELEMETRIA_LOCAL=0` segue mesma convencao de flag de runtime.
- **INV-001** — proposta de Otavio vira `docs/learning/*.md` versionado, nao memoria de conversa.
- **INV-AGENT-005** — Otavio nunca aplica sozinho.

## Gatilhos de reabertura

- Volume de JSONL ultrapassa 100MB em uso real → revisar politica de rotacao.
- Otavio propoe regra ruim 3x seguidas (Roldao rejeita 3x) → revisar prompt do Otavio.
- LGPD muda interpretacao sobre "hash de path como dado pessoal" → migrar pra hash de UUID gerado no install.

## Como verificar

- `cat .claude/.runtime/hook-stats.jsonl | wc -l` cresce com uso real.
- `ROLDAO_TELEMETRIA_LOCAL=0 npx claude --version && cat .claude/.runtime/hook-stats.jsonl | wc -l` nao cresce.
- `/auto-auditar-framework` em projeto com 30+ dias de uso produz proposta de Otavio em < 60s.

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
