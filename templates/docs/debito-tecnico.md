---
tipo: debito-tecnico
versao: 1
status: ativo
owner: _(quem mantem — geralmente tech-lead Rafael)_
revisado-em: AAAA-MM-DD
ultima-consolidacao: AAAA-MM-DD
---

# Debito tecnico — _(nome do projeto/area)_

> Memoria institucional de debitos abertos. Complementa ADRs (que documentam decisao) e auditorias (que listam achados pontuais). Aqui mora o "o que sabemos que esta errado e nao consertamos ainda — com motivo".
>
> **Quando atualizar:** apos `/auditoria`, `/retro`, `/incident-postmortem`, ou quando dev faz fix com `// TODO` ou tier `todo-post-release` em finding (ADR-029).

---

## Resumo

- **Total aberto:** N itens
- **Criticos abertos:** N (devem virar prioridade no proximo sprint)
- **Resolvidos no ultimo mes:** N
- **Tempo medio de vida (open ate resolvido):** N dias

---

## Itens em aberto

> Ordenados por severidade. Cada item tem ID `DT-NNN`. Numeracao continua entre resolucao (DT-007 nao "some" quando fechado — vira `[RESOLVIDO]`).

### DT-001 — _(titulo curto)_

- **Severidade:** critica | alta | media | baixa
- **Origem:** `AUD-007` | `INC-003` | commit `<sha>` | retro de AAAA-MM-DD
- **Status:** **aberto** | em-progresso | parcial | resolvido | arquivado-com-justificativa
- **Owner pra resolver:** _(quem ou "qualquer dev")_
- **Estimativa pra resolver:** P/M/G (1 commit / sprint / 1 release)
- **Aberto desde:** AAAA-MM-DD
- **Quando vira critico:** _(gatilho — ex: "se latencia p95 > 500ms" OU "se usuario reportar 3x")_

**Descricao em PT-BR claro:**
_(2-4 linhas)_

**Por que nao consertamos ainda:**
_(motivo legitimo — ex: "depende de ADR-019 que ainda nao foi escrita" OU "fix exige refactor de modulo X")_

**Como resolver (quando virar prioridade):**
_(plano em alto nivel — 2-3 bullets)_

**Workaround atual (se houver):**
_(o que esta no codigo hoje pra mitigar)_

---

### DT-002 — _(titulo)_

_(replicar estrutura)_

---

### DT-003 ...

---

## Itens resolvidos (historia)

> Resolvidos nao desaparecem — viram historia rastreavel.

### DT-007 — _(titulo)_ — **[RESOLVIDO]**

- **Resolvido em:** AAAA-MM-DD
- **Por:** commit `<sha>` em `feat(T-NNN): ...`
- **Quanto tempo ficou aberto:** N dias
- **Aprendizado:** _(o que esse debito ensinou — input pro meta-cetico)_

---

## Itens arquivados (decidimos NAO resolver)

> Debitos que viraram "vivemos com isso" — decisao explicita, nao esquecimento.

### DT-012 — _(titulo)_ — **[ARQUIVADO]**

- **Arquivado em:** AAAA-MM-DD
- **Por:** _(quem decidiu)_
- **Motivo:** _(ex: "tradeoff aceitavel — corrigir custaria 2 semanas e ROI nao justifica")_
- **Quando reabrir:** _(gatilho — pode ficar arquivado indefinidamente OU ate condicao Y)_

---

## Padroes recorrentes

> Atualizado pelo meta-cetico (Otavio) em `/auto-auditar-framework`. Se 3 DTs do mesmo dominio aparecerem, Otavio sugere virar regra (INV-NNN) OU ADR estrutural.

- **`dominio-X`** — 4 DTs ja viram regra `INV-007` em 2026-MM-DD
- **`dominio-Y`** — 2 DTs abertos; 1 a mais e Otavio propoe regra

---

## Politica de revisao

- **Mensal:** `/aprendizado-mensal` (Camila) cita itens criticos pendentes
- **Pre-release:** `/auditoria --debito-tecnico` enumera o que vai com a release vs o que fica
- **Pos-incidente:** `/incident-postmortem` adiciona DT novo automaticamente

---

## Historico de consolidacao

| Data | Quem | Operacao |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criacao |
| AAAA-MM-DD | Otavio (meta-cetico) | sugeriu consolidar DT-001+DT-005 em regra `INV-007` (aceito) |
