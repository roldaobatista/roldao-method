---
tipo: plano-fix
id: PLAN-NNN
versao: 1
status: draft
owner: _(tech-lead — Rafael)_
revisado-em: AAAA-MM-DD
origem: _(auditoria que disparou — AUD-NNN | bug | incidente | retrospectiva)_
parent-plan: null
auditado-em: null
---

# Plano de correcao — _(titulo curto)_

> Template de plano de correcao em "Ondas" (US-125 / inspirado no padrao lionclaw `auditoria-do-plano.md` e `plano-fix-pipeline-documentation.md`). Cada Onda = entrega independente. Util pra refactor grande ou correcao multi-etapa.
>
> **Quando usar:** correcao envolvendo > 5 tarefas OU multiplos arquivos OU mudanca arquitetural com risco. Para fix simples (1-3 arquivos), use direto `/quick-dev` ou commit atomico.

---

## Resumo em 1 frase

_(O que esse plano resolve, em linguagem do cliente final.)_

---

## Visao geral por onda

| Onda | Foco | Falhas que resolve | Esforco | Risco | Dependencia |
|---|---|---|---|---|---|
| **Onda 1** | _(ex: estabilizar leitura)_ | C1, C2 | M (3-5 dias) | baixo | - |
| **Onda 2** | _(ex: refatorar handlers)_ | A1, A2, M1 | G (1 semana) | medio | Onda 1 |
| **Onda 3** | _(ex: melhorar UX)_ | B1, B2 | P (2 dias) | baixo | Onda 2 |
| **Onda 4** | _(ex: documentar e testar)_ | ALT-1 (aproveitada) | M (3 dias) | baixo | Ondas 1-3 |

---

## Pre-requisitos

Numerados em ordem de execucao. Ate todos estarem com `[x]`, nenhuma Onda pode comecar.

- [ ] **P1** — _(ex: alinhar com Roldao se ADR-NNN ainda vale)_
- [ ] **P2** — _(ex: rodar /readiness pra confirmar estado do epico)_
- [ ] **P3** — _(ex: criar branch ou worktree dedicado)_

---

## Onda 1 — _(titulo)_

### Objetivo
_(1 linha. O que esse onda entrega.)_

### Resolve as falhas
- C1 (da auditoria AUD-NNN)
- C2 (da auditoria AUD-NNN)

### Tarefas

- [ ] **T-1.1** — _(...)_
- [ ] **T-1.2** — _(...)_
- [ ] **T-1.3** — _(...)_

### Como verificar (binario)
- `comando que prova` retorna _(esperado)_
- Hook X passa em arquivo Y

### Risco e mitigacao
- _(risco — mitigacao)_

### Critério de aceitacao da Onda
- [ ] AC-O1-1: _(verificavel por comando)_
- [ ] AC-O1-2: _(verificavel)_

---

## Onda 2 — _(titulo)_

### Objetivo
### Resolve
### Tarefas
### Como verificar
### Risco
### Criterio de aceitacao

_(replicar estrutura)_

---

## Onda 3 — _(titulo)_

_(replicar)_

---

## O que NAO esta no plano (non-goals — INV-003)

- _(item)_
- _(item)_

---

## Quem revisa

- **Tech-lead (Rafael):** valida arquitetura de cada Onda antes de comecar
- **Auditor que originou a auditoria:** re-audita ao final de cada Onda
- **Roldao (dono de produto):** aprovacao final apos ultima Onda

---

## Cronograma estimado

| Onda | Inicio (alvo) | Fim (alvo) | Status |
|---|---|---|---|
| 1 | AAAA-MM-DD | AAAA-MM-DD | pendente |
| 2 | AAAA-MM-DD | AAAA-MM-DD | pendente |
| 3 | AAAA-MM-DD | AAAA-MM-DD | pendente |
| 4 | AAAA-MM-DD | AAAA-MM-DD | pendente |

---

## Auditoria do plano (opcional — INV-AGENT-007)

Se este plano e candidato a "auditoria de auditoria" (raro — so quando achados sao criticos/perigosos), criar `AUD-NNN-do-plano.md` no padrao auditoria.md e ligar via `parent-plan:` aqui. **Max 2 rodadas** antes de escalar pra revisao arquitetural humana.

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criacao |
