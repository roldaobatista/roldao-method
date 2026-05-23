---
id: ADR-009
titulo: Lifecycle de hooks Claude Code — bloqueio duro vs soft warning vs automacao
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-009 — Lifecycle de hooks Claude Code

## Contexto

Claude Code expoe pontos de extensao via hooks: PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, SubagentStop, PreCompact, UserPromptSubmit, Notification. Cada um tem semantica de retorno diferente: PreToolUse bloqueia via `exit 2`; PostToolUse/Stop bloqueia via JSON `{"decision":"block"}`; SessionStart **nao** bloqueia (so contextualiza). Tratar todos igual leva a hooks que "parecem bloquear" mas nao bloqueiam.

## Decisao

Hooks sao classificados em 5 categorias com regras claras:

### 1. Bloqueadores duros (`exit 2`)
PreToolUse que recusa a operacao. Exemplo: `block-destructive.sh` recusa `rm -rf`. Exit code 2 e o sinal claro pro harness rejeitar.

23 hooks no core.

### 2. Bloqueadores JSON (`decision:block`)
PostToolUse/Stop que rejeita a resposta gerada. Exemplo: `block-jargon-pt-br.sh` rejeita resposta com jargao sem traducao. Saida: JSON em stdout `{"decision":"block","reason":"..."}`.

3 hooks no core.

### 3. Soft warnings (`exit 0` + mensagem em stderr)
Lembrete sem bloqueio. Exemplo: `lgpd-base-legal-reminder.sh` avisa que codigo toca CPF/email sem ADR de base legal. Decisao de PRODUTO, nao mecanica.

2 hooks no core.

### 4. Lifecycle / automacao
Hooks que rodam em momento especifico do ciclo, sem bloquear. Exemplos:
- `auto-format-on-write.sh` (PostToolUse) — roda prettier/eslint/ruff apos escrita.
- `session-snapshot.sh` (PreCompact + SessionEnd) — grava snapshot pra retomada.
- `session-snapshot-restore.sh` (SessionStart) — le snapshot e contextualiza.
- `subagent-handoff-audit.sh` (SubagentStop) — valida artefato em disco do agente.
- `context-budget.sh` (UserPromptSubmit) — avisa se AGENTS.md/CLAUDE.md estouram limite.

5 hooks no core.

### 5. Utilitarios internos (`_<nome>.sh`)
Nao sao hooks ativos — sao sourcedos por outros hooks. `_lib.sh` (sanitizacao, hash de sessao, regex de secrets compartilhada). `_test-runner.sh` (suite de testes dos hooks).

2 hooks no core.

**Total core:** 23 + 3 + 2 + 5 + 2 = 35 arquivos em `.claude/hooks/`.

## Consequencias

**Positivas:**
- Documentacao clara — `templates/.claude/rules/roldao-method.md` lista cada hook com exit code esperado.
- Validador `tools/validar-cobertura-hooks.js` exige caso de teste pra cada bloqueador (duro + JSON).
- Soft warning nunca finge ser bloqueio — usuario sabe que decisao final e dele.
- Lifecycle hooks nao se confundem com regras (sao automacao).

**Negativas:**
- Convencao precisa ser ensinada (`docs/EXTENDENDO.md` cobre).
- Hook novo precisa declarar categoria — esquecer leva a "parece bloquear mas nao" (ex: `mcp-validator.sh` rodando em SessionStart).

## Alternativas descartadas

- **So bloqueio duro:** descartado. Soft warning cobre casos legitimos de decisao humana (LGPD base legal nao e auto-decidivel por hook).
- **JSON em todo bloqueio:** descartado. PreToolUse com `exit 2` e mais simples e o harness ja lida.

## Non-goals

- **Não cria mecanismo próprio de hook** — depende dos lifecycle events do Claude Code (se a API mudar, hooks mudam).
- **Não cobre IDEs sem suporte de hook** (Cursor/Windsurf/etc.) — ver ADR-006.
- **Não tenta validar saída do LLM em tempo real** — LLM-as-judge é outro escopo, hooks são checks mecânicos.

## Como aplicar

- Hook novo declara no comentario superior: `# Hook <tipo>, matcher: <X>`.
- Adicionar linha em `templates/.claude/rules/roldao-method.md` (tabela de bloqueios duros).
- Caso de teste em `_test-runner.sh` (obrigatorio pra bloqueadores duro/JSON).

## Relacionado

- [[ADR-002]] hooks bash + perl (escolha de stack).
- [[ADR-005]] dogfooding (hooks rodam no proprio repositorio).
