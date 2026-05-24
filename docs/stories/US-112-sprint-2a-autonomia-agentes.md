---
tipo: story
id: US-112
versao: 1
status: draft
prd: PRD-003
epico: EP-002
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: [US-111]
aprovacoes: []
sprint: 2A
esforco-dias-uteis: 7.5
premissas:
  - "Reescrita dos 3 agentes (analista, dba-dados, devops-infra) mantém comportamento técnico — muda só forma (não devolve pergunta evitável; premissas viram frontmatter)."
  - "Eval comportamental em evals/agent-behavior/no-evitable-questions.eval mede taxa antes/depois — passou se taxa < 5%."
  - "K7 (auto-AskUserQuestion a partir de premissas) é parte desta story porque pertence ao mesmo refactor de fluxo do analista."
adrs-decorrentes: []
---

# US-112 — Sprint 2A: Autonomia dos agentes (C1-C7)

> Story file gerado pelo `/epico` em Modo DECOMP.

---

## Como, quero, para

**Como** dono de produto que não programa,
**quero** que agentes técnicos (`analista`, `devops-infra`, `dba-dados`) decidam sozinhos em vez de devolver "1-3 perguntas pendentes pro PM",
**para** não precisar tomar decisão técnica que não sei tomar e não trancar o fluxo do `/prd` e do `/brownfield` no meio.

---

## Critérios de aceitação

- **AC-112-1** — `analista.md` não contém seção/instrução que devolva "perguntas pendentes pro PM". Verificação: `grep -iE 'perguntas? pendente|pro PM|pro gerente' .claude/agents/analista.md` retorna 0 linhas.
- **AC-112-2** — `dba-dados.md` e `devops-infra.md` não contêm "Pergunta padrão de X". Verificação: `grep -iE 'pergunta padrao|pergunta padrão|pergunta-padrao' .claude/agents/dba-dados.md .claude/agents/devops-infra.md` retorna 0 linhas.
- **AC-112-3** — Eval comportamental `evals/agent-behavior/no-evitable-questions.eval` roda os 3 agentes em 20 cenários e mostra taxa de "pergunta evitável" < 5%. Verificação: `node evals/runner.js evals/agent-behavior/no-evitable-questions.eval` retorna exit 0.
- **AC-112-4** — Premissas assumidas pelos 3 agentes ficam em `premissas:` no frontmatter da spec gerada (PRD/story/ADR). Verificação: teste de integração `tests/integration/agent-premissas.test.js` valida que cada agente, dado input ambíguo, escreve premissa no frontmatter em vez de devolver pergunta.
- **AC-112-5** — K7 entregue: `/prd` etapa 2 dispara `AskUserQuestion` automático a partir das premissas listadas pelo analista (não obriga Roldão a abrir o arquivo). Verificação: `tests/integration/prd-etapa-2-askuserquestion.test.js` retorna 0.
- **AC-112-6** — Cobertura: cada ação C1-C7 do PLANO-AUDITADO tem 1 task T-NNN correspondente nesta story (ver MAPEAMENTO-T-NNN.md da US-111).

---

## Non-goals (INV-003)

- **Não** muda Maestro nem cria modo PRD/BROWNFIELD/AR no orquestrador — fica pra US-113.
- **Não** reescreve agentes em PT-BR ainda (jargão fica pra US-114 F3/F4). Foco aqui é **autonomia** (não devolver pergunta), não linguagem.
- **Não** muda comportamento de agentes que já são autônomos (`investigador`, `dev-senior`, `revisor`, auditores) — escopo é só os 3 reativos.
- **Não** muda `gerente-produto` (Sofia) — ela já está autônoma; o que ela faz com o output dos 3 reformados é responsabilidade dela, não desta story.

---

## Contexto técnico

_(Investigador preenche antes de Bruno codar.)_

- **Arquivos afetados (esperado):** `.claude/agents/analista.md`, `.claude/agents/devops-infra.md`, `.claude/agents/dba-dados.md`, `evals/agent-behavior/no-evitable-questions.eval` (novo), `evals/runner.js` (novo ou estendido), `tests/integration/agent-premissas.test.js` (novo), `tests/integration/prd-etapa-2-askuserquestion.test.js` (novo), `.claude/commands/prd.md` (editar etapa 2).
- **Migrations necessárias:** Não — só edita arquivos `.md` e adiciona testes.
- **ADRs relacionados:** Nenhum decorrente desta story (decisões são comportamentais, não arquiteturais).

---

## Tasks

- [ ] **T-001** — C1: reescrever `analista.md` removendo seção "perguntas pendentes pro PM"; instruir agente a registrar premissas em `premissas:` no frontmatter do brief/PRD.
- [ ] **T-002** — C2: reescrever `dba-dados.md` removendo "Pergunta padrão de X"; agente assume premissa técnica padrão (ex: índice composto antes de simples) e documenta.
- [ ] **T-003** — C3: reescrever `devops-infra.md` removendo "Pergunta padrão de X"; agente assume estratégia padrão (ex: rolling deploy antes de blue-green) e documenta.
- [ ] **T-004** — C4: criar `evals/agent-behavior/no-evitable-questions.eval` com 20 cenários cobrindo os 3 agentes (ambiguidade técnica que **não** afeta comportamento observável pro cliente).
- [ ] **T-005** — C5: implementar runner `evals/runner.js` que executa o eval, mede taxa de "pergunta evitável" (regex sobre output) e retorna exit 0/1.
- [ ] **T-006** — C6: teste de integração `tests/integration/agent-premissas.test.js` valida que premissa vai pro frontmatter da spec, não pra mensagem ao usuário.
- [ ] **T-007** — C7: documentar contrato "agente autônomo" em `docs/PADROES-AGENTE-AUTONOMO.md` (novo) — referência para futuros agentes.
- [ ] **T-008** — K7: editar `.claude/commands/prd.md` etapa 2 — dispara `AskUserQuestion` automático lendo `premissas:` do brief do analista (só perguntas que afetam comportamento observável; resto vai como premissa documentada). + teste.

---

## Testes esperados

- **Unitário:** runner `evals/runner.js` (parse, regex de pergunta evitável, contagem).
- **Integração:** `agent-premissas.test.js`, `prd-etapa-2-askuserquestion.test.js`.
- **E2E:** N/A.

---

## Regulamentação BR aplicável

- **INV-AGENT-003** — Pró-atividade, não permissão. Esta story é a aplicação literal do princípio nos 3 agentes mais reativos.
- **INV-AGENT-006** — Executar, não passar pro usuário. Eval AC-112-3 mede taxa < 5% como gate.

---

## Status

- [x] draft
- [ ] aprovada
- [ ] em implementação
- [ ] revisão
- [ ] entregue

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-112 |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** _(a definir)_
- **Modelo usado:** _(a registrar)_
- **Custo aproximado:** _(a registrar)_
- **Tempo total:** _(a registrar)_
- **Arquivos tocados:** _(a registrar)_
- **Tasks concluídas:** _(T-001..T-008)_
- **Hooks que bloquearam:** _(a registrar)_
- **Decisões fora do PRD:** _(virar ADR se houver)_
- **Skills invocadas:** _(a registrar)_
- **Subagentes invocados:** _(investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(a registrar)_
