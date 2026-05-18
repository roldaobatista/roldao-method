---
tipo: epico
id: EP-NNN
versao: 1
status: draft   # draft | aprovado | em-andamento | entregue | arquivado
prd: PRD-NNN
owner: _(preencher)_
revisado-em: AAAA-MM-DD
tamanho: G    # M | G | XG — soma das stories
---

# EP-NNN — _(título curto do épico, máximo 60 caracteres)_

> Arquivo de épico gerado pelo `/epico`. Vive em disco, não na conversa (INV-001).
>
> **Diferença para PRD:** PRD descreve a iniciativa (problema, mercado, escopo, métricas). Épico é a unidade operacional — agrupa stories filhas, declara ordem de execução e ADRs bloqueantes.

---

## Resumo em 1 frase

_(O que esse épico entrega ao cliente final, em linguagem leiga.)_

---

## Stories filhas

> Tabela autoritativa. Cada US-NNN vive em `docs/stories/US-NNN-*.md`. Aqui é só o índice + ordem + dependências.

| US     | Título                          | Depende de | Tamanho | Status     |
|--------|----------------------------------|------------|---------|------------|
| US-NNN | _(título)_                       | -          | P/M/G   | draft      |
| US-NNN | _(título)_                       | US-NNN     | P/M/G   | draft      |

---

## ADRs bloqueantes

> Decisões arquiteturais que precisam estar **aceitas** antes da primeira story começar.

- [ ] **ADR-NNNN** — _(decisão)_
- [ ] **ADR-NNNN** — _(decisão)_

---

## Readiness (gate mecânico)

Estado do gate `/readiness EP-NNN` — preenchido pelo comando, lido pelo hook `require-readiness-before-feature.sh`.

- **Última verificação:** _(data)_
- **Resultado:** _(PRONTO | NAO_PRONTO)_
- **Arquivo de status:** `docs/readiness/EP-NNN-status.md`

Sem `status: PRONTO` em `docs/readiness/EP-NNN-status.md`, nenhuma `/feature` deste épico avança.

---

## Non-goals (INV-003)

O que esse épico explicitamente NÃO faz (deixa pra épico futuro):

- _(item)_

---

## Métricas de sucesso

Como o épico saberá que foi bem-sucedido (uma métrica concreta, não "melhor experiência"):

- _(ex: redução de 30% no tempo médio de cadastro até 2026-08-01)_

---

## Regulamentação BR aplicável

_(IDs do REGRAS-INEGOCIAVEIS.md tocados pelo épico inteiro)_

- _(ex: LGPD-001, FISCAL-005, PIX-002)_

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criação |
