---
tipo: story
id: US-117
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: []
aprovacoes: []
---

# US-117 — Onda 1: Performance + Visibilidade imediata

> Story file gerado a partir da decomposicao do EP-003. Vive em disco, nao na conversa (INV-001).
>
> **Por que essa story primeiro:** alto ROI imediato (corta 23 hooks pra ~5 por Edit) + baixo risco (so adiciona — nao mexe em comportamento de hook existente) + desbloqueia decisoes informadas nas ondas seguintes (telemetria local fica disponivel pro meta-cetico em US-121).

---

## Como, quero, para

**Como** Roldao operando o framework v2.0.0 hoje,
**quero** sentir o framework mais rapido em cada Edit/Write E ver o que esta acontecendo em tempo real (custo da sessao, agente ativo, semaforo de saude do projeto, traducao automatica de erro pra PT-BR)
**para** parar de adivinhar se o Claude travou ou esta pensando, parar de pagar 700-1800ms de overhead em cada operacao de arquivo, e parar de receber stack trace cru sem traducao.

---

## Criterios de aceitacao

> Cada AC e independentemente testavel. Verificavel por comando.

- **AC-117-1** — `.claude/hooks/_lib.js` ganha funcao `shouldSkipForPath(toolInput, hookId)` que le tabela declarada em `.claude/hooks/MANIFEST.json`. Hooks que nao sao relevantes pro path saem com exit 0 em < 5ms. Edit em `README.md` aciona ≤ 5 hooks (era 23). **Verificavel:** `ROLDAO_HOOKS_VERBOSE=1 echo test > README.md` mostra contagem de hooks executados ≤ 5.

- **AC-117-2** — Frontmatter `// @hook-meta {...}` adicionado em todos os 44 hooks existentes + script `tools/gerar-manifest-hooks.js` gera `.claude/hooks/MANIFEST.json`. Manifest contem `{id, priority, paths_skip[], events[], blocks, rule_id}` por hook. **Verificavel:** `node tools/gerar-manifest-hooks.js && cat .claude/hooks/MANIFEST.json | jq '.hooks | length'` retorna >= 44.

- **AC-117-3** — `.claude/hooks/hook-stats-recorder.js` (PostToolUse) anexa `{hook_id, decision, ts, projeto_hash, duration_ms}` em `.claude/.runtime/hook-stats.jsonl`. Arquivo cresce no uso real. `.gitignore` cobre o arquivo. **Verificavel:** rodar 10 Edits e ver `wc -l .claude/.runtime/hook-stats.jsonl` retornar >= 10.

- **AC-117-4** — Comando `/avisos` novo em `.claude/commands/avisos.md` le `.claude/.runtime/warnings.jsonl` (criado por `_lib.js.emitSoftWarning()`) e mostra ultimos 20 traduzidos em PT-BR claro. **Verificavel:** forcar 3 soft warnings LGPD e rodar `/avisos` — saida lista os 3 em ordem cronologica reversa.

- **AC-117-5** — Comando `/saude` novo gera semaforo binario (verde/amarelo/vermelho) em 5 dimensoes: GIT, TESTES, STORIES, SEGURANCA, LGPD. Sem prosa. **Verificavel:** `/saude` cabe em ≤ 12 linhas de output ASCII e mostra cor por dimensao.

- **AC-117-6** — `metrics.jsonl` virou fonte unica de custo. Hook `SubagentStop` grava `{agente, duracao_ms, tokens_in, tokens_out, custo_usd_estimado, modelo}`. Status line le do `metrics.jsonl`. **Verificavel:** status line mostra `$X.YZ` apos sessao com 1+ Task chamado.

- **AC-117-7** — Hook `translate-errors-ptbr.js` (PostToolUse em qualquer tool com `is_error: true`) intercepta stderr, consulta `templates/dicionario-erros-ptbr.json` (criado), injeta versao PT-BR ANTES do erro tecnico. Erro tecnico fica em bloco colapsado. **Verificavel:** forcar `ENOENT` em `cat /nao-existe` e ver "arquivo nao encontrado" antes do stack trace.

---

## Non-goals (INV-003)

O que esta story NAO faz:

- **NAO mexer em comportamento de hook existente.** So adiciona metadado (`@hook-meta`) + fast-path. Nenhum hook deixa de bloquear cenario que ja bloqueava.
- **NAO migrar markers `.claude/.runtime/*` pra formato novo.** Fica pra US-119 (Onda 3).
- **NAO acumular telemetria cross-project.** Fica pra US-118 (Onda 2 — `~/.claude/memory-cross-project/`).
- **NAO implementar meta-cetico ainda.** Fica pra US-121. Apenas geramos `hook-stats.jsonl` pra ele consumir depois.
- **NAO criar novos hooks bloqueadores nesta story.** Hooks novos sao soft warning (PostToolUse) ou utilitarios (gerador de manifest). Hooks bloqueadores ficam pra US-122.
- **NAO substituir status line existente do framework v2.0.0.** Apenas estender com leitura do `metrics.jsonl`.

---

## Contexto tecnico

_(O Investigador preenche depois do `/feature` etapa 2. Nao inventar antes.)_

- **Arquivos afetados (estimativa do gerente-produto, sujeita a confirmacao do Investigador):**
  - `.claude/hooks/_lib.js` — adicionar `shouldSkipForPath()` + `emitSoftWarning()`
  - `.claude/hooks/*.js` (44 arquivos) — adicionar frontmatter `// @hook-meta {...}` em cada
  - `.claude/hooks/MANIFEST.json` (novo) — gerado por script
  - `.claude/hooks/hook-stats-recorder.js` (novo)
  - `.claude/hooks/translate-errors-ptbr.js` (novo)
  - `.claude/commands/avisos.md` (novo)
  - `.claude/commands/saude.md` (novo)
  - `.claude/statusline.js` — estender pra ler `metrics.jsonl`
  - `templates/dicionario-erros-ptbr.json` (novo)
  - `tools/gerar-manifest-hooks.js` (novo)
  - `.claude/settings.json` — registrar 2 hooks novos
  - `.gitignore` — adicionar `.claude/.runtime/hook-stats.jsonl`, `warnings.jsonl`
- **Entidades/handlers:** PostToolUse hooks; SessionStart adicionado pra gerar manifest se nao existir
- **Migrations necessarias:** nao (este e o framework — sem banco)
- **ADRs relacionados:**
  - ADR-027 (Manifest de hook + fast-path) — **bloqueante, escrever antes de codar**
  - ADR-023 (Framework aprendiz — telemetria local opt-in) — bloqueante
- **Hooks existentes que precisam de cuidado especial:**
  - `block-destructive.js` — NAO pode ganhar fast-path por path (precisa rodar sempre)
  - `secrets-scanner.js` — NAO pode ganhar fast-path por path (precisa rodar sempre)
  - `anti-mascaramento.js` — pode ganhar `paths_skip: ['docs/analises/**', 'docs/auditorias/**', 'templates/**.example']`

---

## Tasks

> Cada task vira 1 commit atomico citando o ID. Ordem recomendada respeita dependencias internas.

- [ ] **T-117-001** — Escrever ADR-027 (Manifest de hook + fast-path). Aceito antes de T-117-002.
- [ ] **T-117-002** — Escrever ADR-023 (Framework Aprendiz — telemetria local). Aceito antes de T-117-006.
- [ ] **T-117-003** — Estender `.claude/hooks/_lib.js` com `shouldSkipForPath(toolInput, hookId)`. Le `MANIFEST.json` (fallback: roda hook normalmente). Adicionar `emitSoftWarning(hookId, msg, severidade)` que faz append em `.claude/.runtime/warnings.jsonl`.
- [ ] **T-117-004** — Criar `tools/gerar-manifest-hooks.js`. Le frontmatter `// @hook-meta {...}` de cada `.claude/hooks/*.js` (excluindo `_lib.js`) e gera `.claude/hooks/MANIFEST.json`. Idempotente.
- [ ] **T-117-005** — Adicionar frontmatter `// @hook-meta {...}` nos 44 hooks existentes. Lote de 5-10 commits separados por grupo tematico (destrutivos, secrets, mascaramento, fiscal, LGPD, pipeline-completion, etc.). NAO mudar comportamento — so adicionar metadado.
- [ ] **T-117-006** — Criar `.claude/hooks/hook-stats-recorder.js` (PostToolUse). Registra no `hook-stats.jsonl`. Inclui rotacao automatica em 30MB OU 90 dias.
- [ ] **T-117-007** — Criar `templates/dicionario-erros-ptbr.json` com mapeamento inicial: `ENOENT`, `EACCES`, `EPIPE`, `EADDRINUSE`, `ENOTDIR`, `EISDIR`, `EEXIST`, `ECONNREFUSED`, `EAI_AGAIN`, primeiros stack traces Node.
- [ ] **T-117-008** — Criar `.claude/hooks/translate-errors-ptbr.js` (PostToolUse com `is_error: true`). Le dicionario, injeta PT-BR antes do erro tecnico em bloco colapsado.
- [ ] **T-117-009** — Estender `.claude/statusline.js` pra ler `metrics.jsonl` (sem mudar comportamento atual — apenas adicionar custo USD ao output). Compat backward: se metrics.jsonl ausente, comporta como hoje.
- [ ] **T-117-010** — Estender `SubagentStop` hook existente OU criar `metrics-recorder.js` que grava `{agente, duracao_ms, tokens_in, tokens_out, custo_usd_estimado, modelo}` no `metrics.jsonl`.
- [ ] **T-117-011** — Criar `.claude/commands/avisos.md`. Le `.claude/.runtime/warnings.jsonl`, mostra ultimos 20 traduzidos em PT-BR.
- [ ] **T-117-012** — Criar `.claude/commands/saude.md`. Le git status + ultimo teste + stories em `docs/stories/` + npm audit + escaneamento LGPD basico. Gera 5 linhas com semaforo verde/amarelo/vermelho.
- [ ] **T-117-013** — Atualizar `.claude/settings.json` registrando 2 hooks novos (`hook-stats-recorder.js`, `translate-errors-ptbr.js`).
- [ ] **T-117-014** — Atualizar `.gitignore` cobrindo `.claude/.runtime/hook-stats.jsonl`, `.claude/.runtime/warnings.jsonl`, `.claude/.runtime/metrics-cache/`.
- [ ] **T-117-015** — Criar testes em `__tests__/`:
  - `__tests__/lib-should-skip-for-path.test.js` (cobre AC-117-1)
  - `__tests__/gerar-manifest-hooks.test.js` (cobre AC-117-2)
  - `__tests__/hook-stats-recorder.test.js` (cobre AC-117-3)
  - `__tests__/comando-avisos.test.js` (cobre AC-117-4)
  - `__tests__/comando-saude.test.js` (cobre AC-117-5)
  - `__tests__/statusline-com-metrics.test.js` (cobre AC-117-6)
  - `__tests__/translate-errors-ptbr.test.js` (cobre AC-117-7)
- [ ] **T-117-016** — Atualizar `.claude/rules/roldao-method.md` documentando os 2 hooks novos.
- [ ] **T-117-017** — Atualizar `AGENTS.md` §9 mencionando o novo padrao `// @hook-meta` (sem listar todos os hooks — link pra MANIFEST.json).
- [ ] **T-117-018** — Atualizar `docs/EXTENDENDO.md` com instrucoes "como adicionar hook novo na v3" (incluir frontmatter `@hook-meta`).

---

## Testes esperados

- **Unitario:**
  - `shouldSkipForPath()` em `_lib.js`: 3 casos por hook (deve pular, nao deve pular, manifest ausente=fallback)
  - `emitSoftWarning()`: append funciona, rotacao funciona
  - `gerar-manifest-hooks.js`: lendo 1 hook fake, lendo 44 hooks, hook sem `@hook-meta` (warning)
  - Dicionario PT-BR: 10 codigos de erro mapeiam corretamente
- **Integracao:**
  - Editar README com `ROLDAO_HOOKS_VERBOSE=1` — saida lista ≤ 5 hooks (AC-117-1)
  - Forcar 3 soft warnings via teste — rodar `/avisos` — saida tem 3 entradas
  - Rodar `/saude` em projeto sandbox limpo — saida tem 5 dimensoes
  - Rodar `cat /nao-existe` via Bash — PT-BR aparece antes do `ENOENT` cru
- **Regressao (cobertura crucial):**
  - Todos os 35 hooks bloqueadores existentes continuam bloqueando cenarios que bloqueavam na v2.0.0 (suite `__tests__/regressao-v2-hooks.test.js`)
  - Status line continua mostrando branch+versao+modelo+agente quando `metrics.jsonl` ausente
  - Commands existentes (28) continuam funcionando

---

## Regulamentacao BR aplicavel

- **LGPD-001 (base legal):** telemetria local-first nao coleta dado pessoal — apenas hash do projeto (SHA-256 do path absoluto), ID de regra, timestamp. Nao se aplica.
- **INV-AGENT-005:** preservada. Nenhuma acao automatica de release/publish nesta story.
- **INV-001:** ADR-023 e ADR-027 escritos antes do codigo. Doc gera codigo, nao o contrario.

---

## Status

- [ ] draft
- [ ] aprovada (gerente-produto OK)
- [ ] em implementacao (dev-senior em acao)
- [ ] revisao (revisor avaliando)
- [ ] entregue (auditores OK ou dispensados)

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 1) |

---

## Dev Agent Record (preencher ao implementar)

_(Preenche o agente que rodar `/feature US-117`.)_

- **Agente principal:** _(pendente — dev-senior — Bruno)_
- **Modelo usado:** _(pendente)_
- **Custo aproximado:** _(pendente)_
- **Tempo total:** _(pendente)_
- **Arquivos tocados:** _(pendente — `git diff --stat` apos T-117-018)_
- **Tasks concluidas:** _(pendente)_
- **Hooks que bloquearam:** _(pendente — provavel: `require-investigador-before-fix.js` antes de T-117-003 pedindo investigador rodar primeiro pra confirmar paths_skip seguros)_
- **Decisoes fora do PRD:** _(se houver, justificar — vira ADR posterior)_
- **Skills invocadas:** _(provavel: `gerar-adr-pt-br` em T-117-001 e T-117-002)_
- **Subagentes invocados:** _(planejado: investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(pendente)_

### Debug log (opcional)

_(Espaco pro agente registrar trilha de decisoes — util pra retro e pra reproduzir o caso depois.)_

```
2026-05-26 HH:MM — gerente-produto criou US-117 a partir do PRD-004 Onda 1
```
