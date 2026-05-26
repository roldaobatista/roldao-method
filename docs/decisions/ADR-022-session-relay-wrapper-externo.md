---
tipo: adr
id: ADR-022
versao: 1
status: aceito
owner: tech-lead
revisado-em: 2026-05-25
relacionado: [US-117, EP-002]
---

# ADR-022 — Wrapper externo `session-relay` em Node puro com IPC via stdin pipe

> Aceito. Implementação na US-117 (Etapa 4 do pipeline FT).

---

## Contexto

Roldão (cliente final, não-programador) precisa que o ciclo "Claude → contexto cheio → /checkpoint → nova sessão → continuar" seja automático. Hoje ele percebe o sintoma (Claude "esquecendo") e dispara o `/checkpoint` manual.

Consulta a 10 agentes `claude-code-guide` em sessão anterior confirmou 4 restrições duras:

1. Anthropic NÃO expõe API pública de `context_usage_percent` consultável por hook/subagente/wrapper. Única ground truth observável é tamanho do transcript em disco.
2. Sessões Claude Code são isoladas (sem IPC nativo entre sessões paralelas).
3. Hook do Claude Code tentando spawnar `claude --continue` recursivamente causa deadlock (o hook roda dentro da sessão que tenta abrir uma nova → trava o terminal).
4. Computer Use e Playwright não veem contexto interno do Claude — não resolvem.

Detetive (Etapa 2 do pipeline) confirmou que:
- O framework JÁ tem `session-snapshot.js` (SessionEnd/PreCompact) + `session-snapshot-restore.js` (SessionStart) que gravam/restauram estado entre sessões em `.claude/.runtime/session-snapshot.md` e `session-state.json`.
- `bin/install.js` (1949 linhas) tem switch de comandos extensível na linha 1904 — adicionar `case 'session-relay'` é o caminho natural, mantém 1 entry point (`roldao-method` / `roldao`).
- Layout do transcript: `~/.claude/projects/<cwd-encoded>/<session-uuid>.jsonl` (cwd com `:`,`\`,`/` substituídos por `-`). Subagents geram `.jsonl` em subdir `subagents/` — filtrar só nível raiz.

---

## Decisão

Implementar `session-relay` como **subcomando do CLI existente** (`bin/install.js` adiciona `case 'session-relay'`), com toda a lógica em **lib pura Node** (`bin/lib/session-relay.js`), seguindo o padrão `bin/lib/snapshot.js`, `bin/lib/tutorial.js`, `bin/lib/demo.js` que já existem.

**Stack:**

- **Linguagem:** Node puro (>=14, mesmo gate do framework). **Zero deps runtime nova.** Usa só `child_process`, `fs`, `path`, `os` builtin.
- **IPC com Claude:** `child_process.spawn('claude', args, { stdio: ['pipe', 'inherit', 'inherit'] })`. Quando atingir threshold, wrapper escreve `'/checkpoint\n'` no `child.stdin`. Sem pty, sem dep externa (`node-pty` quebra Windows sem MSVC). Confirmado: o CLI Claude Code lê stdin linha-a-linha como user prompt.
- **Detecção de fim-de-checkpoint:** mtime de `.claude/.runtime/session-snapshot.md` atualizada (SessionEnd grava esse arquivo automaticamente quando o Claude sair). Backup: novo arquivo em `docs/checkpoints/` recém-criado (mtime > T-disparo).
- **Encerramento:** `child.kill('SIGTERM')` (em Windows mapeia pra `child.kill()`). Espera até `child.exit` com timeout de 30s; se não sair, `SIGKILL` como último recurso e loga aviso PT-BR.
- **Retomada:** `spawn('claude', ['--continue'], ...)`. O hook `session-snapshot-restore.js` (já existente) lê o snapshot no `SessionStart` automaticamente.

**Cálculo de threshold:**

- Ground truth: bytes do `.jsonl` (não soma de subagents — filtrar `<uuid>.jsonl` no nível raiz do project-dir).
- Estimativa: **3.7 bytes por token** (fixo na lib; observado em transcripts PT-BR + JSON estruturado). Configurável via `--tokens-per-byte` se Roldão reclamar de falso positivo.
- Limite default: **500.000 tokens** (50% da janela 1M do Opus 4.7). Configurável via `--threshold <tokens>` ou `--threshold-percent <0-100>`.
- Intervalo de medição: **30s** default, configurável via `--check-interval <segundos>` (mínimo 5s).

**Discovery do transcript file:**

1. Wrapper recebe o `CLAUDE_SESSION_ID` do filho ao spawnar (`process.env.CLAUDE_SESSION_ID`) — o claude-code CLI gera UUID no startup e exporta.
2. Calcula `cwd-encoded` (replace `[:\\\\/]` → `-`).
3. Procura `~/.claude/projects/<cwd-encoded>/<session-id>.jsonl`.
4. Se não achar em 10s (race condition no startup), faz fallback: pega o `.jsonl` mais recentemente modificado no dir, **excluindo `subagents/`**.
5. Loga em PT-BR: "vigiando o arquivo X" (não "monitoring transcript Y").

**Resposta às 3 pendências do Detetive:**

| Pendência | Decisão Rafael | Razão |
|---|---|---|
| SIGINT (Ctrl+C) propaga ou intercepta? | **Intercepta.** Grava marker `relay-stopped-${SESSION_HASH}` em `.claude/.runtime/`, envia SIGTERM no filho, espera 10s, sai com código 0. | Roldão precisa diferenciar "wrapper morreu sozinho" de "eu apertei Ctrl+C". Marker permite reportar isso no próximo arranque. |
| tokens-per-byte fixo ou configurável? | **Fixo 3.7, configurável via `--tokens-per-byte`** | Default cobre 95% dos casos; flag é escape hatch sem complicar UX padrão. |
| `--claude-bin` configurável? | **Sim, default `claude`** | Facilita teste local (mockar com script `node test/fixtures/fake-claude.js`) e abre porta pra Roldão usar `claude-beta` no futuro. |

**Mensagens em PT-BR (tradução obrigatória — INV-AGENT-001):**

| Evento técnico | Mensagem ao Roldão |
|---|---|
| spawn do filho | "abri o Claude pra você. id da sessão: X" |
| descoberta do transcript | "vigiando a conversa (arquivo em disco: Y). vou medir a cada 30s." |
| threshold atingido | "passou da metade da memória. vou pedir pro Claude salvar tudo antes de continuar." |
| /checkpoint disparado | "pedi pro Claude salvar. aguardando ele terminar." |
| snapshot detectado | "salvou. fechando essa sessão." |
| nova sessão aberta | "abri sessão nova continuando de onde parou." |
| Ctrl+C recebido | "ok, você pediu pra parar. fechando o Claude e encerrando." |
| Claude saiu sozinho | "o Claude fechou sozinho. vou tentar abrir de novo daqui a pouco." |
| falha de spawn | "deu erro abrindo o Claude. confirma se o comando 'claude' está instalado e tenta de novo." |

---

## Consequências

### Positivas

- Mantém **zero-deps runtime** do framework. Auditoria de supply chain do Caio fica inalterada.
- Aproveita **100% do ciclo de handoff já testado** (`session-snapshot`/`restore`) — não duplica lógica.
- **1 entry point** preservado (`npx roldao-method session-relay`). Roldão não precisa decorar nome novo de binário.
- Wrapper é **opcional**: sai do caminho de quem prefere `claude` direto.
- Estratégia **stdin pipe** é portável: funciona em Windows (Git Bash, PowerShell, CMD), macOS, Linux.

### Negativas (custo aceito)

- **3.7 bytes/token é heurística.** Idiomas com mais caracteres compostos (japonês, árabe) podem desviar. Documentado no `--tokens-per-byte` como escape.
- **stdin pipe não emula 100% do TTY.** Comportamento de cursor/ANSI no Claude pode mudar levemente quando rodado sob o wrapper. Aceitável — Roldão vê via stdout do filho que continua `inherit`.
- **Detecção de fim-de-checkpoint via mtime é heurística.** Se o usuário modificar `.claude/.runtime/session-snapshot.md` manualmente (improvável), wrapper pode falsamente concluir que SessionEnd terminou. Mitigado por: timeout adicional + verificação dupla (mtime + novo arquivo em `docs/checkpoints/`).
- **Adiciona ~400 LoC ao framework** (`bin/lib/session-relay.js` + testes). Custo de manutenção.

### Neutras

- Wrapper roda em loop sequencial — 1 wrapper = 1 sessão. Worktree paralelo = abrir outro wrapper. Documentado no AC-117 non-goals.

---

## Alternativas consideradas

### Alternativa A — Hook PreCompact que dispara /checkpoint + reload

**Rejeitada.** Hook roda dentro da sessão que está prestes a compactar. Não consegue spawnar `claude --continue` sem deadlock (o terminal do hook é o terminal do Claude → trava). Confirmado nos 10 agentes consultados.

### Alternativa B — Wrapper em Bash/PowerShell por OS

**Rejeitada.** Dupla manutenção (2 scripts pra sincronizar). Framework já é Node puro em todo o restante (`bin/install.js`, hooks, lib). Romper isso pra `session-relay` introduz inconsistência sem ganho real.

### Alternativa C — Lib externa (`node-pty`, `tmux-wrapper`, `screen`)

**Rejeitada.** Quebra zero-deps. `node-pty` exige toolchain de compilação nativa em Windows (MSVC + Python). Roldão (cliente final) instalaria framework e bateria nesse muro. Inaceitável.

### Alternativa D — Computer Use / Playwright

**Rejeitada.** Não veem contexto interno do Claude. Mesmo se conseguissem inferir "está cheio" via heurística visual, o spawn de nova sessão recairia no mesmo problema da Alternativa A. Custo alto, benefício zero.

### Alternativa E — Polling via API Anthropic

**Rejeitada.** API `/messages` retorna `usage` por requisição, mas wrapper não tem acesso ao stream da sessão Claude Code (a sessão é client local, não bate na API direto). Endpoint público de "contexto da sessão local" não existe.

---

## Como reabrir esse ADR

Reverter / repensar se:

- Anthropic lançar API pública de `context_usage_percent` consultável por hook (resolve sem wrapper externo).
- Surgir caso em que stdin pipe causa corrupção comprovada no Claude (precisaria migrar pra pty + aceitar custo cross-platform).
- Roldão pedir múltiplas sessões paralelas no mesmo wrapper (re-arquitetura).
- 3.7 bytes/token mostrar desvio sistemático > 20% em uso real (recalibrar).

---

## Aderência a regras

- **INV-001** — ADR vive em disco, versionado.
- **INV-002** — US-117 referencia este ADR.
- **INV-003** — Non-goals listados na US e nas alternativas rejeitadas aqui.
- **INV-005** — ADR < 200 linhas, conciso.
- **INV-AGENT-001** — Tabela de tradução PT-BR obrigatória pro wrapper.
- **TST-001** — Testes do wrapper são reais, sem skip/xit.
- **SEC-005** — Wrapper NÃO faz hardcode de URL externa. Não chama Anthropic API.
