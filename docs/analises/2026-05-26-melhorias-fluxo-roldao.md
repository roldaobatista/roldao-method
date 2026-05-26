---
owner: roldao
revisado-em: 2026-05-26
status: draft
fonte: 10 agentes Claude Code auditando o FLUXO INTERNO do framework ROLDAO-METHOD
companion: 2026-05-26-licoes-do-lionclaw.md (analise externa) + 2026-05-26-auditoria-pipelines-lionclaw.md (foco em pipelines)
---

# Auditoria do FLUXO INTERNO do ROLDAO-METHOD

> Auditoria com 10 agentes em paralelo focada em **como o framework trabalha** — pipeline mental, memoria, sessao, comandos, hooks, auditoria, onboarding, observabilidade, ADRs, testes, aprendizado. Diferente das duas auditorias anteriores (que olharam lionclaw como fonte de licao), esta olha o **proprio ROLDAO-METHOD** comparando estado atual + insights do lionclaw + propondo melhorias **novas** que ainda nao estavam catalogadas.
>
> **Saida:** 76 propostas novas distribuidas em 10 dimensoes de fluxo. ~30 hooks novos, ~8 agentes novos, ~12 skills novas, ~8 comandos novos, alem de mudancas estruturais (manifest de hook, RAG de memoria, telemetria local).

---

## SUMARIO EXECUTIVO

### TOP 10 DORES OPERACIONAIS DO FRAMEWORK (diagnostico cruzado)

1. **23 hooks PreToolUse rodando em sequencia em cada Edit/Write** — custa 700ms-1.8s por operacao; sessao de 100 edits gasta 1-3min so em hook
2. **Markers `*-done-*` em `.claude/.runtime/` sao binarios sem payload** — Detetive nao sabe quais ACs Sofia priorizou; Bruno re-le PRD inteiro
3. **Auto-compactacao perde markers de pipeline ativo** — proxima sessao acha que Sofia/Detetive nunca rodaram, refaz trabalho
4. **`_(preencher)_` em AGENTS.md vira armadilha silenciosa** — qualquer agente que abra o projeto vai inventar diferente toda vez
5. **28 comandos sem teste de uso real** — quais sao usados? Quais sao mortos? Hoje opaco
6. **Resolution tracker confia em marker, nao em commit** — `audit_sha` prova que Caio leu o diff, nao que o diff endereçou os findings
7. **Memoria cresce monotonicamente sem TTL** — `project-auditoria-10-10-decisoes.md` foi de decisao a log de sprint de 9KB sem revisao
8. **Hierarquia entre 7 fontes carregadas (CLAUDE/AGENTS/REGRAS/rules/MEMORY/memorias)** e implicita — em caso de conflito, qual vence?
9. **Comunicacao 100% prosa para usuario nao-programador** — sem progress bar visual, sem semaforo, sem painel
10. **Framework nao se observa nem aprende com o uso** — quais hooks disparam mais, quais sao falso positivo, quais sao mortos — opacidade total

### TOP 10 MELHORIAS PRIORITARIAS (consolidando 10 agentes)

1. **Manifest de hook + fast-path por path** — corta 23 hooks por Edit pra ~5
2. **Handoff payload JSON tipado entre agentes** — Sofia escreve JSON com ACs, Detetive le como contrato
3. **Pipeline-state consolidado em 1 arquivo** (`.claude/.runtime/pipeline-state-<US>.json`) — substitui 15 sentinels
4. **`/comeco` entrevista guiada 1 pergunta por vez** + hook bloqueador de `_(preencher)_` — fecha brecha do dia 1
5. **Memory router com tag-based RAG local** — carrega so memoria relevante por tarefa
6. **Hook contador `hook-stats.jsonl` + agente `meta-cetico` (Otavio)** — framework comeca a aprender com proprio uso
7. **`/saude` + `/painel` + status line dinamica** — visibilidade pra nao-programador em 3 segundos
8. **Tabela `audit_findings` + ciclo finding→fix→re-audit** — resolution tracker real, nao teatro
9. **`/retomar` universal** — pipeline incompleto resume sem perder trabalho
10. **`evals/skill-vectors/*.json` + mutation testing nos 3 hooks criticos** — framework prova que protege

---

## 1. PIPELINE MENTAL + HANDOFFS ENTRE AGENTES

### Diagnostico (3 fraquezas)

**F1 — Handoff por marker e binario, sem payload.** Hoje o handshake Sofia → Detetive → Rafael e: "existe `sofia-done-<sess>`?". Marker auditor (ADR-020) ja evoluiu pra JSON com `audit_sha`/`lido_de`, mas Sofia/Detetive/Rafael/Bruno ainda criam **arquivo vazio**. Resultado: Detetive nao sabe quais ACs Sofia priorizou; Rafael nao sabe se Detetive descartou hipoteses ou so nao olhou; Bruno re-le tudo do disco.

**F2 — Pipeline linear-implicito por sentinel.** Estado e deduzido por LS de markers. Quebra em 3 cenarios: (a) worktree paralelo disputando o mesmo `sess`, (b) retomada de sessao (`--continue`) onde o agente principal nao sabe que Rafael nunca fechou, (c) abort consciente sem registro estruturado.

**F3 — 3 auditores rodam paralelos mas SE IGNORAM.** Quando Caio aponta `audit_sha` X e Julia aponta `audit_sha` Y (porque uma rodou antes do diff mudar), framework hoje bloqueia ambos como `stale` mas nao correlaciona — "Caio achou C1 que Julia tambem flagou como Q3 ⇒ deduplicar". Precedencia (`SEC>UX>QA>diff`) esta em doc, nao em codigo.

### Propostas (7)

**P1.1 — Handoff payload JSON tipado por agente** (`.claude/.runtime/handoff/<from>-para-<to>-<sess>.json`)
Cada agente, ao concluir, escreve payload com shape minimo: `{us_id, ac_destacadas[], hipoteses_a_investigar[], decisoes_propostas[], arquivos_relevantes[], proximas_perguntas[], confianca: alta|media|baixa}`. Hook `require-handoff-payload.js` (PostToolUse SubagentStop) bloqueia se agente fechou sem payload esperado pelo proximo.

**P1.2 — Inbox persistente por agente** (`.roldao/inbox/<agent>/<msg-id>.json`)
Pasta nao-versionada com fila append-only. Mensagens citam `replies_to: <msg-id>` formando arvore. Util pra paralelizar — agentes consomem inbox em vez de marker do disco.

**P1.3 — Paralelizar Detetive + Lia (UX) em `/epico` e `/feature` com UI**
Pipeline 100% linear hoje. Em `/feature` com UI, Lia esperando Detetive terminar e desperdicio — dominios disjuntos. Maestro detecta sinal "tem componente visual?" no PRD; se sim, **spawna Detetive + Lia simultaneo** apos Sofia. Sincroniza no Rafael. Reduz wall-clock em ~25-30%.

**P1.4 — "Observador silencioso" — agente `vigia-fluxo` (Olivia)**
Marcos (sre-on-call) e reativo a incidente do CLIENTE. Falta SRE DO PROPRIO FLUXO interno: detectar Detetive que nunca fechou, Rafael pulado sem `rafael-skipped`, Caio em loop por stale. Roda a cada SubagentStop, le `.runtime/`, gera `vigia-report-<sess>.md` com sinais soft warning.

**P1.5 — "Modo cetico" como flag por agente** (nao agente novo)
Cada agente recebe flag `--ceticismo: baixo|medio|alto`. No modo alto: Sofia produz 2 ACs alternativas; Detetive lista 2 hipoteses descartadas com prova; Ines procura ativamente "isso pode estar resolvendo o sintoma errado?". Maestro liga ceticismo alto automatico em `/bug` e `/hotfix`.

**P1.6 — Gate iterativo NO MEIO — Ines roda DEPOIS de cada arquivo Bruno toca, nao no fim**
Hook PostToolUse `inline-review-on-write.js` — apos cada Write/Edit do Bruno em codigo de negocio, dispara mini-revisor (subset do Ines, foco "diff isolado tem defeito obvio?"). Resultado em soft warning. Modelo coder/evaluator do lionclaw mas microgranular.

**P1.7 — Markers consolidados em `pipeline-state-<US>.json`** (1 arquivo, nao 15)
Substituir sentinels por 1 arquivo de estado: `{version, pipeline: 'feature', us_id, etapas: [{agente, status, started_at, finished_at, marker_sha, handoff_payload_path}], current: 'rafael'}`. Hooks fazem 1 leitura + parse em vez de N existsSync. Migracao: hook `migrate-runtime-markers.js`.

---

## 2. MEMORIA PERSISTENTE

### Diagnostico (3 fraquezas)

**F1 — Carregamento "tudo ou nada" via index `MEMORY.md`.** Agente carrega 9KB de detalhe de sprint pra responder "qual a stack?".

**F2 — Hierarquia de autoridade silenciosa entre 7 fontes** (CLAUDE.md global, CLAUDE.md projeto, AGENTS.md, REGRAS-INEGOCIAVEIS, .claude/rules/, MEMORY.md, memorias individuais). Quando `project-auditoria-10-10-decisoes.md` diz "metrica final NAO e mais 10/10 dos auditores" e `AGENTS.md` ainda fala "passar auditores" sem ressalva, **nao ha regra explicita de qual vence**.

**F3 — Memoria cresce monotonicamente; nunca encolhe nem expira.** Sem TTL, sem marker de "obsoleta", sem `revisado-em` na maioria dos `.md`.

### Propostas (8)

**P2.1 — `memory-router.js`** — RAG local por tag/path/tarefa
Hook UserPromptSubmit extrai keywords (`bug`, `release`, `stack`, `LGPD`), le frontmatter `tags:` de cada `.md` em `memory/`, injeta no contexto so os 3-5 mais relevantes via `<system-reminder>`. Tabela `tags:` no frontmatter vira contrato. Zero deps. Corta ~70% do orcamento de memoria por turno.

**P2.2 — `MEMORY-PRECEDENCE.md` no `.claude/rules/`**
Documento curto (≤80 linhas) declarando ordem canonica: `REGRAS-INEGOCIAVEIS.md` > `memory/*` (mais recente) > `AGENTS.md` > `CLAUDE.md projeto` > `CLAUDE.md global` > prompt-do-momento. Hook `memory-conflict-detector.js` avisa quando detecta contradicao.

**P2.3 — `memory/.history/` automatico** (versionamento)
Hook PreToolUse em Write/Edit sobre `memory/*` copia arquivo antigo pra `memory/.history/<nome>-<timestamp>.md` antes de aplicar. Retencao 90 dias. Slash command `/memoria-revisar <arquivo>` mostra diff.

**P2.4 — TTL declarativo + agente `memory-skeptic` (Cetico)**
- `revisado-em` obrigatorio no frontmatter
- `expira-em` opcional
- Novo agente `memory-skeptic` invocado mensalmente via `/loop` OU no SessionStart quando ultima auditoria > 30 dias
- Le cada memoria, compara com estado atual, marca `status: obsoleta` ou propoe consolidacao
- Nao deleta — propoe

**P2.5 — `memory/agent-notes/<agente>.md`** (handoff entre agentes)
Sofia roda em sessao 1 e descobre dependencia oculta. Sessao 2 comeca, Detetive nao sabe. Cada agente ganha arquivo opcional. Hook `SubagentStop` permite agente persistir nota curta. Hook `SubagentStart` injeta nota relevante no prompt do proximo. Limite 500 chars — forca concisao.

**P2.6 — `memory/cross-project/` com import por convencao**
Roldao usa framework em 3 projetos. Licao aprendida em projeto A nao chega no projeto B. Pasta global `~/.claude/memory-cross-project/` indexada por tag. Cada projeto declara `cross-project-tags: [pix, lgpd, electron]`. **Diferencial competitivo concreto** — transforma o metodo em organismo que aprende entre projetos.

**P2.7 — `/reflexao` automatico em `/release` + `/checkpoint` + `/retro`**
Tech-writer (Camila) gera 1-3 bullets de aprendizado apos cada release e propoe arquivo em `memory/aprendizados/<data>-<tema>.md`. Hook `enforce-reflection-on-release.js` bloqueia tag git se etapa nao rodou.

**P2.8 — `memory-budget.js`** (orcamento numerico, espelhando `context-budget`)
Hook SessionStart mede tamanho total da pasta `memory/`. Se > 50KB warn, > 100KB block ate rodar `/memoria-consolidar`. Slash command novo invoca `memory-skeptic` em modo agressivo.

---

## 3. LIFECYCLE DE SESSAO

### Diagnostico (3 fraquezas)

**F1 — Snapshot e best-effort silencioso.** `session-snapshot.js` so persiste 4 prefixos. Markers de pipeline em curso (`sofia-done`, `detetive-done`, `investigator-invoked`) sao explicitamente descartados como "efemeros". Auto-compactacao no meio de `/feature` → proxima sessao acha que Sofia/Detetive nunca rodaram.

**F2 — Sem prova-de-vida do agente principal.** `session-relay.js` so mede tamanho. Se Claude esta girando ha 40min sem progresso, relay nao sabe.

**F3 — "Ultimo foco" e invisivel na retomada.** `session-snapshot-restore.js` despeja markdown bruto no stderr. Sem TL;DR, sem "ultima coisa que voce fez".

### Propostas (8)

**P3.1 — Persistir marker de pipeline-step FORA do contexto Claude**
Marker paralelo `pipeline-step-${US}.json` (nao atrelado a `${sess}`) com `{us, last_step, agents_done[], started_at, last_activity}`. Persiste auto-compactacao **e** crash. `session-snapshot-restore.js` le e mostra "US-NNN no passo Bruno (faltam Ines + 3 auditores)".

**P3.2 — `/refactor` e `/auditoria-reversa` SEMPRE em plan mode forcado**
Hook PreToolUse em comando `/refactor` checa `permissionMode`; se ≠ `plan`, bloqueia: "refactor exige plano aprovado antes — aperte Shift+Tab e rode de novo".

**P3.3 — Session-relay com heartbeat de progresso** (nao so de tokens)
Estender `bin/lib/session-relay.js`: alem de `measureUsage()`, adicionar `measureProgress()`. Se 15min sem nova entrada em `metrics.jsonl` mas processo vivo → grava `agent-stalled-${ts}` em `.runtime/`, exibe aviso PT-BR ("agente parado ha 15min, talvez tenha travado — Ctrl+C 2x e `--continue`").

**P3.4 — `crashed-session-recovery.js`** — detectar sessao morta sem fechamento limpo
SessionStart varre `.runtime/`, calcula idade dos markers `*-active-*`; se > 4h sem write no transcript, marca `crashed: true` em `session-state.json` + oferece "recuperar US-117 que parou no meio? (S/N)".

**P3.5 — Diario de sessao automatico em `docs/diario/AAAA-MM-DD-HHmm.md`**
Hook SessionEnd `session-diary.js`: gera 1 pagina PT-BR com arquivos tocados (`git diff --stat`), comandos rodados, agentes invocados, proximo passo sugerido. Diferente do CHANGELOG — granular por sessao.

**P3.6 — "Ultimo foco" estruturado no SessionStart**
`session-snapshot-restore.js` le `pipeline-step-*.json` + `investigation-*.json` + `last-research-path` e renderiza 3 linhas: "Ultima story: US-117 (Bruno fez, falta Ines). Ultima investigacao: 2 dias atras. Proximo passo logico: rodar /historia ou /sprint".

**P3.7 — Aconselhamento de worktree ativo no SessionStart**
Hook `worktree-advisor.js` le stories `status: in-progress` + cruza com `pipeline-step-*.json`. Se ≥3 stories em curso + commits cruzam arquivos disjuntos → sugere `git worktree add`. Se 2 stories tocam mesmo arquivo → avisa "NAO paralelize US-A e US-B".

**P3.8 — Relatorio de custo de sessao ao fechar** (R$/USD/tokens)
`session-snapshot.js` em SessionEnd coleta tokens lendo `.jsonl`. Adiciona `## Custo da sessao` com `tokens_in / tokens_out / custo estimado USD`. Roldao entende "essa sessao custou R$ 14,30" — util pra ROI percebido + detectar sessao patologica.

---

## 4. COMANDOS E ORQUESTRACAO DE WORKFLOWS

### Diagnostico (3 fraquezas)

**F1 — 28 comandos sem teste de uso.** Lionclaw rodou 100% das dores reais com 5 pipelines. ROLDAO tem 5,6x mais comandos sem evidencia de que cada um foi usado.

**F2 — Composabilidade zero, retomada zero.** Se `/feature` falha no auditor-qualidade, nao existe `/feature --retomar`.

**F3 — Comando = documento, sem dry-run, sem telemetria, sem versao.**

### Propostas (8)

**P4.1 — Consolidar pra 12 comandos NUCLEO + 16 alias**
Nucleo: `/inicio`, `/feature`, `/bug`, `/hotfix`, `/auditoria`, `/checkpoint`, `/release`, `/status`, `/help`, `/clarificar`, `/quick-dev`, `/o-que-aconteceu`. Restantes viram modos: `/feature --decompor` no lugar de `/epico`; `/feature --refactor` no lugar de `/refactor`; `/auditoria --reversa`; `/status --sprint`.

**P4.2 — `/feature --rascunho` (dry-run universal)**
Toda command que escreve arquivo aceita `--rascunho`: Maestro lista plano (qual agente vai rodar, qual marker vai criar, quais arquivos vai tocar) **sem chamar Task subagent**. Hook `dry-run-detector.js` intercepta Task quando flag presente.

**P4.3 — `/retomar` (resumability declarativa, INV-012)**
Le `.claude/.runtime/*` + ultimo `docs/checkpoints/` e responde: "ultima sessao parou apos Detetive em US-024. Falta Rafael → Bruno → Ines → 3 auditores. Continuar?". Persiste estado em `.claude/.runtime/pipeline-state-<US>.json`.

**P4.4 — Macro `/entregar <US-NNN>`** (composicao oficial)
Orquestra `/feature` → `/checkpoint` → `/release patch` em sequencia, com 1 confirmacao consolidada no fim, nao 3.

**P4.5 — Telemetria local opt-in em `.claude/.runtime/usage.jsonl`**
Cada SlashCommand registra `{cmd, timestamp, success, duration_ms}`. Comando novo `/status --uso` mostra "comandos mais rodados nos ultimos 30 dias / nunca rodados". Privacidade: `.gitignore`'d, sem PII.

**P4.6 — Versao por comando + `/comando --migrar`**
Frontmatter ganha `version: 1.2.0`. `tools/validar-templates.js` checa se `roldao-method update` deixou comandos antigos. `npx roldao-method doctor` lista comandos defasados.

**P4.7 — Allowlist de comando por agente (SEC-008)**
Frontmatter ganha `restricted-to: [maestro, gerente-produto, dev-senior]` opcional. Hook `enforce-command-permissions.js` bloqueia subagente fora da lista. `/release`, `/hotfix`, `/auditoria` ganham restricao explicita.

**P4.8 — `/status --global` (multi-worktree visibility)**
Le todos `.claude/.runtime/*` de TODOS worktrees irmaos via `git worktree list`, consolida em painel PT-BR: "worktree A: feature US-024 na fase Detetive ha 12min. worktree B: bug US-009 aguardando AskUserQuestion ha 3h."

---

## 5. SISTEMA DE HOOKS

### Diagnostico (3 fraquezas)

**F1 — 23 hooks PreToolUse Write|Edit em sequencia** (`settings.json` L418-530). Estimativa: 23 × ~30-80ms = 700ms-1.8s por Edit. Em sessao de 100 edits, custa 1-3min so de hook.

**F2 — Falsos positivos sem allowlist por path.** O proprio doc de analise foi bloqueado porque CITA padroes proibidos. Solucao atual: reescrever em prosa — friccao desnecessaria.

**F3 — Ordem de execucao implicita** (ordem do array JSON) e sem dependencias declaradas.

### Propostas (8)

**P5.1 — Fast-path por path no `_lib.js`** (early exit antes do regex pesado)
Mapa: `fiscal-br-validator` so roda em paths contendo `/nfe|/fiscal|/sefaz/`; `no-log-pix-key` so em `/pix|/payment/`; `anti-mascaramento` pula `docs/analises/**`, `docs/auditorias/**`, `templates/**.example`. **Edit em README cai de 23 hooks pra ~5.**

**P5.2 — Frontmatter `meta` em cada hook + manifest gerado**
Cabecalho padronizado:
```js
// @hook-meta {"id":"anti-mascaramento","priority":10,"paths_skip":["docs/analises/**"],"events":["PreToolUse:Write|Edit"],"blocks":true,"rule":"TST-001"}
```
Script `npx roldao-method hooks:manifest` gera `.claude/hooks/MANIFEST.json` — base pra ordenacao, `/help hooks`, debug.

**P5.3 — Modo `ROLDAO_PERMISSIVE=1` (aprende, nao bloqueia)**
Variavel de ambiente. Quando ligada, todos os `exit 2` viram `exit 0` + log em `.claude/.runtime/blocked.log`. Projeto novo adotando primeiro liga isso, ve o que SERIA bloqueado por uma semana, ajusta codigo, depois desliga.

**P5.4 — Agregador de soft-warnings em `.claude/warnings.log`**
Os 7 soft-warnings (regra-zero + 6 LGPD) hoje cospem no stderr e somem. `_lib.js` ganha `emitSoftWarning(hookId, msg)` que faz append em JSONL. Comando `/avisos` mostra os ultimos 20 traduzidos em PT-BR.

**P5.5 — Teste obrigatorio por hook + cobertura no manifest**
Cada hook bloqueador precisa de `__tests__/hook-<id>.test.js` com 1 caso positivo + 1 negativo. Hook critico (`block-destructive`, `secrets-scanner`, `anti-mascaramento`) precisa de 3+ casos. Gate no release: `hooks:audit` falha → release bloqueada.

**P5.6 — `ROLDAO_HOOKS_VERBOSE=1` — modo trace**
`_lib.js` ganha wrapper `runHook(fn)` que imprime: `[hook:anti-mascaramento] start path=docs/x.md size=2.3KB` + `[hook:anti-mascaramento] decision=pass duration=42ms`.

**P5.7 — Skill com marker `// roldao:test-fixture` silencia hook**
Conflito real: skill `gerar-test-fixture-br` gera CPF valido por algoritmo; hook `no-test-data-in-fixtures.js` bloqueia esse padrao. Solucao: skill insere magic comment; hook le, valida estrutura, libera. Sem marker = bloqueia normal.

**P5.8 — Diff de hook em `update` + secao `## Local hooks`**
- Hooks do framework moram em `.claude/hooks/_core/`
- Hooks customizados em `.claude/hooks/_local/`
- `update` mostra diff dos `_core/` que vai trocar + preserva `_local/`

---

## 6. AUDITORIA POS-FATO E QUALITY GATES

### Diagnostico (3 fraquezas)

**F1 — Conflito entre auditores em paralelo sem arbitro mecanico.** Julia diz "renomear `data` → `pedido`", Pedro diz "mantenha". Hoje agente "consolida" subjetivamente — teatro de processo.

**F2 — Resolution tracker confia em marker, nao em commit.** `audit_sha` prova que Caio leu o diff, nao que o diff endereçou os 3 criticos.

**F3 — Pedro (auditor-produto) vs Sofia (gerente-produto) escopo sobreposto.** Se Pedro discordar de AC ("essa AC nao faz sentido pro cliente"), ele bloqueia algo que Sofia aprovou. Sem protocolo, vira 4a camada de auditoria.

### Propostas (8)

**P6.1 — Tabela `audit_findings` + ciclo `finding → fix → re-audit`**
Cada auditor escreve `audit-finding-{seg|qual|prod}-${SESSION}.jsonl` com array `{finding_id, severity, rule_id, file, line, descricao, status: 'open'}`. Dev referencia `Fixes: AF-001, AF-003` na msg de commit. Hook `require-findings-resolved.js` bloqueia commit final se `status=open` && `severity=must-fix`. Re-auditoria muda `status: closed-by-{sha}`.

**P6.2 — Severidade em 2 tiers operacionais: `MUST-FIX-MERGE` e `TODO-POST-RELEASE`**
Hoje "criticos/altos/medios/baixos" — vago, tudo vira bloqueante. Auditor classifica em 2 tiers + `INFO`. Hook `require-tier-on-finding.js` rejeita finding sem `tier`.

**P6.3 — Arbitro de conflitos: `audit-arbiter`** (nao auditor — mediador)
Quando 2 auditores produzem recomendacoes contraditorias no MESMO arquivo, agente `audit-arbiter` consome os 2 findings e produz **uma** recomendacao aplicando precedencia. Bruno so ve uma orientacao. **Nao** e recursivo.

**P6.4 — Protocolo Sofia↔Pedro: "AC contestada"**
Pedro discorda de AC → NAO bloqueia → escreve `ac-contestada-${US}-${AC}.md` em `docs/stories/contestacoes/`. Workflow `/replanejar` le contestacoes antes de aceitar US como fechada. Sem 4a camada.

**P6.5 — Auditoria incremental (`audit_sha_base`)**
Marker JSON ganha `audit_sha_base` = sha do ultimo diff aprovado. Re-auditoria apos fix le `git diff $audit_sha_base...HEAD` e audita so o delta. Acelera 5x re-auditoria em ciclo iterativo.

**P6.6 — Auditor pessoal: heuristica `audit-bias.json`**
`.claude/.runtime/audit-bias.json` acumula `{rule_id, miss_count}` ao longo de releases. Quando `miss_count >= 3` numa regra, o respectivo auditor entra em **modo rigoroso** automatico (Caio em LGPD-004 que vazou 3x, Julia em TST-001 com bypass recorrente).

**P6.7 — Gate de release com assinatura humana obrigatoria** (`release-master` checklist, nao agente)
Arquivo `.claude/.runtime/release-approval-${VERSAO}.json` com `{aprovado_por, timestamp, checklist_lido: true, todo_post_release_aceitos: [...]}`. Hook `require-human-release-approval.js` bloqueia `git tag` sem JSON.

**P6.8 — Auditor em "modo coach" via flag `/auditoria --coach`**
Mesmos 3 auditores, saida adapta linguagem: "achei senha sendo logada no login. **Por que e ruim:** [...] **Como arrumar:** [...] **Por que isso resolve:** [...]". Util em `/auditoria-reversa` (cliente herdou repo legado). Reaproveita skill `traduzir-jargao`.

---

## 7. ONBOARDING

### Diagnostico (3 fraquezas)

**F1 — `_(preencher)_` e armadilha silenciosa.** AGENTS.md tem 5+ placeholders. Nao ha hook que detecte, nao ha aviso, nao ha gate.

**F2 — `/inicio` e assincrono demais.** 5 etapas sequenciais com agentes pesados. Cliente nao-programador trava na primeira tela.

**F3 — Zero estado de "primeira vez" detectavel.** Framework nao distingue "instalei agora" de "uso ha 30 dias".

### Propostas (8)

**P7.1 — Hook bloqueador `require-agents-md-preenchido.js`**
Se `AGENTS.md` ainda contem `_(preencher)_` em §1/§2/§6, bloqueia qualquer subagente exceto `gerente-produto`/`analista`/`investigador` + sugere `/comeco`. Excecao: `--skip-onboarding` em `settings.local.json`.

**P7.2 — Workflow `/comeco`** — entrevista guiada 1 pergunta por vez
Substitui overhead do `/inicio` pra popular contrato. (1) Nome? (2) O que faz? (3) Quem usa? (4) SaaS/app/biblioteca/CLI/Electron? (5) Detecta stack via `package.json` e PROPOE. Cada resposta vira commit atomico em `AGENTS.md`. Marker `.roldao-method/onboarding.json`. Suporta `/comeco --continuar`.

**P7.3 — SessionStart hook `welcome-first-session.js`**
Detecta primeira vez (sem `.roldao-method/onboarding.json`) e injeta: "Esse e o primeiro `claude` nesse projeto. Voce pode: `/comeco` (5 min) | `/brownfield` (varrer existente) | `/help`."

**P7.4 — Deteccao de tipo de projeto no `npx roldao-method install`**
Le `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`. Detectou Electron → pergunta "Instalo addon `electron-br`?". Detectou `pix-`/`nfe-` em deps → sugere `fintech-br`/`fiscal-br-completo`.

**P7.5 — "Modo timido" no primeiro projeto** — flag `ROLDAO_VERBOSE_ONBOARDING=true`
Primeiros 7 dias (ou 10 tarefas), agentes explicam o que estao fazendo: "Vou invocar o Detetive porque voce reportou bug — ele le o estado antes de propor solucao, conforme REGRA #0." Hook `block-jargon-pt-br.js` mais agressivo. Depois fica silencioso.

**P7.6 — Hook `detect-existing-claude-md.js` no install**
Se ja existe `CLAUDE.md` com conteudo: NAO sobrescreve. Cria `CLAUDE.md.roldao-merge-pendente` ao lado + reporta diff: "Voce ja tinha um CLAUDE.md. Salvei o ROLDAO em `.roldao-merge-pendente`. Compare e merge manual."

**P7.7 — Soft warning `stale-placeholder-reminder.js`** (apos 7 dias)
SessionStart. Se `.roldao-method/onboarding.json` tem `completed_at` > 7 dias E `AGENTS.md` ainda tem `_(preencher)_`, avisa: "Seu AGENTS.md tem 3 campos vazios ha 7 dias. Quer preencher? (`/comeco --completar`)".

**P7.8 — Versionamento do install em `.roldao-method/version.json`**
Grava `installed_version`, `installed_at`, `customizations_detected`. `update` le e: (a) so toca arquivos NAO customizados sem perguntar, (b) pra cada customizado, mostra 3-way merge em PT-BR, (c) NUNCA mexe em `.specify/overrides/`.

---

## 8. OBSERVABILIDADE INTERNA

### Diagnostico (3 fraquezas)

**F1 — Status line e fotografia, nao filme.** Mostra agente do **ultimo** marker `-done-`. Roldao nao ve agente rodando AGORA, fase atual, tempo gasto, custo da sessao.

**F2 — Comunicacao 100% texto corrido em prosa.** `/status` e `/o-que-aconteceu` produzem markdown bonito mas exigem LER. Sem linha do tempo visual, sem barra, sem semaforo.

**F3 — Erros e custo opacos.** Stack trace cru sobe pro chat. Custo? Invisivel. Tempo por fase? Invisivel.

### Propostas (8)

**P8.1 — Status line dinamica com fase do pipeline ativa**
Trocar "ultimo agente -done-" por agente CORRENTE + posicao no pipeline. Marker `-running-` + leitura de `feature-active-*`. Formato:
```
v1.3.1 - Opus - main - US-118 - [3/7 Rafael] - $1.40 - 22% contexto
```
Cada agente cria `<slug>-running-<ts>` em SubagentStart e renomeia pra `-done-` em SubagentStop.

**P8.2 — Painel ASCII no inicio de cada handoff**
Primeira linha do output mostra:
```
=== /feature US-118 ===
[OK] Sofia (1/7) - [OK] Detetive (2/7) - [ATIVO] Rafael (3/7) - [aguarda] Bruno (4/7) - [aguarda] Ines (5/7) - [aguarda] Caio+Julia+Pedro (6-7/7)
```
Hook PostToolUse quando `Task` retorna injeta linha de progresso.

**P8.3 — `/painel`** — comando unico de "tela de instrumentos"
Combina status + custo + linha do tempo + saude em UM output:
```
PROJETO: roldao-method - branch: main - v1.3.1

PIPELINE ATIVO
[3/7] Rafael (tech-lead) - rodando ha 1m12s

ORCAMENTO HOJE
Tokens: 142k/1M (14%) - Custo: $1.40

LINHA DO TEMPO (ultimos 30min)
14:02 | Sofia    | US-118 escrita     | 18s
14:03 | Detetive | leu auth.js x3     | 45s
14:04 | Rafael   | ADR-008 em escrita | 1m12s (agora)

SAUDE
Verde: sem debito critico, testes verdes
Amarelo: 2 stories pendentes
```

**P8.4 — Resumo automatico a cada N tool calls (auto-pulse)**
Hook PostToolUse conta chamadas. A cada 15 chamadas (ou 5min), agente emite 1 linha: "PULSE - 14:18 - Rafael escrevendo ADR-008 ha 4min - proximo: Bruno implementa - gasto ate agora: $2.10".

**P8.5 — Slow-agent warning** (watchdog do framework)
Se subagent passa > 5min sem PostToolUse, hook avisa: "Bruno (dev-senior) sem atividade visivel ha 6min. Provavelmente pensando — esperar +3min ou pausar com Ctrl+C?".

**P8.6 — Tradutor automatico de erro** (nao opcional)
Hoje `tech-writer` so traduz se chamado. Proposta: hook PostToolUse em qualquer tool que falhe intercepta stderr/exception, roda regex contra dicionario PT-BR (`ENOENT` → "arquivo nao encontrado", `EACCES` → "sem permissao"). Injeta PT-BR ANTES do erro tecnico. Tecnico fica em `<details>` colapsado.

**P8.7 — `/saude`** — semaforo binario do projeto
1 comando, 3 cores, 5 dimensoes. Sem prosa.
```
SAUDE DO PROJETO - 14:18
[verde]    GIT          tudo salvo, nada pendente
[verde]    TESTES       ultima verificacao: tudo passou (2h atras)
[amarelo]  STORIES      3 stories em andamento, 1 sem dono
[vermelho] SEGURANCA    1 dependencia com alerta (lodash 4.17.15)
[verde]    LGPD         nenhum dado pessoal sem base legal

ACAO RECOMENDADA: rodar `npm audit fix` ou `/auditoria`
```

**P8.8 — `metrics.jsonl` virar fonte de verdade do custo**
Estender pra registrar por turn: agente, duracao, tokens in/out, custo estimado, modelo. Hook SubagentStop grava. Status line, `/painel`, `/saude`, `/o-que-aconteceu` leem do mesmo arquivo.

---

## 9. ADRs E DECISOES ARQUITETURAIS

### Diagnostico (3 fraquezas)

**F1 — "Quando exige ADR?" e folclore, nao regra.** Rafael decide na hora. Em 22 ADRs do framework, decisoes triviais (ADR-013) e estruturais (ADR-001) misturadas.

**F2 — ADR e fotografia, nunca filme.** Sem `superseded-by` (campo, hook, validador). ADR-001 escrito ha 6 meses; ninguem revisita.

**F3 — Burocracia uniforme, sem escala de overhead.** Escolher prefixo CSS exige o MESMO ritual de escolher banco. Pequenas decisoes viram folclore oral.

### Propostas (8)

**P9.1 — Hook `require-adr-on-sensitive-area.js` + lista `.claude/adr-triggers.yml`**
```yaml
exige-adr:
  paths: ["src/auth/**", "**/migrations/**", "**/pix/**", "**/nfe/**", "**/secrets/**"]
  acoes:
    - adicionar-dependencia-runtime
    - mudar-formato-dado-persistido
    - trocar-algoritmo-criptografia
    - integrar-api-externa-paga
```
Hook intercepta. Sem ADR novo OU citacao `ADR-NNN` na mensagem → exit 2.

**P9.2 — Campo `superseded-by` + `supersedes` + hook `validate-adr-graph.js`**
Estender frontmatter:
```yaml
status: superseded
superseded-by: ADR-NNN
supersedes: [ADR-MMM]
data-superseded: 2026-05-26
motivo: "Latencia ultrapassou 500ms — gatilho de reabertura disparado"
```
Hook valida bidirecionalidade.

**P9.3 — ADR-Lite (`docs/decisions/notas/DN-NNN-*.md`)** para decisao reversivel
Template enxuto (≤30 linhas) com `tipo: decision-note`, `reversibilidade: alta|media|baixa`, `quando-virar-adr:`. Comando `/dn <titulo>`. Regra de promocao: 3 DNs do mesmo dominio = vira ADR consolidado.

**P9.4 — Workflow `/adr-review` periodico + hook `adr-stale-reminder.js`**
Soft warning: ADR com `status: aceito` e `revisado-em` > 180 dias dispara lembrete. Workflow: Detetive le estado real, Rafael compara doc vs codigo, saida `mantido | superseded | deprecated`.

**P9.5 — Slot `gatilho-de-reabertura` medivel**
```yaml
gatilhos-de-reabertura:
  - metrica: latencia_p95_ms
    limite: 500
    verificacao: manual | metrica:<query>
    ultima-medicao: 2026-05-20
    valor-atual: 230
```
Hook opcional `adr-trigger-checker.js` (rodavel via `/adr-check`).

**P9.6 — ADR pendente: marker + handoff Sofia → Rafael**
Sofia escreve US com `requer-adr: true` + `adr-pendente:` em prosa curta. Hook `require-adr-before-dev.js` bloqueia Bruno se US tem `requer-adr: true` e nao ha ADR referenciando. Maestro chama Rafael ANTES do Bruno.

**P9.7 — Detector de ADRs em conflito (`validate-adr-conflict.js`)**
Le todos ADRs `status: aceito`, extrai campo `decide-sobre:` (novo, obrigatorio). Alerta se 2+ aceitos decidem sobre o mesmo dominio sem `superseded-by`.

**P9.8 — Visualizacao PT-BR: `/adr-mapa`**
Comando gera `docs/decisions/MAPA.md` auto:
```markdown
## Por dominio

### Pipelines e agentes
- ADR-011 (Maestro fonte unica) — ACEITO
  -> ADR-019 (Maestro multi-modo) — ACEITO, estende ADR-011

### Distribuicao
- ADR-001 (zero deps) — ACEITO ha 6 meses [revisao vencida]
```

---

## 10. TESTES E QUALITY GATES DO FRAMEWORK

### Diagnostico (3 fraquezas)

**F1 — Cobertura de hook desigual (smoke vs comportamento).** 27 testes + 35 hooks bloqueadores. ~10 hooks tem teste dedicado de comportamento; ~25 rodam so no smoke. Framework infringe a propria piramide.

**F2 — Skills Python BR (15 scripts) so tem teste de CI rodando 1 caso feliz.** Skills criticas (validar-cpf-cnpj, validar-chave-acesso-nfe) **nao tem tabela de vetores canonicos**. Mutacao no algoritmo passa despercebida.

**F3 — Zero regressao de saida de agente + zero benchmark de hook.** Hooks sincronos no PreToolUse — sem gate "hook > 300ms = falha CI".

### Propostas (8)

**P10.1 — `templates/.claude/hooks/__tests__/<hook>.test.js`** (matriz canonica por hook)
Cada hook bloqueador tem arquivo-irmao com minimo 3 casos: (a) input que DEVE bloquear → exit 2; (b) input que NAO deve bloquear (caso adjacente, evita falso positivo); (c) input degenerado (vazio, malformado) → exit 0 ou erro controlado. `validar-cobertura-hooks-comportamento.js` falha se hook bloqueador sem `__tests__/`.

**P10.2 — `evals/skill-vectors/<skill>.vectors.json`** com vetores canonicos
JSON declarativo: `[{input, expected: valido|invalido, motivo}]`. Casos obrigatorios: 5 CPFs validos reais publicos, 5 invalidos por motivo, CNPJ alfanumerico do Manual RF, BR Code do Manual Bacen 03.34. Runner em `evals/run-vectors.js`. **Mutation testing barato.**

**P10.3 — `evals/hooks-perf.test.js`** com orcamento por hook
Mede tempo de execucao em PreToolUse tipico. Falha se > 250ms (PreToolUse mediano) ou > 500ms (Stop). Metrica vai pra `evals/perf-baseline.json` — regressao > 30% bloqueia merge.

**P10.4 — Snapshot de agente** (`evals/agent-snapshot/<agente>.snapshot.eval.md`)
Pra cada 1 dos 17 agentes: 1 prompt canonico + frases-ancora obrigatorias (Sofia precisa escrever `AC-`; Detetive precisa mencionar "li o estado real"; Camila precisa produzir `### O que muda pra voce`). Runner usa Claude SDK headless.

**P10.5 — Teste de regressao PT-BR** (`test/regressao-pt-br.test.js`)
Varre `templates/.claude/agents/*.md`, `skills/*/SKILL.md`, `commands/*.md`. Falha se aparecem strings claramente EN ("Please ", "Make sure to", "Note that", "Workflow ", "Step ", "Check that", "Output"). Allowlist por palavra intraduzivel.

**P10.6 — `test/install-idempotencia.test.js`** cobrindo 3 cenarios reais
(a) Install em pasta com `.claude/settings.json` customizado → preservar ou diff visivel; (b) `update` em projeto com hooks customizados → nao apagar; (c) reinstall consecutivo (idempotencia).

**P10.7 — Canary release via `npm publish --tag next`**
`1.4.0-next.0` publicado com `dist-tag` = `next`. Roldao instala em projeto-cobaia com `npx roldao-method@next install`. 5 dias de soak antes de promover.

**P10.8 — Mutation testing leve em 3 hooks criticos**
`anti-mascaramento`, `block-destructive`, `secrets-scanner`. Script `tools/mutar-e-rodar.js` aplica 5 mutacoes simples (negar comparacao, trocar operador, remover regex). Exige que pelo menos 4 das 5 sejam detectadas pelo `__tests__/<hook>.test.js`.

---

## 11. APRENDIZADO E EVOLUCAO DO FRAMEWORK

### Diagnostico (3 fraquezas)

**F1 — Evolucao 100% puxada por Roldao, zero puxada pelo uso.** Todos os 35 hooks nasceram de incidente vivido + Roldao decidiu codificar. Nenhum nasceu de **padrao detectado pelo proprio framework**.

**F2 — Opacidade operacional total** — o framework nao se observa. Quais hooks disparam mais? Quais nunca bloquearam? Quais geram falso positivo cronico? Hoje invisivel.

**F3 — Memoria episodica, sem genealogia nem expiry.** 49 IDs em `REGRAS-INEGOCIAVEIS.md` sem "criada apos incidente X em data Y" anexado. Daqui a 1 ano ninguem vai saber por que existem — regra sem causa documentada vira ritualistica.

### Propostas (8)

**P11.1 — Hook contador local `.claude/.runtime/hook-stats.jsonl`**
Cada disparo anexa `{hook, decision, ts, projeto}`. Comando `/stats-hooks` mostra ranking: top 5 mais disparados, top 5 que nunca bloquearam, top 5 com `decision:block` ignorado (sinal de falso positivo). Zero rede.

**P11.2 — Agente `meta-cetico` (Otavio) acionado por `/auto-auditar-framework`**
Mensalmente ou sob demanda. Le `hook-stats.jsonl` + `docs/retros/*.md` + `docs/incidentes/INC-NNN-*.md` + ultimos 100 commits. Saida: 3 candidatos a regra nova (padrao repetiu 3x) + 3 candidatas a sunset (regra que nunca disparou em 90 dias OU regra contornada >50% das vezes). Roldao aceita/rejeita.

**P11.3 — Genealogia obrigatoria em INV/SEC/TST/LGPD (`origem:` no frontmatter)**
```yaml
origem:
  data: 2026-05-15
  incidente-ou-feedback: "INC-003 — PDF errado 3 vezes seguidas"
  sintoma-observado: "agente mudou template sem investigar flag no banco"
```
Hook `require-origem-on-new-rule.js` bloqueia commit que adiciona ID sem `origem:`. INV-006 ja faz isso na prosa — formaliza.

**P11.4 — `/bug` gera candidato a regra como subproduto**
Etapa final: investigador classifica `padrao_recorrente: sim|nao|incerto`. Quando 3 bugs distintos marcarem `sim` no mesmo dominio, `/auto-auditar-framework` propoe regra. **Threshold 3** evita codificar coincidencia.

**P11.5 — Diario de aprendizado `docs/learning/AAAA-MM.md` mensal**
Tech-writer compila 1x/mes: hooks mais disparados, regras propostas, regras sunseted, padrao de erro do agente que se repetiu, feedback do Roldao que ainda nao virou regra. 1 pagina. Framework ganha cara de **produto vivo evoluindo**.

**P11.6 — Diff inteligente entre versoes (`/explicar-update v1.3.0 v1.3.1`)**
Le o que mudou entre versoes E checa **o que afeta este projeto especifico**. Output: "voce ganhou hook X que vai bloquear seu padrao Y; voce perdeu warning Z que era importante pra seu fluxo W".

**P11.7 — Feedback negativo rastreavel (`.claude/.runtime/dismissed.jsonl`)**
Quando usuario contorna soft warning ou usa `--bypass`/edita config pra desligar, grava `{regra, motivo-opcional, ts}`. Apos 5 dismissals da mesma regra → `meta-cetico` sinaliza: "INV-X esta sendo descartada — ou e regra ruim, ou agente precisa de melhor treino".

**P11.8 — Importar conceito de outros frameworks via `/brief-framework <nome>`**
Analista (Cintia) le repo publico de spec-kit/Cline/Cursor/agents.md spec e devolve: "padroes nao cobertos aqui que voce pode adotar" + "padroes que voce rejeita intencionalmente — registre como non-goal". Mecanismo controlado pra absorver ideia externa sem virar copia. Sob demanda, nao automatico.

---

## 12. CONSOLIDADO: NOVAS PRIMITIVAS DE FLUXO

### 12.1 — Novos hooks (~30)

| Categoria | Hooks |
|---|---|
| **Performance** | `fast-path-router.js`, `hooks-perf-budget.js`, `hooks:manifest.js`, `runHook-verbose.js` |
| **Pipeline mental** | `require-handoff-payload.js`, `migrate-runtime-markers.js`, `inline-review-on-write.js`, `slow-agent-warning.js` |
| **Memoria** | `memory-router.js`, `memory-conflict-detector.js`, `memory-budget.js`, `memory-skeptic-trigger.js` |
| **Sessao** | `crashed-session-recovery.js`, `worktree-advisor.js`, `session-diary.js`, `agent-stalled-detector.js` |
| **Onboarding** | `require-agents-md-preenchido.js`, `welcome-first-session.js`, `detect-existing-claude-md.js`, `stale-placeholder-reminder.js` |
| **Comandos** | `dry-run-detector.js`, `enforce-command-permissions.js`, `command-version-validator.js` |
| **Auditoria** | `require-findings-resolved.js`, `require-tier-on-finding.js`, `require-human-release-approval.js`, `enforce-reflection-on-release.js` |
| **ADR** | `require-adr-on-sensitive-area.js`, `validate-adr-graph.js`, `adr-stale-reminder.js`, `validate-adr-conflict.js`, `require-adr-before-dev.js`, `adr-trigger-checker.js` |
| **Aprendizado** | `hook-stats-recorder.js`, `require-origem-on-new-rule.js`, `dismissed-tracker.js` |
| **Testes** | `validar-cobertura-hooks-comportamento.js` |

### 12.2 — Novos agentes (5)

| Agente | Persona | Funcao |
|---|---|---|
| `vigia-fluxo` | "Olivia" | SRE do proprio fluxo interno do framework — detecta agente parado, sequencia pulada, loop |
| `memory-skeptic` | (sem nome ainda) | Auditor de memoria — propoe consolidacao, expiry, deteccao de obsolescencia |
| `audit-arbiter` | (mediador, nao auditor) | Resolve conflito quando 2 auditores produzem recomendacoes contraditorias |
| `meta-cetico` | "Otavio" | Auto-auditor do framework — propoe regras novas e sunset baseado em uso real |
| Analista (Cintia) ja existe | — | Estendida com modo `/brief-framework <nome>` |

### 12.3 — Novas skills (12)

1. `gerar-handoff-payload-pt-br` — molde de JSON tipado entre agentes
2. `recuperar-pipeline-state` — le pipeline-state.json + retoma de onde parou
3. `consolidar-memoria` — agrupa memorias similares com confirmacao humana
4. `gerar-diario-sessao` — formato canonico de `docs/diario/`
5. `gerar-painel-saude-pt-br` — output do `/saude` com semaforo
6. `gerar-painel-instrumentos` — output do `/painel` com linha do tempo
7. `gerar-decision-note-pt-br` — DN-NNN enxuto (ADR-Lite)
8. `gerar-mapa-adr` — output do `/adr-mapa` por dominio
9. `gerar-vetores-skill-br` — `.vectors.json` com casos canonicos
10. `mutar-e-rodar-hook` — mutation testing leve
11. `traduzir-erro-pt-br` — dicionario + regex pra stderr cru
12. `gerar-resumo-hooks-stats` — relatorio mensal de uso de hook

### 12.4 — Novos comandos (8)

1. `/comeco` — entrevista guiada 1 pergunta por vez (substitui overhead do /inicio)
2. `/retomar` — resumability declarativa (INV-012)
3. `/entregar <US>` — macro: /feature → /checkpoint → /release patch
4. `/painel` — tela de instrumentos (status + custo + linha do tempo + saude)
5. `/saude` — semaforo binario do projeto
6. `/adr-mapa` — visualizacao PT-BR de ADRs por dominio
7. `/adr-review <ADR-NNN>` — revisao periodica de ADR
8. `/auto-auditar-framework` — invoca meta-cetico
9. `/brief-framework <nome>` — analista importa conceitos de outro framework
10. `/stats-hooks` — ranking de hooks por uso
11. `/avisos` — agregador de soft warnings em PT-BR
12. `/memoria-consolidar` — invoca memory-skeptic

### 12.5 — Novas estruturas (8)

1. `.claude/.runtime/pipeline-state-<US>.json` — substitui sentinels
2. `.claude/.runtime/handoff/<from>-para-<to>-<sess>.json` — payload tipado
3. `.roldao/inbox/<agent>/<msg-id>.json` — fila persistente entre agentes
4. `memory/.history/` — versionamento automatico de memoria
5. `memory/agent-notes/<agente>.md` — handoff entre agentes
6. `memory/cross-project/` (em `~/.claude/`) — memoria entre projetos
7. `.claude/adr-triggers.yml` — lista declarativa de areas sensiveis
8. `.claude/.runtime/{hook-stats,dismissed,audit-bias,usage}.jsonl` — telemetria local

---

## 13. ROADMAP CONSOLIDADO (5 Ondas)

### Onda 1 — Performance + Visibilidade imediata (2-3 dias)

**Tudo aqui tem ROI imediato e baixo risco:**
- Fast-path por path no `_lib.js` (P5.1)
- Manifest de hook (`@hook-meta` + `MANIFEST.json`) (P5.2)
- Hook contador `hook-stats.jsonl` (P11.1)
- `/avisos` (agregador soft warnings) (P5.4)
- `/saude` (semaforo binario) (P8.7)
- `metrics.jsonl` virar fonte unica de custo (P8.8)
- Tradutor automatico de erro PT-BR (P8.6)

### Onda 2 — Onboarding + Memoria (3-5 dias)

- Hook `require-agents-md-preenchido.js` (P7.1)
- Workflow `/comeco` entrevista guiada (P7.2)
- SessionStart `welcome-first-session.js` (P7.3)
- Deteccao de tipo de projeto no install (P7.4)
- `detect-existing-claude-md.js` (P7.6)
- `memory-router.js` RAG local (P2.1)
- `MEMORY-PRECEDENCE.md` (P2.2)
- `memory-budget.js` (P2.8)
- `memory/agent-notes/` (P2.5)

### Onda 3 — Fluxo de pipeline com payload + retomada (5-7 dias)

- Handoff payload JSON tipado (P1.1)
- Pipeline-state consolidado em 1 arquivo (P1.7)
- Migracao `migrate-runtime-markers.js`
- `/retomar` (P4.3)
- `pipeline-step-${US}.json` fora do `${sess}` (P3.1)
- `crashed-session-recovery.js` (P3.4)
- "Ultimo foco" estruturado (P3.6)
- Status line dinamica (P8.1)
- Painel ASCII no handoff (P8.2)
- `/painel` (P8.3)
- Auto-pulse a cada N tool calls (P8.4)
- Slow-agent warning (P8.5)
- Session-relay com heartbeat (P3.3)

### Onda 4 — Auditoria + ADRs como filme (4-6 dias)

- Tabela `audit_findings` + ciclo finding→fix→re-audit (P6.1)
- Severidade 2 tiers (P6.2)
- `audit-arbiter` (P6.3)
- Protocolo Sofia↔Pedro AC contestada (P6.4)
- Auditoria incremental (`audit_sha_base`) (P6.5)
- `audit-bias.json` + modo rigoroso automatico (P6.6)
- Gate humano de release (P6.7)
- Hook `require-adr-on-sensitive-area.js` (P9.1)
- `superseded-by` + `validate-adr-graph.js` (P9.2)
- ADR-Lite (DN-NNN) (P9.3)
- `/adr-review` + `adr-stale-reminder.js` (P9.4)
- `/adr-mapa` (P9.8)

### Onda 5 — Aprendizado + Testes + Comandos (4-6 dias)

- Agente `meta-cetico` (Otavio) + `/auto-auditar-framework` (P11.2)
- Genealogia obrigatoria `origem:` (P11.3)
- `/bug` gera candidato a regra (P11.4)
- Diario mensal `/learning/` (P11.5)
- `/explicar-update` (P11.6)
- `dismissed.jsonl` (P11.7)
- `/brief-framework` (P11.8)
- Consolidar comandos 12 nucleo + alias (P4.1)
- `--rascunho` universal (P4.2)
- `/entregar` macro (P4.4)
- Telemetria local opt-in (P4.5)
- Versao por comando (P4.6)
- `/status --global` worktree (P4.8)
- Testes obrigatorios por hook (P5.5)
- `evals/skill-vectors/*.json` (P10.2)
- `evals/hooks-perf.test.js` (P10.3)
- Snapshot de agente (P10.4)
- Regressao PT-BR (P10.5)
- Canary release (P10.7)
- Mutation testing leve (P10.8)
- `vigia-fluxo` (Olivia) + agente SRE interno (P1.4)
- "Modo cetico" como flag por agente (P1.5)
- Paralelizacao Detetive+Lia (P1.3)
- Inbox persistente (P1.2)
- Gate iterativo inline (P1.6)

---

## 14. SINTESE — O QUE MUDA NO ROLDAO-METHOD APOS AS 5 ONDAS

**Antes (hoje):**
- Pipeline conta com markers binarios em `.runtime/`
- Memoria carrega tudo de uma vez
- Status line e foto, nao filme
- 23 hooks rodam em sequencia em cada Edit
- 28 comandos sem composabilidade nem retomada
- Auditoria post-fato com staleness check mas sem rastreio finding→commit
- ADR e estatico, sem revisao periodica
- Framework nao observa proprio uso
- Onboarding com armadilha silenciosa `_(preencher)_`
- Teste de framework e majoritariamente smoke

**Depois (apos 5 ondas):**
- Pipeline em `pipeline-state-<US>.json` com payload JSON tipado entre agentes
- Memoria recupera so o relevante por tarefa via tag-based RAG
- Status line dinamica + painel ASCII + `/painel` + `/saude` PT-BR
- Fast-path corta hooks de 23 pra ~5 por operacao
- 12 comandos nucleo + retomada universal + macros + dry-run
- `audit_findings` rastreado finding→fix→re-audit com tiers MUST-FIX vs TODO-POST-RELEASE
- ADR vira filme: superseded-by, `/adr-review`, `/adr-mapa`, DN-NNN para decisao leve
- `hook-stats.jsonl` + `meta-cetico` (Otavio) propoe regras novas e sunset baseado em uso
- `/comeco` entrevista guiada + hook bloqueador de `_(preencher)_`
- Matriz canonica por hook + skill-vectors + mutation testing nos 3 hooks criticos
- Framework vira **produto vivo evoluindo**, nao monolito estatico

---

## 15. NAO ESCOPADO AQUI (vive em arquivos companheiros)

- Padroes BR (LGPD/Fiscal/Pix) → `2026-05-26-licoes-do-lionclaw.md` §1, 2, 5
- Addon `electron-br` materializado → `licoes-do-lionclaw.md` §3, 4
- Pipeline engine declarativo + agent-runtime polimorfico → `auditoria-pipelines-lionclaw.md`
- Workflow `/documentar-repo` (23 fases) → `auditoria-pipelines-lionclaw.md` §3
- `/auditoria-iterativa` com 3 rounds → `auditoria-pipelines-lionclaw.md` §4
- Templates Electron/frontend/banco → `licoes-do-lionclaw.md` §5, 6

Este arquivo cobre **fluxo INTERNO do framework**. Os outros 2 cobrem **conteudo BR e padroes tecnicos extraidos do lionclaw**.

---

_Proximo passo sugerido: priorizar a Onda 1 (performance + visibilidade) — 2-3 dias, ROI imediato, baixo risco. Foco em `hook-stats.jsonl` + fast-path + `/saude` + `/avisos` + manifest de hook. Tudo isso desbloqueia decisoes informadas nas ondas seguintes._
