---
description: Corrige bug em comportamento existente. Investigador OBRIGATÓRIO antes de qualquer mudança de código. Codifica a REGRA #0 do ROLDAO-METHOD.
argument-hint: "[descricao-do-bug]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(touch:*), Bash(mkdir:*), Bash(grep:*), Bash(git diff:*), Edit, Write, Task
---

# /bug — corrigir bug

**REGRA #0 ATIVA:** você NÃO escreve uma linha de código antes de o investigador reportar a causa raiz.

Use `$ARGUMENTS` como descrição do bug reportado.

## Etapa 1 — Investigador (OBRIGATÓRIO)

Invoque `investigador`:
- Lê estado real (banco, log, payload, console, config).
- Rastreia onde o dado é gerado, salvo e lido.
- Identifica builders/handlers duplicados se houver.
- Reporta causa raiz + ponto específico da correção.

**Não pule. Não substitua.** Se o investigador marcar `pendencias[]` no JSON com `impacto: comportamento-visivel`, **dispare `AskUserQuestion` automaticamente** usando as opções já listadas no JSON. Caso contrário, escolha o default (INV-AGENT-006). Nunca jogar pergunta de texto livre pro Roldão — sempre opções pré-formuladas pelo investigador.

**Ao terminar a investigação (MECÂNICO — destrava o hook):** o hook `require-investigador-before-fix.js` exige 2 markers + 1 JSON pra liberar Edit/Write em código de negócio em sessão de bug:

1. `bug-active-${SESSION_HASH}` — sinaliza que ESTA sessão está em fluxo `/bug` (gate de ativação do GATE 2 do hook). Sem ele o GATE 2 nunca arma e a prova mecânica vira teatro.
2. `investigator-invoked-${SESSION_HASH}` — sinaliza que o Detetive foi chamado (gate 1).
3. `investigation-<ref>.json` — JSON canônico com `lido[]` array não-vazio + `achado` ≥20 chars descrevendo causa raiz (gate 2, shape).

Sem qualquer um dos 3, dev-senior fica travado. Crie os markers ao iniciar a investigação (bug-active + investigator-invoked) e o JSON ao concluir (investigation-*.json):

```bash
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
[ -z "$SESSION_HASH" ] && SESSION_HASH=default
mkdir -p .claude/.runtime
touch ".claude/.runtime/bug-active-${SESSION_HASH}"
touch ".claude/.runtime/investigator-invoked-${SESSION_HASH}"
```

Ao concluir, o Detetive grava `.claude/.runtime/investigation-<ref>.json` (shape: ver `agents/investigador.md`). Sem esse JSON com shape válido (lido[] não-vazio, achado ≥20 chars), o GATE 2 bloqueia o dev-senior.

Só crie os markers DEPOIS que o investigador foi de fato chamado — criar antes é furar a própria REGRA #0.

## Etapa 2 — Confirmação com usuário (automática, baseada em `pendencias[]`)

Leia o JSON `.claude/.runtime/investigation-*.json` que o investigador gravou. Para cada item em `pendencias[]`:

- Se `impacto: comportamento-visivel` E `opcoes: [...]` preenchido → dispare **1 `AskUserQuestion`** consolidando todas as ambiguidades. Cada pendência vira 1 question. Opções vêm direto do JSON (não invente novas).
- Se `impacto: tecnico-interno` → escolha o default sugerido pelo investigador (`default:` no item) e marque `decidido-automaticamente: <razão>` no investigation JSON.
- Se `opcoes` faltar → o investigador errou; reinvoque pedindo opções pré-formuladas.

**Nunca pergunte de texto livre** ("pode me explicar melhor o problema?"). INV-AGENT-006: opções concretas ou default automático.

## Etapa 3 — Dev Sênior

Invoque `dev-senior` com:
- Relatório do investigador (causa raiz + ponto da correção).
- Confirmação da intenção do usuário.

Dev Sênior:
- Conserta NO PONTO RAIZ, não no sintoma.
- Adiciona teste de regressão pra esse bug.
- Commit atômico citando o bug.

## Etapa 4 — Revisor

Invoque `revisor`:
- Verifica se a correção ataca a causa raiz reportada (não só sintoma).
- Verifica teste de regressão.
- Audita anti-padrões / mascaramento.

## Saída final

```
BUG CORRIGIDO

Descrição original: <pedido do usuário>
Causa raiz (investigador): <onde estava o problema real>
Local da correção: <arquivo:linha>
Teste de regressão: <adicionado, nome do teste>
Revisor: APROVADO

O cliente vai notar: <descrição em PT-BR sem jargão>
```

## Anti-padrões PROIBIDOS neste workflow

- Mudar template/UI/CSS sem ler dados do banco primeiro.
- Tratar sintoma (ex: filtrar valor na UI) em vez de causa (ex: corrigir gravação).
- Adicionar try/catch que esconde o erro original.
- Mascarar teste antigo que ficou falhando.

Se você se pegar fazendo qualquer um desses: **pare e volte pro investigador.**
