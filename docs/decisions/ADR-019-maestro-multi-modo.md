---
owner: tech-lead
revisado-em: 2026-05-24
status: proposta
---

# ADR-019 — Maestro multi-modo (PRD/BROWNFIELD/AR) estendendo o agente unico

## Contexto

Hoje `.claude/agents/maestro.md` (200 linhas) e fonte unica do pipeline mecanico de `/feature` (decisao firmada em ADR-011). Implementa 3 modos no frontmatter — `FT`, `BUG`, `AUDIT` —, mas so o Modo FT esta detalhado no corpo do agente (linhas 57-175); BUG ocupa 4 linhas e AUDIT 3 linhas, sem markers proprios por etapa.

Os 3 workflows longos restantes — `/prd` (analista → gerente-produto → tech-lead → ux → decomposicao), `/brownfield` (investigador → tech-lead → gerente-produto → auditor-seguranca) e `/auditoria-reversa` (investigador → 3 auditores → tech-writer) — **nao tem orquestrador**. O LLM principal le o markdown do command e segue as etapas manualmente. Em sessao longa, compactacao de contexto (`PreCompact` hook ativo) pode pular etapa silenciosamente, e nao ha marker por etapa que o `enforce-pipeline-completion.js` consiga verificar.

PRD-003 promete os 3 modos novos no Sprint 2B (US-113 AC-113-1). Antes do Bruno (`dev-senior`) codar, precisamos decidir **onde** o codigo vai morar: estender o Maestro existente (1 agente, 6 modos) ou quebrar em 3 agentes orquestradores separados.

## Decisao

**Estender o Maestro existente com 3 modos novos** — `PRD`, `BROWNFIELD`, `AR` — no mesmo arquivo `.claude/agents/maestro.md`. Cada modo ganha:

- Secao propria no corpo do agente (analoga ao Modo FT — entre 60 e 100 linhas cada).
- Markers proprios por etapa em `.claude/.runtime/` com prefixo do modo (ex: `maestro-prd-step-1-${SESSION_HASH}`, `maestro-brownfield-step-2-${SESSION_HASH}`, `maestro-ar-step-3-${SESSION_HASH}`).
- Entrada no array `menu:` do frontmatter, totalizando 6 codigos: `FT`, `BUG`, `AUDIT`, `PRD`, `BROWNFIELD`, `AR`.
- Limpeza de markers ao fim do modo (mesmo padrao da linha 156-157 do maestro atual).

O contrato de marker (shape JSON `{ session, mode, step, agent, audit_sha, timestamp }`) e canonizado em ADR-020 — este ADR aponta pra la em vez de redefinir.

## Consequencias

**Positivas:**
- INV-001 preservada — uma fonte unica do pipeline mecanico (mesma razao que sustentou ADR-011). Contribuidor edita 1 arquivo pra mudar contrato de marker, nao 4.
- Reuso do `SESSION_HASH`, `audit_sha`, padrao de re-rodar auditor quando diff muda — codigo ja existe no Modo FT, replicado nos novos modos sem reinventar.
- `enforce-pipeline-completion.js` ganha 3 modos pra validar com a mesma logica de gate (marker faltante = block).
- `statusline.js` mostra "Modo PRD etapa 3/5", "Modo BROWNFIELD etapa 2/4" usando 1 unico leitor de marker.

**Negativas (custo aceito):**
- `maestro.md` cresce de 200 pra ~500-550 linhas. Excede o orcamento de 200 linhas que vale pra `AGENTS.md`/`CLAUDE.md` (INV-005), mas o orcamento INV-005 vale **pros docs de contrato carregados toda sessao** — agentes especialistas sao lazy-load (so entram em contexto quando o `Task` chama o agente). Custo de contexto cobrado so quando o Maestro roda.
- Worktrees paralelos rodando modos diferentes na mesma sessao compartilham `SESSION_HASH` — colisao de marker possivel se 2 modos ativam ao mesmo tempo. Mitigacao: marker carrega prefixo do modo (`maestro-prd-*` vs `maestro-brownfield-*`); `feature-active-*` continua exclusivo do Modo FT.

**Neutras:**
- `subagent-handoff-audit.js` precisa reconhecer 3 modos novos no log de handoff — alteracao mecanica de adicionar prefixos a uma allowlist, sem mudanca de comportamento observavel.

## Alternativas consideradas

### Opcao B — 3 agentes orquestradores separados (`maestro-prd`, `maestro-brownfield`, `maestro-ar`)

Cada modo vira agente independente em `.claude/agents/`. **Descartada porque** cria 4 fontes paralelas de contrato de marker — qualquer mudanca em `SESSION_HASH` ou `audit_sha` exigiria editar 4 arquivos sincronizados. Foi exatamente o problema que ADR-011 resolveu colapsando `feature.md` em shim do Maestro. Repetir o erro seria regressao consciente.

### Opcao C — Super-maestro que delega pra orquestradores especificos

Um agente `super-maestro` recebe a chamada e despacha pra `maestro-prd`, `maestro-brownfield`, `maestro-ar`. **Descartada porque** adiciona camada de indirecao sem ganho real — o LLM ja faz esse roteamento sozinho lendo o command que invocou. Custo: +1 turno de Task, +1 ponto de falha (super-maestro pode escolher modo errado), +4 arquivos pra manter. Beneficio: nenhum em relacao a opcao A.

## Non-goals

O que esta decisao NAO resolve:
- **Nao define o shape JSON do marker** — fica pra ADR-020.
- **Nao define a janela de compatibilidade com markers vazios criados por `touch`** — fica pra ADR-021.
- **Nao orquestra `/hotfix`, `/qa`, `/incident-postmortem`** — esses 3 continuam descrevendo fluxo proprio no command (mesmo escopo que ADR-011 deixou pra `/bug`).
- **Nao paraleliza modos** — cada modo do Maestro e sequencial dentro de uma sessao. Paralelismo entre worktrees diferentes continua valido (cada worktree tem sua propria sessao, portanto seu proprio `SESSION_HASH`).
- **Nao muda contrato publico do command `/prd`, `/brownfield`, `/auditoria-reversa`** — usuario continua rodando o mesmo comando, mudanca e interna no como o pipeline e executado (consistente com SemVer minor — ADR-016).

## Como verificar aderencia

- `.claude/agents/maestro.md` tem secao `## Modo PRD`, `## Modo BROWNFIELD`, `## Modo AR` no corpo, alem das 3 ja existentes (FT/BUG/AUDIT).
- Array `menu:` no frontmatter lista 6 codigos.
- Teste `tests/agents/maestro-multi-modo.test.js` confirma que rodar `Task subagent_type=maestro` com prompt `MODE=PRD` dispara o pipeline correto e cria os markers esperados.
- `enforce-pipeline-completion.js` valida marker dos 6 modos (3 testes adversariais novos em `tests/hooks/`: PRD/BROWNFIELD/AR com etapa pulada = block).
- `statusline.js` mostra "Modo X etapa N/M" quando qualquer marker `maestro-*-step-*` existe.

## Como reabrir

- Se `maestro.md` ultrapassar 700 linhas: reavaliar quebrar em arquivos auxiliares carregados via include.
- Se 2+ modos do Maestro precisarem rodar **em paralelo na mesma sessao** (ex: PRD novo enquanto BROWNFIELD de diagnostico roda em background): reavaliar opcao B (agentes separados) — o atual `SESSION_HASH` unico nao serve.
- Se contribuidor terceiro pedir orquestrador customizado (ex: `maestro-fintech` no addon `fintech-br`) e a extensao do Maestro core ficar impraticavel: criar mecanismo de plugin pra modos (fora do escopo deste ADR).

## Referencias

- ADR-011 — Maestro como fonte unica do pipeline mecanico.
- ADR-016 — Politica de SemVer (mudanca interna do Maestro = MINOR).
- INV-001 — documento e estado compartilhado (unico).
- INV-005 — conciso vence completo (excecao justificada pra agente lazy-load).
- PRD-003 secao 4 — US-113 (Sprint 2B).
- `.claude/agents/maestro.md` (estado atual).
- `.claude/hooks/enforce-pipeline-completion.js` (gate dos markers).
- `.claude/hooks/session-snapshot.js` (preserva markers entre compactacao).
- `.claude/statusline.js` (consumidor dos markers pra UI).
