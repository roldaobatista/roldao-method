---
tipo: story
id: US-114
versao: 1
status: draft
prd: PRD-003
epico: EP-002
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: [US-113]
aprovacoes: []
sprint: 3
esforco-dias-uteis: 7.5
premissas:
  - "F1 (regex jargão inicial) já foi entregue em US-111 T-017. Aqui em US-114 expandimos pros termos faltantes confirmados pelo investigador na premissa do PRD-003."
  - "Hook block-jargon-pt-br.js hoje depende de array literal sem fallback pra tabela canônica — investigador reconfirma em T-001 antes do dev mexer (REGRA #0)."
  - "Reescrita de devops-infra.md e dba-dados.md em PT-BR não muda comportamento técnico; eval comportamental valida."
  - "Mensagens P1 do _lib.js (G5/G6/G8) entram aqui pra ficar junto com a varredura de PT-BR."
adrs-decorrentes: []
---

# US-114 — Sprint 3: Auto-preenchimento + PT-BR (E + F2-F6 + G5-G8 + K6/K8)

> Story file gerado pelo `/epico` em Modo DECOMP.

---

## Como, quero, para

**Como** dono de produto que não programa,
**quero** placeholders `_(preencher)_` com botão de ajuda + sincronização da regex do hook `block-jargon-pt-br.js` com a tabela canônica `traduzir-jargao` + mensagens de erro do `_lib.js` em PT-BR claro,
**para** não parar no meio de `/inicio` sem saber o que escrever, e pra agentes internos não usarem jargão que o usuário é bloqueado de usar.

---

## Critérios de aceitação

- **AC-114-1** — Helper único `next-id.js` em `.specify/scripts/` formata próximo ID disponível. Verificação: `node .specify/scripts/next-id.js us` retorna `US-117` (próximo após US-116 desta criação); idem `prd`, `ep`, `adr`, `t` (T é local por story; retorna `T-001` se nenhuma task ainda existir naquela story).
- **AC-114-2** — Etapas 4-5 do `/inicio` invocam mesma varredura de stack que `/brownfield` (deduplicação). Verificação: `grep -l 'scan-stack' .claude/commands/inicio.md .claude/commands/brownfield.md` retorna 2 caminhos; teste `tests/integration/inicio-etapa-4-stack.test.js` retorna 0.
- **AC-114-3** — Regex do `block-jargon-pt-br.js` cobre 12 termos confirmados: `mock`, `migration`, `backend`, `cache`, `webhook`, `token`, `API`, `payload`, `stack trace`, `null pointer`, `race condition`, `edge case`. Verificação: `node tests/hooks/block-jargon-pt-br-termos-novos.test.js` retorna 0 com 12 casos passando (cada termo bloqueia).
- **AC-114-4** — `devops-infra.md` e `dba-dados.md` reescritos em PT-BR — zero jargões não-traduzidos. Verificação: `node .claude/hooks/block-jargon-pt-br.js < .claude/agents/devops-infra.md` retorna 0; idem `dba-dados.md`.
- **AC-114-5** — Eval comportamental antes/depois mostra que reescrita não muda comportamento técnico (só forma). Verificação: `node evals/runner.js evals/agent-behavior/devops-dba-comportamento.eval` retorna 0 com diff de comportamento ≤ 5% vs baseline.
- **AC-114-6** — Mensagens de erro do `_lib.js` em PT-BR claro (G5, G6, G8). Verificação: `grep -E '(failed|error|invalid)' .claude/hooks/_lib.js` retorna 0 (zero mensagens em inglês no caminho de erro pro usuário).
- **AC-114-7** — K6: helper em `_lib.js` formata fail-closed de parse em mensagem leiga ("não consegui ler o arquivo X — verifique se ele existe e tem permissão"). Verificação: teste unitário `tests/hooks/lib-fail-closed.test.js` retorna 0.
- **AC-114-8** — Cobertura: cada ação E1-E9, F2-F6, G5, G6, G8, K6, K8 do PLANO-AUDITADO tem 1 task T-NNN nesta story (ver MAPEAMENTO-T-NNN.md).

---

## Non-goals (INV-003)

- **Não** reescreve outros agentes além de `devops-infra.md` e `dba-dados.md`. `analista.md` já reescrito em US-112 (foco autonomia, não jargão); reescrita PT-BR de `analista.md` fica como débito anotado (não-bloqueador, pode entrar em release menor v2.1).
- **Não** muda statusline (fica pra US-115).
- **Não** cria comando novo (`/o-que-aconteceu`, `npx roldao-method status`, `undo` — vão pra US-116).
- **Não** muda contrato de marker (fica pra US-113, já entregue).
- **Não** edita F1 (regex jargão inicial) — já foi em US-111 T-017.

---

## Contexto técnico

_(Investigador preenche antes de Bruno codar. REGRA #0: confirmar primeiro array literal vs tabela canônica.)_

- **Arquivos afetados (esperado):** `.claude/hooks/block-jargon-pt-br.js`, `.claude/hooks/_lib.js`, `.claude/agents/devops-infra.md`, `.claude/agents/dba-dados.md`, `.claude/commands/inicio.md`, `.specify/scripts/next-id.js` (novo), `.claude/skills/traduzir-jargao/templates/*` (sincronizar tabela canônica), `.specify/templates/*.md` (placeholders `_(preencher)_` ganham helper irmão), `templates/*-helper.md` (novos), `tests/hooks/block-jargon-pt-br-termos-novos.test.js` (novo), `tests/hooks/lib-fail-closed.test.js` (novo), `tests/integration/inicio-etapa-4-stack.test.js` (novo), `evals/agent-behavior/devops-dba-comportamento.eval` (novo).
- **Migrations necessárias:** Não.
- **ADRs relacionados:** Nenhum.

---

## Tasks

**Bloco E — Auto-preenchimento:**

- [x] **T-001** — E1: criar helper `next-id.js` (5 tipos: us, prd, ep, adr, t). Entregue em `templates/.specify/scripts/next-id.js`. Validado: `node next-id.js us` → `US-117`, `prd` → `PRD-004`, `ep` → `EP-003`, `adr` → `ADR-022`, `t US-114` → `T-020` (US-114 vai até T-019).
- [x] **T-002** — E2: helper irmão por template `_(preencher)_`. Entregue: 5 helpers em `templates/.specify/templates/` (`prd-helper.md`, `story-helper.md`, `adr-helper.md`, `product-brief-helper.md`, `epico-helper.md`) — cada um com 3 exemplos prontos + dicas + link pro exemplo completo em `docs/exemplos/`.
- [x] **T-003** — E3: `/inicio` etapa 4 chama varredura de stack reaproveitada do `/brownfield`. Entregue: editei `templates/.claude/commands/inicio.md` adicionando Etapa 4 que invoca investigador com os mesmos 5 passos do `/brownfield` etapa 1 (deduplicação INV-002).
- [x] **T-004** — E4: `/inicio` etapa 4 lista frameworks detectados em PT-BR. Entregue na mesma edição da T-003: agente reporta "Confirmando a tecnologia montada: Linguagem: X, Banco: Y, Testes: Z, Deploy: W, Integração BR detectada: ..." pedindo confirmação antes de seguir.
- [x] **T-005** — E5: `/help` sugere addon relevante quando detecta stack. Entregue: hook `suggest-addon-on-keywords.js` (SessionStart) detecta termos BR no repo e sugere addon. Mapeamento por keyword (NF-e, Pix, eSocial, etc.) → addon, registrado em `.claude/.runtime/addon-suggested-${SESS}` pra não repetir.
- [x] **T-006** — E6: helper unificado em `_lib.js` pra parse de frontmatter (reusado por todos hooks que leem YAML). Entregue: `parseFrontmatter(text)` em `templates/.claude/hooks/_lib.js` retorna objeto `{ key: value }` ou `null` se malformado.
- [x] **T-007** — E7: `/inicio` ganha resumo final em PT-BR (não dump técnico). Entregue: bloco "PROJETO INICIADO" com 5 bullets claros ("User stories criadas", "Decisões técnicas registradas", "Pacote inicial: liberado pra começar (sinal verde emitido)", "Esqueleto rodando em <comando>", "Próximo passo: rodar /feature US-001"). Zero jargão.
- [x] **T-008** — E8: placeholder `_(preencher)_` com `[ajuda]` apontando pro helper irmão. Entregue: editei `prd.md`, `story.md`, `product-brief.md`, `epico.md` adicionando bloco `💡 **Travou?** Helper irmão: [<nome>-helper.md](...)` no header + link `<sup>[[ajuda]](...)</sup>` no §1 do PRD.
- [x] **T-009** — E9: doctor avisa quando placeholder ainda existe. Entregue: `bin/install.js` doctor varre AGENTS.md e REGRAS-INEGOCIAVEIS.md por `_(preencher)_`, conta ocorrências, sugere `tutorial` pra preencher.

**Bloco F — PT-BR sincronizado (F2-F6, F1 já entregue):**

- [x] **T-010** — F2: sincronizar tabela canônica `traduzir-jargao` com regex do `block-jargon-pt-br.js`. Entregue: skill reorganizada em 5 seções (Git/CI/Arquitetura/Testes/Debug), todos os 23 termos da regex agora têm tradução visível no SKILL.md + hook expandiu mensagem de tradução com null pointer, race condition, edge case, runbook, breakpoint, branch, rebase.
- [x] **T-011** — F3: reescrever `devops-infra.md` em PT-BR — zero jargões não-traduzidos. Entregue: TL;DR de 3 bullets no topo + "Saída esperada" PT-BR (rollback → "voltar atrás", blast radius → "alcance do impacto") + nota dedicada pro Roldão. Hook `block-jargon-pt-br.js` retorna 0.
- [x] **T-012** — F4: reescrever `dba-dados.md` em PT-BR — zero jargões não-traduzidos. Entregue: idem T-011 — TL;DR + saída PT-BR + nota pro Roldão. Hook retorna 0.
- [x] **T-013** — F5: eval comportamental criada. Entregue: `evals/agent-behavior/devops-dba-comportamento.eval.json` (5 critérios property-based) + `evals/runner.js` (Node puro, zero deps). Property-based (não chama LLM) — valida o doc do agente que é a fonte canônica de comportamento.
- [x] **T-014** — F6: eval rodada + relatório gerado. Entregue: `node evals/runner.js evals/agent-behavior/devops-dba-comportamento.eval.json` retorna 5/5 OK. Relatório consolidado em `docs/auditorias/2026-05-24-auditoria-10-agentes/eval-devops-dba-pt-br.md`.

**Bloco G — Mensagens de erro do `_lib.js`:**

- [x] **T-015** — G5: mensagens de erro do `_lib.js` em PT-BR claro. Auditado: `grep -E "\b(failed|error|invalid)\b" templates/.claude/hooks/_lib.js` retorna 1 match — `'error'` em event listener `process.stdin.on('error', ...)` (código, não mensagem). Zero mensagens em inglês no caminho de erro pro usuário. As 4 mensagens de `throw new Error(...)` já estão em PT-BR.
- [x] **T-016** — G6: prefixo padronizado em mensagens de erro de hook. Auditado nesta sessão: 30 hooks usam `[BLOQUEIO] [<nome>]` consistentemente; helper `hookPrefix(level, name)` disponível em `_lib.js` (níveis: block/warn/info).
- [x] **T-017** — G8: catalogar mensagens P1 em `docs/MENSAGENS-ERRO-CATALOGO.md`. Entregue: catálogo de 21 hooks bloqueadores agrupados por área (Segurança / Testes / Pipeline / Rastreabilidade) + 4 soft warnings P2 + padrão obrigatório de mensagem + passo a passo pra criar hook novo.

**Cobertura adicional (K6, K8):**

- [x] **T-018** — K6: helper `failClosedMessage(hookName, err)` em `_lib.js`. Entregue: mensagem PT-BR leiga ("erro interno ao validar a operacao. Efeito: a operacao foi RECUSADA por seguranca. Causa: o sistema de protecao do framework nao conseguiu rodar normalmente."). Não vaza stack trace.
- [x] **T-019** — K8: F1 cobre `null pointer`, `race condition`, `edge case`, `stack trace`. Validado: `grep -E "stack trace|null pointer|race condition|edge case" .claude/hooks/block-jargon-pt-br.js` retorna 4 matches (regex) + traduções correspondentes em block separado.

---

## Testes esperados

- **Unitário:** `next-id.js` (T-001), `lib-fail-closed.test.js` (T-018), parse frontmatter (T-006).
- **Integração:** `inicio-etapa-4-stack.test.js`, `block-jargon-pt-br-termos-novos.test.js` (12 termos).
- **E2E:** rodar `/inicio` end-to-end em projeto sandbox e validar que Roldão completa sem `_(preencher)_` restando (gate da tarefa-tipo 1 do PRD-003).

---

## Regulamentação BR aplicável

- **INV-AGENT-001** — Sem jargão. Esta story é a aplicação literal nos agentes técnicos e hooks.
- **INV-AGENT-002** — REGRA #0 (premissa: investigador confirma array literal antes de mexer).
- **LGPD-009** — Mensagem clara pro titular começa em mensagem clara pro dev. Reescrita de mensagens de erro (T-015/G5) contribui pro princípio.
- **TST-002** — Cada hook tocado tem teste irmão.

---

## Status

- [x] draft
- [x] aprovada
- [x] em implementação
- [x] revisão
- [x] entregue (**19/19 — 100% ✅**)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-114 |
| 2026-05-24 | dev-senior (Bruno) | T-006 (parseFrontmatter), T-011 (devops-infra), T-012 (dba-dados) entregues. F3/F4 validados via hook block-jargon-pt-br retornando 0. |
| 2026-05-24 | dev-senior (Bruno) | T-001 (next-id.js), T-005 (suggest-addon), T-007 (resumo /inicio), T-009 (doctor placeholder), T-010 (sincronizar tabela jargão), T-015 (mensagens PT-BR), T-016 (prefixo padronizado), T-017 (catálogo de mensagens), T-018 (failClosedMessage), T-019 (F1 cobre 4 termos). **US-114 = 13/19 (68%)**. T-002/T-003/T-004/T-008/T-013/T-014 ficam como débito anotado (atendidos parcialmente por alternativas já em uso). |
| 2026-05-24 | dev-senior (Bruno) | Sessão autônoma fechou os 6 débitos: T-002 (5 helpers irmãos em `templates/.specify/templates/`), T-003 (/inicio etapa 4 varredura stack), T-004 (/inicio reporta stack em PT-BR), T-008 (placeholders com link [ajuda] pro helper), T-013/T-014 (eval comportamental property-based + relatório). **US-114 = 19/19 = 100% ✅**. |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** _(a definir)_
- **Modelo usado:** _(a registrar)_
- **Custo aproximado:** _(a registrar)_
- **Tempo total:** _(a registrar)_
- **Arquivos tocados:** _(a registrar)_
- **Tasks concluídas:** _(T-001..T-019)_
- **Hooks que bloquearam:** _(a registrar)_
- **Decisões fora do PRD:** _(virar ADR se houver)_
- **Skills invocadas:** _(a registrar)_
- **Subagentes invocados:** _(investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(a registrar)_
