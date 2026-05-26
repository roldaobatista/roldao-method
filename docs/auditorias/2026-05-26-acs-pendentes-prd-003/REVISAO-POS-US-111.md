---
owner: tech-lead
revisado-em: 2026-05-26
status: stable
escopo: revisao da auditoria inicial apos completar pipeline /feature US-111
referencia: AUDITORIA.md (auditoria inicial)
---

# Revisao da auditoria inicial — pos pipeline US-111

> A auditoria inicial (mesmo dia, mais cedo) estimou **36 de 44 ACs pendentes**. Apos completar pipeline /feature US-111 e re-auditar 4 outras stories com lente "caminho real" (vs spec literal), a estimativa real cai drasticamente. **Possivelmente 5-10 ACs reais pendentes, nao 36.**

## Por que a auditoria inicial inflou

A spec literal pede arquivos em caminhos como `tests/hooks/X.test.js`. O codigo real evoluiu pra `test/hooks-X.test.js`. A busca por caminho literal devolvia "FALTA" pra arquivos que de fato existem em pasta proxima. Trabalho foi feito; spec ficou desatualizada.

## US-111 — VERIFICADO via pipeline completo

| AC | Inicial | Real | Evidencia |
|---|---|---|---|
| AC-111-1 | FALTA | **ENTREGUE** | `test/hooks-auditors-pass.test.js` 19/19 OK |
| AC-111-2 | FALTA | **ENTREGUE** | `test/hooks-anti-mascaramento-extra.test.js` 19/19 OK |
| AC-111-3 | FALTA | **PENDENTE-EXTERNA** | Amarrado ao bump v2.0.0 (task externa) |
| AC-111-4 | FALTA | **ENTREGUE** | `useLegacyMarkers()` em `_lib.js` + 4 hooks consomem |
| AC-111-5 | FALTA | **ENTREGUE NESTA SESSAO** | `MAPEAMENTO-T-NNN.md` 109 itens |
| AC-111-7 | FALTA | **ENTREGUE** | commit T-004 atomico ja existia |

**Estado:** 7/8 entregues, 1 pendente-externa.

## US-112 — re-auditoria preliminar (NAO validada por pipeline)

| AC | Inicial | Re-audit | Nota |
|---|---|---|---|
| AC-112-1 | FALTA | **PROVAVELMENTE ENTREGUE** | `analista.md` linha 37 diz literalmente "nao joga pergunta vaga pro PM — INV-AGENT-006" (busca literal de "pro PM" deu falso positivo) |
| AC-112-2 | FALTA | **REAL PENDENTE** | `dba-dados.md` linha 61 ainda tem "Pergunta padrão de acesso..." (modo MOD) |
| AC-112-3 | FALTA | **ENTREGUE (caminho diferente)** | `evals/agent-behavior/devops-dba-comportamento.eval.json` existe (nao `no-evitable-questions.eval`) |
| AC-112-4 | FALTA | **PENDENTE** | Sem `agent-premissas` em test/tests/ |
| AC-112-5 | FALTA | **PENDENTE** | Sem `prd-etapa-2-askuserquestion` em test/tests/ |

**Estado:** ~3 entregues, 3 reais pendentes.

## US-113 — re-auditoria preliminar

| AC | Inicial | Re-audit | Nota |
|---|---|---|---|
| AC-113-1 | FALTA | **REAL PENDENTE** | ADR-019 ainda `proposta` — fix de 30 segundos |
| AC-113-2 | FALTA | **ENTREGUE** | `test/agents-commands-statusline.test.js` existe |
| AC-113-4 | FALTA | **PARCIAL** | `epico.md` + `prd.md` tem ref a modo: |

## US-114 — re-auditoria preliminar

| AC | Inicial | Re-audit | Nota |
|---|---|---|---|
| AC-114-3 | FALTA | **ENTREGUE** | `test/hooks-jargon-expanded.test.js` existe |
| AC-114-6 | FALTA | **PENDENTE-REAL** | `_lib.js` ainda tem 6 ocorrencias de inglês — fix de 10 min |
| AC-114-7 | FALTA | **PROVAVELMENTE ENTREGUE** | `test/lib-contract.test.js`, `test/lib-next-id.test.js` existem |

## US-115 — re-auditoria preliminar

| AC | Inicial | Re-audit | Nota |
|---|---|---|---|
| AC-115-2 | FALTA (20 sem TL;DR) | **PARCIAL** | 7 sem TL;DR (13 entregues — auditoria inicial errou contagem) |
| AC-115-3 | FALTA | **PARCIAL** | `bin/install.js` existe; `package.json` tem `bin`; falta `help`/`status` standalone |
| AC-115-4 | FALTA | **REAL PENDENTE** | Sem fuzzy search test |

## US-116 — nao re-auditada (mantem auditoria inicial ate confirmar)

## Re-estimativa de esforco

| Categoria | Itens reais pendentes | Esforco |
|---|---|---|
| Fix mecanico (1-2 linhas) | AC-112-2, AC-113-1, AC-114-6 | 1 hora total |
| Implementacao pequena | AC-115-2 (7 TL;DR), AC-115-3 (CLI), AC-115-4 (fuzzy), AC-112-4, AC-112-5 | 1-2 dias |
| Validacao ao vivo | AC-116-7 (5 tarefas-tipo com Roldao) | 1 sessao com Roldao |
| Bump release | AC-111-3 + task #7 | 1 hora |

**Total realista:** **~3-5 dias uteis** em vez de 7-8 semanas.

## Recomendacao

Antes de mergulhar em pipelines /feature pra cada US, **re-auditar US-112..US-116 sistematicamente com auditor-produto** (1 turno por story) pra mapear o que de fato falta. Depois um unico /feature consolidado ou pipeline rapido por story pra entregar so o que falta. Pode fechar v2.0.0 em semana, nao meses.
