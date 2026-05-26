---
tipo: story
id: US-117
versao: 1
status: draft
prd: PRD-002        # modelo-sustentabilidade — relay reduz fricção do Roldão (cliente final)
epico: EP-002       # v2.0 — auditoria 10/10 (relay é ferramenta de produtividade do dono)
tamanho: G          # wrapper Node novo + integração com sinais + multiplataforma + testes
owner: dev-senior
revisado-em: 2026-05-25
depende-de: []
premissas:
  - Nome do subcomando: "roldao-method session-relay" (subcomando do CLI existente, padrão npx).
  - Threshold default: 50% do limite estimado de contexto Claude (configurável via --threshold).
  - Intervalo de medição: 30s (configurável via --check-interval).
  - Linguagem: Node puro (mantém zero-deps runtime, igual ao resto do framework — Rafael decide em ADR).
  - Estimativa de "uso de contexto" via tamanho do transcript .jsonl em disco (Anthropic não expõe API de % de contexto a hooks/wrappers — confirmado em consulta a 10 agentes).
  - Fallback obrigatório: se o wrapper morrer (kill -9, crash, terminal fechou), o Claude por baixo continua rodando normalmente. Wrapper é opcional, nunca corrompe o estado do Claude.
  - Marker de retomada: já existe via .claude/.runtime/session-snapshot.md + session-state.json (gravado por SessionEnd, lido por SessionStart). Detetive identificou — wrapper aproveita 100% e NÃO cria docs/handoff/SESSION-*.md.
aprovacoes: []
---

# US-117 — session-relay: ciclo automático de sessão Claude

> Story gerada pelo /feature (Maestro modo FT) com Roldão como cliente final.
>
> **Para Roldão (não-programador):** este é um robô que vigia o tamanho da conversa com o Claude. Quando a conversa está ficando comprida demais (Claude começa a "esquecer" o que foi dito no começo), o robô salva tudo, fecha a sessão atual e abre uma nova lendo o que foi salvo. Você abre o terminal UMA vez e ele faz isso sozinho a tarde inteira.

---

## Como, quero, para

**Como** dono de produto que não programa e usa o Claude Code o dia inteiro,
**quero** rodar UM comando no início do dia que cuida sozinho do ciclo "Claude → memória cheia → salvar → abrir nova sessão → continuar"
**para** parar de ter que perceber sintomas técnicos ("Claude esqueceu", "tá lento", "o que era mesmo?") e rodar `/checkpoint` manualmente toda hora.

---

## Critérios de aceitação

> Cada AC é independentemente testável. Roldão (não-programador) consegue ler todos.

- **AC-117-1** — Rodar `npx roldao-method session-relay` abre uma sessão Claude (`claude` ou `claude --continue` se já existir handoff anterior) e fica vigiando o tamanho do transcript em disco. **Verificável:** processo iniciado, transcript file detectado em <10s, log do wrapper mostra "vigiando sessão Claude (id=X), arquivo=Y, intervalo=30s".

- **AC-117-2** — Quando o tamanho do transcript passa do threshold (default 50%, configurável via `--threshold 60`), o wrapper dispara `/checkpoint` na sessão Claude ativa via stdin/pipe. **Verificável:** teste unitário simula transcript crescendo até passar do limite e confirma que o sinal de checkpoint foi enviado.

- **AC-117-3** — Após o `/checkpoint`, o wrapper espera o Claude terminar de processar (detecta mtime de `.claude/.runtime/session-snapshot.md` atualizada, ou novo arquivo em `docs/checkpoints/`) e só então fecha a sessão atual graciosamente (SIGTERM, não kill -9). **Verificável:** integração — sinal de "checkpoint pronto" ocorre ANTES do encerramento da sessão.

- **AC-117-4** — Após fechar a sessão antiga, o wrapper abre `claude --continue` que dispara automaticamente `session-snapshot-restore.js` (hook SessionStart já existente no framework) e retoma o trabalho. Roldão vê no terminal: "salvei, abri sessão nova, continuando" (em PT-BR, sem jargão). **Verificável:** sessão nova iniciada, snapshot lido, contexto retomado.

- **AC-117-5** — Loop infinito até Ctrl+C. Cada ciclo é independente — se 1 ciclo falhar (Claude travou, marker não apareceu), wrapper registra erro PT-BR e continua tentando no próximo ciclo, nunca corrompe o Claude por baixo. **Verificável:** simular falha (marker não aparece em 5min) → wrapper avisa em PT-BR e segue, não derruba o Claude.

- **AC-117-6** — Funciona em Windows (Git Bash + PowerShell), macOS e Linux. Nenhuma dependência runtime nova (mantém zero-deps do framework). **Verificável:** CI roda em ubuntu-latest e windows-latest; teste smoke verifica spawn do processo Claude em ambos.

- **AC-117-7** — Mensagens do wrapper são traduzidas pro perfil Roldão (sem "stdin", "SIGTERM", "transcript jsonl"). Tabela:
  - "salvando o que conversamos até agora" (em vez de "triggering /checkpoint")
  - "abri sessão nova, continuando de onde paramos" (em vez de "claude --continue spawned")
  - "vigiando a conversa (passa a metade da memória, eu salvo)" (em vez de "monitoring transcript size at 50% threshold")
  - "deu erro salvando — vou tentar de novo daqui a pouco" (em vez de "checkpoint failed, retrying")
  **Verificável:** snapshot test compara saída do wrapper contra strings esperadas.

- **AC-117-8** — Wrapper é OPCIONAL. Quem prefere usar `claude` direto continua usando — nenhuma instalação do framework força o wrapper a rodar. **Verificável:** `npm test` passa sem nunca invocar o wrapper; `claude` direto continua funcionando idêntico ao antes da US-117.

- **AC-117-9** — Flag `--dry-run` simula o ciclo sem realmente abrir o Claude (loga o que faria a cada passo). Pra Roldão testar antes de soltar o robô de verdade. **Verificável:** teste de comportamento — flag dry-run produz log esperado sem spawnar processo.

- **AC-117-10** — Documentação em `docs/PARA-DONO-DE-PRODUTO.md` (seção nova "robô vigia da conversa") explica em PT-BR claro: o que faz, quando ligar, quando desligar (Ctrl+C), o que aparece na tela.

---

## Non-goals (INV-003)

O que esta story NÃO faz:

- NÃO substitui o `/compact` nativo do Claude. É camada externa que age ANTES da compactação automática (que apaga contexto).
- NÃO é hook do Claude Code (rodaria DENTRO da sessão → mesmo gap descoberto na consulta aos 10 agentes: hook não vê contexto e não pode spawnar `claude --continue` sem deadlock).
- NÃO depende de API pública de "percentual de contexto" da Anthropic (não existe — confirmado).
- NÃO usa Computer Use, Playwright, nem nenhuma forma de "ver a tela do Claude" — só lê arquivo em disco.
- NÃO faz auto-merge, auto-commit nem auto-push. Só dispara `/checkpoint` e o pipeline normal do framework cuida do resto.
- NÃO altera o comportamento do `claude` quando rodado direto. Wrapper é aditivo.
- NÃO suporta múltiplas sessões Claude em paralelo no mesmo wrapper (1 wrapper = 1 sessão sequencial). Worktree paralelo = abrir outro wrapper.
- NÃO é obrigatório no `/feature`, `/bug` ou qualquer workflow. É ferramenta opcional de produtividade.

---

## Contexto técnico

> Detetive preenche na Etapa 2.

- **Arquivos afetados:**
  - `bin/install.js` (adicionar `case 'session-relay'` no switch linha 1904 + entry no `help()`)
  - `bin/lib/session-relay.js` (nova lib com toda lógica do wrapper)
  - `test/session-relay-detect-transcript.test.js`, `test/session-relay-threshold.test.js`, `test/session-relay-checkpoint-trigger.test.js`, `test/session-relay-dry-run.test.js`
  - `package.json` (adicionar `test:session-relay-*` no script `test`)
  - `docs/PARA-DONO-DE-PRODUTO.md` (seção nova explicando o robô)
- **Entidades/handlers:** subcomando CLI + lib pura Node (sem servidor, sem banco).
- **Migrations necessárias:** não.
- **ADRs relacionados:** ADR-022 (a criar na Etapa 3).
- **Reaproveitamento crítico (descoberto pelo Detetive):** o framework JÁ tem persistência de estado entre sessões via `session-snapshot.js` (SessionEnd/PreCompact) e `session-snapshot-restore.js` (SessionStart). Wrapper **não cria** marker novo — ele aproveita o ciclo existente.

---

## Tasks

> Cada task vira 1 commit atômico citando o ID.

- [ ] **T-117-1** — Criar `bin/session-relay.js` com CLI mínimo (parser de flags, help PT-BR).
- [ ] **T-117-2** — Implementar detecção do transcript file ativo (procura em `~/.claude/projects/<hash-do-cwd>/<session>.jsonl` o mais recentemente modificado).
- [ ] **T-117-3** — Implementar medição de threshold (tamanho em bytes; conversão pra estimativa de tokens — Rafael define a fórmula).
- [ ] **T-117-4** — Implementar disparo de `/checkpoint` (estratégia Rafael decide: stdin pipe vs sinal vs arquivo de comando).
- [ ] **T-117-5** — Implementar detecção de fim-de-checkpoint via mtime de `.claude/.runtime/session-snapshot.md` (atualizada pelo hook SessionEnd) ou novo arquivo em `docs/checkpoints/`.
- [ ] **T-117-6** — Implementar encerramento gracioso da sessão antiga (SIGTERM com timeout) e spawn da nova com `--continue`.
- [ ] **T-117-7** — Implementar loop infinito + handler de Ctrl+C (limpa processo filho).
- [ ] **T-117-8** — Traduzir todas as mensagens pro perfil Roldão (snapshot test).
- [ ] **T-117-9** — Implementar `--dry-run`.
- [ ] **T-117-10** — Adicionar entry no `package.json` (campo `bin` ou subcomando do CLI atual — Rafael decide).
- [ ] **T-117-11** — Smoke test cross-platform (CI ubuntu + windows).
- [ ] **T-117-12** — Documentar em `docs/PARA-DONO-DE-PRODUTO.md`.

---

## Testes esperados

- **Unitário:**
  - Função de detecção do transcript file (mock filesystem com 3 arquivos, 1 recente).
  - Função de cálculo de threshold (bytes → estimativa tokens → comparação com limite).
  - Função de parsing de marker SESSION-*.md (extrai timestamp, valida formato).
  - Parser de flags (`--threshold`, `--check-interval`, `--dry-run`).
- **Integração:**
  - Ciclo completo simulado: cria transcript fake crescendo, wrapper detecta, dispara checkpoint, marker é criado por dummy, wrapper espera, fecha, reabre. Sem Claude real.
- **E2E (smoke):**
  - CI: `node bin/session-relay.js --dry-run --threshold 1` roda 5s, sai com código 0, log esperado.

---

## Regulamentação BR aplicável

- **INV-AGENT-001** — mensagens do wrapper traduzidas pro perfil não-programador (Roldão).
- **INV-AGENT-006** — wrapper executa o ciclo sem pedir confirmação a Roldão a cada checkpoint.
- **INV-001** — marker SESSION-*.md em disco é estado compartilhado entre sessões.
- **TST-001** — testes do wrapper não podem usar `skip`/`xit` pra "passar" no CI.

> Sem LGPD/FISCAL direto: wrapper não toca dado pessoal, não emite fiscal, não loga chave Pix.

---

## Status

- [x] draft
- [ ] aprovada (gerente-produto OK)
- [ ] em implementação (dev-senior em ação)
- [ ] revisão (revisor avaliando)
- [ ] entregue (auditores OK ou dispensados)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-25 | Sofia (gerente-produto) | criação — Modo STORY rodado pelo Maestro FT |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** dev-senior — Bruno
- **Modelo usado:** _(preencher)_
- **Custo aproximado:** _(preencher)_
- **Tempo total:** _(preencher)_
- **Arquivos tocados:** _(preencher)_
- **Tasks concluídas:** _(preencher)_
- **Hooks que bloquearam:** _(preencher)_
- **Decisões fora do PRD:** _(preencher)_
- **Skills invocadas:** _(preencher)_
- **Subagentes invocados:** investigador, tech-lead, revisor, auditor-seguranca, auditor-qualidade, auditor-produto, tech-writer
- **Bloqueios encontrados:** _(preencher)_

### Debug log

```
2026-05-25 — Sofia criou US-117 com 10 AC, 8 non-goals, 12 tasks. Premissas documentadas no frontmatter.
```
