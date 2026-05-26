---
tipo: prd
id: PRD-004
versao: 1
status: draft
owner: gerente-produto
revisado-em: 2026-05-26
escopo: evolucao do framework ROLDAO-METHOD pra v3.0.0 — Framework Aprendiz. Implementa as 3 auditorias de 2026-05-26 sem retirar nada do que ja existe (principio aditivo).
fontes:
  - docs/analises/2026-05-26-licoes-do-lionclaw.md
  - docs/analises/2026-05-26-auditoria-pipelines-lionclaw.md
  - docs/analises/2026-05-26-melhorias-fluxo-roldao.md
epico-filho-previsto: EP-003
stories-filhas-previstas:
  - US-117 (Onda 1 — Performance + Visibilidade imediata)
  - US-118 (Onda 2 — Onboarding sem armadilha + Memoria tag-based)
  - US-119 (Onda 3 — Pipeline com payload + retomada universal)
  - US-120 (Onda 4 — Auditoria com findings rastreaveis + ADRs como filme)
  - US-121 (Onda 5 — Framework aprendiz + telemetria local + meta-cetico)
  - US-122 (Onda 6 — Regras novas com IDs INV/SEC/TST/LGPD codificadas em hook)
  - US-123 (Onda 7 — Addon `electron-br` materializado)
  - US-124 (Onda 8 — Workflow `/documentar-repo` + agente documentation-master)
  - US-125 (Onda 9 — Skills core novas + templates de doc)
  - US-126 (Onda 10 — Hardening de testes + canary release + mutation testing)
  - US-127 (buffer + polimento + MIGRATION-v3.md)
adrs-decorrentes-previstos:
  - ADR-023 (Framework aprendiz — telemetria local opt-in + meta-cetico)
  - ADR-024 (Pipeline state como JSON consolidado convive com sentinel files legados)
  - ADR-025 (Handoff payload tipado entre agentes — contrato JSON minimo)
  - ADR-026 (Memory router com tag-based RAG local — Node puro zero-deps)
  - ADR-027 (Manifest de hook + fast-path por path + frontmatter `@hook-meta`)
  - ADR-028 (ADR-Lite DN-NNN coexiste com ADR completo — escala de overhead)
  - ADR-029 (Tabela `audit_findings` + ciclo finding-fix-re-audit como contrato)
  - ADR-030 (Addon `electron-br` como cidadao de primeira classe — primeiro addon com agentes/hooks/templates completos)
  - ADR-031 (Principio aditivo v3 — nada e removido, tudo evolui por extensao)
premissas:
  - "Versao confirmada como v3.0.0 (major bump) com MIGRATION-v3.md. Honra semver: regras novas sao bloqueadoras → quebra compatibilidade conceitual mesmo sendo aditivas."
  - "PRINCIPIO DE PRESERVACAO DE CAPACIDADE: nenhuma capacidade/funcao/funcionalidade do framework existente pode ser perdida na v3. Refatoracao e melhoria estrutural sao permitidas — mas se um comando/hook/agente/skill for renomeado, consolidado ou substituido, o caminho antigo precisa continuar possivel via alias, modo, ou flag de compatibilidade (`ROLDAO_METHOD_LEGACY_*`). Removivel apenas no v4 com aviso explicito de deprecation."
  - "As 3 auditorias de 2026-05-26 sao a fonte unica de escopo. Item nao listado em pelo menos 1 dos 3 arquivos NAO entra neste PRD."
  - "Cronograma realista: 14 semanas com 2 semanas de buffer. Roldao confirmou em INV-AGENT-005 que mudanca publica exige confirmacao — releases por onda permitem early feedback."
  - "PRD-003 (v2.0.0) precisa estar entregue ANTES desta US-117 comecar. Este PRD assume v2.0.0 como baseline estavel."
  - "Numeracao verificada em disco: PRD-001..PRD-003 existem -> este e PRD-004. US-101..US-116 existem -> proximas comecam em US-117. ADR-001..ADR-022 existem -> proximo ADR e ADR-023."
  - "Todos os 49 IDs novos de regra (INV-007..012, INV-AGENT-007..011, SEC-006/007, TST-005/006, LGPD-011) ja foram catalogados nos 3 arquivos de analise — esta US so codifica em REGRAS-INEGOCIAVEIS.md + hook."
  - "Telemetria local (hook-stats.jsonl, dismissed.jsonl, usage.jsonl, audit-bias.json) e 100% local-first — zero rede, zero servidor, zero PII. Decisao do Roldao (Node puro zero-deps)."
  - "Meta-cetico (Otavio) NUNCA aplica regra sozinho — sempre PROPOE pra Roldao aceitar/rejeitar (INV-AGENT-005)."
---

# PRD-004 — v3.0.0 Framework Aprendiz

> **PRD = Product Requirements Document.** Em PT-BR claro: documento que diz o que vamos construir, pra quem, por que, e como saberemos que deu certo. Spec-as-source (INV-002): este documento gera as user stories filhas (US-117..US-127) e o codigo.
>
> **Contexto:** este PRD consolida 3 auditorias paralelas de 2026-05-26 — uma sobre o lionclaw como referencia tecnica, uma sobre os pipelines do lionclaw, e uma sobre o proprio fluxo interno do ROLDAO-METHOD. As 3 produziram 76+ propostas concretas; este PRD organiza tudo em 10 ondas de entrega aditivas (v3.0.0).
>
> **Principio fundador desta release:** **NUNCA PERDER CAPACIDADE.** O Roldao foi explicito — pode melhorar, refatorar, criar coisa nova que substitui, **desde que o NOVO tenha tudo o que o ANTIGO tinha (ou mais)**. A questao nao e proibir mudanca estrutural — e garantir que nenhuma capacidade/funcao/funcionalidade existente desaparece. Toda refatoracao precisa provar que o caminho antigo continua possivel (mesmo via alias, modo, ou flag de compatibilidade).

---

## 1. Problema

O framework ROLDAO-METHOD esta na v2.0.0 (Auditoria 10-de-10). Funciona. Tem **44 hooks bloqueadores**, **17 agentes especialistas** com personas brasileiras, **28 workflows** em PT-BR, **19 skills BR** (validar CPF/CNPJ/Pix/NFe/PIS/CNH/etc.), **22 ADRs** documentando decisoes, e telemetria zero — porque Node puro zero-deps e diferencial.

Tres auditorias paralelas com 30 agentes (10 cada) feitas em 2026-05-26 expuseram **76+ pontos onde o framework atual nao captura todo o valor que poderia capturar**. Nao sao bugs — sao **gaps de maturidade** que aparecem quando o framework e usado de verdade. Foram organizados em 3 frentes:

**Frente 1 — Padroes BR e Electron extraidos do lionclaw.** O lionclaw (v2.2.0 — Electron BR ambicioso de ~10MB de codigo) e o caso real mais avancado que o Roldao tocou. Tem agent-runtime polimorfico, watchdog de 5 sinais, cofre de secrets em 3 camadas, 15 MCPs locais embarcados. Tem tambem god-files monstro (8198 linhas), 65% de migrations sao re-prompt de agente, zero acessibilidade na UI de pipeline. Cada dor do lionclaw e uma dor que o ROLDAO-METHOD pode prevenir mecanicamente com hook.

**Frente 2 — Padroes de pipeline e agent-runtime.** O lionclaw orquestra agentes IA com `agent-runtime/` polimorfico (cloud/local/external/codex), 70 seed-agents em 11 familias, watchdog de 5 sinais. O ROLDAO-METHOD hoje confia em markers binarios em `.claude/.runtime/` e em prosa de doutrina — funciona em fluxo curto, mas perde estado em auto-compactacao, nao retoma apos crash, nao tem payload tipado entre agentes.

**Frente 3 — Fluxo interno do proprio ROLDAO-METHOD.** Auditoria reflexiva. Achados criticos: 23 hooks PreToolUse rodando em cada Edit/Write custam 700ms-1.8s; `AGENTS.md` com `_(preencher)_` vira armadilha silenciosa; framework nao observa proprio uso (zero telemetria); auditoria entre Caio/Julia/Pedro nao tem arbitro mecanico; resolution tracker confia em marker, nao em commit. O framework prega "documento e estado compartilhado" (INV-001), mas ainda confia em folclore oral pra muito do proprio fluxo.

**Evidencia consolidada:**

- **3 arquivos de analise** com 30 agentes ao todo, ~3400 linhas de diagnostico cruzado
- **20 migrations v50..v71 do lionclaw** sendo 65% re-prompt de agente em vez de DDL real
- **god-file `pipeline-engine/index.ts` com 8198 linhas** (auditor humano vira refem de grep)
- **`anti-mascaramento.js` do proprio framework bloqueou o doc de analise** que so CITAVA padroes proibidos — sinal de hook sem allowlist por path
- **`pipeline-engine/index.ts:6133-6157` do lionclaw** mostra `publishDocArtifacts()` chamado por side-effect na fase 21, sobrescrevendo `docs/` do usuario sem confirmacao — 4 ondas de fix custaram ao Roldao
- **Zero `aria-live` em qualquer view de pipeline do lionclaw** — inacessivel pra screen reader (eMAG BR violada)
- **3 cascatas "fix the fix" em migrations:** v61→v62→v66, v63→v64, v59 com fix interno
- **Memoria do framework ja cresceu de 3 pra 7 arquivos** em 2 meses sem mecanismo de TTL nem consolidacao

---

## 2. Personas

| Persona | Quem e | O que quer | Onde sofre hoje |
|---|---|---|---|
| **Roldao — dono de produto BR** | Idealizador/dono de produto que NAO programa. Conhece o produto melhor que ninguem, mas nao escreve codigo nem traduz mensagem tecnica. Hoje opera com v2.0.0 atingindo ~80% das tarefas sozinho. | Atingir 100% das 5 tarefas-tipo. Saber em tempo real qual agente esta rodando, quanto custou a sessao, se o pipeline travou ou esta pensando. Retomar projeto depois de 3 dias sem perder contexto. Framework que aprende com o uso e propoe melhoria proativa em vez de exigir que ele lembre. | Status line e foto, nao filme. Sessao morre no meio de `/feature` e perde markers. AGENTS.md ainda tem `_(preencher)_` em 3 lugares ha semanas — ninguem avisa. Erro do agente sobe stack trace cru — Camila so traduz se chamada explicitamente. Custo da sessao invisivel — gastou R$ 80 ou R$ 8 hoje? |
| **Dev que adota framework em projeto Electron BR** | Programador experiente plugando ROLDAO-METHOD em produto Electron BR (NF-e, Pix, certificado A1, eSocial). | Templates Electron production-ready: builder.yml com asarUnpack, preload seguro com contextBridge, IPC tipado por dominio, cofre de secrets 3-camadas, migrations idempotentes com teste full-chain. Agentes especializados em arquitetura Electron + seguranca Electron. | Hoje o addon `electron-br` so existe no AGENTS.md §9 — nao tem agentes/skills/templates materializados. Dev acaba copiando padrao do lionclaw na unha e replicando os mesmos anti-padroes (god-file, prompt em migration, zero aria-live). |
| **Mantenedor de addon BR** (`fintech-br`, `fiscal-br-completo`, `lgpd-compliance`) | Autor de addon que estende o core. Depende do contrato de markers, shape de `_lib.js`, e formato dos hooks. | Saber quando o core muda contrato — receber sinal antes da quebra. Versionar addon contra versao do core. Plugar hooks/agentes/skills do addon sem colidir com o core. | Hoje contrato e implicito. v3.0.0 traz `pipeline-state-<US>.json` substituindo sentinels — mantenedores de addon precisam de janela de migracao. PRD-004 garante coexistencia: novo formato convive com markers legados por 1 release inteira. |
| **Auditor humano externo** (consultoria contabil, DPO terceirizado) | Profissional convocado pra auditar conformidade do projeto cliente — fiscal, LGPD, Pix, ou seguranca. Nao mexe no codigo, le evidencia. | Achar `audit_findings.jsonl` rastreaveis, `audit-bias.json` historico, `dismissed.jsonl` (regras contornadas). Saber o que o cliente recusou explicitamente. Sem precisar abrir o codigo. | Hoje auditoria humana le commit msg + ADRs. Falta dossier centralizado por sessao. v3 entrega isso como subproduto de `audit_findings` + telemetria local. |

---

## 3. Hipotese de solucao

Transformar o ROLDAO-METHOD em **Framework Aprendiz** — um produto que: (a) **observa o proprio uso** sem rede nem servidor (telemetria 100% local em JSONL); (b) **propoe melhorias proativas** via agente cetico `meta-cetico` (Otavio) que le telemetria e sugere regras novas / sunset; (c) **aprende entre projetos** via `memory/cross-project/` indexada por tag; (d) **carrega so o relevante** via tag-based RAG local em vez de despejar todo o `MEMORY.md` no contexto; (e) **fala em tempo real** com `/painel`, `/saude`, status line dinamica e tradutor automatico de erro PT-BR; (f) **rastreia findings ate o commit** com tabela `audit_findings` em vez de confiar em marker.

A v3.0.0 **preserva todas as capacidades existentes** — mas e livre pra refatorar, consolidar ou criar caminho novo quando isso melhora a experiencia, desde que o caminho antigo continue acessivel via alias/modo/flag de compatibilidade. Exemplos do que isso significa na pratica:

- **Pode** consolidar 28 comandos em 12 nucleo + 16 modos/alias, desde que `/epico` continue rodando (como alias pra `/feature --decompor`, por exemplo).
- **Pode** substituir sentinel markers por JSON consolidado, desde que `ROLDAO_METHOD_LEGACY_MARKERS=1` (default true na v3) mantenha sentinels funcionando.
- **Pode** reorganizar `memory/` em sub-pastas tematicas, desde que o `MEMORY.md` index continue apontando corretamente e nenhum conteudo seja perdido.
- **Pode** refatorar agente existente (Sofia, Detetive, Rafael), desde que prompt continue produzindo as mesmas frases-ancora obrigatorias (validado por snapshot test — AC-126-4).
- **NAO pode** retirar capacidade: nenhum slash command desaparece sem alias, nenhum hook deixa de bloquear cenario que ja bloqueava, nenhum agente perde habilidade documentada.

A solucao se decompoe em **11 ondas de entrega**, totalizando **14 semanas + 2 semanas de buffer = 16 semanas**, com release intermediario por onda (v3.0.0-next.0 a v3.0.0-next.10) e promocao final pra `latest` apos canary de 5 dias. Cada onda vira 1 user story filha (US-117..US-127), com criterios de aceitacao binarios e comando verificavel. A metrica final do produto NAO e "implementou todas as 76 propostas" — e **"o Roldao completa 8 tarefas-tipo sozinho com framework propondo proativamente"** (definidas na secao 6).


---

## 4. User stories (rastreaveis)

### US-117 — Onda 1: Performance + Visibilidade imediata (2-3 dias)

**Como** Roldao operando v2.0.0 hoje, **quero** sentir o framework mais rapido e ver o que esta acontecendo em tempo real **para** parar de ficar adivinhando se o Claude travou ou esta pensando.

**Criterios de aceitacao:**

- **AC-117-1** — `.claude/hooks/_lib.js` ganha funcao `shouldSkipForPath(toolInput, hookId)` que le tabela declarada em `.claude/hooks/MANIFEST.json`. Hooks que nao sao relevantes pro path saem com exit 0 em < 5ms. Edit em README.md aciona <= 5 hooks (era 23). Verificavel: `ROLDAO_HOOKS_VERBOSE=1 echo test > README.md` mostra contagem de hooks executados.
- **AC-117-2** — Frontmatter `// @hook-meta {...}` adicionado em todos os 44 hooks existentes + script `tools/gerar-manifest-hooks.js` gera `.claude/hooks/MANIFEST.json`. Manifest contem `{id, priority, paths_skip[], events[], blocks, rule_id}` por hook. Verificavel: `node tools/gerar-manifest-hooks.js && cat .claude/hooks/MANIFEST.json | jq '.hooks | length'` retorna 44+.
- **AC-117-3** — `.claude/hooks/hook-stats-recorder.js` (PostToolUse) anexa `{hook_id, decision, ts, projeto_hash, duration_ms}` em `.claude/.runtime/hook-stats.jsonl`. Arquivo cresce no uso real. `.gitignore` cobre o arquivo. Verificavel: rodar 10 Edits e ver `wc -l .claude/.runtime/hook-stats.jsonl` retornar >= 10.
- **AC-117-4** — Comando `/avisos` novo em `.claude/commands/avisos.md` le `.claude/.runtime/warnings.jsonl` (criado por `_lib.js` em todos os soft warnings) e mostra ultimos 20 traduzidos em PT-BR claro. Verificavel: forcar 3 soft warnings LGPD e rodar `/avisos` — saida lista os 3.
- **AC-117-5** — Comando `/saude` novo gera semaforo binario (verde/amarelo/vermelho) em 5 dimensoes: GIT, TESTES, STORIES, SEGURANCA, LGPD. Sem prosa. Verificavel: `/saude` cabe em 12 linhas de output.
- **AC-117-6** — `metrics.jsonl` virou fonte unica de custo. Hook `SubagentStop` grava `{agente, duracao_ms, tokens_in, tokens_out, custo_usd_estimado, modelo}`. Status line le do `metrics.jsonl`. Verificavel: status line mostra `$X.YZ` apos sessao com 1+ Task.
- **AC-117-7** — Hook `translate-errors-ptbr.js` (PostToolUse em qualquer tool com `is_error: true`) intercepta stderr, consulta `templates/dicionario-erros-ptbr.json` (criado), injeta versao PT-BR ANTES do erro tecnico. Erro tecnico fica em bloco colapsado. Verificavel: forcar `ENOENT` e ver "arquivo nao encontrado" antes do stack trace.

**Non-goals desta onda:**
- NAO mexer em comportamento de hook existente (so adicionar metadado + fast-path)
- NAO migrar markers (fica pra Onda 3)
- NAO acumular telemetria cross-project (fica pra Onda 5)

### US-118 — Onda 2: Onboarding sem armadilha + Memoria tag-based (3-5 dias)

**Como** Roldao iniciando projeto novo OU operando projeto com framework instalado ha 2 meses, **quero** o framework me ajudar ativamente a preencher contratos vazios e carregar so a memoria relevante pra tarefa em curso **para** parar de carregar 9KB de log de sprint pra responder "qual a stack?".

**Criterios de aceitacao:**

- **AC-118-1** — Hook `require-agents-md-preenchido.js` (PreToolUse Task) bloqueia qualquer subagente exceto `gerente-produto`/`analista`/`investigador` se `AGENTS.md` contem `_(preencher)_` em §1, §2 ou §6. Mensagem PT-BR sugere `/comeco`. Excecao: `.claude/settings.local.json` com `roldao.skip_onboarding: true`. Verificavel: criar AGENTS.md com placeholder e rodar `Task subagent=dev-senior` — exit 2.
- **AC-118-2** — Comando `/comeco` novo em `.claude/commands/comeco.md` faz entrevista guiada de 5 perguntas (nome do projeto, frase do que faz, quem usa, tipo SaaS/app/lib/CLI/Electron, stack detectada via `package.json` com confirmacao). Cada resposta vira commit atomico em `AGENTS.md`. Marker `.roldao-method/onboarding.json` com `{step, completed_at}`. Suporta `/comeco --continuar`. Verificavel: rodar `/comeco` 2x interrompido — retoma do passo certo.
- **AC-118-3** — Hook `welcome-first-session.js` (SessionStart) detecta primeira vez (sem `.roldao-method/onboarding.json`) e injeta system-reminder em PT-BR: "Primeira sessao nesse projeto. Voce pode: `/comeco` (5 min) | `/brownfield` (varrer existente) | `/help`."
- **AC-118-4** — `npx roldao-method install` detecta tipo de projeto via `package.json`/`requirements.txt`/`go.mod`/`Cargo.toml`/`pubspec.yaml`. Detectou Electron → pergunta "Instalo addon `electron-br` junto?". Detectou `nfe-`/`pix-`/`sped-` em deps → sugere `fintech-br` ou `fiscal-br-completo`. Verificavel: install em pasta vazia + `package.json` com `"electron": "*"` em deps → sugere addon `electron-br`.
- **AC-118-5** — Hook `detect-existing-claude-md.js` no install: se `CLAUDE.md` ja existe com conteudo, **NAO sobrescreve**. Cria `CLAUDE.md.roldao-merge-pendente` ao lado + reporta diff em PT-BR. Verificavel: instalar em pasta com CLAUDE.md de outro framework → arquivo original preservado.
- **AC-118-6** — `.claude/hooks/memory-router.js` (UserPromptSubmit) extrai keywords da pergunta do usuario, le frontmatter `tags:` de cada `.md` em `memory/`, injeta no contexto so os 3-5 mais relevantes via `<system-reminder>`. Reducao de ~70% no orcamento de memoria por turno. Verificavel: prompt "qual a stack?" carrega `project-stack.md` mas NAO `project-auditoria-10-10-decisoes.md`.
- **AC-118-7** — `.claude/rules/MEMORY-PRECEDENCE.md` (novo, ≤80 linhas) declara ordem canonica: `REGRAS-INEGOCIAVEIS.md` > `memory/*` (mais recente) > `AGENTS.md` > `CLAUDE.md projeto` > `CLAUDE.md global` > prompt-do-momento. Hook `memory-conflict-detector.js` (PostToolUse Read em memoria) avisa em soft warning quando detecta contradicao com regra carregada.
- **AC-118-8** — `memory/.history/` ganha versionamento automatico via hook `memory-history-snapshot.js` (PreToolUse Write/Edit sobre `memory/*`). Retencao 90 dias. Comando `/memoria-revisar <arquivo>` mostra diff entre versao atual e anterior.
- **AC-118-9** — Frontmatter de memoria ganha campo opcional `tags: [stack, lgpd, fiscal, pix, electron, frontend, banco, ...]`. Memorias existentes recebem tags via script de migracao automatico no install do v3.
- **AC-118-10** — `.claude/hooks/memory-budget.js` (SessionStart) mede tamanho total de `memory/`. > 50KB warn em PT-BR. > 100KB block ate rodar `/memoria-consolidar` novo.
- **AC-118-11** — `memory/agent-notes/<agente>.md` (novo conceito). Hook `SubagentStop` permite agente persistir nota curta (≤500 chars). Hook `SubagentStart` injeta nota relevante no prompt do proximo agente da cadeia. Verificavel: Sofia escreve nota, Detetive em sessao seguinte recebe a nota injetada.
- **AC-118-12** — `~/.claude/memory-cross-project/` (memoria cross-project) habilitada por hook `SessionStart`. Frontmatter do projeto declara `cross-project-tags: [pix, lgpd, electron]`. Hook injeta memorias cross-project com tag matching. Diferencial competitivo concreto.

**Non-goals desta onda:**
- NAO implementar `memory-skeptic` (agente vai pra Onda 5)
- NAO mexer em `MEMORY.md` index (so adicionar tags em memorias individuais)

### US-119 — Onda 3: Pipeline com payload + retomada universal (5-7 dias)

**Como** Roldao rodando `/feature` em US grande que demora horas, **quero** retomar exatamente de onde parei depois de auto-compactacao OU crash OU `--continue` na sessao seguinte **para** parar de refazer trabalho que ja estava feito.

**Criterios de aceitacao:**

- **AC-119-1** — Formato `.claude/.runtime/pipeline-state-<US>.json` consolidado criado. Schema declarado em `.specify/schemas/pipeline-state.schema.json`: `{version: 1, pipeline: 'feature'|'bug'|'hotfix'|..., us_id, started_at, etapas: [{agente, status: 'pending'|'running'|'done'|'skipped'|'failed', started_at, finished_at, marker_sha, handoff_payload_path}], current: <agent_id>}`. Verificavel: rodar `/feature US-001` interrompido em meio → ler JSON e ver `current: 'detetive'`.
- **AC-119-2** — Hook `migrate-runtime-markers.js` (SessionStart) le sentinels legados `*-done-*` em `.claude/.runtime/` e popula `pipeline-state-<US>.json` correspondente se faltar. **Sentinels legados continuam funcionando.** Coexistencia controlada por flag `ROLDAO_METHOD_LEGACY_MARKERS=1` (default true). Verificavel: projeto com markers v2 funciona em v3 sem mudar nada.
- **AC-119-3** — Formato `.claude/.runtime/handoff/<from>-para-<to>-<sess>.json` criado. Schema em `.specify/schemas/handoff-payload.schema.json`: `{us_id, ac_destacadas: string[], hipoteses_a_investigar: string[], decisoes_propostas: string[], arquivos_relevantes: string[], proximas_perguntas: string[], confianca: 'alta'|'media'|'baixa'}`. Hook `require-handoff-payload.js` (PostToolUse SubagentStop) bloqueia em soft warning se agente fechou sem payload. Modo aprende: warning na v3.0.0, block na v3.1.0.
- **AC-119-4** — Comando `/retomar` novo le `.claude/.runtime/pipeline-state-*.json` + ultimo `docs/checkpoints/`, mostra em PT-BR: "ultima sessao parou apos Detetive em US-024. Falta Rafael → Bruno → Ines → 3 auditores. Continuar? (S/N)". Marker `feature-active-<sess>` persiste cross-session via `pipeline-step-${US}.json` (nao mais atrelado a `${sess}`).
- **AC-119-5** — `bin/lib/session-relay.js` ganha funcao `measureProgress()` alem de `measureUsage()`. Se 15min sem nova entrada em `metrics.jsonl` mas processo vivo → grava `agent-stalled-${ts}` em `.runtime/`, exibe aviso PT-BR: "agente parado ha 15min. Talvez tenha travado — Ctrl+C 2x e `claude --continue`."
- **AC-119-6** — Hook `crashed-session-recovery.js` (SessionStart) varre `.runtime/`, calcula idade de markers `*-active-*`. > 4h sem write em transcript → marca `crashed: true` em `session-state.json` + oferece "recuperar US-117 que parou no meio? (S/N)".
- **AC-119-7** — Hook `session-diary.js` (SessionEnd, apos snapshot) gera 1 pagina PT-BR em `docs/diario/AAAA-MM-DD-HHmm.md`: arquivos tocados (`git diff --stat HEAD@{session_start}`), comandos rodados (`metrics.jsonl`), agentes invocados (markers `*-done-*`), proximo passo sugerido. Diferente do CHANGELOG — granular por sessao.
- **AC-119-8** — `session-snapshot-restore.js` ganha bloco "ULTIMO FOCO" estruturado: 3 linhas no stderr — `Ultima story: US-117 (Bruno fez, falta Ines). Ultima investigacao: 2 dias atras em investigation-US-117.json. Proximo passo logico: rodar /historia ou /sprint`. Le `pipeline-step-*.json` + `investigation-*.json` + `last-research-path`.
- **AC-119-9** — Status line dinamica: troca "ultimo agente -done-" por agente CORRENTE + posicao no pipeline. Cada agente cria `<slug>-running-<ts>` em SubagentStart e renomeia pra `-done-` em SubagentStop. Formato: `v3.0.0 - Opus - main - US-118 - [3/7 Rafael] - $1.40 - 22% contexto`.
- **AC-119-10** — Painel ASCII no inicio de cada handoff entre agentes. Hook `handoff-progress-render.js` (PreToolUse Task quando dentro de pipeline ativo) injeta linha: `=== /feature US-118 === [OK] Sofia (1/7) - [OK] Detetive (2/7) - [ATIVO] Rafael (3/7) - [aguarda] Bruno (4/7) - [aguarda] Ines (5/7) - [aguarda] Caio+Julia+Pedro (6-7/7)`. ~20 tokens de overhead, ROI alto.
- **AC-119-11** — Comando `/painel` novo combina status + custo + linha do tempo + saude em UM output visual. Le `pipeline-state-*.json` + `metrics.jsonl`. Saida cabe em 24 linhas. ASCII puro, sem unicode complexo (compat Windows terminal).
- **AC-119-12** — Hook `auto-pulse.js` (PostToolUse) conta tool calls na sessao em `.claude/.runtime/tool-count`. A cada 15 chamadas OU 5min, agente principal recebe system-reminder pulse: "Rafael escrevendo ADR-008 ha 4min. Proximo: Bruno. Gasto ate agora: $2.10."
- **AC-119-13** — Hook `worktree-advisor.js` (SessionStart) le stories `status: in-progress` em `docs/stories/` + cruza com `pipeline-state-*.json`. 3+ stories em curso + commits cruzam arquivos disjuntos → sugere `git worktree add`. 2 stories tocam mesmo arquivo (via `git log --name-only -n 20`) → avisa "NAO paralelize US-A e US-B".

**Non-goals desta onda:**
- NAO mexer em comportamento de agente (so adicionar payload de handoff)
- NAO substituir sentinel markers — coexistencia explicita por 1 release inteira
- NAO implementar `vigia-fluxo` (Olivia) — vai pra Onda 5

### US-120 — Onda 4: Auditoria com findings rastreaveis + ADRs como filme (4-6 dias)

**Como** Roldao rodando `/auditoria` em release importante, **quero** rastrear cada finding ate o commit que o resolveu E ter ADRs que evoluem (nao foto estatica) **para** parar de re-auditar a mesma coisa porque ninguem provou que foi resolvido.

**Criterios de aceitacao:**

- **AC-120-1** — Formato `.claude/.runtime/audit-finding-{seg|qual|prod}-${SESSION}.jsonl` criado. Schema em `.specify/schemas/audit-finding.schema.json`: `{finding_id: 'AF-NNN', severity: 'must-fix-merge'|'todo-post-release'|'info', rule_id, file, line, descricao_pt_br, status: 'open'|'closed-by-<sha>'|'arquivado-com-justificativa', tier_justificativa}`. Cada auditor (Caio/Julia/Pedro) ao bloquear escreve seu jsonl. Hook `require-tier-on-finding.js` rejeita finding sem `severity`.
- **AC-120-2** — Hook `require-findings-resolved.js` (PreToolUse Bash quando commit) le `audit-finding-*.jsonl` + diff do commit. Bloqueia commit final se `status=open` && `severity=must-fix-merge`. Dev referencia `Fixes: AF-001, AF-003` na msg pra fechar. Re-auditoria muda `status: closed-by-<sha>`.
- **AC-120-3** — Severidade em 2 tiers operacionais + 1 informativo: `MUST-FIX-MERGE` (bloqueia merge), `TODO-POST-RELEASE` (registra como divida tecnica), `INFO` (so registra). Hoje "criticos/altos/medios/baixos" continua valido — apenas adiciona campo `tier:` obrigatorio.
- **AC-120-4** — Agente `audit-arbiter` novo em `.claude/agents/audit-arbiter.md`. **NAO e auditor — e mediador.** Acionado quando 2 auditores produzem recomendacoes contraditorias no MESMO arquivo. Consome os 2 findings e produz UMA recomendacao aplicando precedencia (Caio > Pedro > Julia > Ines). Saida em `arbiter-decision-${SESSION}.json` com justificativa. Bruno so ve uma orientacao. **NAO e recursivo** — arbiter nao chama arbiter (INV-AGENT-007).
- **AC-120-5** — Protocolo Sofia↔Pedro "AC contestada". Pedro discorda de AC (nao de aderencia a AC, da AC EM SI) → NAO bloqueia → escreve `docs/stories/contestacoes/US-NNN-AC-N.md`. Workflow `/replanejar` le contestacoes antes de aceitar US como fechada. Hook `validate-story-approvals.js` ganha campo opcional `ac_contestadas:` no frontmatter.
- **AC-120-6** — Auditoria incremental via `audit_sha_base`. Marker JSON ganha campo `audit_sha_base` = sha do ultimo diff aprovado. Re-auditoria apos fix le `git diff $audit_sha_base...HEAD` e audita so o delta. Acelera 5x re-auditoria em ciclo iterativo. Compat: se `audit_sha_base` ausente, comporta como v2 (audita tudo).
- **AC-120-7** — `.claude/.runtime/audit-bias.json` acumula `{rule_id, miss_count, last_miss_at}` ao longo de releases. Quando `miss_count >= 3` numa regra, o respectivo auditor entra em **modo rigoroso automatico** (Caio em LGPD-004 que vazou 3x, Julia em TST-001 contornado recorrente). Skill leve, sem agente novo.
- **AC-120-8** — `.claude/.runtime/release-approval-${VERSAO}.json` exigido por hook `require-human-release-approval.js` antes de `git tag`. Schema: `{aprovado_por: '<nome humano>', timestamp, checklist_lido: true, todo_post_release_aceitos: ['AF-007','AF-012']}`. Roldao preenche com 1 comando: `/release --aprovar v3.0.0`.
- **AC-120-9** — Comando `/auditoria --coach` modo coach. Mesmos 3 auditores, saida adapta linguagem: "achei senha sendo logada no login. **Por que e ruim:** [..] **Como arrumar:** [..] **Por que isso resolve:** [..]". Reaproveita skill `traduzir-jargao` existente.
- **AC-120-10** — Workflow `/auditoria-iterativa` novo (alem do `/auditoria` existente que continua valido). 3 rounds max + criterio de parada `riscos_novos == 0`. Hook `enforce-audit-iteration.js` bloqueia commit se `riscos_novos != 0` no ultimo round. Tabela opcional `audit_round` em `.claude/.runtime/audit-rounds-${SESSION}.jsonl`. Template `templates/auditoria.md` com formato Cn/An/Mn/Bn/Gn/Rn/ALT-n.
- **AC-120-11** — ADR ganha campos `superseded-by` + `supersedes`. Hook `validate-adr-graph.js` valida bidirecionalidade. Skill `gerar-adr-pt-br` ganha modo `--supersede ADR-NNN`.
- **AC-120-12** — Conceito `docs/decisions/notas/DN-NNN-*.md` (ADR-Lite) criado. Template enxuto (≤30 linhas) com `tipo: decision-note`, `reversibilidade: alta|media|baixa`, `quando-virar-adr:`. Comando `/dn <titulo>`. Regra de promocao: 3 DNs do mesmo dominio = vira ADR consolidado (sugestao automatica em `/auto-auditar-framework`).
- **AC-120-13** — `.claude/adr-triggers.yml` (versionado, editavel) lista areas sensiveis: `paths: [src/auth/**, **/migrations/**, **/pix/**, **/nfe/**, **/secrets/**]` + `acoes: [adicionar-dependencia-runtime, mudar-formato-dado-persistido, trocar-algoritmo-criptografia, integrar-api-externa-paga]`. Hook `require-adr-on-sensitive-area.js` intercepta Write/Edit. Sem ADR/DN novo OU citacao em commit msg → exit 2.
- **AC-120-14** — Hook `adr-stale-reminder.js` (soft warning UserPromptSubmit). ADR com `status: aceito` + `revisado-em` > 180 dias → lembrete em sessao de planejamento. Workflow `/adr-review <ADR-NNN>` novo: Detetive le estado real, Rafael compara doc vs codigo, saida `mantido | superseded | deprecated`.
- **AC-120-15** — Comando `/adr-mapa` novo gera `docs/decisions/MAPA.md` auto agrupando ADRs por dominio + linhagem (`supersedes:`/`superseded-by:`). Util pro Roldao ver em 1 tela onde estao as decisoes.

**Non-goals desta onda:**
- NAO substituir auditores existentes — `audit-arbiter` so entra em CONFLITO
- NAO migrar ADRs antigos pra ter `superseded-by` automaticamente — preenchimento manual conforme casos surgirem
- NAO criar `meta-auditor` recursivo — INV-AGENT-007 bloqueia

### US-121 — Onda 5: Framework Aprendiz + telemetria local + meta-cetico (4-6 dias)

**Como** Roldao usando framework ha 6 meses, **quero** que o proprio framework me proponha melhorias baseado no MEU uso real **para** parar de depender so da minha memoria pra notar padroes que viraram regra.

**Criterios de aceitacao:**

- **AC-121-1** — Agente `meta-cetico` (Otavio) novo em `.claude/agents/meta-cetico.md`. Acionado por `/auto-auditar-framework`. Le `hook-stats.jsonl` + `docs/retros/*.md` + `docs/incidentes/INC-NNN-*.md` + ultimos 100 commits. Saida em `docs/learning/<data>-meta-cetico-r<N>.md`: **3 candidatos a regra nova** (padrao repetiu 3x) + **3 candidatas a sunset** (regra que nunca disparou em 90 dias OU contornada >50% das vezes). **NUNCA aplica sozinho — sempre propoe pra Roldao aceitar/rejeitar (INV-AGENT-005).**
- **AC-121-2** — Frontmatter de regra (INV/SEC/TST/LGPD/PIX/FISCAL) ganha bloco `origem:` obrigatorio:
  ```yaml
  origem:
    data: 2026-05-15
    incidente-ou-feedback: "INC-003 — PDF errado 3 vezes seguidas"
    sintoma-observado: "agente mudou template sem investigar flag no banco"
  ```
  Hook `require-origem-on-new-rule.js` bloqueia commit que adiciona ID novo a `REGRAS-INEGOCIAVEIS.md` sem `origem:`. Regras existentes ganham `origem:` em onda de retroformatacao (US-127).
- **AC-121-3** — Workflow `/bug` ganha etapa final: investigador classifica `padrao_recorrente: sim|nao|incerto` em `.claude/.runtime/bug-pattern-${US}.jsonl`. Quando 3 bugs distintos marcarem `sim` no mesmo dominio → `/auto-auditar-framework` propoe regra. **Threshold 3** (regra dos tres do XP) evita codificar coincidencia.
- **AC-121-4** — Tech-writer (Camila) ganha modo `--diario-aprendizado` (mensal). Compila 1x/mes: hooks mais disparados, regras propostas, regras sunseted, padrao de erro do agente que se repetiu, feedback do Roldao que ainda nao virou regra. Saida em `docs/learning/AAAA-MM.md`. 1 pagina. Acionado por `/aprendizado-mensal` novo OU automaticamente em `SessionStart` no dia 1 de cada mes.
- **AC-121-5** — Comando `/explicar-update <vAntiga> <vNova>` novo. Le o diff de changelog entre versoes E checa **o que afeta este projeto especifico**. Output PT-BR: "voce ganhou hook X que vai bloquear seu padrao Y; voce perdeu warning Z que era importante pra seu fluxo W".
- **AC-121-6** — `.claude/.runtime/dismissed.jsonl` rastreavel. Quando usuario contorna soft warning OU usa `--bypass` OU edita config pra desligar hook, grava `{regra, motivo_opcional, ts, projeto_hash}`. Apos 5 dismissals da mesma regra → meta-cetico sinaliza no proximo `/auto-auditar-framework`.
- **AC-121-7** — Comando `/brief-framework <nome>` novo. Analista (Cintia) le repo publico de spec-kit/Cline/Cursor/agents.md spec e devolve: padroes nao cobertos aqui que voce pode adotar + padroes que voce rejeita intencionalmente. Saida em `docs/analises/AAAA-MM-DD-brief-<nome>.md`. Sob demanda, nao automatico.
- **AC-121-8** — Agente `memory-skeptic` (sem persona nomeada) acionado mensalmente OU em SessionStart se ultima auditoria > 30 dias. Le cada memoria, compara com estado atual do repo, marca `status: obsoleta` ou propoe consolidacao. **Nao deleta — propoe.** Comando `/memoria-consolidar` invoca em modo agressivo.
- **AC-121-9** — Workflow `/release` ganha etapa final automatica: tech-writer gera 1-3 bullets de aprendizado e propoe arquivo em `memory/aprendizados/<data>-<tema>.md`. Roldao aprova com 1 sim/nao. Hook `enforce-reflection-on-release.js` bloqueia `git tag` se etapa nao rodou (modo aprende: warning v3.0.0, block v3.1.0).
- **AC-121-10** — Agente `vigia-fluxo` (Olivia) novo. SRE do PROPRIO FLUXO interno do framework (Marcos sre-on-call e reativo a incidente do cliente). Roda a cada SubagentStop, le `.runtime/`, gera `vigia-report-<sess>.md` com sinais: tempo entre Sofia e Detetive > 10min sem atividade, handoff payload com `confianca: baixa`, audit_sha em loop, agente pulado sem skip marker. **Nao bloqueia — escala** em soft warning.
- **AC-121-11** — Comando `/stats-hooks` novo. Le `hook-stats.jsonl`. Mostra: top 5 hooks mais disparados, top 5 que nunca bloquearam em 90 dias, top 5 com `decision:block` ignorado (sinal de falso positivo). Usado por meta-cetico como input.

**Non-goals desta onda:**
- NAO compartilhar telemetria entre usuarios (mantem 100% local)
- NAO auto-aplicar regra proposta pelo meta-cetico (INV-AGENT-005)
- NAO cron real — gatilho via `/loop` (skill existente) OU manual

### US-122 — Onda 6: Regras novas com IDs INV/SEC/TST/LGPD codificadas em hook (2-3 dias)

**Como** Roldao querendo que o framework prove proativamente as licoes do lionclaw, **quero** todos os IDs novos catalogados nas 3 analises codificados em `REGRAS-INEGOCIAVEIS.md` + hook bloqueador correspondente **para** evitar que projeto novo passe pelas mesmas dores.

**Criterios de aceitacao (codifica 17 IDs novos):**

- **AC-122-1** — `REGRAS-INEGOCIAVEIS.md` ganha **INV-007** (Geracao automatica de arquivo em path do usuario exige confirmacao + diff). Hooks `block-doc-overwrite-without-diff.js` + `enforce-read-before-write-doc.js` + `block-overwriting-user-docs.js`.
- **AC-122-2** — **INV-008** reforcada (warn 1500 linhas, block 3000 sem ADR; orquestrador ≤500). Hook `block-god-file.js`.
- **AC-122-3** — **INV-009** (Logica de fase mora junto da fase). Hook `block-phase-number-dispatch.js` — >5 ramos `phaseNumber === N` no mesmo arquivo.
- **AC-122-4** — **INV-010** (Workflow e dado + funcao). Soft warning em registry que so carrega metadado sem `handler`.
- **AC-122-5** — **INV-011** (Saida estruturada por fase). Hook `require-structured-phase-output.js` — proibe marker string como `[PHASE_COMPLETE]`.
- **AC-122-6** — **INV-012** (Workflow > 5 fases exige resumability declarada). Hook `require-pipeline-resumable.js`.
- **AC-122-7** — **INV-AGENT-007** (Max 2 rodadas de auditoria antes de escalar pra revisao humana). Hook `enforce-audit-iteration.js` (AC-120-10).
- **AC-122-8** — **INV-AGENT-008** (Spawn de agente IA exige AbortController + watchdog). Hook `require-watchdog-on-agent-spawn.js`.
- **AC-122-9** — **INV-AGENT-009** (Erro de pipeline herda de classe base com `userMessagePtBr`). Hook `enforce-user-message-on-pipeline-error.js`.
- **AC-122-10** — **INV-AGENT-010** (Passo de pipeline declara `timeout` explicito). Hook `require-timeout-on-pipeline-step.js`.
- **AC-122-11** — **INV-AGENT-011** (Componente que renderiza stream de pipeline tem `aria-live`). Hook `require-aria-live-on-pipeline-stream.js`.
- **AC-122-12** — **SEC-006** (Working tree nao pode conter `.tmp*`, `*.snapshot`, `*.bak`, `*.log` > 1MB nao declarado no `.gitignore`). Hook `block-tmp-log-in-tree.js`.
- **AC-122-13** — **SEC-007** (`dangerouslySkipPermissions:true` so via perfil declarado). Hook `require-permission-profile.js`.
- **AC-122-14** — **SEC-008** (Comando restrito por agente via frontmatter `restricted-to:`). Hook `enforce-command-permissions.js` (opt-in, default permissivo).
- **AC-122-15** — **TST-005** (Orcamento numerico de skip controlado + prompt de agente nunca em migration). Hooks `skip-budget-validator.js` + `block-prompt-in-migration.js`.
- **AC-122-16** — **TST-006** (Migration nova exige teste full-chain + seed-agent drift compara TODOS os campos). Hook `require-migration-test-fullchain.js` + reforco em `validate-seed-agent-drift.js`.
- **AC-122-17** — **LGPD-011** (Log de auditoria com conteudo livre exige mascaramento de PII; tabela `*_messages`/`*_phase_metrics` sem `purge_after_days`). Hooks `block-pii-in-audit-log.js` + `lgpd-pipeline-payload-reminder.js`.
- **AC-122-18** — Reforco do `anti-mascaramento.js` existente (NAO substitui): pega expect tautologico (true equals true, 1 equals 1) alem dos padroes ja cobertos. Allowlist por path: `docs/analises/**`, `docs/auditorias/**`, `templates/**.example`, `**/__tests__/hook-*-extra.test.js`.
- **AC-122-19** — `.claude/rules/roldao-method.md` ganha tabela atualizada hook→regra com TODOS os IDs novos. Origens documentadas no campo `origem:` (AC-121-2).

**Non-goals desta onda:**
- NAO mexer em regras existentes (INV-001..006 ficam intactas)
- NAO ligar hook em modo block antes de 1 release com modo warning (compatibilidade)

### US-123 — Onda 7: Addon `electron-br` materializado (5-7 dias)

**Como** Dev BR plugando ROLDAO-METHOD em produto Electron, **quero** o addon `electron-br` instalavel via `npx roldao-method add electron-br` com agentes/hooks/skills/templates production-ready **para** parar de copiar o padrao do lionclaw na unha e replicar os mesmos anti-padroes.

**Criterios de aceitacao:**

- **AC-123-1** — Pasta `addons/electron-br/` criada como cidadao de primeira classe. Estrutura: `agents/`, `hooks/`, `skills/`, `templates/`, `rules/`, `README.md`, `ADDON.json` (manifest). Instalavel via `npx roldao-method add electron-br`.
- **AC-123-2** — Agente `electron-architect` em `addons/electron-br/agents/electron-architect.md`. Gatilho: `/inicio` Electron, decisao main/preload/renderer, IPC contract. Entrega skeleton com `tsconfig` project references + `electron-vite.config.ts` com `externalizeDepsPlugin` configurado pra natives BR (better-sqlite3, keytar, sqlite-vec, node-pty, canvas).
- **AC-123-3** — Agente `electron-security` em `addons/electron-br/agents/electron-security.md`. Especialista de Caio (auditor-seguranca). Gatilho: Edit em `webPreferences`, `electron-builder.yml`, signing/notarization. Audita CSP, custom protocols, asar, code signing BR (A1/A3 vs Apple Developer ID), notarization Mac, atestado Windows.
- **AC-123-4** — Hooks Electron em `addons/electron-br/hooks/`:
  - `block-electron-insecure-webprefs.js` — bloqueia `nodeIntegration` ligado / `contextIsolation` desligado / `webSecurity` desligado em arquivo que importa `BrowserWindow`
  - `require-context-bridge-preload.js` — bloqueia `ipcRenderer` usado fora de `preload/`
  - `block-window-open-without-handler.js` — bloqueia `new BrowserWindow` sem `setWindowOpenHandler` no mesmo arquivo
  - `require-single-instance-lock.js` — projeto com SQLite/keytar sem `requestSingleInstanceLock()` = exit 2
  - `require-csp-meta.js` — `index.html` sem `<meta http-equiv="Content-Security-Policy">` = exit 2
- **AC-123-5** — Skills Electron em `addons/electron-br/skills/`:
  - `gerar-ipc-handler` — trio main+preload+renderer tipado (padrao lionclaw `electron/main/ipc/<feature>.ts` + `src/services/<feature>.ts` + tipos em `@shared`)
  - `gerar-preload-seguro` — template `preload/index.ts` com `contextBridge.exposeInMainWorld` + tipagem + padrao unsubscribe-returning
  - `validar-csp-electron` — checklist contra CSP do `index.html`
  - `gerar-secrets-vault-electron` — porta o padrao safeStorage → keytar → AES-GCM em 3 camadas (referenciado em `secrets-vault.ts` do lionclaw)
  - `gerar-migration-sqlite-segura` — template TS com BEGIN/COMMIT, guard idempotente, `noTransaction`/`foreignKeysOff` documentados, teste full-chain incluso
  - `gerar-mcp-local-electron` — template completo McpServer + StdioServerTransport + zod + watchdog (backoff `[1s, 5s, 30s]`, `taskkill /T` Windows anti-zumbi)
  - `windows-line-endings-check` — generaliza Windows Health Check do lionclaw (`core.autocrlf=false` + `.gitattributes` com `* text=auto eol=lf`)
- **AC-123-6** — Templates em `addons/electron-br/templates/`:
  - `electron-builder.yml.example` — production-ready (asarUnpack natives, extraResources MCPs, hardened runtime Mac + entitlements, NSIS Windows perMachine=false)
  - `preload-secure.ts.example` — esqueleto com `contextBridge` + tipagem `<App>API` + padrao unsubscribe
  - `main-index.ts.example` — boot completo: `requestSingleInstanceLock`, `protocol.registerSchemesAsPrivileged`, BrowserWindow seguro, `setWindowOpenHandler`, `before-quit` com cleanup+timeout, `uncaughtException` swallow EPIPE
  - `entitlements.mac.plist.example` + checklist de notarization (gap real do lionclaw — vira referencia)
  - `tsconfig.json` em project references (`electron/tsconfig.json` + `src/tsconfig.json` separados)
  - `package.json` com gates encadeados (`predev` rebuild nativo, `pretest` rebuild, `prebuild: npm test`, `predist: npm test`)
  - `db/migration-template.ts` — espelha `runMigration()` do lionclaw
  - `db/schema-template-pii.sql` — coluna PII com comentario `-- PII: tipo, base-legal, retencao-dias`
- **AC-123-7** — Rule `addons/electron-br/rules/electron-br.md` com `paths: ['**/*.tsx', '**/*.ts', 'electron/**', 'src/main/**', 'src/renderer/**', 'src/preload/**']` — checklist Electron BR: contextIsolation, IPC tipado, CSP, signing, retencao LGPD em SQLite.
- **AC-123-8** — `npx roldao-method add electron-br` integra com auto-deteccao da AC-118-4 (install detecta Electron e sugere addon).
- **AC-123-9** — `addons/electron-br/README.md` em PT-BR explica: quando usar, o que entrega, integracao com framework core, exemplo `/inicio` Electron BR.

**Non-goals desta onda:**
- NAO entregar addon `fintech-br` neste PRD (ja existe — apenas referencia)
- NAO migrar lionclaw pra usar este addon (lionclaw e cliente, nao framework)
- NAO escrever Windows Code Signing pago (custo de cert — fora do escopo)

### US-124 — Onda 8: Workflow `/documentar-repo` + agente documentation-master (5-7 dias)

**Como** Roldao herdando ou retomando projeto brownfield sem documentacao, **quero** rodar `/documentar-repo` e ter PRD retroativo + ADRs extraidos + SCHEMA/API/TYPES + README + RUNBOOK + ONBOARDING + CLAUDE.md gerados em 1 sessao **para** ter doutrina capturada em vez de codigo orfao.

**Criterios de aceitacao:**

- **AC-124-1** — Agente `documentation-master` em `.claude/agents/documentation-master.md`. Orquestrador. Gatilho: `/documentar-repo`. Coordena 23 fases em 7 stages (Scan→Triage→Architecture→Schema→Modules→Docs→Finalization) — referencia ao lionclaw mas reescritas em PT-BR + integradas ao formato de docs do framework (`docs/prd/`, `docs/decisions/`, `docs/internal/`).
- **AC-124-2** — Comando `/documentar-repo` novo em `.claude/commands/documentar-repo.md`. Etapas: (1) Scan: profila repo via `Glob` + `git log`, inventaria docs existentes, classifica gaps; (2) Triage: PRD retroativo + revisao; (3) Architecture: doc arquitetural + extrai ADRs do codigo; (4) Schema: SCHEMA.md + API.md + TYPES.md a partir de SQL/IPC/types; (5) Modules: pool paralelo de 3 workers (nao 5 como lionclaw — manter parcimonia); (6) Docs: README + RUNBOOK + ONBOARDING + USER_GUIDE; (7) Finalization: INDEX.md + AI Context (CLAUDE.md) + Skeptic.
- **AC-124-3** — **TODA escrita em `docs/` do usuario passa por staging + diff visual antes de aplicar** (INV-007 codificada). Stage 1: agente escreve em `.specify/runs/documentation-<runId>/`. Stage 2: engine calcula `PublishPlan` com `action: 'create'|'overwrite'|'identical'` + diff. Stage 3: confirmacao humana arquivo-a-arquivo via `/documentar-repo --publicar`. Stage 4: apply com lock per-project + manifest tracking. **Auto-publish proibido — vulnerabilidade residual do lionclaw nao se repete.**
- **AC-124-4** — Skill `gerar-doc-com-preservacao` em `.claude/skills/`. Template canonico pra qualquer doc-writer: (1) buscar doc equivalente em lista de candidates; (2) se existir, ler integralmente truncando 40KB UTF-8-safe via `StringDecoder` (nao `subarray().toString()` cego — quebra acento/emoji); (3) anti-symlink (`realpath` dentro de `projectRoot`); (4) output em diff; (5) marcar secoes `[novo]`, `[atualizado]`, `[preservado]`, `[deprecated]`.
- **AC-124-5** — Hook `block-doc-overwrite-without-diff.js` (PreToolUse Write/Edit) — path em `docs/**` + arquivo existe + diff > 30% sem flag explicita = exit 2 (codifica INV-007, ja em AC-122-1).
- **AC-124-6** — Hook `enforce-read-before-write-doc.js` — Write em `docs/X.md` sem ter chamado Read em `docs/X.md` na mesma sessao = exit 2 (codifica INV-007).
- **AC-124-7** — `docs/internal/` opcional adotado como padrao (`audit-log.md`, `tech-debt.md`, `core-systems.md`, `pipelines.md`, `file-map.md`, `contributing-pipeline.md`, `glossary.md`). Distincao explicita: `docs/internal/` = doutrina perene; `docs/<artefato>/` = artefatos de pipeline.

**Non-goals desta onda:**
- NAO substituir `/brownfield` existente (continua valido pra adocao incremental)
- NAO migrar projetos antigos pra docs/internal/ (so disponibilizar template)
- NAO suportar codebases > 50k arquivos (declarar limite explicito)

### US-125 — Onda 9: Skills core novas + templates de doc (3-5 dias)

**Como** Roldao em qualquer projeto, **quero** skills utilitarias do core (testar webapp, construir MCP, limpar memoria) e templates canonicos de auditoria/plano/SPEC/glossary **para** parar de inventar formato a cada vez.

**Criterios de aceitacao:**

- **AC-125-1** — Skill `testar-webapp` em `.claude/skills/testar-webapp/`. Playwright pra E2E browser. Gera teste pareando com persona `qa-automation` (Bia ja existe). Documenta padrao "1 e2e por jornada critica" em `templates/playwright.config.ts.example`.
- **AC-125-2** — Skill `construir-mcp` em `.claude/skills/construir-mcp/`. Guia pra criar MCP server em TypeScript stdio. Template completo (`src/index.ts` com `McpServer` + zod + `server.tool()`, `package.json` SDK pinado, `tsconfig.json`).
- **AC-125-3** — Skill `limpar-memoria` em `.claude/skills/limpar-memoria/`. Wrapper do agente `memory-skeptic` em modo manual. Util pra Roldao executar consolidacao quando quiser.
- **AC-125-4** — Skill `gerar-handoff-payload-pt-br` — molde de JSON tipado entre agentes (AC-119-3).
- **AC-125-5** — Skill `gerar-painel-saude-pt-br` — output do `/saude` (AC-117-5).
- **AC-125-6** — Skill `gerar-painel-instrumentos` — output do `/painel` (AC-119-11).
- **AC-125-7** — Skill `gerar-decision-note-pt-br` — DN-NNN enxuto (AC-120-12).
- **AC-125-8** — Skill `gerar-mapa-adr` — output do `/adr-mapa` (AC-120-15).
- **AC-125-9** — Skill `gerar-vetores-skill-br` — gera `.vectors.json` com casos canonicos pra skills BR.
- **AC-125-10** — Skill `mutar-e-rodar-hook` — mutation testing leve.
- **AC-125-11** — Skill `traduzir-erro-pt-br` — wrapper do hook `translate-errors-ptbr.js` (AC-117-7) pra uso programatico.
- **AC-125-12** — Skill `gerar-resumo-hooks-stats` — relatorio mensal de uso de hook.
- **AC-125-13** — Templates de doc em `templates/docs/`:
  - `templates/docs/auditoria.md` — formato Cn/An/Mn/Bn/Gn/Rn/ALT-n com frontmatter `round`+`parent-audit`
  - `templates/docs/plano-fix.md` — padrao "Ondas" + tabela visao geral
  - `templates/docs/debito-tecnico.md` — lista numerada com status `aberto|parcial|resolvido`
  - `templates/docs/SPEC.md` + `SPEC_PROGRESS.md` — agregado por epico + tracker
  - `templates/docs/glossary.md` — regras nomeadas tipo R2/R6/R7 citaveis
  - `templates/docs/discovery-notes.md` — output enxuto do `analista` no `/brief`
  - `templates/docs/ADR-pipeline-resumability.md` — template ADR especifico
  - `templates/docs/ADR-prompts-fora-da-migration.md` — template ADR especifico
  - `templates/docs/ADR-retencao.md` — template LGPD-002
- **AC-125-14** — `templates/CLAUDE.md.example` ganha bloco opcional `## 0. Overrides (modo de operacao deste projeto)` comentado pronto pra ativar. Documenta mecanismo de override sem precisar adivinhar (resolve INSIGHT 10.6 do `licoes-do-lionclaw.md`).
- **AC-125-15** — Templates frontend em `templates/`:
  - `templates/component-acessivel.tsx` (focus trap + useId + ARIA — referencia `Modal.tsx` do lionclaw)
  - `templates/zustand-store.ts` (interface State + actions tipadas + persist opcional)
  - `templates/form-zod-react-hook-form.tsx`
  - `templates/tsconfig-strict.json` (preset estrito)

**Non-goals desta onda:**
- NAO criar addon `design-system-br` com 8 skills de "design taste" do lionclaw (avaliar separadamente — fora de v3)
- NAO criar addon `mcp-dev` (skill `construir-mcp` no core ja resolve)
- NAO criar addon `docs-office-br` (avaliar separadamente)

### US-126 — Onda 10: Hardening de testes + canary release + mutation testing (3-5 dias)

**Como** Roldao publicando v3.0.0 e mantenedor de addons que dependem do core, **quero** ter prova de que os hooks bloqueiam o que deveriam E nao bloqueiam o que nao deveriam **para** confiar que upgrade nao quebra projetos clientes.

**Criterios de aceitacao:**

- **AC-126-1** — `templates/.claude/hooks/__tests__/<hook>.test.js` obrigatorio pra cada hook bloqueador. Minimo 3 casos por hook: (a) input que DEVE bloquear → exit 2/decision:block; (b) input que NAO deve bloquear (caso adjacente perigoso pra falso positivo); (c) input degenerado (vazio, malformado, sem stdin) → exit 0 ou erro controlado, nunca crash. Script `tools/validar-cobertura-hooks-comportamento.js` falha CI se hook bloqueador sem `__tests__/`.
- **AC-126-2** — `evals/skill-vectors/<skill>.vectors.json` criado pra skills criticas (validar-cpf-cnpj, validar-chave-acesso-nfe, validar-boleto, mascarar-dado-pessoal, gerar-br-code). Casos obrigatorios: 5 CPFs validos reais publicos, 5 invalidos por motivo (DV1/DV2/repetido/curto/letras), CNPJ alfanumerico do Manual RF, BR Code do Manual Bacen 03.34 (saida EMV byte-a-byte conhecida). Runner em `evals/run-vectors.js`.
- **AC-126-3** — `evals/hooks-perf.test.js` com orcamento por hook. Mede tempo em PreToolUse tipico. Falha CI se > 250ms (PreToolUse mediano) ou > 500ms (Stop/SubagentStop). Metrica em `evals/perf-baseline.json` versionado — regressao > 30% bloqueia merge.
- **AC-126-4** — `evals/agent-snapshot/<agente>.snapshot.eval.md` criado pra cada 1 dos 17+ agentes. 1 prompt canonico de gatilho + lista de frases-ancora obrigatorias (Sofia tem que escrever `AC-`; Detetive tem que mencionar "li o estado real"; Camila tem que produzir `### O que muda pra voce`). Runner usa Claude SDK headless.
- **AC-126-5** — `test/regressao-pt-br.test.js` varre `templates/.claude/agents/*.md`, `templates/.claude/skills/*/SKILL.md`, `templates/.claude/commands/*.md` e falha se aparecem strings claramente EN ("Please ", "Make sure to", "Note that", "Workflow ", "Step ", "Check that", "Output"). Allowlist por palavra tecnica intraduzivel (`SDK`, `commit`, `npm`).
- **AC-126-6** — `test/install-idempotencia.test.js` cobre 3 cenarios: (a) install em pasta com `.claude/settings.json` customizado → preservar ou diff visivel; (b) `update` em projeto com hooks customizados em `.claude/hooks/<custom>.js` → nao apagar; (c) reinstall consecutivo (idempotencia).
- **AC-126-7** — Canary release habilitado. `npm publish --tag next` publica `3.0.0-next.0` com `dist-tag = next`. Roldao instala em projeto-cobaia com `npx roldao-method@next install`. **5 dias de soak** antes de promover pra `latest`. Documentado em ADR-032 (sera criada como decorrente).
- **AC-126-8** — Mutation testing leve em 3 hooks criticos (`anti-mascaramento`, `block-destructive`, `secrets-scanner`). Script `tools/mutar-e-rodar.js` (~80 linhas, Node puro): aplica 5 mutacoes simples (negar comparacao, trocar operador, remover regex), roda `__tests__/<hook>.test.js`, exige que **pelo menos 4 das 5 mutacoes sejam detectadas**.
- **AC-126-9** — `tools/validar-templates.js` existente reforcado: agora valida tambem que cada novo IDs (INV-007..012, INV-AGENT-007..011, SEC-006/007/008, TST-005/006, LGPD-011) tem (a) entrada em `REGRAS-INEGOCIAVEIS.md` com `origem:`, (b) hook correspondente em `.claude/hooks/`, (c) entrada na tabela em `.claude/rules/roldao-method.md`.

**Non-goals desta onda:**
- NAO migrar pra Vitest (Node puro zero-deps e diferencial — manter)
- NAO usar Stryker (mutation testing usa script Node puro proprio)
- NAO testar Playwright/E2E do framework em si (framework e CLI + arquivos, sem UI)

### US-127 — Onda 11: Buffer + polimento + MIGRATION-v3.md (1-2 semanas)

**Como** Roldao publicando major bump v3.0.0, **quero** documento de migracao claro + buffer pra hotfix imprevisto + retroformatacao de regras antigas com `origem:` **para** publicar com tranquilidade.

**Criterios de aceitacao:**

- **AC-127-1** — `MIGRATION-v3.md` criado em raiz. Cobre: (a) flag `ROLDAO_METHOD_LEGACY_MARKERS=1` continua valida (estende ADR-021); (b) novo formato `pipeline-state-<US>.json` coexiste com sentinels legados; (c) novo formato `audit-finding-*.jsonl` opcional na v3.0.0, obrigatorio na v3.1.0; (d) hooks novos em modo warning v3.0.0, block v3.1.0; (e) frontmatter `tags:` opcional v3.0.0, obrigatorio v3.1.0; (f) `MEMORY.md` continua funcionando.
- **AC-127-2** — Retroformatacao de regras antigas. Todas as 49 regras existentes em `REGRAS-INEGOCIAVEIS.md` ganham campo `origem:` preenchido (best effort com base em git log + ADRs + retros). INV-006 ja faz isso na prosa — generaliza.
- **AC-127-3** — `docs/learning/2026-MM.md` (primeiro diario mensal) publicado. Camila gera baseline pos-release v3.0.0.
- **AC-127-4** — `/explicar-update v2.0.0 v3.0.0` testado em 3 projetos clientes (sandbox interno) com saida PT-BR clara.
- **AC-127-5** — Release notes em `docs/releases/v3.0.0.md` em PT-BR claro pra dono de produto. Camila modo REL. Topicos: "O que muda pra voce (nao-programador)" + "Por que importa" + "Como aplicar" + "Atencao (breaking changes conceituais)".
- **AC-127-6** — `README.md` do framework ganha badge `v3.0.0` + bloco "Novidades v3.0" com 5-7 bullets.
- **AC-127-7** — `AGENTS.md` do framework ganha entrada `documentation-master`, `audit-arbiter`, `meta-cetico` (Otavio), `memory-skeptic`, `vigia-fluxo` (Olivia) na tabela §4 Modelo de agentes.
- **AC-127-8** — Buffer de 1 semana pra hotfix paralelo identificado durante canary.
- **AC-127-9** — `gh release create v3.0.0` publicado com release notes em PT-BR + tarball + assets. (Roldao autoriza explicitamente conforme INV-AGENT-005.)

**Non-goals desta onda:**
- NAO publicar npm pacote sem autorizacao explicita do Roldao (memoria `feedback-npm-publish.md` reforca isso)
- NAO mudar visibilidade publica do repo
- NAO comprar dominio, plano, ou qualquer gasto sem autorizacao

---

## 5. Non-goals (INV-003)

O que NAO esta no escopo desta v3.0.0:

- **Compartilhamento de telemetria entre usuarios.** Telemetria local-first. Zero rede. Zero servidor. Zero PII. Decisao do Roldao (memoria `project-stack.md` — Node puro zero-deps).
- **Auto-aplicacao de regra proposta por meta-cetico (Otavio).** Otavio SEMPRE propoe — Roldao aceita/rejeita (INV-AGENT-005).
- **Cron real / daemon de fundo.** Tarefas periodicas via skill `/loop` existente OU gatilho manual via comando. Sem processo de fundo.
- **Migracao destrutiva.** Sentinels legados continuam funcionando 1 release inteira (`ROLDAO_METHOD_LEGACY_MARKERS=1` default true). Deprecation aviso explicito em `MIGRATION-v3.md` antes de qualquer remocao no v4.
- **Addon `fintech-br` / `fiscal-br-completo` neste PRD.** Ja existem como addons — apenas referenciados. Materializacao do `electron-br` (US-123) e o unico addon entregue na v3.0.0.
- **Addon `design-system-br`, `mcp-dev`, `docs-office-br`.** Catalogados nas analises mas adiados pra v3.1.0 ou posterior.
- **Workflow `/auditoria-iterativa` substituir `/auditoria`.** Ambos coexistem — Roldao escolhe quando rodar one-shot ou iterativo (preserva capacidade).
- **Remocao de comandos existentes.** Todos os 28 comandos atuais continuam funcionando. Comandos novos sao adicionados; alias internos coexistem.
- **Mutation testing em todos os hooks.** Apenas 3 hooks criticos: `anti-mascaramento`, `block-destructive`, `secrets-scanner`.
- **Suporte a codebase > 50k arquivos no `/documentar-repo`.** Limite declarado explicito.
- **Reescrever agentes existentes.** Snapshot test (AC-126-4) prova que prompt antigo continua produzindo as mesmas frases-ancora obrigatorias.
- **Refactor de `metrics.jsonl` existente.** Apenas estender com campos novos (compat backward).
- **Pacote npm publicado automaticamente.** Roldao autoriza explicitamente cada release (INV-AGENT-005 + memoria `feedback-npm-publish.md`).
- **Telemetria de uso compartilhada cross-projeto sem opt-in explicito.** `~/.claude/memory-cross-project/` exige declaracao explicita em `CLAUDE.md` (`cross-project-tags: [...]`).

---

## 6. Metricas de sucesso

> Metrica final do produto NAO e "implementou 76 propostas". E "Roldao completa 8 tarefas-tipo sozinho com framework propondo proativamente".

### 6.1 — 8 tarefas-tipo do Roldao (validacao humana binaria)

| # | Tarefa-tipo | Como medir |
|---|---|---|
| 1 | Iniciar projeto novo do zero ate primeira US implementada | `/comeco` + `/feature US-001` sem ajuda humana |
| 2 | Adotar repo legado em 30min | `/brownfield` em projeto sandbox + `AGENTS.md` preenchido |
| 3 | Reportar bug e receber correcao com investigador rodando primeiro | `/bug` com observacao real → patch que cita `INV-006` |
| 4 | Fechar release minor com aprendizado registrado | `/release patch` → `memory/aprendizados/<data>.md` criado + tag git + `gh release` |
| 5 | Retomar sessao 3 dias depois sem perder contexto | `claude --continue` apos 3 dias → status line mostra pipeline ativo + ultimo foco |
| 6 | Auditar release com findings rastreaveis | `/auditoria` → cada finding tem `AF-NNN`, fix referencia `Fixes: AF-001` em commit msg |
| 7 | Aceitar/rejeitar proposta de regra do meta-cetico | `/auto-auditar-framework` apos 30 dias de uso → Otavio propoe regra, Roldao decide em 1 sim/nao |
| 8 | Documentar repo brownfield sem sobrescrever doc existente | `/documentar-repo` em repo com `docs/PRD.md` existente → diff visual + `--publicar` exigido |

### 6.2 — Metricas tecnicas (verificaveis por script)

| Metrica | Valor atual (v2.0.0) | Meta v3.0.0 | Como medir |
|---|---|---|---|
| Latencia mediana de PreToolUse Write/Edit | ~1000ms | ≤ 250ms | `evals/hooks-perf.test.js` AC-126-3 |
| Hooks executados por Edit em README.md | 23 | ≤ 5 | `ROLDAO_HOOKS_VERBOSE=1` AC-117-1 |
| Cobertura comportamental de hooks bloqueadores | ~30% | 100% | `tools/validar-cobertura-hooks-comportamento.js` AC-126-1 |
| Mutation kill rate em 3 hooks criticos | N/A | ≥ 4/5 mutacoes detectadas | AC-126-8 |
| Skills BR com vetores canonicos | 0 | 5 (CPF/CNPJ/NFe/Boleto/Pix) | AC-126-2 |
| Agentes com snapshot test | 2 | 17+ | AC-126-4 |
| Strings EN em templates/agentes/skills/commands | desconhecido | 0 (allowlist) | `test/regressao-pt-br.test.js` AC-126-5 |
| ADRs com `superseded-by` quando aplicavel | 0 | 100% dos casos identificados | AC-120-11 |
| Regras com campo `origem:` preenchido | ~2% (so INV-006) | 100% | AC-127-2 |
| Soft warnings agregados em `/avisos` | invisivel (cospe stderr) | rastreavel | AC-117-4 |
| Tempo pra retomar sessao apos crash | nunca testado | < 30s ate primeiro comando produtivo | AC-119-6 |

### 6.3 — Metricas operacionais (subjetivas, validadas pelo Roldao)

- "Eu sinto o framework mais rapido" (resposta sim/nao apos Onda 1)
- "Eu vejo o que esta acontecendo em tempo real" (apos Onda 3 — status line + painel)
- "Eu nao perco trabalho quando sessao morre" (apos Onda 3 — retomada)
- "Eu confio que auditoria fechou tudo" (apos Onda 4 — findings rastreaveis)
- "O framework esta me ajudando a melhorar ele mesmo" (apos Onda 5 — meta-cetico)

---

## 7. Riscos e mitigacao

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| Hook `block-prompt-in-migration.js` gera falso positivo em projeto legado com prompt embutido | alta | medio | Modo warning na v3.0.0; block so na v3.1.0. Skill `extrair-prompt-de-migration` (AC-123-x) automatiza refactor. |
| Manifest de hook + frontmatter `@hook-meta` quebra hooks customizados pelo usuario | media | alto | Hook sem `@hook-meta` continua funcionando — fast-path so atua quando metadado presente. Documentado em `MIGRATION-v3.md`. |
| Telemetria local em `hook-stats.jsonl` cresce indefinidamente | alta | baixo | Rotacao automatica em 30MB OU 90 dias. Hook `purge-old-hookstats.js` (lifecycle) zera apos rotacao. |
| `pipeline-state-<US>.json` desincroniza com sentinels legados | media | alto | Hook `migrate-runtime-markers.js` (SessionStart) sincroniza ambos. Flag `ROLDAO_METHOD_LEGACY_MARKERS=1` default true. |
| Workflow `/documentar-repo` sobrescreve `docs/` do usuario (replica incidente do lionclaw) | baixa | critico | Staging + diff + confirmacao em 4 stages obrigatorios (AC-124-3). Hook `block-doc-overwrite-without-diff.js` (AC-122-1). **Auto-publish proibido por arquitetura — vulnerabilidade residual NAO se repete.** |
| Meta-cetico propoe regra ruim que Roldao aceita por engano | media | medio | `dismissed.jsonl` rastreia dismissals; apos 5x dismissal, meta-cetico marca regra como "candidata a sunset" automaticamente. |
| Canary release v3.0.0-next gera regressao em projeto cliente real | media | alto | 5 dias de soak obrigatorios + `/explicar-update v2.0.0 v3.0.0` testado em 3 projetos sandbox (AC-127-4). |
| `aria-live` em pipeline UI quebra layout existente em projetos com Tailwind 3.x | baixa | baixo | Hook `require-aria-live-on-pipeline-stream.js` em modo warning v3.0.0; block v3.1.0. Templates atualizados em paralelo. |
| Cronograma de 16 semanas escorrega por dependencia entre ondas | media | medio | Ondas 5, 6, 9 podem rodar em paralelo apos Onda 3. Buffer de 2 semanas em US-127. |
| Addon `electron-br` colide com convencao de outro projeto Electron BR | baixa | medio | Manifest `ADDON.json` declara namespace. Comando `npx roldao-method add electron-br --dry-run` mostra o que seria copiado. |
| Memory router (RAG local) carrega memoria errada e agente alucina | media | medio | Frontmatter `tags:` opcional na v3.0.0; agente sempre pode carregar memoria completa via `/memoria-all`. Fallback explicito. |
| Skill `extrair-prompt-de-migration` corrompe migration existente | media | critico | Script gera diff antes de aplicar; sempre exige `--confirmar` explicito. Testes obrigatorios em `__tests__/skill-extrair-prompt.test.js`. |
| Snapshot test de agente trava em update do Claude Code (mudanca de output do SDK) | media | medio | Snapshot tolerante a whitespace + ordem; frase-ancora e regex, nao exact match. |

---

## 8. Regulamentacao BR aplicavel

- **LGPD-001 (base legal):** telemetria local-first nao coleta dado pessoal — apenas hash do projeto, ID de regra, timestamp. Nao se aplica base legal.
- **LGPD-002 (direito ao esquecimento):** `~/.claude/memory-cross-project/` permite exclusao via `rm -rf` ou comando `/memoria-esquecer <tag>`.
- **LGPD-004 (trilha de auditoria):** `audit-finding-*.jsonl` virou trilha de auditoria de qualidade — preserva quem auditou, quando, com que `audit_sha`.
- **LGPD-006 (incidente — 72h ANPD):** `/incident-postmortem` existente continua valido. v3 adiciona `/auto-auditar-framework` pra detectar padrao de incidente.
- **LGPD-011 (NOVA — mascaramento em log livre):** codificada nesta release (AC-122-17). Sustenta LGPD-004.
- **PIX-004 (chave Pix mascarada em log):** addon `fintech-br` ja codifica. Nao alterado neste PRD.
- **FISCAL-001 (NF-e imutavel):** addon `fiscal-br-completo` ja codifica via `nfe-imutavel.js`. Nao alterado neste PRD.
- **INV-AGENT-005 (confirmar antes de mudanca publica):** preservado integralmente. `gh release create` exige autorizacao explicita (AC-127-9). `npm publish` proibido sem credenciais do Roldao.
- **N/A pra FISCAL-002..010, PIX-001..005:** v3.0.0 nao toca em fluxo fiscal nem Pix do framework core.

---

## 9. Historico de mudancas

| Data | Versao | Autor | Mudanca |
|---|---|---|---|
| 2026-05-26 | 1 | gerente-produto + Roldao | Criacao do PRD. Consolida 3 auditorias paralelas de 2026-05-26 (licoes-do-lionclaw, auditoria-pipelines-lionclaw, melhorias-fluxo-roldao). 11 ondas de entrega (US-117..US-127). Principio de preservacao de capacidade explicitado. |

---

## 10. Menu de adaptacao por dominio (CLI / Biblioteca / Framework)

> Framework e CLI Node puro zero-deps. Aplicam as secoes 10.D + 10.F.

### 10.D — CLI / Biblioteca / Framework

- **Plataformas suportadas:** Windows 10+, macOS 12+, Linux (Ubuntu 22.04+). Decisao do Roldao: Windows e primario (90% dos donos de produto BR).
- **Versao de runtime minima:** Node 20+ (LTS). Validado em CI matriz Ubuntu/Mac/Windows.
- **Instalacao:** `npx roldao-method install`. Sem instalacao global — sempre via npx. v3.0.0 adiciona deteccao automatica de tipo de projeto (AC-118-4).
- **Breaking changes:** v3.0.0 e major bump honesto. `MIGRATION-v3.md` obrigatorio (AC-127-1). Hooks novos em modo warning v3.0.0, block v3.1.0 — 1 release de janela.
- **Deprecation:** capacidades antigas nunca removidas em minor. Aviso explicito em major + 1 release de aviso antes de qualquer remocao.
- **API estavel vs experimental:** Hooks em `.claude/hooks/_core/` sao estaveis. `.claude/hooks/_local/` sao customizacao do usuario. `.claude/.runtime/` e contrato interno — addons consomem via `_lib.js` (estavel).
- **Distribuicao:** npm public registry. Tag `next` pra canary; tag `latest` pra producao. 5 dias de soak obrigatorios entre canary e promocao (AC-126-7).

### 10.F — Sistema legado (brownfield migration) — referencia interna v2.0.0 → v3.0.0

- **Sistema substituido:** Framework v2.0.0 em produto interno do Roldao.
- **Estrategia:** strangler fig com flag de compatibilidade. Sentinels legados convivem com pipeline-state.json novo. Markers v2 invocam migrate-runtime-markers.js no SessionStart.
- **Plano de rollback:** revert pra v2.0.0 e suportado por 1 release (v3.1.0 e o limite). `npx roldao-method@2 install` continua funcionando.
- **Coexistencia:** v2.0.0 e v3.0.0 podem conviver em worktrees paralelos do mesmo repo (uma worktree em v2, outra em v3). Testado em AC-126-6.
- **Migracao de dados:** memoria do Roldao (`~/.claude/projects/.../memory/`) e estendida com `tags:` automaticamente no install v3 — script de migracao em `tools/migrar-memorias-pra-v3.js`. Idempotente.
- **Treinamento de usuario:** `MIGRATION-v3.md` em PT-BR claro + release notes pra Roldao + `/explicar-update v2.0.0 v3.0.0` interativo (AC-121-5).

---

## 11. Dependencias e ordem de execucao

```
[PRD-003 v2.0.0 entregue]
       ↓
   US-117 (Onda 1)  ← FUNDACAO: performance + visibilidade
       ↓
   US-118 (Onda 2)  ← ONBOARDING + MEMORIA
       ↓
   US-119 (Onda 3)  ← PIPELINE com payload + retomada
       ↓
   ┌───────┬───────┬───────┐
   ↓       ↓       ↓       ↓
US-120  US-121  US-122  US-123  ← PARALELIZAVEIS apos US-119
(Audit) (Apren)  (Reg)  (Elec)
   ↓       ↓       ↓       ↓
   └───────┴───────┴───────┘
       ↓
   US-124 (Onda 8)  ← /documentar-repo (depende de US-120 pra staging)
       ↓
   US-125 (Onda 9)  ← Skills + templates de doc
       ↓
   US-126 (Onda 10) ← Hardening + canary
       ↓
   US-127 (Onda 11) ← MIGRATION + release v3.0.0
```

**Caminho critico:** US-117 → US-119 → US-124 → US-126 → US-127 (10 semanas de trabalho serial).
**Paralelizavel:** US-120 + US-121 + US-122 + US-123 podem rodar em paralelo apos US-119 fechar (corta 3-4 semanas com worktrees).

---

## 12. Resumo executivo pra Roldao (nao-programador)

**O que muda na pratica apos v3.0.0:**

1. **Voce passa a ver o que esta acontecendo em tempo real.** Status line mostra agente rodando agora, custo da sessao, posicao no pipeline. Comando `/painel` da uma tela de instrumentos. Comando `/saude` mostra semaforo verde/amarelo/vermelho do projeto.

2. **Voce nao perde mais trabalho quando o Claude trava ou compacta sessao.** Pipeline-state.json salva exatamente onde voce parou. `/retomar` continua de onde estava.

3. **O framework te ajuda a preencher contratos vazios.** AGENTS.md com `_(preencher)_` vira pergunta guiada via `/comeco`. Nao precisa adivinhar.

4. **Auditoria fica honesta.** Cada coisa que o Caio/Julia/Pedro acharem vira um numero (AF-001, AF-002...). O commit que corrige cita o numero. Fica facil saber o que ficou em aberto.

5. **O framework comeca a aprender com voce.** Otavio (agente cetico) le como voce usou o framework nos ultimos 30 dias e propoe regras novas baseadas em padrao real — nao em achismo. Voce decide aceitar ou nao.

6. **Memoria fica organizada.** Em vez de carregar 9KB de log de sprint pra responder "qual a stack?", o framework carrega so o relevante. Memoria ganha historico — se voce mudar algo errado, da pra desfazer.

7. **Erro do agente vem em PT-BR claro automaticamente.** Stack trace tecnico fica colapsado. Voce le "arquivo nao encontrado" antes do tecniques.

8. **Electron BR vira cidadao de primeira classe.** `npx roldao-method add electron-br` plugga templates production-ready (builder, preload seguro, cofre de secrets, migrations).

9. **Repo legado ganha doc retroativa.** `/documentar-repo` gera PRD + ADRs + SCHEMA + README + RUNBOOK em 1 sessao — sem nunca sobrescrever doc existente sem confirmar.

10. **Nada que voce ja sabia fazer parou de funcionar.** Todos os 28 comandos, 44 hooks, 17 agentes, 19 skills, 22 ADRs da v2.0.0 continuam funcionando. v3 e camada nova POR CIMA.

**Custo estimado:** 16 semanas de trabalho (10 semanas serial + 4 paralelizadas + 2 buffer). 11 user stories filhas. ~8 ADRs decorrentes. Release final em fim de Agosto/2026 se comecar imediato.

**Risco principal:** voce nao ter tempo de validar canary de 5 dias antes de promover. Mitigacao: nao publicar antes de voce dar OK explicito (INV-AGENT-005 + memoria `feedback-npm-publish.md`).

---

_Proximo passo: rodar `/clarificar PRD-004` se houver duvida em qualquer AC, ou abrir epico EP-003 pra decompor US-117 (Onda 1) — alto ROI, baixo risco._

