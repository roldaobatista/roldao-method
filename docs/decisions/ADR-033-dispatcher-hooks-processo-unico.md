---
owner: tech-lead
revisado-em: 2026-08-17
status: aceito
decidido-em: 2026-08-17
decidido-por: Roldao Batista
prd: null
epico: null
story: null
supersedes: []
superseded-by: null
relacionado: [ADR-027]
---

# ADR-033 — Dispatcher: grupo de hooks num único processo node

## Contexto

A auditoria de 2026-08-17 mediu o custo real da cadeia de hooks na máquina de
referência (notebook classe U com estrangulamento térmico): **~615 ms de
cold-start por processo node** e **22 processos disparados a cada Write/Edit**
(grupo PreToolUse `Write|Edit|NotebookEdit`), somando ~6 s de cadeia — ou 22
processos simultâneos saturando a CPU quando o harness paraleliza. O ADR-027
("manifest hook fast-path") já diagnosticava o problema, mas propunha um
manifesto declarativo que nunca foi implementado.

## Decisão

Criar `_dispatcher.js`: o settings registra **uma** entrada por grupo quente
(`pre-write`, `post-write`, `pre-bash`), e o dispatcher roda os hooks do grupo
**in-process**, na mesma ordem de antes, num único processo node.

Contrato por hook:

- `module.exports = { runHook, onErrorExit }`
- `runHook(input, raw)` → `Promise<number>` (0 libera, 2 bloqueia); escreve
  stderr/stdout normalmente; **nunca** chama `process.exit`.
- `onErrorExit`: política do hook quando `runHook` lança — `2` (fail-closed,
  bloqueadores) ou `0` (fail-open, reminders soft). Espelha o `.catch` que o
  hook tinha no modo standalone.
- O modo CLI de cada arquivo é preservado por wrapper `require.main === module`
  — os testes que spawnam o arquivo direto continuam válidos, e o hook segue
  utilizável avulso.

Fonte única dos grupos: `_dispatcher-groups.json` (mesma pasta). Hook ainda não
convertido roda em **fallback** por subprocesso — a migração pode ser
incremental sem janela de desproteção.

Falhas de infraestrutura são fail-closed: grupo desconhecido, mapa ilegível ou
hook bloqueador que não carrega ⇒ exit 2 (nunca liberação silenciosa).

## Consequências

- Medido pós-conversão: grupo `pre-bash` (8 hooks) caiu de >1,5 s para
  **127–244 ms** por comando; `pre-write` (22 hooks) tem 1 cold-start em vez
  de 22.
- Hooks de eventos raros (SessionStart, Stop, SessionEnd, PreCompact,
  UserPromptSubmit, SubagentStop) ficam fora — o ganho não compensa o acoplamento.
- Quem adicionar hook novo nos grupos quentes precisa registrá-lo em
  `_dispatcher-groups.json` (o teste `hooks-dispatcher` confere existência e o
  espelhamento com o settings).
- Risco aceito: um hook convertido que (por regressão) chame `process.exit`
  derruba o grupo inteiro com o exit dele — mitigado pelo contrato, pela
  revisão na conversão e pelos testes por hook nos dois modos.

## Alternativas rejeitadas

- **Manifesto declarativo com fast-path por paths (ADR-027 original):** mais
  poderoso (skip por path antes de carregar), porém muito mais invasivo; o
  dispatcher entrega a maior parte do ganho com contrato mínimo. Os dois podem
  compor no futuro (fast-path dentro do dispatcher).
- **Reduzir a quantidade de hooks:** cada hook cobre regra rastreável
  (REGRAS-INEGOCIAVEIS) — cortar cobertura pra ganhar latência inverte a
  prioridade do produto.
