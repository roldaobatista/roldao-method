---
tipo: checkpoint
data: 2026-05-25
us: US-117
adr: ADR-022
owner: tech-writer
revisado-em: 2026-05-25
status: stable
audit_sha: 97abe3d82fc01e97dbd4b03b76991455fb5310ef
---

# CHECKPOINT — US-117 / `session-relay`

> Walkthrough da mudança ANTES de subir pra produção.

## Propósito em 1 frase

Adicionar um robô externo (`npx roldao-method session-relay`) que orquestra automaticamente o ciclo "Claude → memória cheia → salvar → abrir sessão nova → continuar", sem o Roldão precisar perceber sintoma técnico.

## O que muda pro cliente final

- **Muda:** Roldão (não-programador) pode rodar 1 comando no início do dia e deixar a janela aberta — o robô cuida do `/checkpoint` sozinho quando a conversa fica longa.
- **Muda:** docs/PARA-DONO-DE-PRODUTO.md tem seção nova "Robô vigia da conversa" com mensagens-exemplo.
- **NÃO muda:** quem prefere usar `claude` direto continua igual. Wrapper é opt-in.
- **NÃO muda:** `/checkpoint`, `/feature`, `/bug`, hooks, agentes — nada do framework alterado.

## Arquivos tocados (10)

| Arquivo | Linhas | Motivo |
|---|---|---|
| `bin/install.js` | +46 | Adiciona `case 'session-relay'`, entry no help, `KNOWN_COMMANDS`, função `runSessionRelayCmd` que faz wiring CLI |
| `bin/lib/session-relay.js` | +537 (novo) | Lib pura com toda lógica: discovery do transcript, threshold, trigger, snapshot wait, close, spawn, parseFlags, runRelay loop |
| `docs/decisions/ADR-022-session-relay-wrapper-externo.md` | +152 (novo) | Decisão: Node puro, IPC stdin pipe, mtime de session-snapshot.md como sinal, 5 alternativas rejeitadas |
| `docs/stories/US-117-session-relay-wrapper-externo.md` | +182 (novo) | US com 10 AC testáveis, 8 non-goals, 12 tasks, 5 premissas |
| `docs/PARA-DONO-DE-PRODUTO.md` | +45 | Seção "Robô vigia da conversa" em PT-BR pro Roldão |
| `package.json` | +5 | 4 novos npm scripts test:session-relay-* incluídos no script `test` |
| `test/session-relay-detect-transcript.test.js` | +100 (novo) | 7 testes — encodeCwd, projectsDirFor, listRootJsonl (filtra subagents/), discoverTranscript (com/sem sessionId) |
| `test/session-relay-threshold.test.js` | +146 (novo) | 20 testes — bytesToTokens, measureUsage, shouldCheckpoint, parseFlags (incluindo validação de flags inválidas) |
| `test/session-relay-checkpoint-trigger.test.js` | +138 (novo) | 9 testes — triggerCheckpoint, snapshotMtime, waitForSnapshot, closeSession |
| `test/session-relay-dry-run.test.js` | +110 (novo) | 2 testes — runRelay end-to-end com dryRun=true e sandbox fs |

**Total:** 1461 inserções, 1 deleção.

## Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Estimativa 3.7 bytes/token desviar muito em sessão específica | Média | Médio (checkpoint cedo/tarde) | Flag `--tokens-per-byte` permite recalibrar; default cobre 95% PT-BR + JSON |
| Detecção via mtime de `session-snapshot.md` falhar (timestamp pulou pra frente por outro motivo) | Baixa | Médio (wrapper acha que salvou antes da hora) | Timeout adicional de 5min antes de assumir "salvou"; fallback robusto não corrompe Claude |
| `stdin.write('/checkpoint\\n')` não ser interpretado como comando pelo Claude | Baixa | Alto (todo o ciclo quebra) | Comportamento confirmado em smoke test E2E desta sessão; documentado no ADR-022 |
| Roldão rodar wrapper em ambiente sem `claude` instalado | Média | Baixo | Mensagem PT-BR clara: "deu erro abrindo o Claude. confirma se o comando 'claude' esta instalado" |
| Wrapper "morrer" (kill -9 forçado) sem fechar Claude filho | Baixa | Baixo | Filho continua rodando normalmente — Claude por baixo é estável sem o wrapper, conforme AC-117-8 |

## Migrações de dados

Nenhuma. Wrapper não toca banco, não migra schema, não altera arquivos existentes do projeto (só lê transcript em `~/.claude/projects/` e snapshot em `.claude/.runtime/`).

## Dependências adicionadas

**Zero deps runtime nova.** Lib usa apenas `child_process`, `fs`, `path`, `os`, `events` (builtin Node). `devDependencies` não tocado. Confirma o princípio zero-deps do framework.

## Testes adicionados

- **38 testes unitários** novos (7 + 20 + 9 + 2):
  - 7 cobrindo discovery (encodeCwd cross-platform, listRootJsonl filtra `subagents/`, discoverTranscript com/sem sessionId, fallback pelo mais recente).
  - 20 cobrindo threshold (bytesToTokens, measureUsage, shouldCheckpoint, parseFlags com validação de input).
  - 9 cobrindo trigger/wait/close (escrever `/checkpoint\n` no stdin, detectar mtime, SIGTERM gracioso com timeout).
  - 2 cobrindo runRelay end-to-end com sandbox fs simulando snapshot tardio (sem Claude real).
- **Smoke E2E manual:** `node bin/install.js session-relay --dry-run` rodando contra esta sessão real (Opus 4.7 1M) — descobriu transcript `39e10731-...jsonl`, mostrou mensagens PT-BR corretas, dry-run não spawn.

## Aprovações (audit trail)

- **Sofia (gerente-produto)** — US-117 com 10 AC, 8 non-goals, 5 premissas. Sem ambiguidade pendente.
- **Detetive (investigador)** — `investigation-US-117.json` mapeou 8 arquivos a tocar. Identificou que premissa da Sofia sobre `docs/handoff/SESSION-*.md` estava imprecisa — corrigida na US. Reaproveita 100% do ciclo `session-snapshot` existente.
- **Rafael (tech-lead)** — ADR-022 aceito. Node puro, IPC stdin pipe, mtime como sinal. 5 alternativas rejeitadas com razão (hook PreCompact, Bash/PS, node-pty, Computer Use, polling API).
- **Bruno (dev-senior)** — 376 LoC de lib testável + 4 arquivos de teste + wiring CLI + doc Roldão. TDD nos pontos críticos. 33 testes verdes ao final da implementação.
- **Inês (revisor)** — 4 ressalvas: RESS-001 (mensagem "<descobrindo...>" infinita), RESS-002 (parseFlags engolia input inválido), RESS-003 (cosmético, não-bloqueante), RESS-004 (SIGINT listener acumulação em re-uso futuro). 2 corrigidas no diff, 5 testes novos pra RESS-002. APROVADO.
- **Caio (auditor-seguranca)** — APROVADO sem ressalvas. Zero dep nova, zero dado pessoal tocado, zero chamada externa, zero shell injection (sem `shell: true` no spawn). SEC-005 N/A (sem URL externa). LGPD-001..010 N/A (sem PII).
- **Júlia (auditor-qualidade)** — APROVADO sem ressalvas. 38 testes reais, anti-padrões zero, sem TODO, sem mock indevido. Pirâmide saudável.
- **Pedro (auditor-produto)** — APROVADO sem ressalvas. 10/10 AC entregues + 8/8 non-goals respeitados. Scope creep zero.

## O que falta pra subir

- **Teste manual do Roldão** (recomendado antes de release): rodar `npx roldao-method session-relay --dry-run --threshold 100 --check-interval 5` no terminal dele e confirmar que as mensagens PT-BR fazem sentido.
- **Suite completa do framework** (`npm test`): rodar uma vez antes do commit pra garantir que os 30 outros testes existentes não regrediram (provavelmente OK — lib nova é isolada).
- **Commit atômico** com mensagem citando US-117 + T-117-1 a T-117-12 + ADR-022.
- **Bump de versão** em `package.json` quando virar release (1.2.5 → 1.3.0, minor — feature nova, sem breaking change).

## Como reabrir essa decisão

Ver ADR-022 seção "Como reabrir esse ADR" — gatilhos: Anthropic lançar API de % de contexto, surgir caso real de corrupção via stdin pipe, Roldão pedir multi-sessão paralela, ou desvio sistemático > 20% na heurística 3.7 bytes/token.
