---
description: Retoma pipeline interrompido lendo `.claude/.runtime/pipeline-state-<US>.json`. Mostra onde parou, sugere proximo passo, aguarda confirmacao do usuario antes de continuar.
argument-hint: "[US-NNN]"
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash(ls:*), Bash(git status:*), Bash(mkdir:*), Bash(mv:*), Write, Task
---

# /retomar — continuar de onde parou

Comando-chave de resumability. Le pipeline state consolidado e mostra exatamente onde a sessao anterior parou + o que falta fazer.

Resolve a dor cronica de "Claude travou no meio do /feature, perdi todo o contexto".

## Etapa 1 — Identificar US

- Se `$ARGUMENTS` foi passado (ex: `/retomar US-117`): usar essa US
- Se vazio: localizar todos `.claude/.runtime/pipeline-state-*.json` ativos
  - Se 1: usar essa
  - Se 2+: listar opcoes e perguntar qual

## Etapa 2 — Ler estado

```javascript
const state = JSON.parse(fs.readFileSync('.claude/.runtime/pipeline-state-<US>.json'))
```

Verificar que o JSON tem os campos minimos esperados (`current`, `historico`). Se corrompido ou incompleto: avisar em PT-BR claro e sugerir `/painel` pra ver o estado geral do projeto.

## Etapa 3 — Apresentar contexto

Saida em PT-BR claro:

```
RETOMANDO US-117 — Performance + Visibilidade imediata

ESTADO ATUAL
Pipeline: feature (Sofia → Detetive → Rafael → Bruno → Ines → 3 auditores)
Iniciado: ha 2 dias
Ultima atividade: 16 min depois do inicio (entao foi interrompido)

ETAPAS
[ok] Sofia (gerente-produto)    14:02 → 14:05   "US criada com 7 ACs"
[ok] Detetive (investigador)    14:05 → 14:12   "Confirmou hot paths em 23 hooks"
[parou] Rafael (tech-lead)      14:12 → ???     "Aguardando ADR-027 ser escrito"

FALTAM:
- Rafael termina ADR-027
- Bruno (dev-senior) implementa 18 tasks
- Ines (revisor) audita diff
- Caio + Julia + Pedro (3 auditores em paralelo)
- Checkpoint final

HANDOFF PAYLOADS DISPONIVEIS
- sofia-para-detetive: 12 ACs destacadas, confianca alta
- detetive-para-rafael: 5 arquivos relevantes, 3 hipoteses descartadas, confianca alta

CONTINUAR DE ONDE PAROU?
  [S] Sim - chamar Rafael (tech-lead) com payload do Detetive
  [N] Nao - quero reorientar
  [R] Resetar - apagar pipeline-state e comecar de novo (perde markers, retem documentos)
```

## Etapa 4 — Acao baseada na resposta

### S — Continuar

Chamar via `Task` o proximo agente declarado em `state.current`. Injetar handoff payload anterior no prompt. Marker `<agente>-running-<ts>` criado em `.claude/.runtime/`.

### N — Reorientar

Apresentar opcoes:
- Trocar de US (se ha outras pipelines parados)
- Revisar AC ou non-goal antes de continuar
- Pausar definitivamente (status: blocked) + nota explicando

### R — Resetar

CONFIRMACAO DUPLA exigida:
```
ATENCAO: voce vai apagar pipeline-state-US-117.json.
- Markers ja escritos sao mantidos
- Documentos gerados (PRD, ADR, etc.) sao mantidos
- Mas o framework vai esquecer onde estava

Confirmar reset? (digitar "resetar" pra confirmar)
```

So apos confirmar literalmente "resetar", move o arquivo pra `.claude/.runtime/.history/` (nunca apaga de fato — so tira de circulacao).

## Etapa 5 — Recuperacao apos sessao interrompida sem fechamento limpo

O hook `session-snapshot.js` (PreCompact + SessionEnd) grava `.claude/.runtime/session-snapshot.md` (narrativo) e `.claude/.runtime/session-state.json` (machine-readable) a cada fechamento de sessao. O hook `session-snapshot-restore.js` (SessionStart) le esses arquivos na proxima sessao e recria os markers ativos automaticamente.

Se `/retomar` encontra um `pipeline-state-<US>.json` com `current` apontando pra um agente, mas `git status -s` mostra mudancas nao commitadas E o `session-snapshot.md` mais recente e mais antigo que o esperado pro fluxo em curso, trate como sessao interrompida sem fechamento limpo:

```
RETOMANDO US-117 — SESSAO ANTERIOR PARECE TER SIDO INTERROMPIDA

Sinais encontrados:
- pipeline-state aponta pra Rafael (tech-lead), mas nao ha marker `rafael-running-*` nem `rafael-done-*` recente
- `git status -s` mostra 2 arquivo(s) modificado(s) nao commitados
- Ultimo snapshot de sessao: ha mais tempo do que o esperado pro fluxo em curso

INVESTIGANDO ARTEFATOS
- Arquivos modificados nao-commitados (`git status -s`):
    M src/index.ts (24 linhas alteradas)
    A new-feature.ts (novo)
- Tasks declaradas em US-117: 18; completadas: 5 (T-117-001 a T-117-005)

CONTEXTO RECUPERADO (via session-snapshot.md)
- Sofia destacou AC-117-1, AC-117-2, AC-117-7 como prioridade
- Detetive identificou que arquivos em src/ precisam de revisao

CONTINUAR DA TASK T-117-006?
  [S] Sim - continuar de onde parou (T-117-006)
  [V] Voltar - retomar T-117-005 pra revalidar
  [R] Resetar
```

## Limites

- **NUNCA continua sem confirmacao explicita do usuario.** Estado pode estar inconsistente entre interrupcao e retomada.
- **NUNCA reseta sem confirmacao dupla.** Reset perde rastro (mesmo que o arquivo va pra `.history/` e nao seja apagado de fato).
- **Sempre cita evidencias** (paths, markers, timestamps).
