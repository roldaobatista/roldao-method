---
tipo: story
id: US-121
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-119]
aprovacoes: []
---

# US-121 — Onda 5: Framework Aprendiz + telemetria + meta-cetico (Otavio)

## Como, quero, para

**Como** Roldao usando framework ha 6 meses,
**quero** que o proprio framework me proponha melhorias baseado no MEU uso real
**para** parar de depender so da minha memoria pra notar padroes que viraram regra.

## Criterios de aceitacao

- **AC-121-1** — Agente `meta-cetico` (Otavio) novo. Acionado por `/auto-auditar-framework`. Le hook-stats.jsonl + retros + incidentes + ultimos 100 commits. Saida em `docs/learning/<data>-meta-cetico-r<N>.md`: 3 candidatos a regra nova + 3 candidatas a sunset. NUNCA aplica sozinho (INV-AGENT-005).
- **AC-121-2** — Frontmatter de regra (INV/SEC/TST/LGPD/PIX/FISCAL) ganha bloco `origem:` obrigatorio (data + incidente + sintoma). Hook `require-origem-on-new-rule.js` bloqueia ID novo sem `origem:`.
- **AC-121-3** — Workflow `/bug` ganha etapa final: investigador classifica `padrao_recorrente: sim|nao|incerto` em `bug-pattern-${US}.jsonl`. 3 bugs com `sim` no mesmo dominio → Otavio propoe regra.
- **AC-121-4** — Tech-writer (Camila) ganha modo `--diario-aprendizado` (mensal). Compila `docs/learning/AAAA-MM.md`. Acionado por `/aprendizado-mensal` OU automaticamente em SessionStart no dia 1 de cada mes.
- **AC-121-5** — Comando `/explicar-update <vAntiga> <vNova>` le diff de changelog + checa o que afeta o projeto especifico. Output PT-BR.
- **AC-121-6** — `.claude/.runtime/dismissed.jsonl` rastreavel quando usuario contorna soft warning ou usa `--bypass`. Apos 5 dismissals da mesma regra, Otavio sinaliza.
- **AC-121-7** — Comando `/brief-framework <nome>` novo. Analista (Cintia) le repo publico de outro framework e devolve "padroes nao cobertos aqui que voce pode adotar" + "padroes que voce rejeita intencionalmente". Saida em `docs/analises/`. Sob demanda.
- **AC-121-8** — Agente `memory-skeptic` acionado mensalmente OU em SessionStart se ultima auditoria > 30 dias. Le cada memoria, compara com estado atual, marca `status: obsoleta` ou propoe consolidacao. Nao deleta — propoe. Comando `/memoria-consolidar` invoca em modo agressivo. Comando `/memoria-all` mantem capacidade de carregar tudo (ADR-031).
- **AC-121-9** — Workflow `/release` ganha etapa final automatica: Camila gera 1-3 bullets de aprendizado em `memory/aprendizados/<data>-<tema>.md`. Roldao aprova com 1 sim/nao. Hook `enforce-reflection-on-release.js` (modo soft warning v3.0.0, block v3.1.0).
- **AC-121-10** — Agente `vigia-fluxo` (Olivia) novo. SRE do PROPRIO FLUXO interno. Roda a cada SubagentStop, le `.runtime/`, gera `vigia-report-<sess>.md` com sinais: tempo > 10min sem atividade, handoff payload com `confianca: baixa`, audit_sha em loop. NAO bloqueia — escala em soft warning.
- **AC-121-11** — Comando `/stats-hooks` le hook-stats.jsonl: top 5 mais disparados, top 5 que nunca bloquearam em 90 dias, top 5 com `decision:block` ignorado.

## Non-goals

- NAO compartilhar telemetria entre usuarios (local-first sempre)
- NAO auto-aplicar regra proposta (INV-AGENT-005)
- NAO criar cron real (gatilho via `/loop` existente ou manual)
- NAO substituir Caio/Julia/Pedro (auditores) — Otavio audita o FRAMEWORK, nao o codigo do projeto

## Contexto tecnico

- **ADRs bloqueantes:** ADR-023 (Framework aprendiz — telemetria) — ja escrito
- **Depende de:** US-117 (hook-stats.jsonl existindo) e US-119 (pipeline-state.json pra Otavio cruzar com bugs)

## Tasks

- [ ] **T-121-001** — Agente `meta-cetico` (Otavio) em `.claude/agents/meta-cetico.md`
- [ ] **T-121-002** — Comando `/auto-auditar-framework`
- [ ] **T-121-003** — Frontmatter `origem:` obrigatorio + hook `require-origem-on-new-rule.js`
- [ ] **T-121-004** — Retrofit das 49 regras existentes em REGRAS-INEGOCIAVEIS.md com `origem:` (best-effort via git log)
- [ ] **T-121-005** — Estender `/bug` com classificacao `padrao_recorrente`
- [ ] **T-121-006** — Camila modo `--diario-aprendizado` + comando `/aprendizado-mensal`
- [ ] **T-121-007** — Comando `/explicar-update`
- [ ] **T-121-008** — `.claude/.runtime/dismissed.jsonl` (recorder em `_lib.js` quando `--bypass`)
- [ ] **T-121-009** — Comando `/brief-framework` + estender Cintia
- [ ] **T-121-010** — Agente `memory-skeptic` + comando `/memoria-consolidar` + `/memoria-all`
- [ ] **T-121-011** — Estender `/release` com etapa de reflexao + hook `enforce-reflection-on-release.js`
- [ ] **T-121-012** — Agente `vigia-fluxo` (Olivia) em `.claude/agents/vigia-fluxo.md`
- [ ] **T-121-013** — Comando `/stats-hooks`

## Testes esperados

- **Unitario:** parser de hook-stats.jsonl; classificador de padrao_recorrente
- **Integracao:** rodar 30 dias em sandbox + `/auto-auditar-framework` → Otavio produz proposta valida; `/memoria-all` carrega tudo (preserva capacidade)
- **Regressao:** regras existentes sem `origem:` continuam funcionando ate retrofit completar

## Regulamentacao BR aplicavel

- **INV-AGENT-005** — Otavio sempre PROPOE, nunca aplica
- **LGPD-001** — telemetria nao coleta PII (hash projeto + ID regra + timestamp)
- **ADR-023** — coletor local-first

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 5) |
